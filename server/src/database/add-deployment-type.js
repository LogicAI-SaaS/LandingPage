const fs = require('fs');
const path = require('path');
const { promisePool } = require('../config/database');

async function runMigration() {
  console.log('🔄 Starting migration: add-deployment-type');

  try {
    // Lire le fichier SQL
    const sqlFile = path.join(__dirname, 'add-deployment-type.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Diviser le SQL en instructions individuelles (séparées par ;)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    // Exécuter chaque instruction
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        await promisePool.execute(statement);
      }
    }

    console.log('✅ Migration completed successfully!');

    // Afficher le résumé
    const [rows] = await promisePool.execute(`
      SELECT deployment_type, COUNT(*) as count
      FROM instances
      GROUP BY deployment_type
    `);

    console.log('\n📊 Current instances by deployment type:');
    console.table(rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
