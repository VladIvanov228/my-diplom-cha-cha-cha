const fs = require('fs');
const { pool } = require('./index');

async function updateSchema() {
  try {
    console.log('Updating database schema...');
    
    const sql = fs.readFileSync(__dirname + '/schema.sql', 'utf8');
    await pool.query(sql);
    
    console.log('✅ Database schema updated successfully!');
  } catch (error) {
    console.error('❌ Error updating schema:', error.message);
  }
}

updateSchema();