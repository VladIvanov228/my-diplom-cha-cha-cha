const { Pool } = require('pg');
require('dotenv').config();

async function testConnection() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL подключен успешно!');
    
    // Проверяем версию PostgreSQL
    const res = await client.query('SELECT version()');
    console.log('PostgreSQL версия:', res.rows[0].version);
    
    client.release();
  } catch (error) {
    console.error('❌ Ошибка подключения к PostgreSQL:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();