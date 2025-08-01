// campaign-manager.js — Campaign and contact management utilities
require('dotenv').config();
const { Pool } = require('pg');

const { DATABASE_URL } = process.env;

const missing = [];
if (!DATABASE_URL) missing.push('DATABASE_URL');
if (missing.length) {
  console.error('Missing env vars:', missing.join(', '));
  process.exit(1);
}

/**
 * Create a new campaign
 * @param {Object}  campaignData
 * @param {string}  campaignData.name              - Campaign name
 * @param {string}  campaignData.api_key           - API key for ES integration
 * @param {Object}  campaignData.es_query          - Elasticsearch query object
 * @param {boolean} [campaignData.use_net_new=true]- Whether to use net-new contacts
 * @param {Array}   [campaignData.exclude_campaign_ids=[]] - Campaign IDs to exclude
 * @param {Object}  campaignData.smtp              - SMTP configuration object
 * @param {number}  campaignData.per_hour_limit    - Hourly send limit
 * @param {?number} [campaignData.max_send_limit]  - Global cap (NULL/omit ⇒ unlimited)
 * @returns {Promise<Object>}                      - Created campaign row
 */
async function createCampaign(campaignData) {
  const pool   = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const {
      name,
      api_key,
      es_query,
      use_net_new = true,
      exclude_campaign_ids = [],
      smtp,
      per_hour_limit,
      max_send_limit = null
    } = campaignData;

    // Required-field validation
    if (!name || !api_key || !es_query || !smtp || !per_hour_limit) {
      throw new Error(
        'Missing required fields: name, api_key, es_query, smtp, per_hour_limit'
      );
    }

    const { rows } = await client.query(
      `
        INSERT INTO campaigns (
          name, api_key, es_query, use_net_new, exclude_campaign_ids,
          smtp, per_hour_limit, max_send_limit
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id, name, api_key, per_hour_limit, max_send_limit, created_at
      `,
      [
        name,
        api_key,
        JSON.stringify(es_query),
        use_net_new,
        exclude_campaign_ids,
        JSON.stringify(smtp),
        per_hour_limit,
        max_send_limit
      ]
    );

    console.log(
      `✓ Campaign created: ${rows[0].name} (ID: ${rows[0].id})`
    );
    return rows[0];
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Insert contacts into a campaign queue
 * @param {string} campaignId            - Campaign UUID
 * @param {Array}  contacts              - Contact objects
 * @returns {Promise<Array>}             - Created contact rows
 */
async function insertCampaignContacts(campaignId, contacts) {
  const pool   = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    // Fetch campaign configuration & limits
    const { rows: [campaign] } = await client.query(
      `
        SELECT id, max_send_limit
        FROM campaigns
        WHERE id = $1
      `,
      [campaignId]
    );

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    // Optional guard: stop inserting if cap already reached
    if (campaign.max_send_limit !== null) {
      const { rows: [{ n: alreadyQueued }] } = await client.query(
        `
          SELECT COUNT(*)::int AS n
          FROM campaign_contacts
          WHERE campaign_id = $1
        `,
        [campaignId]
      );

      if (alreadyQueued >= campaign.max_send_limit) {
        console.log(
          `Campaign ${campaignId} already has ${alreadyQueued}/${campaign.max_send_limit} contacts – skipping insert.`
        );
        return [];
      }
    }

    const createdContacts = [];

    for (const contact of contacts) {
      const {
        email,
        subject,
        html,
        text,
        es_index  = null,
        es_doc_id = null
      } = contact;

      // Validate per-contact required fields
      if (!email || !subject || !html) {
        console.warn(
          `Skipping contact with missing required fields: ${email || 'unknown'}`
        );
        continue;
      }

      const { rows } = await client.query(
        `
          INSERT INTO campaign_contacts (
            campaign_id, email, subject, html, text,
            es_index, es_doc_id
          ) VALUES ($1,$2,$3,$4,$5,$6,$7)
          RETURNING id, email, subject, created_at
        `,
        [
          campaignId,
          email,
          subject,
          html,
          text || null,
          es_index,
          es_doc_id
        ]
      );

      createdContacts.push(rows[0]);

      // Break early if we hit the cap while inserting
      if (
        campaign.max_send_limit !== null &&
        createdContacts.length + (alreadyQueued || 0) >= campaign.max_send_limit
      ) {
        console.log(
          `Reached campaign max_send_limit (${campaign.max_send_limit}) while inserting; remaining contacts skipped.`
        );
        break;
      }
    }

    console.log(
      `✓ Inserted ${createdContacts.length} contacts for campaign ${campaignId}`
    );
    return createdContacts;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exported API
module.exports = {
  createCampaign,
  insertCampaignContacts,
  createSampleCampaign
};
