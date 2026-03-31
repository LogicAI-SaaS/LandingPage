#!/usr/bin/env node

/**
 * Script de gestion des plans
 * Usage: node scripts/manage-plans.js [command] [options]
 * 
 * Commands:
 *   list                    - Liste tous les plans
 *   list-active             - Liste les plans actifs uniquement
 *   show <planName>         - Affiche les détails d'un plan
 *   stats                   - Affiche les statistiques d'utilisation
 *   create                  - Crée un nouveau plan (interactif)
 *   update <planName>       - Met à jour un plan
 *   activate <planName>     - Active un plan
 *   deactivate <planName>   - Désactive un plan
 *   init                    - Initialise les plans par défaut
 *   sync                    - Synchronise les plans utilisateurs
 *   check                   - Vérifie l'intégrité de la base de données
 */

const Plan = require('../src/models/Plan');
const { promisePool } = require('../src/config/database');

async function listPlans(activeOnly = false) {
  try {
    const plans = activeOnly ? await Plan.findAllActive() : await Plan.findAll();
    
    console.log('\n📊 Liste des plans:\n');
    console.table(plans.map(p => ({
      ID: p.id,
      Nom: p.name,
      'Nom affiché': p.display_name,
      'Prix/mois': `${p.price_monthly}€`,
      'Prix/an': `${p.price_yearly}€`,
      Instances: p.max_instances === -1 ? '∞' : p.max_instances,
      Workflows: p.max_workflows === -1 ? '∞' : p.max_workflows,
      Actif: p.is_active ? '✅' : '❌'
    })));
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function showPlan(planName) {
  try {
    const plan = await Plan.findByName(planName);
    
    if (!plan) {
      console.error(`❌ Plan "${planName}" non trouvé`);
      process.exit(1);
    }

    console.log('\n📋 Détails du plan:\n');
    console.log(`ID: ${plan.id}`);
    console.log(`Nom: ${plan.name}`);
    console.log(`Nom affiché: ${plan.display_name}`);
    console.log(`Description: ${plan.description || 'N/A'}`);
    console.log(`\n💰 Tarification:`);
    console.log(`  Prix mensuel: ${plan.price_monthly}€`);
    console.log(`  Prix annuel: ${plan.price_yearly}€`);
    console.log(`\n📊 Limites:`);
    console.log(`  Instances max: ${plan.max_instances === -1 ? 'Illimité' : plan.max_instances}`);
    console.log(`  Workflows max: ${plan.max_workflows === -1 ? 'Illimité' : plan.max_workflows}`);
    console.log(`  Stockage max: ${plan.max_storage_gb === -1 ? 'Illimité' : plan.max_storage_gb + ' GB'}`);
    console.log(`  Exécutions/mois: ${plan.max_executions_per_month === -1 ? 'Illimité' : plan.max_executions_per_month.toLocaleString()}`);
    console.log(`\n✨ Fonctionnalités:`);
    if (plan.features && typeof plan.features === 'object') {
      Object.entries(plan.features).forEach(([key, value]) => {
        const icon = value === true ? '✅' : value === false ? '❌' : '📌';
        console.log(`  ${icon} ${key}: ${value}`);
      });
    }
    console.log(`\n📅 Dates:`);
    console.log(`  Créé le: ${plan.created_at}`);
    console.log(`  Mis à jour: ${plan.updated_at}`);
    console.log(`\nStatut: ${plan.is_active ? '✅ Actif' : '❌ Inactif'}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function showStats() {
  try {
    const [stats] = await promisePool.query(`
      SELECT 
        u.plan,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT i.id) as instance_count,
        p.display_name as plan_name,
        p.price_monthly
      FROM users u
      LEFT JOIN instances i ON u.id = i.user_id AND i.status != 'deleted'
      LEFT JOIN plans p ON u.plan = p.name
      GROUP BY u.plan, p.display_name, p.price_monthly
      ORDER BY p.price_monthly ASC
    `);

    console.log('\n📈 Statistiques d\'utilisation des plans:\n');
    
    let totalUsers = 0;
    let totalInstances = 0;
    let estimatedRevenue = 0;

    const formattedStats = stats.map(s => {
      totalUsers += s.user_count;
      totalInstances += s.instance_count;
      const revenue = s.price_monthly * s.user_count;
      estimatedRevenue += revenue;
      
      return {
        Plan: s.plan_name || s.plan,
        Utilisateurs: s.user_count,
        Instances: s.instance_count,
        'Prix/mois': `${s.price_monthly || 0}€`,
        'Revenus estimés': `${revenue.toFixed(2)}€`
      };
    });

    console.table(formattedStats);
    
    console.log('\n📊 Résumé global:');
    console.log(`  Total utilisateurs: ${totalUsers}`);
    console.log(`  Total instances: ${totalInstances}`);
    console.log(`  Revenus mensuels estimés: ${estimatedRevenue.toFixed(2)}€`);
    console.log(`  Revenus annuels estimés: ${(estimatedRevenue * 12).toFixed(2)}€\n`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function togglePlan(planName, activate) {
  try {
    const plan = await Plan.findByName(planName);
    
    if (!plan) {
      console.error(`❌ Plan "${planName}" non trouvé`);
      process.exit(1);
    }

    await Plan.toggleActive(plan.id, activate);
    console.log(`✅ Plan "${planName}" ${activate ? 'activé' : 'désactivé'} avec succès`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function initPlans() {
  try {
    console.log('🚀 Initialisation des plans par défaut...\n');
    const createPlanTables = require('../src/database/create-plan-tables');
    await createPlanTables();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function syncPlans() {
  try {
    console.log('🔄 Synchronisation des plans utilisateurs...\n');
    const syncUserPlans = require('../src/database/sync-user-plans');
    await syncUserPlans();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

async function checkIntegrity() {
  try {
    const checkDatabaseIntegrity = require('./check-db-integrity');
    await checkDatabaseIntegrity();
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Main
async function main() {
  const command = process.argv[2];
  const arg = process.argv[3];

  if (!command) {
    console.log(`
Usage: node scripts/manage-plans.js [command] [options]

Commands:
  list                    - Liste tous les plans
  list-active             - Liste les plans actifs uniquement
  show <planName>         - Affiche les détails d'un plan
  stats                   - Affiche les statistiques d'utilisation
  activate <planName>     - Active un plan
  deactivate <planName>   - Désactive un plan
  init                    - Initialise les plans par défaut
  sync                    - Synchronise les plans utilisateurs
  check                   - Vérifie l'intégrité de la base de données

Examples:
  node scripts/manage-plans.js list
  node scripts/manage-plans.js show pro
  node scripts/manage-plans.js stats
  node scripts/manage-plans.js sync
  node scripts/manage-plans.js check
    `);
    process.exit(0);
  }

  try {
    switch (command) {
      case 'list':
        await listPlans(false);
        break;
      case 'list-active':
        await listPlans(true);
        break;
      case 'show':
        if (!arg) {
          console.error('❌ Veuillez spécifier le nom du plan');
          process.exit(1);
        }
        await showPlan(arg);
        break;
      case 'stats':
        await showStats();
        break;
      case 'activate':
        if (!arg) {
          console.error('❌ Veuillez spécifier le nom du plan');
          process.exit(1);
        }
        await togglePlan(arg, true);
        break;
      case 'deactivate':
        if (!arg) {
          console.error('❌ Veuillez spécifier le nom du plan');
          process.exit(1);
        }
        await togglePlan(arg, false);
        break;
      case 'sync':
        await syncPlans();
        break;
      case 'check':
        await checkIntegrity();
        break;
      case 'init':
        await initPlans();
        break;
      default:
        console.error(`❌ Commande inconnue: ${command}`);
        process.exit(1);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

main();
