require('dotenv').config();
const { promisePool } = require('../src/config/database');

async function makeAdmin(email) {
  try {
    const sql = 'UPDATE users SET role = ? WHERE email = ?';
    const [result] = await promisePool.execute(sql, ['admin', email]);

    if (result.affectedRows === 0) {
      console.log(`❌ Aucun utilisateur trouvé avec l'email: ${email}`);
    } else {
      console.log(`✅ L'utilisateur ${email} est maintenant admin !`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

// Récupérer l'email depuis les arguments ou utiliser l'email par défaut
const email = process.argv[2] || 'samuel74300@gmail.com';

console.log(`🔐 Promotion de ${email} en admin...`);
makeAdmin(email);
