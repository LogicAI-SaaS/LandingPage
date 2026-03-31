/**
 * Script de seed pour PostgreSQL
 * Remplit la base de données avec les données initiales
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Début du seed...');

  try {
    // ============================================
    // 1. Nettoyer la base de données
    // ============================================
    console.log('🧹 Nettoyage de la base de données...');

    await prisma.instanceMember.deleteMany();
    await prisma.instance.deleteMany();
    await prisma.betaKey.deleteMany();
    await prisma.betaAccess.deleteMany();
    await prisma.user.deleteMany();
    await prisma.plan.deleteMany();

    console.log('✅ Base de données nettoyée');

    // ============================================
    // 2. Créer les plans
    // ============================================
    console.log('📋 Création des plans...');

    const plans = await prisma.subscriptionPlan.createMany({
      data: [
        {
          name: 'free',
          displayName: 'Free',
          description: 'Plan gratuit pour démarrer avec LogicAI',
          priceMonthly: 0.00,
          priceYearly: 0.00,
          maxInstances: 1,
          maxWorkflows: 10,
          maxStorageGb: 1,
          maxExecutionsPerMonth: 1000,
          features: {
            support: 'community',
            custom_domain: false,
            advanced_analytics: false,
            priority_support: false,
            white_label: false,
            api_access: false,
            team_collaboration: false,
            sla_guarantee: false
          },
          isActive: true
        },
        {
          name: 'pro',
          displayName: 'Pro',
          description: 'Plan professionnel pour les utilisateurs avancés',
          priceMonthly: 29.99,
          priceYearly: 299.00,
          maxInstances: 5,
          maxWorkflows: 100,
          maxStorageGb: 10,
          maxExecutionsPerMonth: 50000,
          features: {
            support: 'email',
            custom_domain: true,
            advanced_analytics: true,
            priority_support: false,
            white_label: false,
            api_access: true,
            team_collaboration: true,
            sla_guarantee: false
          },
          isActive: true
        },
        {
          name: 'business',
          displayName: 'Business',
          description: 'Plan entreprise pour les équipes',
          priceMonthly: 99.99,
          priceYearly: 999.00,
          maxInstances: 20,
          maxWorkflows: -1,
          maxStorageGb: 50,
          maxExecutionsPerMonth: 500000,
          features: {
            support: 'priority',
            custom_domain: true,
            advanced_analytics: true,
            priority_support: true,
            white_label: false,
            api_access: true,
            team_collaboration: true,
            sla_guarantee: true
          },
          isActive: true
        },
        {
          name: 'corporation',
          displayName: 'Corporation',
          description: 'Plan sur mesure pour les grandes entreprises',
          priceMonthly: 299.99,
          priceYearly: 2999.00,
          maxInstances: -1,
          maxWorkflows: -1,
          maxStorageGb: -1,
          maxExecutionsPerMonth: -1,
          features: {
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
          },
          isActive: true
        }
      ],
      skipDuplicates: true
    });

    console.log(`✅ ${plans.count} plans créés`);

    // ============================================
    // 3. Créer l'utilisateur admin par défaut
    // ============================================
    console.log('👤 Création de l\'utilisateur admin...');

    const hashedPassword = await bcrypt.hash('admin123', 10);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@logicai.fr' },
      update: {},
      create: {
        email: 'admin@logicai.fr',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'LogicAI',
        plan: 'corporation',
        role: 'admin'
      }
    });

    console.log(`✅ Utilisateur admin créé: ${admin.email} / admin123`);

    // ============================================
    // 4. Créer quelques utilisateurs de test
    // ============================================
    console.log('👥 Création des utilisateurs de test...');

    const testUsers = [
      {
        email: 'user@logicai.fr',
        password: 'user123',
        firstName: 'Utilisateur',
        lastName: 'Test',
        plan: 'free',
        role: 'user'
      },
      {
        email: 'pro@logicai.fr',
        password: 'pro123',
        firstName: 'Utilisateur',
        lastName: 'Pro',
        plan: 'pro',
        role: 'user'
      }
    ];

    for (const userData of testUsers) {
      const hashed = await bcrypt.hash(userData.password, 10);
      await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          ...userData,
          password: hashed
        }
      });
      console.log(`✅ Utilisateur créé: ${userData.email} / ${userData.password}`);
    }

    // ============================================
    // 5. Créer quelques instances de test
    // ============================================
    console.log('🐳 Création des instances de test...');

    const testUser = await prisma.user.findUnique({
      where: { email: 'user@logicai.fr' }
    });

    if (testUser) {
      await prisma.instance.create({
        data: {
          userId: testUser.id,
          name: 'instance-test-cloud',
          uuid: 'test123',
          subdomain: 'test123.logicai.fr',
          port: 5678,
          status: 'running',
          deploymentType: 'cloud'
        }
      });

      await prisma.instance.create({
        data: {
          userId: testUser.id,
          name: 'instance-test-local',
          uuid: 'local456',
          subdomain: 'local456.logicai.fr',
          status: 'stopped',
          deploymentType: 'local'
        }
      });

      console.log('✅ 2 instances de test créées');
    }

    // ============================================
    // 6. Créer des clés bêta de test
    // ============================================
    console.log('🔑 Création des clés bêta...');

    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@logicai.fr' }
    });

    if (adminUser) {
      await prisma.betaKey.createMany({
        data: [
          {
            keyCode: 'BETA_TEST_2024',
            maxUses: 100,
            usedCount: 0,
            isActive: true,
            createdById: adminUser.id
          },
          {
            keyCode: 'EARLY_ACCESS',
            maxUses: 50,
            usedCount: 5,
            isActive: true,
            createdById: adminUser.id
          }
        ]
      });

      console.log('✅ 2 clés bêta créées');
    }

    console.log('\n🎉 Seed terminé avec succès !');
    console.log('\n📝 Comptes de test:');
    console.log('   Admin: admin@logicai.fr / admin123');
    console.log('   User:  user@logicai.fr / user123');
    console.log('   Pro:   pro@logicai.fr / pro123');

  } catch (error) {
    console.error('❌ Erreur lors du seed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seed()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
