/**
 * Script Interactif de Migration MySQL → PostgreSQL + Prisma
 *
 * Ce script guide l'utilisateur à travers tout le processus de migration:
 * 1. Installation de PostgreSQL
 * 2. Création de la base de données
 * 3. Installation de Prisma
 * 4. Migration des données
 * 5. Vérification
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const log = {
  title: (msg) => console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.blue}${msg}${colors.reset}`),
  step: (num, msg) => console.log(`\n${colors.green}Étape ${num}:${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset}  ${msg}`),
  command: (cmd) => console.log(`${colors.yellow}>${colors.reset} ${cmd}`),
};

// Fonction pour poser une question à l'utilisateur
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Vérifier si une commande existe
function commandExists(cmd) {
  try {
    execSync(`${cmd} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Exécuter une commande et afficher le résultat
function execCommand(cmd, description) {
  try {
    log.command(cmd);
    const result = execSync(cmd, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    return true;
  } catch (error) {
    log.error(`Erreur: ${error.message}`);
    return false;
  }
}

// ============================================
// ÉTAPE 1: Vérification PostgreSQL
// ============================================
async function checkPostgreSQL() {
  log.step(1, 'Vérification de PostgreSQL');

  if (commandExists('psql')) {
    log.success('PostgreSQL est déjà installé !');

    const version = execSync('psql --version').toString();
    log.info(`Version: ${version.trim()}`);

    return true;
  } else {
    log.warn('PostgreSQL n\'est pas installé');

    console.log('\n' + '='.repeat(70));
    log.info('INSTALLATION DE POSTGRESQL SUR WINDOWS');
    console.log('='.repeat(70));

    console.log('\n📦 Option 1: Via Chocolatey (Recommandé)');
    log.command('choco install postgresql --admin');
    console.log('\n   → Ouvre un terminal PowerShell en Administrateur');
    console.log('   → Exécute: choco install postgresql --admin');
    console.log('   → Redémarre ton terminal');

    console.log('\n📦 Option 2: Téléchargement manuel');
    console.log('   → https://www.postgresql.org/download/windows/');
    console.log('   → Télécharge "Interactive installer"');
    console.log('   → Installe avec les options par défaut');
    console.log('   → Note le mot de passe (nous utiliserons "logicai_password")');

    console.log('\n' + '='.repeat(70));

    const ready = await question('\n✅ As-tu installé PostgreSQL ? (o/n): ');

    if (ready.toLowerCase() === 'o' || ready.toLowerCase() === 'y' || ready.toLowerCase() === 'yes' || ready.toLowerCase() === 'oui') {
      log.success('Continuons...');
      return true;
    } else {
      log.info('Installe PostgreSQL puis relance ce script');
      log.info('Commande: node scripts/migrate-interactive.js');
      process.exit(0);
    }
  }
}

// ============================================
// ÉTAPE 2: Création de la base de données
// ============================================
async function createDatabase() {
  log.step(2, 'Création de la base de données PostgreSQL');

  const dbName = await question('Nom de la base de données (logicai): ') || 'logicai';
  const dbUser = await question('Utilisateur PostgreSQL (logicai): ') || 'logicai';
  const dbPassword = await question('Mot de passe (logicai_password): ') || 'logicai_password';

  log.info('Création de la base de données...');
  log.command(`psql -U postgres -c "CREATE USER ${dbUser} WITH PASSWORD '${dbPassword}';"`);
  log.command(`psql -U postgres -c "CREATE DATABASE ${dbName} OWNER ${dbUser};"`);
  log.command(`psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE ${dbName} TO ${dbUser};"`);

  // Mettre à jour .env
  log.info('Mise à jour du fichier .env...');
  const envPath = path.join(__dirname, '../.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  const newDbUrl = `DATABASE_URL="postgresql://${dbUser}:${dbPassword}@localhost:5432/${dbName}?schema=public"`;

  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /DATABASE_URL=".*"/,
      newDbUrl
    );
  } else {
    envContent = envContent.replace(
      /# POSTGRESQL.*?schema=public"/,
      `# POSTGRESQL (Nouvelle base de données avec Prisma)\n${newDbUrl}`
    );
  }

  fs.writeFileSync(envPath, envContent);
  log.success('Fichier .env mis à jour');

  log.success(`Base de données "${dbName}" créée avec succès !`);
  return { dbName, dbUser, dbPassword };
}

// ============================================
// ÉTAPE 3: Installation de Prisma
// ============================================
async function installPrisma() {
  log.step(3, 'Installation de Prisma');

  const packageJson = path.join(__dirname, '../package.json');

  if (fs.existsSync(packageJson)) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    const hasPrisma = pkg.dependencies?.['@prisma/client'] || pkg.devDependencies?.['prisma'];

    if (hasPrisma) {
      log.success('Prisma est déjà installé');
      return true;
    }
  }

  log.info('Installation de Prisma et Prisma Client...');
  log.command('npm install prisma @prisma/client');

  try {
    execSync('npm install prisma @prisma/client', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    log.success('Prisma installé avec succès !');
    return true;
  } catch (error) {
    log.error('Erreur lors de l\'installation de Prisma');
    log.info('Installe manuellement: npm install prisma @prisma/client');
    return false;
  }
}

// ============================================
// ÉTAPE 4: Génération du client Prisma
// ============================================
async function generatePrismaClient() {
  log.step(4, 'Génération du client Prisma');

  log.info('Génération du client Prisma...');
  log.command('npx prisma generate');

  try {
    execSync('npx prisma generate', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    log.success('Client Prisma généré !');
    return true;
  } catch (error) {
    log.error('Erreur lors de la génération du client Prisma');
    log.info('Vérifie que le fichier schema.prisma existe dans prisma/');
    return false;
  }
}

// ============================================
// ÉTAPE 5: Pousser le schéma vers PostgreSQL
// ============================================
async function pushSchema() {
  log.step(5, 'Création des tables dans PostgreSQL');

  log.info('Création des tables via Prisma...');
  log.command('npx prisma db push');

  try {
    execSync('npx prisma db push', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    log.success('Tables créées dans PostgreSQL !');
    return true;
  } catch (error) {
    log.error('Erreur lors de la création des tables');
    log.info('Vérifie que PostgreSQL est démarré et que DATABASE_URL est correct');
    return false;
  }
}

// ============================================
// ÉTAPE 6: Migration des données MySQL → PostgreSQL
// ============================================
async function migrateData() {
  log.step(6, 'Migration des données de MySQL vers PostgreSQL');

  const migrate = await question('\n⚠️  Veux-tu migrer les données existantes de MySQL ? (o/n): ');

  if (migrate.toLowerCase() !== 'o' && migrate.toLowerCase() !== 'y' && migrate.toLowerCase() !== 'yes' && migrate.toLowerCase() !== 'oui') {
    log.info('Skipping data migration...');
    return true;
  }

  log.info('Vérification de la connexion MySQL...');
  log.info('Assure-toi que MySQL est démarré et que les credentials sont corrects dans .env');

  const confirm = await question('✅ MySQL est prêt ? (o/n): ');

  if (confirm.toLowerCase() !== 'o' && confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'oui') {
    log.warn('Migration annulée. Tu pourras migrer plus tard avec:');
    log.command('node scripts/migrate-mysql-to-postgres.js');
    return false;
  }

  log.info('Migration des données...');
  log.command('node scripts/migrate-mysql-to-postgres.js');

  try {
    execSync('node scripts/migrate-mysql-to-postgres.js', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    log.success('Données migrées avec succès !');
    return true;
  } catch (error) {
    log.error('Erreur lors de la migration des données');
    log.info('Vérifie la connexion MySQL dans .env');
    return false;
  }
}

// ============================================
// ÉTAPE 7: Seed des données initiales
// ============================================
async function seedDatabase() {
  log.step(7, 'Remplissage avec les données initiales');

  log.info('Exécution du script de seed...');
  log.command('node scripts/seed.js');

  try {
    execSync('node scripts/seed.js', {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });
    log.success('Base de données remplie !');
    return true;
  } catch (error) {
    log.warn('Erreur lors du seed (pas critique)');
    log.info('Tu pourras le lancer plus tard: node scripts/seed.js');
    return false;
  }
}

// ============================================
// ÉTAPE 8: Vérification avec Prisma Studio
// ============================================
async function verifyMigration() {
  log.step(8, 'Vérification de la migration');

  log.info('Tu peux maintenant vérifier tes données avec Prisma Studio:');
  log.command('npx prisma studio');

  log.info('\nPrisma Studio va s\'ouvrir sur http://localhost:5555');

  const openStudio = await question('\n✅ Ouvrir Prisma Studio maintenant ? (o/n): ');

  if (openStudio.toLowerCase() === 'o' || openStudio.toLowerCase() === 'y') {
    try {
      execSync('npx prisma studio', {
        cwd: path.join(__dirname, '..'),
        stdio: 'inherit'
      });
    } catch (error) {
      log.warn('Impossible d\'ouvrir Prisma Studio automatiquement');
      log.info('Ouvre-le manuellement avec: npx prisma studio');
    }
  }
}

// ============================================
// FONCTION PRINCIPALE
// ============================================
async function main() {
  console.clear();

  log.title();
  log.header('🚀 MIGRATION MYSQL → POSTGRESQL + PRISMA');
  log.title();

  console.log('\nCe script va te guider à travers les étapes suivantes:');
  console.log('  1. ✅ Vérification de PostgreSQL');
  console.log('  2. ✅ Création de la base de données');
  console.log('  3. ✅ Installation de Prisma');
  console.log('  4. ✅ Génération du client Prisma');
  console.log('  5. ✅ Création des tables PostgreSQL');
  console.log('  6. ✅ Migration des données MySQL → PostgreSQL');
  console.log('  7. ✅ Remplissage avec les données initiales');
  console.log('  8. ✅ Vérification avec Prisma Studio');

  console.log('\n' + '='.repeat(70));

  const ready = await question('\n🎯 Prêt à commencer ? (Entrée pour continuer, Ctrl+C pour annuler): ');

  try {
    // Étape 1: Vérifier PostgreSQL
    await checkPostgreSQL();

    // Étape 2: Créer la base de données
    await createDatabase();

    // Étape 3: Installer Prisma
    const prismaInstalled = await installPrisma();
    if (!prismaInstalled) {
      log.error('Installation de Prima échouée. Abandon...');
      process.exit(1);
    }

    // Étape 4: Générer le client Prisma
    const generated = await generatePrismaClient();
    if (!generated) {
      log.error('Génération du client échouée. Abandon...');
      process.exit(1);
    }

    // Étape 5: Pousser le schéma
    const pushed = await pushSchema();
    if (!pushed) {
      log.error('Création des tables échouée. Abandon...');
      process.exit(1);
    }

    // Étape 6: Migrer les données
    await migrateData();

    // Étape 7: Seed
    await seedDatabase();

    // Étape 8: Vérification
    await verifyMigration();

    // Succès !
    log.title();
    log.header('✅ MIGRATION TERMINÉE AVEC SUCCÈS !');
    log.title();

    console.log('\n📝 Prochaines étapes:');
    console.log('\n1. Mettre à jour tes services pour utiliser Prisma:');
    console.log('   - Remplacer promisePool.execute() par prisma.model.findMany()');
    console.log('   - Voir examples: server/services/prisma-examples.js');

    console.log('\n2. Démarrer le serveur:');
    console.log('   - npm run dev');

    console.log('\n3. Explorer tes données:');
    console.log('   - npx prisma studio');

    console.log('\n4. En cas de problème:');
    console.log('   - Voir le guide: MIGRATION_POSTGRESQL.md');
    console.log('   - Restaurer ton backup MySQL');

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    log.error(`Erreur critique: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Exécuter si c'est le module principal
if (require.main === module) {
  main();
}

module.exports = { main };
