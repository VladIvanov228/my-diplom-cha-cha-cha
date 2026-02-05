// backend/db/seed.js - обновите:
const bcrypt = require('bcryptjs');

async function seedDatabase() {
  try {
    console.log('Seeding database with test data...');  
    
    // Хешируем пароль
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('test123', salt);
    
    console.log('Generated hash:', hashedPassword);
    
    // Тестовый пользователь (мастер)
    await pool.query(`
      INSERT INTO users (email, username, password_hash, role) 
      VALUES ('master@test.com', 'GameMaster', $1, 'master')
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    // Тестовый пользователь (игрок)
    await pool.query(`
      INSERT INTO users (email, username, password_hash, role) 
      VALUES ('player@test.com', 'DragonSlayer', $1, 'player')
      ON CONFLICT (email) DO NOTHING;
    `, [hashedPassword]);
    
    console.log('✅ Test data added successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await pool.end();
  }
}