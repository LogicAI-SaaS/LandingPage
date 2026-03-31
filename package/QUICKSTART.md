# 🚀 Quick Start - LogicAI SDK

Guide de démarrage rapide pour utiliser le SDK LogicAI.

## 📦 Installation

### 1. Builder le package

```bash
cd package
npm install
npm run build
```

Cela crée le dossier `dist/` avec:
- `index.js` - Version CommonJS
- `index.mjs` - Version ES Module
- `index.d.ts` - Déclarations TypeScript

### 2. Utilisation locale (développement)

Pour utiliser le SDK dans votre projet local avant de le publier sur NPM:

```bash
# Dans le dossier package/
npm link

# Dans votre projet
npm link @logicai/sdk
```

### 3. Configuration

Créez un fichier `.env` (copier depuis `.env.example`):

```bash
cp .env.example .env
```

Configurez vos variables:
```env
LOGICAI_API_URL=http://localhost:3000
LOGICAI_TOKEN=votre-token-jwt
INSTANCE_UUID=uuid-de-votre-instance
```

## 🎯 Exemples d'utilisation

### Exemple 1: Script simple

Créez `test-sdk.js`:

```javascript
require('dotenv').config();
const { LogicAIClient } = require('@logicai/sdk');

const client = new LogicAIClient({
  apiUrl: process.env.LOGICAI_API_URL,
  token: process.env.LOGICAI_TOKEN
});

async function main() {
  // Lister les instances
  const instances = await client.instances.list();
  console.log('Instances:', instances);

  // Trigger un workflow
  const result = await client.workflows.webhook({
    instanceUuid: process.env.INSTANCE_UUID,
    webhookPath: 'test',
    data: { message: 'Hello from SDK!' }
  });
  console.log('Résultat:', result);
}

main().catch(console.error);
```

Lancer:
```bash
node test-sdk.js
```

### Exemple 2: Traitement de formulaire

```bash
# Compiler l'exemple TypeScript
npx ts-node examples/form-submission.ts
```

Ou intégrer dans votre application:
```typescript
import { handleContactForm } from '@logicai/sdk/examples/form-submission';

const result = await handleContactForm({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Question',
  message: 'Bonjour!'
});
```

### Exemple 3: Serveur Express

```bash
# Installer Express
npm install express @types/express

# Lancer le serveur
npx ts-node examples/express-server.ts
```

Tester avec curl:
```bash
# Soumettre un formulaire
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","subject":"Test","message":"Hello"}'

# Lister les instances
curl http://localhost:3001/api/instances

# Démarrer une instance
curl -X POST http://localhost:3001/api/instances/{uuid}/start
```

### Exemple 4: Monitoring

```bash
# Lancer le script de monitoring interactif
npx ts-node examples/monitoring.ts
```

Fonctionnalités:
- ✅ Afficher l'état des instances
- ▶️ Démarrer automatiquement les instances arrêtées
- 👤 Afficher le profil utilisateur
- 🔄 Monitoring en temps réel (toutes les 30s)

## 📝 Utilisation dans React/Vue

### Avec React

```typescript
import { LogicAIClient } from '@logicai/sdk';
import { useState, useEffect } from 'react';

function MyComponent() {
  const [client] = useState(() => new LogicAIClient({
    apiUrl: import.meta.env.VITE_API_URL,
    token: localStorage.getItem('token') || ''
  }));

  const handleSubmit = async (data: any) => {
    try {
      await client.workflows.webhook({
        instanceUuid: 'your-uuid',
        webhookPath: 'form',
        data
      });
      alert('Formulaire soumis!');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Vos champs de formulaire */}
    </form>
  );
}
```

### Avec Vue 3

```typescript
import { LogicAIClient } from '@logicai/sdk';
import { ref } from 'vue';

export function useLogicAI() {
  const client = new LogicAIClient({
    apiUrl: import.meta.env.VITE_API_URL,
    token: localStorage.getItem('token') || ''
  });

  const instances = ref([]);
  
  const loadInstances = async () => {
    instances.value = await client.instances.list();
  };

  return { client, instances, loadInstances };
}
```

## 🔑 Gestion du token

### Mise à jour du token

Si le token change (reconnexion), mettez-le à jour:

```typescript
client.setToken(newToken);
```

### Gestion de l'expiration

Le SDK détecte automatiquement les tokens expirés et lance une exception `TokenExpiredError`:

```typescript
import { TokenExpiredError } from '@logicai/sdk';

try {
  await client.workflows.trigger({ ... });
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Rediriger vers la page de login
    window.location.href = '/login';
  }
}
```

## 🧪 Tests

Créez `test.js` pour tester rapidement:

```javascript
require('dotenv').config();
const { LogicAIClient } = require('./dist/index.js');

const client = new LogicAIClient({
  apiUrl: process.env.LOGICAI_API_URL,
  token: process.env.LOGICAI_TOKEN
});

async function test() {
  console.log('🧪 Test du SDK LogicAI\n');

  // Test 1: Profil
  console.log('1. Récupération du profil...');
  const profile = await client.getProfile();
  console.log('✅ Profil:', profile.email);

  // Test 2: Instances
  console.log('\n2. Liste des instances...');
  const instances = await client.instances.list();
  console.log(`✅ ${instances.length} instance(s) trouvée(s)`);

  // Test 3: Stats
  console.log('\n3. Statistiques...');
  const stats = await client.instances.stats();
  console.log(`✅ Running: ${stats.runningCount}, Stopped: ${stats.stoppedCount}`);

  console.log('\n🎉 Tous les tests réussis!');
}

test().catch(err => {
  console.error('❌ Erreur:', err.message);
  process.exit(1);
});
```

Lancer:
```bash
node test.js
```

## 📚 Documentation complète

Voir [README.md](./README.md) pour:
- Référence complète de l'API
- Gestion des erreurs
- Configuration avancée
- Plus d'exemples

## 🆘 Besoin d'aide?

- 📖 Documentation: Voir `README.md`
- 💬 Support: Contactez l'équipe LogicAI
- 🐛 Bugs: Ouvrez une issue sur le repo

## 🚀 Prochaines étapes

1. **Tester** le SDK avec vos propres workflows
2. **Intégrer** dans votre application
3. **Publier** sur NPM (optionnel):
   ```bash
   npm publish --access public
   ```

---

**Bon développement avec LogicAI SDK! 🎉**
