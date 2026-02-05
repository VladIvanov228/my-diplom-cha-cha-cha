const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function fixUsers() {
  try {
    console.log('🔄 Fixing test users...');
    
    // Удаляем старых пользователей
    await pool.query("DELETE FROM users WHERE email IN ('player@test.com', 'master@test.com')");
    console.log('🗑️ Old users deleted');
    
    // Создаем правильный хеш для test123
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    
    console.log('🔑 Generated hash:', hashedPassword);
    
    // Создаем тестовых пользователей
    const users = [
      ['master@test.com', 'GameMaster', hashedPassword, 'master'],
      ['player@test.com', 'DragonSlayer', hashedPassword, 'player']
    ];
    
    for (const [email, username, password, role] of users) {
      await pool.query(
        'INSERT INTO users (email, username, password_hash, role) VALUES ($1, $2, $3, $4)',
        [email, username, password, role]
      );
      console.log(`✅ Created ${email} with password: test123`);
    }
    
    // Проверим что получилось
    const result = await pool.query('SELECT email, username FROM users');
    console.log('📊 Current users:', result.rows);
    
  } catch (error) {
    console.error('❌ Error fixing users:', error);
  } finally {
    await pool.end();
  }
}

fixUsers();