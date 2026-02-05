const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'postgres'
});

async function resetDatabase() {
  try {
    console.log('Resetting database...');
    
    // Удаляем старую БД, если существует
    await pool.query('DROP DATABASE IF EXISTS dnd_platform');
    
    // Создаем новую БД
    await pool.query('CREATE DATABASE dnd_platform');
    
    console.log('Database reset successfully!');
    
  } catch (error) {
    console.error('Error resetting database:', error);
  } finally {
    await pool.end();
  }
}

resetDatabase();