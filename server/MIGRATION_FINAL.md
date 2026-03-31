# 🚀 Guide Final de Migration MySQL → PostgreSQL + Prisma

## ✅ État Actuel

- ✅ Prisma 5.22.0 installé (version stable)
- ✅ Schéma Prisma créé et validé
- ✅ Client Prisma généré
- ✅ Variables d'environnement configurées
- ✅ Scripts de migration créés

## 📋 Étapes Restantes

### 1️⃣ Installer PostgreSQL (15 min)

**Via Chocolatey (Recommandé):**
```powershell
# Ouvre PowerShell en Administrateur
choco install postgresql --admin
```

**Ou téléchargement:**
- https://www.postgresql.org/download/windows/
- Choisis "Interactive installer"
- Mot de passe suggéré: `logicai_password`

### 2️⃣ Créer la base de données (2 min)

```bash
# Ouvre PostgreSQL Shell (installé avec PostgreSQL)
psql -U postgres

CREATE USER logicai WITH PASSWORD 'logicai_password';
CREATE DATABASE logicai OWNER logicai;
GRANT ALL PRIVILEGES ON DATABASE logicai TO logicai;
\q
```

### 3️⃣ Pousser le schéma vers PostgreSQL (1 min)

```bash
cd server
npx prisma db push
```

Cela va créer toutes les tables dans PostgreSQL.

### 4️⃣ Migrer les données MySQL → PostgreSQL (2 min)

```bash
cd server
node scripts/migrate-simple.js
```

Cela va:
- Se connecter à MySQL
- Copier toutes les données
- Les insérer dans PostgreSQL
- Réinitialiser les séquences

### 5️⃣ Remplir avec les données initiales (1 min)

```bash
cd server
node scripts/seed.js
```

Cela va créer:
- Admin: `admin@logicai.fr` / `admin123`
- Utilisateurs de test
- Plans (Free, Pro, Business, Corporation)
- Clés bêta de test

### 6️⃣ Vérifier avec Prisma Studio

```bash
cd server
npx prisma studio
```

Ouvre `http://localhost:5555` - Interface visuelle de tes données !

## 🎯 Commandes Rapides

```bash
# Tout faire en une fois (après PostgreSQL installé)
cd server
npm install prisma@5 @prisma/client --save-exact
npx prisma generate
npx prisma db push
node scripts/migrate-simple.js
node scripts/seed.js
npx prisma studio
```

## 📊 Résultat Attendu

Après migration, tu auras:

**Données migrées:**
- ✅ Utilisateurs (avec mots de passe hashés)
- ✅ Instances (cloud + locales)
- ✅ Membres d'instances
- ✅ Plans d'abonnement
- ✅ Accès bêta
- ✅ Clés bêta

**Comptes créés:**
- Admin: `admin@logicai.fr` / `admin123`
- User: `user@logicai.fr` / `user123`
- Pro: `pro@logicai.fr` / `pro123`

## 🔧 Prochaine Étape: Mettre à jour les services

Remplacer dans tes contrôleurs:

**Avant:**
```javascript
const [rows] = await promisePool.execute(
  'SELECT * FROM instances WHERE user_id = ?',
  [userId]
);
```

**Après:**
```javascript
const instances = await prisma.instance.findMany({
  where: { userId }
});
```

Voir exemples: `server/services/prisma-examples.js`

## ⚠️ En cas d'erreur

**PostgreSQL ne démarre pas:**
```bash
# Windows: Vérifier dans "Services"
services.msc → PostgreSQL

# Ou réessayer l'installation
```

**Connexion MySQL refusée:**
```bash
# Vérifier que MySQL est démarré
# Vérifier les credentials dans .env
```

**Problème de permissions:**
```bash
# Sur Windows, exécuter PowerShell en Administrateur
```

## ✅ Checklist Finale

- [ ] PostgreSQL installé et démarré
- [ ] Base de données `logicai` créée
- [ ] Prisma client généré (`npx prisma generate`)
- [ ] Tables créées (`npx prisma db push`)
- [ ] Données migrées (`node scripts/migrate-simple.js`)
- [ ] Seed exécuté (`node scripts/seed.js`)
- [ ] Prisma Studio testé (`npx prisma studio`)

## 🎉 Une fois terminé...

1. **Démarrer le serveur:**
   ```bash
   npm run dev
   ```

2. **Explorer tes données:**
   ```bash
   npx prisma studio
   ```

3. **Profiter de Prisma:**
   - Autocomplétion TypeScript
   - Requetes type-safe
   - Migrations faciles
   - Interface visuelle

**C'est parti ! 🚀**
