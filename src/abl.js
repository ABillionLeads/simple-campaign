// abl.js – usage:
//
// const abl = require('./abl').configure({...}).DEBUG();
// await abl.query('software engineers').take(100).sendEmails(lead => ({ ... }));

const { Pool }             = require('pg');
const { Client: EsClient } = require('@elastic/elasticsearch');
const crypto               = require('crypto');

function configure ({ ablKey, ablSMTPService, domainProviderKey, databaseUrl, esNode }) {
  const pool = new Pool({ connectionString: databaseUrl });
  const es   = new EsClient({ node: esNode });

  let debug = false;
  const apiKey = ablKey;          // used later for contactedBy tag

  const dsl = {
    DEBUG () { debug = true; return dsl; },

    query (q) {
      const ctx = { query: q, size: 10 };
      return {
        take (n) { ctx.size = n; return this; },

        async sendEmails (renderFn) {
          const esRes = await es.search({
            index: 'contacts',
            body: { query: { simple_query_string: { query: ctx.query }}, size: ctx.size }
          });

          for (const hit of esRes.hits.hits) {
            const lead = hit._source;
            const mail = renderFn(lead);

            if (debug) {
              console.log('[DEBUG] would send', mail);
              continue;
            }

            await insertContact(pool, {
              campaignId: mail.campaignId,
              email:      mail.to,
              subject:    mail.subject,
              html:       mail.body,
              esIndex:    hit._index,
              esId:       hit._id
            });
          }
        }
      };
    }
  };

  return dsl;

  async function insertContact (pool, row) {
    await pool.query(`
      INSERT INTO campaign_contacts
        (id,campaign_id,email,subject,html,es_index,es_doc_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT DO NOTHING`,
      [crypto.randomUUID(), row.campaignId, row.email,
       row.subject, row.html, row.esIndex, row.esId]);
  }
}

module.exports = { configure };
