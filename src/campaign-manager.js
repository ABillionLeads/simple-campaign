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
 * @param {Object}  campaignData.query             - Elasticsearch query object
 * @param {boolean} [campaignData.use_net_new=true]- Whether to use net-new contacts
 * @param {Array}   [campaignData.exclude_campaign_ids=[]] - Campaign IDs to exclude
 * @param {Object}  campaignData.smtp              - SMTP configuration object
 * @param {number}  campaignData.per_hour_limit    - Hourly send limit
 * @param {number}  campaignData.audience_size     - Expected audience size
 * @returns {Promise<Object>}                      - Created campaign row
 */
async function createCampaign(campaignData) {
  const pool   = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const {
      name,
      api_key,
      query,
      use_net_new = true,
      exclude_campaign_ids = [],
      smtp,
      per_hour_limit,
      audience_size
    } = campaignData;

    // Required-field validation
    if (!name || !api_key || !query || !smtp || !per_hour_limit || !audience_size) {
      throw new Error(
        'Missing required fields: name, api_key, query, smtp, per_hour_limit, audience_size'
      );
    }

    const { rows } = await client.query(
      `
        INSERT INTO campaigns (
          name, api_key, query, use_net_new, exclude_campaign_ids,
          smtp, per_hour_limit, audience_size
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id, name, api_key, per_hour_limit, audience_size, created_at
      `,
      [
        name,
        api_key,
        JSON.stringify(query),
        use_net_new,
        exclude_campaign_ids,
        JSON.stringify(smtp),
        per_hour_limit,
        audience_size
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
 * Get campaign contact statistics
 * @param {string} campaignId            - Campaign UUID
 * @returns {Promise<Object>}            - Contact statistics
 */
async function getCampaignStats(campaignId) {
  const pool   = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    // Verify campaign exists
    const { rows: [campaign] } = await client.query(
      `
        SELECT id, name, audience_size
        FROM campaigns
        WHERE id = $1
      `,
      [campaignId]
    );

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    // Get contact statistics
    const { rows: [stats] } = await client.query(
      `
        SELECT 
          COUNT(*)::int AS total_contacts,
          COUNT(sent_at)::int AS sent_contacts,
          COUNT(*)::int - COUNT(sent_at)::int AS pending_contacts
        FROM campaign_contacts
        WHERE campaign_id = $1
      `,
      [campaignId]
    );

    return {
      campaign_id: campaignId,
      campaign_name: campaign.name,
      audience_size: campaign.audience_size,
      total_contacts: stats.total_contacts,
      sent_contacts: stats.sent_contacts,
      pending_contacts: stats.pending_contacts
    };
  } finally {
    client.release();
    await pool.end();
  }
}

/**
 * Count how many contacts have been sent for a campaign
 * @param {string} campaignId            - Campaign UUID
 * @returns {Promise<number>}            - Number of sent contacts
 */
async function getSentContactCount(campaignId) {
  const pool   = new Pool({ connectionString: DATABASE_URL });
  const client = await pool.connect();

  try {
    const { rows: [{ count }] } = await client.query(
      `
        SELECT COUNT(*)::int AS count
        FROM campaign_contacts
        WHERE campaign_id = $1 AND sent_at IS NOT NULL
      `,
      [campaignId]
    );

    return count;
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
    // Verify campaign exists
    const { rows: [campaign] } = await client.query(
      `
        SELECT id, audience_size
        FROM campaigns
        WHERE id = $1
      `,
      [campaignId]
    );

    if (!campaign) {
      throw new Error(`Campaign with ID ${campaignId} not found`);
    }

    const createdContacts = [];

    for (const contact of contacts) {
      const {
        email,
        subject,
        body
      } = contact;

      // Validate per-contact required fields
      if (!email || !subject || !body) {
        console.warn(
          `Skipping contact with missing required fields: ${email || 'unknown'}`
        );
        continue;
      }

      const { rows } = await client.query(
        `
          INSERT INTO campaign_contacts (
            campaign_id, email, subject, body
          ) VALUES ($1,$2,$3,$4)
          RETURNING id, email, subject, created_at
        `,
        [
          campaignId,
          email,
          subject,
          body
        ]
      );

      createdContacts.push(rows[0]);

      // Break early if we hit the audience size limit while inserting
      if (createdContacts.length >= campaign.audience_size) {
        console.log(
          `Reached campaign audience_size (${campaign.audience_size}) while inserting; remaining contacts skipped.`
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
  getCampaignStats,
  getSentContactCount
};
