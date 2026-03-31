const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createPlanTables() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'logicai_saas'
  });

  try {
    console.log('🚀 Création de la table des plans...\n');

    // Créer la table plans
    await conn.query(`
      CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        price_monthly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        price_yearly DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        max_instances INT NOT NULL DEFAULT 1,
        max_workflows INT NOT NULL DEFAULT 10,
        max_storage_gb INT NOT NULL DEFAULT 1,
        max_executions_per_month INT NOT NULL DEFAULT 1000,
        features JSON,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_is_active (is_active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Table plans créée');

    // Insérer les plans par défaut
    const plans = [
      {
        name: 'free',
        display_name: 'Free',
        description: 'Plan gratuit pour démarrer avec LogicAI',
        price_monthly: 0.00,
        price_yearly: 0.00,
        max_instances: 1,
        max_workflows: 10,
        max_storage_gb: 1,
        max_executions_per_month: 1000,
        features: JSON.stringify({
          support: 'community',
          custom_domain: false,
          advanced_analytics: false,
          priority_support: false,
          white_label: false,
          api_access: false,
          team_collaboration: false,
          sla_guarantee: false
        })
      },
      {
        name: 'pro',
        display_name: 'Pro',
        description: 'Plan professionnel pour les utilisateurs avancés',
        price_monthly: 29.99,
        price_yearly: 299.00,
        max_instances: 5,
        max_workflows: 100,
        max_storage_gb: 10,
        max_executions_per_month: 50000,
        features: JSON.stringify({
          support: 'email',
          custom_domain: true,
          advanced_analytics: true,
          priority_support: false,
          white_label: false,
          api_access: true,
          team_collaboration: true,
          sla_guarantee: false
        })
      },
      {
        name: 'business',
        display_name: 'Business',
        description: 'Plan entreprise pour les équipes',
        price_monthly: 99.99,
        price_yearly: 999.00,
        max_instances: 20,
        max_workflows: -1, // -1 = illimité
        max_storage_gb: 50,
        max_executions_per_month: 500000,
        features: JSON.stringify({
          support: 'priority',
          custom_domain: true,
          advanced_analytics: true,
          priority_support: true,
          white_label: false,
          api_access: true,
          team_collaboration: true,
          sla_guarantee: true
        })
      },
      {
        name: 'corporation',
        display_name: 'Corporation',
        description: 'Plan sur mesure pour les grandes entreprises',
        price_monthly: 299.99,
        price_yearly: 2999.00,
        max_instances: -1, // illimité
        max_workflows: -1, // illimité
        max_storage_gb: -1, // illimité
        max_executions_per_month: -1, // illimité
        features: JSON.stringify({
          support: 'dedicated',
          custom_domain: true,
          advanced_analytics: true,
          priority_support: true,
          white_label: true,
          api_access: true,
          team_collaboration: true,
          sla_guarantee: true,
          custom_integrations: true,
          dedicated_infrastructure: true,
          compliance_certifications: true
        })
      }
    ];

    for (const plan of plans) {
      try {
        await conn.query(`
          INSERT INTO plans (
            name, display_name, description, 
            price_monthly, price_yearly,
            max_instances, max_workflows, max_storage_gb, max_executions_per_month,
            features, is_active
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE
            display_name = VALUES(display_name),
            description = VALUES(description),
            price_monthly = VALUES(price_monthly),
            price_yearly = VALUES(price_yearly),
            max_instances = VALUES(max_instances),
            max_workflows = VALUES(max_workflows),
            max_storage_gb = VALUES(max_storage_gb),
            max_executions_per_month = VALUES(max_executions_per_month),
            features = VALUES(features)
        `, [
          plan.name, plan.display_name, plan.description,
          plan.price_monthly, plan.price_yearly,
          plan.max_instances, plan.max_workflows, plan.max_storage_gb, plan.max_executions_per_month,
          plan.features
        ]);
        console.log(`✅ Plan "${plan.display_name}" inséré/mis à jour`);
      } catch (err) {
        console.error(`❌ Erreur lors de l'insertion du plan ${plan.name}:`, err.message);
      }
    }

    console.log('\n🎉 Tables des plans créées et données initialisées avec succès!');
    console.log('\n📊 Plans disponibles:');
    const [existingPlans] = await conn.query('SELECT name, display_name, price_monthly, max_instances, max_workflows FROM plans ORDER BY price_monthly ASC');
    console.table(existingPlans);

  } catch (error) {
    console.error('❌ Erreur lors de la création des tables des plans:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  createPlanTables()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = createPlanTables;
