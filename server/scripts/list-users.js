require('dotenv').config();
const { promisePool } = require('../src/config/database');

async function listUsers() {
  try {
    const [rows] = await promisePool.execute('SELECT id, email, first_name, last_name, role FROM users');

    console.log('\n📋 Utilisateurs dans la base de données:\n');
    if (rows.length === 0) {
      console.log('❌ Aucun utilisateur trouvé.');
    } else {
      rows.forEach(user => {
        console.log(`  • ID: ${user.id}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Nom: ${user.first_name} ${user.last_name}`);
        console.log(`    Rôle: ${user.role}`);
        console.log('');
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

listUsers();
