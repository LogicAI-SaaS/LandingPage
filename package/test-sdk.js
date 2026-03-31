/**
 * Script de test simple pour le SDK LogicAI
 * 
 * Usage: npx ts-node test-sdk.ts
 */

require('dotenv').config();

const { LogicAIClient, LogicAIError, TokenExpiredError } = require('./dist/index.js');

// Configuration
const config = {
  apiUrl: process.env.LOGICAI_API_URL || 'http://localhost:3000',
  token: process.env.LOGICAI_TOKEN || '',
  instanceUuid: process.env.INSTANCE_UUID || ''
};

// Vérifier la configuration
if (!config.token) {
  console.error('❌ LOGICAI_TOKEN manquant dans .env');
  process.exit(1);
}

// Initialiser le client
const client = new LogicAIClient({
  apiUrl: config.apiUrl,
  token: config.token
});

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║           🧪 TEST DU SDK LOGICAI                          ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');
console.log(`API URL: ${config.apiUrl}\n`);

// Délai entre les tests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: Récupération du profil
  try {
    console.log('📝 Test 1: Récupération du profil utilisateur');
    const profile = await client.getProfile();
    console.log(`   ✅ Succès! Email: ${profile.email}, Plan: ${profile.plan}`);
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Échec:`, error.message);
    if (error instanceof TokenExpiredError) {
      console.error('   ⚠️  Token expiré. Veuillez vous reconnecter.');
      process.exit(1);
    }
    testsFailed++;
  }

  await delay(500);

  // Test 2: Liste des instances
  try {
    console.log('\n📝 Test 2: Liste des instances');
    const instances = await client.instances.list();
    console.log(`   ✅ Succès! ${instances.length} instance(s) trouvée(s)`);
    
    if (instances.length > 0) {
      const running = instances.filter(i => i.status === 'running').length;
      const stopped = instances.filter(i => i.status === 'stopped').length;
      console.log(`   📊 Running: ${running}, Stopped: ${stopped}`);
      
      // Afficher la première instance
      const first = instances[0];
      console.log(`\n   Exemple d'instance:`);
      console.log(`   - UUID: ${first.uuid}`);
      console.log(`   - Nom: ${first.name}`);
      console.log(`   - Status: ${first.status}`);
      console.log(`   - URL: ${first.url || 'N/A'}`);
      
      // Sauvegarder l'UUID pour les tests suivants
      if (!config.instanceUuid) {
        config.instanceUuid = first.uuid;
        console.log(`   💡 Utilisation de ${first.uuid} pour les tests suivants`);
      }
    }
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Échec:`, error.message);
    testsFailed++;
  }

  await delay(500);

  // Test 3: Statistiques
  try {
    console.log('\n📝 Test 3: Statistiques des instances');
    const stats = await client.instances.stats();
    console.log(`   ✅ Succès!`);
    console.log(`   📊 Total: ${stats.instanceCount}`);
    console.log(`   ▶️  Running: ${stats.runningCount}`);
    console.log(`   ⏸️  Stopped: ${stats.stoppedCount}`);
    testsPassed++;
  } catch (error) {
    console.error(`   ❌ Échec:`, error.message);
    testsFailed++;
  }

  await delay(500);

  // Test 4: Récupérer une instance spécifique
  if (config.instanceUuid) {
    try {
      console.log('\n📝 Test 4: Récupération d\'une instance spécifique');
      console.log(`   UUID: ${config.instanceUuid}`);
      const instance = await client.instances.get(config.instanceUuid);
      console.log(`   ✅ Succès! Instance: ${instance.name}`);
      console.log(`   📊 Status: ${instance.status}`);
      console.log(`   🔗 URL: ${instance.url || 'N/A'}`);
      testsPassed++;
    } catch (error) {
      console.error(`   ❌ Échec:`, error.message);
      testsFailed++;
    }
  } else {
    console.log('\n⏭️  Test 4: Ignoré (aucune instance disponible)');
  }

  await delay(500);

  // Test 5: Trigger un workflow (optionnel)
  if (config.instanceUuid) {
    try {
      console.log('\n📝 Test 5: Trigger d\'un workflow (webhook test)');
      console.log(`   Instance UUID: ${config.instanceUuid}`);
      
      // Vérifier que l'instance est en cours d'exécution
      const instance = await client.instances.get(config.instanceUuid);
      
      if (instance.status !== 'running') {
        console.log(`   ⚠️  Instance non active (status: ${instance.status})`);
        console.log(`   💡 Démarrez l\'instance pour tester le trigger`);
      } else {
        // Trigger un webhook de test
        const result = await client.workflows.webhook({
          instanceUuid: config.instanceUuid,
          webhookPath: 'test',
          method: 'POST',
          data: {
            test: true,
            timestamp: new Date().toISOString(),
            message: 'Test depuis le SDK'
          }
        });
        
        console.log(`   ✅ Succès! Workflow déclenché`);
        console.log(`   📦 Résultat:`, JSON.stringify(result, null, 2));
        testsPassed++;
      }
    } catch (error) {
      // Ce test peut échouer si le webhook n'existe pas, c'est normal
      console.log(`   ⚠️  Workflow non déclenché: ${error.message}`);
      console.log(`   💡 Créez un webhook "test" dans votre instance pour tester`);
    }
  } else {
    console.log('\n⏭️  Test 5: Ignoré (aucune instance disponible)');
  }

  // Résumé
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 RÉSUMÉ DES TESTS\n');
  console.log(`   ✅ Tests réussis: ${testsPassed}`);
  console.log(`   ❌ Tests échoués: ${testsFailed}`);
  console.log(`   📈 Taux de réussite: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
  
  if (testsFailed === 0) {
    console.log('\n   🎉 Tous les tests sont passés avec succès!');
  } else {
    console.log('\n   ⚠️  Certains tests ont échoué. Vérifiez votre configuration.');
  }
  
  console.log('\n' + '═'.repeat(60) + '\n');
}

// Lancer les tests
runTests().catch(error => {
  console.error('\n💥 Erreur fatale:', error);
  process.exit(1);
});
