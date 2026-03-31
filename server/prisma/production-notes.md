# Prisma Configuration Guide

## 🚀 Installation des dépendances

```bash
npm install prisma @prisma/client
npm install -D prisma
```

## 📝 Initialisation

```bash
# Générer le client Prisma
npx prisma generate

# Créer la migration initiale
npx prisma migrate dev --name init

# Ouvrir Prisma Studio (interface visuelle)
npx prisma studio
```

## 🔧 Configuration Production

### 1. Pool de connexions

```js
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")

  // Ajouter pour la production
  // Directement dans DATABASE_URL:
  // postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=20
}
```

### 2. Variables d'environnement

```env
# Development
DATABASE_URL="postgresql://logicai:dev_pass@localhost:5432/logicai_dev?schema=public"

# Production (avec SSL et pool)
DATABASE_URL="postgresql://logicai:prod_pass@prod-db.example.com:5432/logicai?schema=public&sslmode=require&connection_limit=20&pool_timeout=30"

# Production Cloud (Supabase, Neon, Railway)
# DATABASE_URL="postgresql://logicai:password@ep-xxx.us-east-1.aws.neon.tech/logicai?ssl=true"
```

### 3. Optimisations Prisma

```js
// src/config/prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' 
    ? ['query', 'error', 'warn'] 
    : ['error'],
  
  // Configuration pour la production
  ...(process.env.NODE_ENV === 'production' && {
    log: ['error'],
    errorFormat: 'minimal'
  })
});

// Middleware pour logs de performance
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();
  
  if (after - before > 1000) {
    console.log(`⚠️  Query lente: ${params.model}.${params.action} (${after - before}ms)`);
  }
  
  return result;
});

module.exports = { prisma };
```

## 📊 Monitoring

### Prisma Studio en production

```bash
# Lancer Studio sur un port spécifique
npx prisma studio --browser none

# Avec tunnel SSH (pour accès distant)
ssh -L 5555:localhost:5555 user@server
npx prisma studio
```

### Acceleration avec pgBouncer

Pour la production avec beaucoup de connexions:

```env
DATABASE_URL="postgresql://logicai:pass@pgbouncer:6432/logicai?pgbouncer=true"
```

## 🔄 Migrations en production

```bash
# Déployer une nouvelle migration
npx prisma migrate deploy

# Résétiser (ATTENTION: destructif!)
npx prisma migrate reset --force
```

## 🧪 Tests avec Prisma

```js
// tests/setup.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_TEST_URL || 'postgresql://test:test@localhost:5432/logicai_test'
    }
  }
});

beforeEach(async () => {
  // Nettoyer la base avant chaque test
  await prisma.instance.deleteMany();
  await prisma.user.deleteMany();
});
```

## 🔍 Debug

### Activer les logs détaillés

```js
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' }
  ],
});

// Écouter les événements de query
prisma.$on('query', (e) => {
  console.log('Query: ' + e.query);
  console.log('Duration: ' + e.duration + 'ms');
});
```

## 🚨 Problèmes courants

### 1. "Unknown database"

```bash
# Créer la base de données
createdb logicai
# ou
psql -U postgres -c "CREATE DATABASE logicai;"
```

### 2. "Connection refused"

```bash
# Vérifier que PostgreSQL est démarré
# Linux
sudo systemctl status postgresql

# macOS
brew services list

# Windows
# Vérifier dans "Services" Windows
```

### 3. "Too many connections"

```env
# Augmenter le max_connections dans PostgreSQL
# postgresql.conf:
max_connections = 200

# OU utiliser pgBouncer pour le pool de connexions
```

### 4. Performance

```js
// Pagination pour éviter de charger trop de données
const users = await prisma.user.findMany({
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: 'desc' }
});

// Sélectionner seulement les champs nécessaires
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    firstName: true
  }
});
```

## 📚 Ressources utiles

- [Prisma Docs](https://www.prisma.io/docs)
- [Prisma Studio](https://www.prisma.io/studio)
- [PostgreSQL Performance](https://www.postgresql.org/docs/current/performance-tips.html)
- [pgBouncer](https://www.pgbouncer.org/)

## 🎯 Checklist déploiement

- [ ] PostgreSQL installé et configuré
- [ ] Base de données créée
- [ ] `DATABASE_URL` configuré dans `.env`
- [ ] `npx prisma generate` exécuté
- [ ] `npx prisma migrate deploy` exécuté
- [ ] Variables d'environnement production configurées
- [ ] Prisma Studio testé
- [ ] Requêtes performantes (pas de N+1 queries)
- [ ] Logs configurés
- [ ] Backup automatique configuré
