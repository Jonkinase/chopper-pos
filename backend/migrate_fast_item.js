const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'chopper_pos_dev',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query('ALTER TABLE sale_items ALTER COLUMN product_id DROP NOT NULL;');
    await client.query('ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS custom_description VARCHAR(100);');

    await client.query('ALTER TABLE quote_items ALTER COLUMN product_id DROP NOT NULL;');
    await client.query('ALTER TABLE quote_items ADD COLUMN IF NOT EXISTS custom_description VARCHAR(100);');
    
    await client.query('COMMIT');
    console.log('Migration successful');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
