const fs = require('fs');
const { pool } = require('./index');

async function safeUpdateSchema() {
  try {
    console.log('Checking and updating database schema...');
    
    // Читаем SQL файл
    const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
    
    // Разбиваем SQL на отдельные запросы
    const queries = sql.split(';').filter(q => q.trim());
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i].trim() + ';';
      
      try {
        await pool.query(query);
        console.log(`✅ Query ${i + 1} executed successfully`);
      } catch (error) {
        // Пропускаем ошибки "уже существует"
        if (error.message.includes('уже существует') || 
            error.message.includes('already exists') ||
            error.message.includes('duplicate key')) {
          console.log(`⚠️  Table/constraint already exists, skipping...`);
        } else {
          console.error(`❌ Error in query ${i + 1}:`, error.message);
        }
      }
    }
    
    console.log('✅ Database schema check completed!');
  } catch (error) {
    console.error('❌ Error updating schema:', error.message);
  } finally {
    await pool.end();
  }
}

safeUpdateSchema();