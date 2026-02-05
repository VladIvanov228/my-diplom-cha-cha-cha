const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
require('dotenv').config();

async function testPassword() {
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  
  try {
    // Получаем пользователя
    const result = await pool.query(
      "SELECT * FROM users WHERE email = 'player@test.com'"
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = result.rows[0];
    console.log('User:', user.email);
    console.log('Hash in DB:', user.password_hash);
    
    // Проверяем пароль
    const testPasswords = ['test123', 'Test123', 'TEST123', 'test', '123'];
    
    for (const testPassword of testPasswords) {
      const isValid = await bcrypt.compare(testPassword, user.password_hash);
      console.log(`Password "${testPassword}" matches? ${isValid}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

testPassword();