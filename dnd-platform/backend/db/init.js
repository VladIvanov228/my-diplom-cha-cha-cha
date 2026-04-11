const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

async function initializeDatabase() {
  let appPool = null;
  
  try {
    console.log('Initializing database...');
    
    // Читаем SQL файл
    const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
    
    // Разделяем SQL на отдельные команды
    const commands = sql
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0);
    
    console.log(`Found ${commands.length} SQL commands`);
    
    // Подключаемся к нашей БД
    appPool = new Pool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    
    // Выполняем каждую команду отдельно для лучшей диагностики
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      try {
        await appPool.query(command);
        console.log(`✅ Command ${i + 1} executed successfully`);
      } catch (cmdError) {
        console.error(`❌ Error in command ${i + 1}:`);
        console.error(command);
        console.error('Error:', cmdError.message);
        throw cmdError; // Останавливаем выполнение при ошибке
      }
    }
    
    console.log('✅ Database schema created successfully!');
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
  } finally {
    if (appPool) {
      await appPool.end();
    }
  }
}

initializeDatabase();