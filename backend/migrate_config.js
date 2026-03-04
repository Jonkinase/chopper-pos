const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'db',
  database: process.env.DB_NAME || 'chopper_pos_dev',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function run() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query('CREATE TABLE IF NOT EXISTS system_config (key VARCHAR(100) PRIMARY KEY, value TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);');

    await client.query("INSERT INTO system_config (key, value) VALUES ('company_name', 'Chopper POS'), ('company_cuit', NULL), ('company_address', NULL), ('company_phone', NULL), ('pdf_banner_path', NULL), ('pdf_footer_message', 'Gracias por su preferencia'), ('pdf_banner_validity', 'Presupuesto válido por 30 días'), ('sidebar_logo_path', NULL) ON CONFLICT (key) DO NOTHING;");
    
    await client.query('COMMIT');
    console.log('Config migration successful');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Config migration failed:', e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
