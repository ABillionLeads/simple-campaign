// index.js — Railway Cron: 0 * * * *   (boot → send → exit)
require('dotenv').config();

/*
users will use their api key to start campaigns on my server. 
ABL will store on each contact contacted by them:
1. their api key(to mark that contact as globally contacted by them) and
2. a campaign id(so they can either contact net new contacts or just contacts that are new for that specific campaign)

*/
const initDb              = require('./init-db');
const { Pool }            = require('pg');
const nodemailer          = require('nodemailer');
const { getSentContactCount, insertCampaignContacts, createCampaign } = require('./campaign-manager');
const { fetchABLContacts } = require('./abl-contact-fetcher');
// Import fetch for making HTTP requests
const fetch = require('node-fetch');

const {
  DATABASE_URL,
  // this should not be  here, i am the only one that needs it
  ABL_API_ENDPOINT,
  ABL_API_KEY
} = process.env;

const missing = [];
if (!DATABASE_URL) missing.push('DATABASE_URL');
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
// i think i need to pass in the personalization function here
async function main () {
  log('Worker started');

  const pool = new Pool({ connectionString: DATABASE_URL });

  const client = await pool.connect();
  try {
    const { rows: campaigns } = await client.query(`
      SELECT id, name, api_key, query, smtp::text, per_hour_limit, audience_size
        FROM campaigns
       WHERE per_hour_limit > 0
    `);


   
    for (const campaign of campaigns) {
      await generateAndInsertContactsForCampaign(campaign, ABL_API_KEY);
      await sendForCampaign(client, campaign);
    }
    
  } finally {
    client.release();
    await pool.end();
    log('Worker finished');
  }
}

async function createSampleCampaign() {
  const queryParam = {
    included: {
      industry: ['marketing and advertising'],
      job_company_size: ['1-10', '51-200', '11-50', '201-500'],
    },
    excluded: {},
  };
  let campaignCreationObject = {
    name: 'test',
    api_key: ABL_API_KEY,
    query: queryParam,
    smtp: {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test',
        pass: 'test'
      }
    },
    per_hour_limit: 10,
    audience_size: 100
  }
  await createCampaign(campaignCreationObject);
}

// the schema should not allow for duplicate emails in the same campaign
// but if this happens, then i have a problem with the elasticsearch contactedBy
async function generateAndInsertContactsForCampaign(campaign, ABL_API_KEY) {
  let contacts = await fetchABLContacts({
    apiKey: ABL_API_KEY,
    campaignId: campaign.id,
    noOfContactsToGet: campaign.per_hour_limit,
    queryObject: campaign.query,
    endpointPath: '/api/campaign-contacts',
    baseUrl: ABL_API_ENDPOINT
  });
  let contactsToInsert = await personalizeContacts(campaign, contacts);
  await insertCampaignContacts(campaign.id, contactsToInsert);
  return contacts;
}

// personalize contacts
async function personalizeContacts(campaign,contacts) {
  // TODO: implement
  let contactsToInsert = contacts.map(contact => {
    // TODO: implement
    let c = {};
    c.email = contact.emails[0];
    c.subject = 'test subject';
    c.body = 'test email body';
    c.created_at = new Date();
    c.sent_at = new Date();
    c.campaign_id = campaign.id;
    return c; // Return the transformed object, not the original contact
  });
  
  return contactsToInsert;
}

async function sendForCampaign (db, campaign) {
  const { rows: [{ n: sentLastHour }] } = await db.query(
    `SELECT COUNT(*)::int AS n
       FROM campaign_contacts
      WHERE campaign_id=$1
        AND sent_at >= now() - INTERVAL '1 hour'`,
    [campaign.id]
  );

  const quota = campaign.per_hour_limit - sentLastHour;
  if (quota <= 0) { log(`[${campaign.name}] quota reached`); return; }

  const { rows: batch } = await db.query(
    `SELECT id,email,subject,body
       FROM campaign_contacts
      WHERE campaign_id=$1 AND sent_at IS NULL
      ORDER BY id
      FOR UPDATE SKIP LOCKED
      LIMIT $2`, [campaign.id, quota]
  );
  if (!batch.length) { log(`[${campaign.name}] nothing pending`); return; }

  const smtp = JSON.parse(campaign.smtp);
  const tx   = nodemailer.createTransport(smtp);

  log(`[${campaign.name}] sending ${batch.length} email(s)…`);

  for (const row of batch) {
    try {
      console.log('Sending:');
      console.log(row.email);
      console.log(row.body);
      /*
      await tx.sendMail({
        from: smtp.from,
        to: row.email,
        subject: row.subject,
        html: row.body,
        text: convertHtmlToText(row.body)
      });
      */

      await db.query(`UPDATE campaign_contacts SET sent_at = now() WHERE id=$1`, [row.id]);

      if (row.es_index && row.es_doc_id) {
        const tag = `${campaign.api_key}:${campaign.id}`;
      }

      log(`✓ ${row.email}`);
    } catch (err) {
      log(`✗ ${row.email}: ${err.message}`);
    }
  }
}

/* -------------------------------------------------------------------------- */
function log (...a) { console.log(new Date().toISOString(), ...a); }
