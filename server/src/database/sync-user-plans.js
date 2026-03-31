const mysql = require('mysql2/promise');

async function syncUserPlans() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'logicai_saas'
  });

  try {
    console.log('🔄 Synchronisation des plans utilisateurs...\n');

    // 1. Vérifier les plans existants dans la table users
    const [userPlans] = await conn.query(`
      SELECT DISTINCT plan, COUNT(*) as count 
      FROM users 
      GROUP BY plan
      ORDER BY count DESC
    `);

    console.log('📊 Plans actuels dans la table users:');
    console.table(userPlans);

    // 2. Vérifier les plans disponibles dans la table plans
    const [availablePlans] = await conn.query(`
      SELECT name, display_name, is_active 
      FROM plans 
      ORDER BY price_monthly ASC
    `);

    console.log('\n📋 Plans disponibles dans la table plans:');
    console.table(availablePlans);

    // 3. Créer une map des plans valides
    const validPlans = availablePlans.map(p => p.name);
    
    // 4. Trouver les utilisateurs avec des plans invalides
    const [invalidPlanUsers] = await conn.query(`
      SELECT id, email, plan 
      FROM users 
      WHERE plan NOT IN (?)
      LIMIT 10
    `, [validPlans.length > 0 ? validPlans : ['free']]);

    if (invalidPlanUsers.length > 0) {
      console.log('\n⚠️  Utilisateurs avec des plans invalides trouvés:');
      console.table(invalidPlanUsers);

      // Demander confirmation pour la migration
      console.log('\n📝 Actions recommandées:');
      console.log('1. Migrer les plans invalides vers "free"');
      console.log('2. Vérifier manuellement et corriger si nécessaire\n');

      // Mise à jour automatique vers 'free' pour les plans invalides
      const [updateResult] = await conn.query(`
        UPDATE users 
        SET plan = 'free' 
        WHERE plan NOT IN (?)
      `, [validPlans.length > 0 ? validPlans : ['free']]);

      console.log(`✅ ${updateResult.affectedRows} utilisateurs migrés vers le plan "free"`);
    } else {
      console.log('\n✅ Tous les utilisateurs ont des plans valides!');
    }

    // 5. Statistiques finales
    const [finalStats] = await conn.query(`
      SELECT 
        u.plan,
        p.display_name,
        COUNT(u.id) as user_count,
        p.is_active
      FROM users u
      LEFT JOIN plans p ON u.plan = p.name
      GROUP BY u.plan, p.display_name, p.is_active
      ORDER BY user_count DESC
    `);

    console.log('\n📊 Distribution finale des utilisateurs par plan:');
    console.table(finalStats);

    // 6. Vérifier l'intégrité des données
    const [nullPlans] = await conn.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE plan IS NULL OR plan = ''
    `);

    if (nullPlans[0].count > 0) {
      console.log(`\n⚠️  ${nullPlans[0].count} utilisateurs sans plan assigné`);
      console.log('Correction en cours...');
      
      await conn.query(`
        UPDATE users 
        SET plan = 'free' 
        WHERE plan IS NULL OR plan = ''
      `);
      
      console.log('✅ Plans par défaut assignés');
    }

    console.log('\n🎉 Synchronisation terminée avec succès!');
    console.log('\n💡 Conseils:');
    console.log('  - La colonne "plan" dans users est maintenant alignée avec la table plans');
    console.log('  - Les nouveaux utilisateurs auront par défaut le plan "free"');
    console.log('  - Utilisez le script manage-plans.js pour gérer les plans');

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  syncUserPlans()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = syncUserPlans;
