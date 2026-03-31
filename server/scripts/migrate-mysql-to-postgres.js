/**
 * Script de migration MySQL → PostgreSQL pour LogicAI
 *
 * Ce script:
 * 1. Se connecte à MySQL et lit toutes les données
 * 2. Les transforme pour PostgreSQL
 * 3. Les insère dans PostgreSQL via Prisma
 *
 * Usage:
 *   node scripts/migrate-mysql-to-postgres.js
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

// Configuration de la connexion MySQL (ancienne)
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'logicai_saas',
};

// Instance Prisma pour PostgreSQL
const prisma = new PrismaClient();

// Logs avec couleurs
const log = {
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m✗\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
};

/**
 * Connexion à MySQL
 */
async function connectMySQL() {
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    log.success('Connecté à MySQL');
    return connection;
  } catch (error) {
    log.error(`Impossible de se connecter à MySQL: ${error.message}`);
    throw error;
  }
}

/**
 * Récupérer toutes les données de MySQL
 */
async function fetchMySQLData(connection) {
  log.info('Récupération des données depuis MySQL...');

  const [users] = await connection.query('SELECT * FROM users');
  const [instances] = await connection.query('SELECT * FROM instances');
  const [instanceMembers] = await connection.query('SELECT * FROM instance_members');
  const [plans] = await connection.query('SELECT * FROM plans');
  const [betaAccess] = await connection.query('SELECT * FROM beta_access');
  const [betaKeys] = await connection.query('SELECT * FROM beta_keys');

  log.success(`Données récupérées:
    - ${users.length} utilisateurs
    - ${instances.length} instances
    - ${instanceMembers.length} membres d'instances
    - ${plans.length} plans
    - ${betaAccess.length} accès bêta
    - ${betaKeys.length} clés bêta
  `);

  return { users, instances, instanceMembers, plans, betaAccess, betaKeys };
}

/**
 * Transformer les données MySQL en format PostgreSQL
 */
function transformData(data) {
  log.info('Transformation des données...');

  // Users
  const users = data.users.map(user => ({
    id: user.id,
    email: user.email,
    password: user.password,
    firstName: user.first_name,
    lastName: user.last_name,
    plan: user.plan,
    role: user.role,
    betaAccessId: user.beta_access_id,
    hasBetaAccess: Boolean(user.has_beta_access),
    createdAt: new Date(user.created_at),
    updatedAt: new Date(user.updated_at),
  }));

  // Instances
  const instances = data.instances.map(instance => ({
    id: instance.id,
    userId: instance.user_id,
    name: instance.name,
    uuid: instance.uuid,
    subdomain: instance.subdomain,
    port: instance.port,
    status: instance.status,
    deploymentType: instance.deployment_type || 'cloud',
    containerId: instance.container_id,
    tempPassword: instance.temp_password,
    passwordSet: Boolean(instance.password_set),
    n8nEmail: instance.n8n_email,
    isShared: Boolean(instance.is_shared),
    publicUrl: instance.public_url,
    createdAt: new Date(instance.created_at),
    updatedAt: new Date(instance.updated_at),
  }));

  // Instance Members
  const instanceMembers = data.instance_members.map(member => ({
    id: member.id,
    instanceId: member.instance_id,
    userId: member.user_id,
    email: member.email,
    name: member.name,
    role: member.role,
    tempPassword: member.temp_password,
    passwordSet: Boolean(member.password_set),
    invitationToken: member.invitation_token,
    invitationStatus: member.invitation_status,
    createdAt: new Date(member.created_at),
    updatedAt: new Date(member.updated_at),
  }));

  // Plans
  const plans = data.plans.map(plan => ({
    id: plan.id,
    name: plan.name,
    displayName: plan.display_name,
    description: plan.description,
    priceMonthly: plan.price_monthly,
    priceYearly: plan.price_yearly,
    maxInstances: plan.max_instances,
    maxWorkflows: plan.max_workflows,
    maxStorageGb: plan.max_storage_gb,
    maxExecutionsPerMonth: plan.max_executions_per_month,
    features: plan.features,
    isActive: Boolean(plan.is_active),
    createdAt: new Date(plan.created_at),
    updatedAt: new Date(plan.updated_at),
  }));

  // Beta Access
  const betaAccess = data.betaAccess.map(access => ({
    id: access.id,
    email: access.email,
    betaKey: access.beta_key,
    status: access.status,
    createdAt: new Date(access.created_at),
    updatedAt: new Date(access.updated_at),
  }));

  // Beta Keys
  const betaKeys = data.betaKeys.map(key => ({
    id: key.id,
    keyCode: key.key_code,
    maxUses: key.max_uses,
    usedCount: key.used_count,
    isActive: Boolean(key.is_active),
    createdById: key.created_by,
    expiresAt: key.expires_at ? new Date(key.expires_at) : null,
    createdAt: new Date(key.created_at),
  }));

  return { users, instances, instanceMembers, plans, betaAccess, betaKeys };
}

/**
 * Insérer les données dans PostgreSQL via Prisma
 */
async function insertPostgreSQLData(transformedData) {
  log.info('Insertion des données dans PostgreSQL...');

  try {
    // Désactiver les triggers et contraintes temporairement
    await prisma.$executeRawUnsafe('SET CONSTRAINTS ALL DEFERRED;');

    // Insérer dans l'ordre des dépendances
    // 1. Plans (pas de dépendances)
    if (transformedData.plans.length > 0) {
      log.info('Migration des plans...');
      await prisma.plan.createMany({
        data: transformedData.plans,
        skipDuplicates: true,
      });
      log.success(`${transformedData.plans.length} plans migrés`);
    }

    // 2. Beta Keys (dépend de users)
    if (transformedData.betaKeys.length > 0) {
      log.info('Migration des clés bêta...');
      await prisma.betaKey.createMany({
        data: transformedData.betaKeys,
        skipDuplicates: true,
      });
      log.success(`${transformedData.betaKeys.length} clés bêta migrées`);
    }

    // 3. Beta Access (pas de dépendances)
    if (transformedData.betaAccess.length > 0) {
      log.info('Migration des accès bêta...');
      await prisma.betaAccess.createMany({
        data: transformedData.betaAccess,
        skipDuplicates: true,
      });
      log.success(`${transformedData.betaAccess.length} accès bêta migrés`);
    }

    // 4. Users (pas de dépendances externes)
    if (transformedData.users.length > 0) {
      log.info('Migration des utilisateurs...');
      await prisma.user.createMany({
        data: transformedData.users,
        skipDuplicates: true,
      });
      log.success(`${transformedData.users.length} utilisateurs migrés`);
    }

    // 5. Instances (dépend de users)
    if (transformedData.instances.length > 0) {
      log.info('Migration des instances...');
      await prisma.instance.createMany({
        data: transformedData.instances,
        skipDuplicates: true,
      });
      log.success(`${transformedData.instances.length} instances migrées`);
    }

    // 6. Instance Members (dépend de instances et users)
    if (transformedData.instanceMembers.length > 0) {
      log.info('Migration des membres d\'instances...');
      await prisma.instanceMember.createMany({
        data: transformedData.instanceMembers,
        skipDuplicates: true,
      });
      log.success(`${transformedData.instanceMembers.length} membres migrés`);
    }

    log.success('Toutes les données ont été migrées avec succès !');
  } catch (error) {
    log.error(`Erreur lors de l'insertion: ${error.message}`);
    throw error;
  }
}

/**
 * Réinitialiser la séquence des IDs (auto-increment)
 */
async function resetSequences() {
  log.info('Réinitialisation des séquences d\'auto-increment...');

  try {
    const tables = ['users', 'instances', 'instance_members', 'plans', 'beta_access', 'beta_keys'];

    for (const table of tables) {
      await prisma.$executeRawUnsafe(`
        SELECT setval(
          pg_get_serial_sequence('"${table}"', 'id'),
          COALESCE((SELECT MAX(id) FROM "${table}"), 1),
          true
        );
      `);
    }

    log.success('Séquences réinitialisées');
  } catch (error) {
    log.warn(`Impossible de réinitialiser les séquences: ${error.message}`);
  }
}

/**
 * Vérifier l'intégrité des données
 */
async function verifyMigration() {
  log.info('Vérification de l\'intégrité des données...');

  const counts = {
    users: await prisma.user.count(),
    instances: await prisma.instance.count(),
    instanceMembers: await prisma.instanceMember.count(),
    plans: await prisma.plan.count(),
    betaAccess: await prisma.betaAccess.count(),
    betaKeys: await prisma.betaKey.count(),
  };

  log.success('Données dans PostgreSQL:');
  console.table(counts);

  return counts;
}

/**
 * Main migration function
 */
async function migrate() {
  const startTime = Date.now();

  try {
    log.info('=== DÉBUT DE LA MIGRATION MYSQL → POSTGRESQL ===\n');

    // 1. Connexion à MySQL
    const mysqlConnection = await connectMySQL();

    // 2. Récupération des données
    const mysqlData = await fetchMySQLData(mysqlConnection);

    // Fermer la connexion MySQL
    await mysqlConnection.end();

    // 3. Transformation des données
    const transformedData = transformData(mysqlData);

    // 4. Insertion dans PostgreSQL
    await insertPostgreSQLData(transformedData);

    // 5. Réinitialiser les séquences
    await resetSequences();

    // 6. Vérification
    await verifyMigration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    log.success(`\n=== MIGRATION TERMINÉE EN ${duration}s ===`);

  } catch (error) {
    log.error(`Erreur critique: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter la migration
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
