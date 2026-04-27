const fs = require('fs');
const { pool } = require('./index');

async function safeUpdateSchema() {
  try {
    console.log('🔄 Checking and updating database schema...');
    
    // Читаем SQL файл
    const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
    
    // Удаляем комментарии
    const cleanSQL = sql.replace(/--.*$/gm, '');
    
    // Разбиваем на запросы, учитывая многострочные функции
    const queries = [];
    let currentQuery = '';
    let inFunction = false;
    let inDollarQuote = false;
    
    const lines = cleanSQL.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Пропускаем пустые строки
      if (!trimmedLine) continue;
      
      // Проверяем начало функции с $$
      if (trimmedLine.includes('$$')) {
        if (!inDollarQuote) {
          inDollarQuote = true;
          inFunction = true;
        } else {
          inDollarQuote = false;
        }
      }
      
      currentQuery += line + '\n';
      
      // Если не в функции и строка заканчивается на ;
      if (!inFunction && trimmedLine.endsWith(';')) {
        const finalQuery = currentQuery.trim();
        if (finalQuery && finalQuery !== ';') {
          queries.push(finalQuery);
        }
        currentQuery = '';
      }
      
      // Выход из функции когда найдена строка LANGUAGE
      if (inFunction && trimmedLine.includes('LANGUAGE plpgsql')) {
        inFunction = false;
        const finalQuery = currentQuery.trim();
        if (finalQuery) {
          queries.push(finalQuery);
        }
        currentQuery = '';
      }
    }
    
    console.log(`📊 Found ${queries.length} SQL queries`);
    
    // Выполняем запросы
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      try {
        await pool.query(query);
        successCount++;
        
        // Показываем прогресс для длинных запросов
        if (query.length > 100) {
          const firstLine = query.split('\n')[0].substring(0, 50);
          console.log(`✅ Query ${i + 1}: ${firstLine}...`);
        }
      } catch (error) {
        // Пропускаем ошибки "уже существует"
        if (error.message.includes('уже существует') || 
            error.message.includes('already exists') ||
            error.message.includes('duplicate key') ||
            error.message.includes('multiple primary keys')) {
          skipCount++;
          // console.log(`⚠️  Query ${i + 1}: Already exists, skipping`);
        } else {
          errorCount++;
          console.error(`❌ Error in query ${i + 1}:`, error.message);
          console.error('   Query:', query.substring(0, 100) + '...');
        }
      }
    }
    
    console.log('\n📈 Results:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⚠️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors:  ${errorCount}`);
    console.log('✅ Database schema check completed!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await pool.end();
  }
}

safeUpdateSchema();