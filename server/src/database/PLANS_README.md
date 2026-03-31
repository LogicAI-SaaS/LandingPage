# Système de Gestion des Plans

Ce dossier contient le système complet de gestion des plans d'abonnement pour LogicAI.

## Plans Disponibles

### 🆓 Free
- **Prix**: Gratuit
- **Instances**: 1
- **Workflows**: 10
- **Stockage**: 1 GB
- **Exécutions/mois**: 1,000
- **Support**: Community

### 💎 Pro
- **Prix**: 29.99€/mois ou 299€/an
- **Instances**: 5
- **Workflows**: 100
- **Stockage**: 10 GB
- **Exécutions/mois**: 50,000
- **Fonctionnalités**:
  - Support par email
  - Domaine personnalisé
  - Analytiques avancées
  - Accès API
  - Collaboration d'équipe

### 🏢 Business
- **Prix**: 99.99€/mois ou 999€/an
- **Instances**: 20
- **Workflows**: Illimité
- **Stockage**: 50 GB
- **Exécutions/mois**: 500,000
- **Fonctionnalités**:
  - Support prioritaire
  - Toutes les fonctionnalités Pro
  - Collaboration d'équipe avancée
  - SLA garanti

### 🏛️ Corporation
- **Prix**: 299.99€/mois ou 2999€/an
- **Instances**: Illimité
- **Workflows**: Illimité
- **Stockage**: Illimité
- **Exécutions/mois**: Illimité
- **Fonctionnalités**:
  - Support dédié
  - Toutes les fonctionnalités Business
  - White label
  - Intégrations personnalisées
  - Infrastructure dédiée
  - Certifications de conformité

## Structure de la Base de Données

### Table `plans`

```sql
CREATE TABLE plans (
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Colonnes

- `name`: Identifiant unique du plan (free, pro, business, corporation)
- `display_name`: Nom d'affichage du plan
- `description`: Description du plan
- `price_monthly`: Prix mensuel en euros
- `price_yearly`: Prix annuel en euros
- `max_instances`: Nombre maximum d'instances (-1 = illimité)
- `max_workflows`: Nombre maximum de workflows (-1 = illimité)
- `max_storage_gb`: Stockage maximum en GB (-1 = illimité)
- `max_executions_per_month`: Nombre maximum d'exécutions par mois (-1 = illimité)
- `features`: Objet JSON contenant les fonctionnalités du plan
- `is_active`: Statut actif/inactif du plan

## Installation

### 1. Créer les tables

```bash
cd server
node src/database/create-plan-tables.js
```

Ou manuellement avec SQL:

```bash
mysql -u root -p logicai_saas < src/database/create-plan-tables.sql
```

### 2. Vérifier l'installation

Les plans par défaut seront automatiquement créés lors de l'exécution du script.

## API Endpoints

### Routes Publiques

#### GET `/api/plans/public`
Récupère tous les plans actifs.

**Réponse**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "free",
      "display_name": "Free",
      "price_monthly": 0.00,
      ...
    }
  ]
}
```

#### GET `/api/plans/public/:planName`
Récupère un plan spécifique par son nom.

**Paramètres**:
- `planName`: nom du plan (free, pro, business, corporation)

#### GET `/api/plans/public/compare`
Compare deux plans.

**Query params**:
- `plan1`: nom du premier plan
- `plan2`: nom du second plan

### Routes Protégées (Authentification requise)

#### GET `/api/plans/:planName/limits`
Récupère les limites d'un plan spécifique.

**Headers**:
```
Authorization: Bearer <token>
```

### Routes Admin (Admin seulement)

#### GET `/api/plans/admin/all`
Récupère tous les plans (incluant les inactifs).

#### GET `/api/plans/admin/stats`
Récupère les statistiques d'utilisation des plans.

**Réponse**:
```json
{
  "success": true,
  "data": [
    {
      "plan": "free",
      "plan_name": "Free",
      "user_count": 150,
      "instance_count": 120
    }
  ]
}
```

#### POST `/api/plans/admin`
Crée un nouveau plan.

**Body**:
```json
{
  "name": "custom",
  "display_name": "Custom Plan",
  "description": "Description",
  "price_monthly": 49.99,
  "price_yearly": 499.00,
  "max_instances": 10,
  "max_workflows": 50,
  "max_storage_gb": 20,
  "max_executions_per_month": 100000,
  "features": {
    "support": "email",
    "custom_domain": true
  }
}
```

#### PUT `/api/plans/admin/:planId`
Met à jour un plan existant.

#### PATCH `/api/plans/admin/:planId/toggle`
Active/désactive un plan.

**Body**:
```json
{
  "is_active": false
}
```

#### DELETE `/api/plans/admin/:planId`
Supprime (désactive) un plan.

## Utilisation dans le Code

### Modèle Plan

```javascript
const Plan = require('./models/Plan');

// Récupérer un plan
const plan = await Plan.findByName('pro');

// Récupérer les limites
const limits = await Plan.getLimits('business');

// Créer un plan
await Plan.create({
  name: 'custom',
  display_name: 'Custom',
  price_monthly: 49.99,
  max_instances: 10,
  features: { support: 'email' }
});
```

### Modèle User

```javascript
const User = require('./models/User');

// Vérifier les limites du plan de l'utilisateur
const user = await User.findById(userId);
const limits = User.getPlanLimits(user.plan);

if (instanceCount >= limits.max_instances) {
  throw new Error('Limite d\'instances atteinte');
}

// Vérifier si un plan est valide
if (User.isValidPlan('pro')) {
  // Plan valide
}
```

## Migration des Données Existantes

Si vous avez déjà des utilisateurs avec des plans, exécutez le script de création des tables pour initialiser la table `plans` avec les données par défaut. Les utilisateurs existants conserveront leur plan actuel (stocké dans la colonne `plan` de la table `users`).

## Notes Importantes

1. **Valeur -1**: Une valeur de -1 dans les colonnes de limites signifie "illimité"
2. **Soft Delete**: La suppression d'un plan le désactive plutôt que de le supprimer définitivement
3. **Plan Free**: Le plan gratuit ne peut pas être supprimé
4. **Features JSON**: Les fonctionnalités sont stockées en JSON pour une flexibilité maximale

## Maintenance

### Ajouter une nouvelle fonctionnalité

Pour ajouter une nouvelle fonctionnalité à tous les plans:

```sql
UPDATE plans 
SET features = JSON_SET(features, '$.new_feature', true)
WHERE name IN ('pro', 'business', 'corporation');
```

### Modifier les prix

```sql
UPDATE plans 
SET price_monthly = 39.99, price_yearly = 399.00
WHERE name = 'pro';
```

## Support

Pour toute question ou problème, consultez la documentation principale ou contactez l'équipe de développement.
