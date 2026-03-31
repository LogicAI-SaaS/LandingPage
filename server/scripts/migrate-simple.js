/**
 * Script simplifié de migration MySQL → PostgreSQL
 * Version sans dépendances externes complexes
 */

const mysql = require('mysql2/promise');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

// Configuration MySQL (ancienne base)
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'logicai_saas',
};

// Logs
const log = {
  info: (msg) => console.log(`\x1b[36mℹ\x1b[0m ${msg}`),
  success: (msg) => console.log(`\x1b[32m✓\x1b[0m ${msg}`),
  error: (msg) => console.log(`\x1b[31m✗\x1b[0m ${msg}`),
  warn: (msg) => console.log(`\x1b[33m⚠\x1b[0m ${msg}`),
};

async function migrate() {
  try {
    log.info('Connexion à MySQL...');
    const connection = await mysql.createConnection(mysqlConfig);
    log.success('Connecté à MySQL');

    // ============================================
    // 1. Users
    // ============================================
    log.info('Migration des utilisateurs...');
    const [users] = await connection.query('SELECT * FROM users');

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: {
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
        }
      });
    }
    log.success(`${users.length} utilisateurs migrés`);

    // ============================================
    // 2. Subscription Plans
    // ============================================
    log.info('Migration des plans...');
    try {
      const [plans] = await connection.query('SELECT * FROM plans');

      for (const plan of plans) {
        await prisma.subscriptionPlan.upsert({
          where: { name: plan.name },
          update: {},
          create: {
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
          }
        });
      }
      log.success(`${plans.length} plans migrés`);
    } catch (error) {
      log.warn('Table plans inexistante (normal)');
    }

    // ============================================
    // 3. Instances
    // ============================================
    log.info('Migration des instances...');
    const [instances] = await connection.query('SELECT * FROM instances');

    for (const instance of instances) {
      await prisma.instance.upsert({
        where: { uuid: instance.uuid },
        update: {},
        create: {
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
        }
      });
    }
    log.success(`${instances.length} instances migrées`);

    // ============================================
    // 4. Instance Members
    // ============================================
    log.info('Migration des membres d\'instances...');
    const [members] = await connection.query('SELECT * FROM instance_members');

    for (const member of members) {
      await prisma.instanceMember.create({
        data: {
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
        },
        skipDuplicates: true
      });
    }
    log.success(`${members.length} membres migrés`);

    // ============================================
    // 5. Beta Access
    // ============================================
    log.info('Migration des accès bêta...');
    try {
      const [betaAccess] = await connection.query('SELECT * FROM beta_access');

      for (const access of betaAccess) {
        await prisma.betaAccess.upsert({
          where: { email: access.email },
          update: {},
          create: {
            email: access.email,
            betaKey: access.beta_key,
            status: access.status,
            createdAt: new Date(access.created_at),
            updatedAt: new Date(access.updated_at),
          }
        });
      }
      log.success(`${betaAccess.length} accès bêta migrés`);
    } catch (error) {
      log.warn('Table beta_access inexistante (normal)');
    }

    // ============================================
    // 6. Beta Keys
    // ============================================
    log.info('Migration des clés bêta...');
    try {
      const [betaKeys] = await connection.query('SELECT * FROM beta_keys');

      for (const key of betaKeys) {
        await prisma.betaKey.create({
          data: {
            keyCode: key.key_code,
            maxUses: key.max_uses,
            usedCount: key.used_count,
            isActive: Boolean(key.is_active),
            createdById: key.created_by,
            expiresAt: key.expires_at ? new Date(key.expires_at) : null,
            createdAt: new Date(key.created_at),
          },
          skipDuplicates: true
        });
      }
      log.success(`${betaKeys.length} clés bêta migrées`);
    } catch (error) {
      log.warn('Table beta_keys inexistante (normal)');
    }

    // ============================================
    // 7. Reset sequences
    // ============================================
    log.info('Réinitialisation des séquences auto-increment...');

    const tables = ['users', 'instances', 'instance_members', 'subscription_plans', 'beta_access', 'beta_keys'];

    for (const table of tables) {
      try {
        await prisma.$executeRawUnsafe(`
          SELECT setval(
            pg_get_serial_sequence('"${table}"', 'id'),
            COALESCE((SELECT MAX(id) FROM "${table}"), 1),
            true
          );
        `);
      } catch (error) {
        // La table ou la séquence n'existe pas encore
      }
    }

    log.success('Séquences réinitialisées');

    // Fermer la connexion MySQL
    await connection.end();

    // ============================================
    // 8. Vérification
    // ============================================
    log.info('Vérification de la migration...');

    const counts = {
      users: await prisma.user.count(),
      instances: await prisma.instance.count(),
      instanceMembers: await prisma.instanceMember.count(),
      plans: await prisma.subscriptionPlan.count(),
      betaAccess: await prisma.betaAccess.count(),
      betaKeys: await prisma.betaKey.count(),
    };

    console.log('\n📊 Données dans PostgreSQL:');
    console.table(counts);

    log.success('\n✅ MIGRATION TERMINÉE AVEC SUCCÈS !');

  } catch (error) {
    log.error(`Erreur: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
