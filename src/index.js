// index.js — Railway Cron: 0 * * * *   (boot → send → exit)
require('dotenv').config();

const initDb              = require('./init-db');
const { Pool }            = require('pg');
const nodemailer          = require('nodemailer');

const {
  DATABASE_URL,
  ES_NODE
} = process.env;

const missing = [];
if (!DATABASE_URL) missing.push('DATABASE_URL');
if (!ES_NODE)      missing.push('ES_NODE');
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);
}

(async () => {
  /* 1 — ensure schema */
  await initDb(DATABASE_URL);

  /* 2 — run the hourly work */
  await main();
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });

/* -------------------------------------------------------------------------- */

async function main () {
  log('Worker started');

  const pool = new Pool({ connectionString: DATABASE_URL });

  const client = await pool.connect();
  try {
    const { rows: campaigns } = await client.query(`
      SELECT id, name, api_key, smtp::text, per_hour_limit
        FROM campaigns
       WHERE per_hour_limit > 0
    `);

    for (const c of campaigns) {
      await sendForCampaign(client, es, c);
    }
    
  } finally {
    client.release();
    await pool.end();
    log('Worker finished');
  }
}

/* -------------------------------------------------------------------------- */

async function sendForCampaign (db, es, c) {
  const { rows: [{ n: sentLastHour }] } = await db.query(
    `SELECT COUNT(*)::int AS n
       FROM campaign_contacts
      WHERE campaign_id=$1
        AND sent_at >= now() - INTERVAL '1 hour'`,
    [c.id]
  );

  const quota = c.per_hour_limit - sentLastHour;
  if (quota <= 0) { log(`[${c.name}] quota reached`); return; }

  const { rows: batch } = await db.query(
    `SELECT id,email,subject,html,text,es_index,es_doc_id
       FROM campaign_contacts
      WHERE campaign_id=$1 AND sent_at IS NULL
      ORDER BY id
      FOR UPDATE SKIP LOCKED
      LIMIT $2`, [c.id, quota]
  );
  if (!batch.length) { log(`[${c.name}] nothing pending`); return; }

  const smtp = JSON.parse(c.smtp);
  const tx   = nodemailer.createTransport(smtp);

  log(`[${c.name}] sending ${batch.length} email(s)…`);

  for (const row of batch) {
    try {
      await tx.sendMail({
        from: smtp.from,
        to: row.email,
        subject: row.subject,
        html: row.html,
        text: row.text || undefined
      });

      await db.query(`UPDATE campaign_contacts SET sent_at = now() WHERE id=$1`, [row.id]);

      if (row.es_index && row.es_doc_id) {
        const tag = `${c.api_key}:${c.id}`;
        es.update({
          index:  row.es_index,
          id:     row.es_doc_id,
          script: {
            source: 'if (!ctx._source.contactedBy.contains(params.tag)) ctx._source.contactedBy.add(params.tag)',
            params: { tag }
          }
        }).catch(e => log(`ES update failed for ${row.email}:`, e.meta?.body?.error || e));
      }

      log(`✓ ${row.email}`);
    } catch (err) {
      log(`✗ ${row.email}: ${err.message}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
function log (...a) { console.log(new Date().toISOString(), ...a); }
