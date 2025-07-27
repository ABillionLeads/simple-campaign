// init-db.js  — idempotent schema bootstrapping
const fs   = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function initDb (connectionString) {
  const pool   = new Pool({ connectionString });
  const client = await pool.connect();

  try {
    const { rowCount } = await client.query(`
      SELECT 1
        FROM information_schema.tables
       WHERE table_name = 'campaigns'
       LIMIT 1
    `);

    if (rowCount === 0) {
      console.log('↳ No schema detected – applying schema.sql…');
      const ddl = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
      await client.query(ddl);
      console.log('✓ Schema applied.');
    } else {
      console.log('↳ Schema already present – skipping.');
    }
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = initDb;