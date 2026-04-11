const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

// Подключение к базе данных
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'dnd_admin',
  password: process.env.DB_PASSWORD || 'dndAdmin129701',
  database: process.env.DB_NAME || 'dnd_platform'
});

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with test data...');  
    
    // Проверяем подключение
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    
    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    
    console.log('Generated hash:', hashedPassword);
    
    // Тестовый пользователь (мастер)
    const masterResult = await pool.query(`
      INSERT INTO users (email, username, password_hash, role) 
      VALUES ('master@test.com', 'GameMaster', $1, 'master')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, username;
    `, [hashedPassword]);
    
    if (masterResult.rows.length > 0) {
      console.log('✅ Master user created:', masterResult.rows[0]);
    } else {
      console.log('ℹ️ Master user already exists');
    }
    
    // Тестовый пользователь (игрок)
    const playerResult = await pool.query(`
      INSERT INTO users (email, username, password_hash, role) 
      VALUES ('player@test.com', 'DragonSlayer', $1, 'player')
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email, username;
    `, [hashedPassword]);
    
    if (playerResult.rows.length > 0) {
      console.log('✅ Player user created:', playerResult.rows[0]);
    } else {
      console.log('ℹ️ Player user already exists');
    }
    
    // Проверяем, что пользователи действительно создались
    const users = await pool.query('SELECT id, email, username, role FROM users');
    console.log(`📊 Total users in database: ${users.rows.length}`);
    console.log('Users:', users.rows);
    
    console.log('✅ Seed completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
    console.log('🔌 Database connection closed');
  }
}

// Запускаем функцию
seedDatabase().catch(console.error);