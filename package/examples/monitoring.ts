/**
 * Exemple: Script de monitoring des instances
 * 
 * Script pour monitorer l'état des instances et les gérer automatiquement
 */

import { LogicAIClient } from '../src';

const client = new LogicAIClient({
  apiUrl: process.env.LOGICAI_API_URL || 'http://localhost:3000',
  token: process.env.LOGICAI_TOKEN || 'your-token-here',
});

// Afficher l'état des instances
async function displayInstancesStatus() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 ÉTAT DES INSTANCES');
  console.log('='.repeat(60) + '\n');

  try {
    const instances = await client.instances.list();

    if (instances.length === 0) {
      console.log('⚠️  Aucune instance trouvée\n');
      return;
    }

    for (const instance of instances) {
      const statusIcon = instance.status === 'running' ? '✅' : 
                        instance.status === 'stopped' ? '⏸️' : 
                        instance.status === 'error' ? '❌' : '⏳';

      console.log(`${statusIcon} ${instance.name}`);
      console.log(`   UUID: ${instance.uuid}`);
      console.log(`   Status: ${instance.status}`);
      console.log(`   URL: ${instance.url || 'N/A'}`);
      console.log(`   Port: ${instance.port || 'N/A'}`);
      console.log(`   Créé: ${new Date(instance.created_at).toLocaleString('fr-FR')}`);
      console.log('');
    }

    // Statistiques
    const stats = await client.instances.stats();
    console.log('─'.repeat(60));
    console.log(`📈 Total: ${stats.instanceCount} | ` +
                `Running: ${stats.runningCount} | ` +
                `Stopped: ${stats.stoppedCount}`);
    console.log('─'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des instances:', error);
  }
}

// Démarrer automatiquement les instances arrêtées
async function autoStartInstances() {
  console.log('🔄 Vérification des instances arrêtées...\n');

  try {
    const instances = await client.instances.list();
    const stoppedInstances = instances.filter(i => i.status === 'stopped');

    if (stoppedInstances.length === 0) {
      console.log('✅ Toutes les instances sont actives\n');
      return;
    }

    console.log(`⚠️  ${stoppedInstances.length} instance(s) arrêtée(s) trouvée(s)\n`);

    for (const instance of stoppedInstances) {
      try {
        console.log(`▶️  Démarrage de "${instance.name}" (${instance.uuid})...`);
        await client.instances.start(instance.uuid);
        console.log(`   ✅ Instance démarrée avec succès\n`);
      } catch (error) {
        console.error(`   ❌ Échec du démarrage:`, error);
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Obtenir le profil utilisateur
async function displayUserProfile() {
  try {
    const profile = await client.getProfile();
    
    console.log('\n' + '='.repeat(60));
    console.log('👤 PROFIL UTILISATEUR');
    console.log('='.repeat(60) + '\n');
    console.log(`Email: ${profile.email}`);
    console.log(`Nom: ${profile.firstName} ${profile.lastName}`);
    console.log(`Plan: ${profile.plan}`);
    console.log(`Rôle: ${profile.role}`);
    console.log(`Accès Beta: ${profile.has_beta_access ? 'Oui' : 'Non'}`);
    console.log('');
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du profil:', error);
  }
}

// Menu interactif
async function interactiveMenu() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const menu = `
╔════════════════════════════════════════════════════════════╗
║           🎯 LOGICAI - MONITORING INSTANCES                ║
╚════════════════════════════════════════════════════════════╝

  1. Afficher l'état des instances
  2. Démarrer automatiquement les instances arrêtées
  3. Afficher le profil utilisateur
  4. Monitoring en temps réel (toutes les 30s)
  0. Quitter

Votre choix: `;

  return new Promise<string>((resolve) => {
    rl.question(menu, (answer: string) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// Monitoring en temps réel
async function realtimeMonitoring() {
  console.log('\n🔄 Monitoring en temps réel activé (CTRL+C pour arrêter)\n');

  let iteration = 0;

  const monitor = async () => {
    iteration++;
    console.log(`\n[${new Date().toLocaleTimeString('fr-FR')}] Vérification #${iteration}`);
    await displayInstancesStatus();
  };

  // Première vérification
  await monitor();

  // Vérifications périodiques toutes les 30 secondes
  const interval = setInterval(monitor, 30000);

  // Gérer CTRL+C proprement
  process.on('SIGINT', () => {
    console.log('\n\n✋ Arrêt du monitoring...\n');
    clearInterval(interval);
    process.exit(0);
  });
}

// Programme principal
async function main() {
  try {
    const choice = await interactiveMenu();

    switch (choice) {
      case '1':
        await displayInstancesStatus();
        break;
      case '2':
        await autoStartInstances();
        await displayInstancesStatus();
        break;
      case '3':
        await displayUserProfile();
        break;
      case '4':
        await realtimeMonitoring();
        return; // Ne pas revenir au menu
      case '0':
        console.log('\n👋 Au revoir!\n');
        process.exit(0);
        break;
      default:
        console.log('\n❌ Choix invalide\n');
    }

    // Revenir au menu
    setTimeout(() => main(), 1000);
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Lancer le script si appelé directement
if (require.main === module) {
  console.log('\n🚀 Démarrage du monitoring LogicAI...\n');
  main().catch(console.error);
}

export { displayInstancesStatus, autoStartInstances, displayUserProfile };
