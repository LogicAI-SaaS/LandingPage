#!/usr/bin/env node

/**
 * Script de vérification de l'intégrité de la base de données
 * Vérifie que tous les plans utilisateurs sont valides
 */

const { promisePool } = require('../src/config/database');

async function checkDatabaseIntegrity() {
  try {
    console.log('🔍 Vérification de l\'intégrité de la base de données...\n');

    // 1. Vérifier que la table plans existe
    const [tables] = await promisePool.query(`
      SHOW TABLES LIKE 'plans'
    `);

    if (tables.length === 0) {
      console.log('⚠️  La table "plans" n\'existe pas encore.');
      console.log('📝 Exécutez: node src/database/create-plan-tables.js\n');
      return false;
    }

    console.log('✅ Table "plans" trouvée');

    // 2. Vérifier les plans valides
    const [plans] = await promisePool.query('SELECT name FROM plans WHERE is_active = 1');
    const validPlans = plans.map(p => p.name);
    
    console.log(`✅ Plans valides: ${validPlans.join(', ')}\n`);

    // 3. Vérifier les utilisateurs
    const [users] = await promisePool.query('SELECT COUNT(*) as count FROM users');
    console.log(`👥 Nombre total d\'utilisateurs: ${users[0].count}`);

    // 4. Vérifier les plans utilisateurs
    const [userPlans] = await promisePool.query(`
      SELECT plan, COUNT(*) as count 
      FROM users 
      GROUP BY plan
    `);

    console.log('\n📊 Distribution des plans utilisateurs:');
    userPlans.forEach(up => {
      const isValid = validPlans.includes(up.plan);
      const status = isValid ? '✅' : '❌';
      console.log(`  ${status} ${up.plan}: ${up.count} utilisateur(s)`);
    });

    // 5. Trouver les plans invalides
    const [invalidUsers] = await promisePool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE plan NOT IN (?) OR plan IS NULL OR plan = ''
    `, [validPlans.length > 0 ? validPlans : ['free']]);

    if (invalidUsers[0].count > 0) {
      console.log(`\n⚠️  ${invalidUsers[0].count} utilisateur(s) avec un plan invalide ou vide`);
      console.log('\n📝 Actions recommandées:');
      console.log('   Exécutez: node src/database/sync-user-plans.js');
      return false;
    } else {
      console.log('\n✅ Tous les plans utilisateurs sont valides!');
    }

    // 6. Vérifier les contraintes
    const [nullPlans] = await promisePool.query(`
      SELECT COUNT(*) as count FROM users WHERE plan IS NULL
    `);

    if (nullPlans[0].count > 0) {
      console.log(`\n⚠️  ${nullPlans[0].count} utilisateur(s) sans plan assigné`);
      return false;
    }

    console.log('\n🎉 Base de données intègre et synchronisée!');
    return true;

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    return false;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  checkDatabaseIntegrity()
    .then((isValid) => {
      process.exit(isValid ? 0 : 1);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = checkDatabaseIntegrity;
