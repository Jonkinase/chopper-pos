const db = require('../../config/db');

class ConfigService {
  async getAll() {
    const { rows } = await db.query('SELECT key, value FROM system_config');
    const config = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });
    return config;
  }

  async update(configData) {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (const [key, value] of Object.entries(configData)) {
        await client.query(
          'INSERT INTO system_config (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
          [key, value]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async set(key, value) {
    await db.query(
      'INSERT INTO system_config (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP',
      [key, value]
    );
  }

  async get(key) {
    const { rows } = await db.query('SELECT value FROM system_config WHERE key = $1', [key]);
    return rows.length > 0 ? rows[0].value : null;
  }
}

module.exports = new ConfigService();
