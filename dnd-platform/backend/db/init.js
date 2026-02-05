const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: 'postgres' // Подключаемся к стандартной БД для создания нашей
});

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Читаем SQL файл
    const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
    
    // Подключаемся к нашей БД
    const appPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    // Выполняем SQL
    await appPool.query(sql);
    console.log('Database schema created successfully!');
    
    // Закрываем соединение
    await appPool.end();
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

initializeDatabase();   