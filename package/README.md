# @logicai/sdk

SDK JavaScript/TypeScript officiel pour interagir avec l'API LogicAI. Permet de gérer des instances LogicAI, trigger des workflows et automatiser vos processus.

## 📦 Installation

```bash
npm install @logicai/sdk
```

```bash
yarn add @logicai/sdk
```

```bash
pnpm add @logicai/sdk
```

## 🚀 Utilisation Rapide

### Initialisation

```typescript
import { LogicAIClient } from '@logicai/sdk';

const client = new LogicAIClient({
  apiUrl: 'https://api.logicai.com',
  token: 'your-jwt-token-here',
  timeout: 30000 // optionnel, défaut: 30000ms
});
```

### Gestion des Instances

```typescript
// Créer une instance
const instance = await client.instances.create({
  name: 'Mon Instance Production'
});

console.log('Instance créée:', instance.uuid);

// Lister toutes les instances
const instances = await client.instances.list();

// Obtenir une instance spécifique
const myInstance = await client.instances.get('uuid-de-linstance');

// Démarrer une instance
await client.instances.start('uuid-de-linstance');

// Arrêter une instance
await client.instances.stop('uuid-de-linstance');

// Supprimer une instance
await client.instances.delete('uuid-de-linstance');

// Obtenir les statistiques
const stats = await client.instances.stats();
console.log(`${stats.runningCount} instances actives`);
```

### Trigger des Workflows

#### Via Workflow ID

```typescript
// Trigger un workflow avec des données
const result = await client.workflows.trigger({
  instanceUuid: 'abc-123-def-456',
  workflowId: 'my-workflow',
  data: {
    user: 'John Doe',
    email: 'john@example.com',
    action: 'signup'
  }
});

console.log('Workflow exécuté:', result);
```

#### Via Webhook Personnalisé

```typescript
// POST vers un webhook
await client.workflows.webhook({
  instanceUuid: 'abc-123-def-456',
  webhookPath: 'form-submission',
  data: {
    form: 'contact',
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Bonjour!'
  }
});

// GET vers un webhook
await client.workflows.webhook({
  instanceUuid: 'abc-123-def-456',
  webhookPath: 'status-check',
  method: 'GET',
  data: {
    checkId: '12345'
  }
});
```

## 📚 Exemples d'Utilisation

### Exemple 1: Traitement de Formulaire

```typescript
import { LogicAIClient } from '@logicai/sdk';

const client = new LogicAIClient({
  apiUrl: process.env.LOGICAI_API_URL!,
  token: process.env.LOGICAI_TOKEN!
});

async function handleFormSubmission(formData: any) {
  try {
    // Trigger le workflow de traitement de formulaire
    const result = await client.workflows.webhook({
      instanceUuid: process.env.INSTANCE_UUID!,
      webhookPath: 'form-submission',
      data: {
        formType: 'contact',
        timestamp: new Date().toISOString(),
        ...formData
      }
    });

    console.log('Formulaire traité:', result);
    return { success: true, data: result };
  } catch (error) {
    console.error('Erreur:', error);
    return { success: false, error: error.message };
  }
}

// Utilisation
await handleFormSubmission({
  name: 'John Doe',
  email: 'john@example.com',
  subject: 'Demande de contact',
  message: 'Je souhaite plus d\'informations'
});
```

### Exemple 2: Automation avec Données Utilisateur

```typescript
async function processUserSignup(userData: any) {
  const client = new LogicAIClient({
    apiUrl: process.env.LOGICAI_API_URL!,
    token: process.env.LOGICAI_TOKEN!
  });

  try {
    // 1. Vérifier que l'instance est disponible
    const instance = await client.instances.get(process.env.INSTANCE_UUID!);
    
    if (instance.status !== 'running') {
      console.log('Démarrage de l\'instance...');
      await client.instances.start(instance.uuid);
      
      // Attendre que l'instance soit prête
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // 2. Trigger le workflow d'inscription
    const result = await client.workflows.trigger({
      instanceUuid: instance.uuid,
      workflowId: 'user-signup',
      data: {
        user: userData,
        timestamp: Date.now(),
        source: 'web-app'
      }
    });

    console.log('Inscription traitée:', result);
    return result;
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      console.error('Token expiré, veuillez vous reconnecter');
    } else if (error instanceof NotFoundError) {
      console.error('Instance non trouvée');
    } else {
      console.error('Erreur:', error.message);
    }
    throw error;
  }
}
```

### Exemple 3: Intégration avec Express.js

```typescript
import express from 'express';
import { LogicAIClient } from '@logicai/sdk';

const app = express();
app.use(express.json());

const logicai = new LogicAIClient({
  apiUrl: process.env.LOGICAI_API_URL!,
  token: process.env.LOGICAI_TOKEN!
});

// Endpoint pour soumettre un formulaire
app.post('/api/submit-form', async (req, res) => {
  try {
    const result = await logicai.workflows.webhook({
      instanceUuid: process.env.INSTANCE_UUID!,
      webhookPath: 'form-submission',
      data: req.body
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Endpoint pour déclencher un workflow spécifique
app.post('/api/trigger/:workflowId', async (req, res) => {
  try {
    const result = await logicai.workflows.trigger({
      instanceUuid: process.env.INSTANCE_UUID!,
      workflowId: req.params.workflowId,
      data: req.body
    });

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Exemple 4: Script de Monitoring

```typescript
import { LogicAIClient } from '@logicai/sdk';

const client = new LogicAIClient({
  apiUrl: process.env.LOGICAI_API_URL!,
  token: process.env.LOGICAI_TOKEN!
});

async function monitorInstances() {
  try {
    const instances = await client.instances.list();
    
    console.log('\n=== État des Instances ===');
    
    for (const instance of instances) {
      const status = instance.status === 'running' ? '✅' : '⚠️';
      console.log(`${status} ${instance.name} (${instance.uuid})`);
      console.log(`   Status: ${instance.status}`);
      console.log(`   URL: ${instance.url || 'N/A'}`);
      console.log('');
    }

    const stats = await client.instances.stats();
    console.log(`Total: ${stats.instanceCount} | Running: ${stats.runningCount} | Stopped: ${stats.stoppedCount}`);
  } catch (error) {
    console.error('Erreur de monitoring:', error.message);
  }
}

// Vérifier toutes les 5 minutes
setInterval(monitorInstances, 5 * 60 * 1000);
monitorInstances(); // Premier appel immédiat
```

## 🔒 Gestion des Erreurs

Le SDK fournit des classes d'erreurs typées pour une meilleure gestion :

```typescript
import { 
  LogicAIClient,
  TokenExpiredError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  NetworkError
} from '@logicai/sdk';

try {
  const result = await client.workflows.trigger({...});
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Token expiré - rediriger vers login
    console.log('Session expirée:', error.expiredAt);
  } else if (error instanceof AuthenticationError) {
    // Problème d'authentification
    console.log('Auth error:', error.message);
  } else if (error instanceof NotFoundError) {
    // Ressource non trouvée
    console.log('Not found:', error.message);
  } else if (error instanceof ValidationError) {
    // Erreur de validation
    console.log('Validation:', error.details);
  } else if (error instanceof RateLimitError) {
    // Rate limit atteint
    console.log('Too many requests');
  } else if (error instanceof NetworkError) {
    // Erreur réseau
    console.log('Network issue:', error.details);
  }
}
```

## 🔧 Configuration Avancée

### Variables d'Environnement

```env
LOGICAI_API_URL=https://api.logicai.com
LOGICAI_TOKEN=your-jwt-token
INSTANCE_UUID=your-instance-uuid
```

### Headers Personnalisés

```typescript
// Ajouter des headers aux requêtes workflow
await client.workflows.trigger({
  instanceUuid: 'abc-123',
  workflowId: 'my-workflow',
  data: { ... },
  headers: {
    'X-Custom-Header': 'value',
    'X-Request-ID': 'req-12345'
  }
});
```

### Mise à Jour du Token

```typescript
// Mettre à jour le token après reconnexion
client.setToken('new-jwt-token');
```

## 📖 API Reference

### `LogicAIClient`

#### Configuration
- `apiUrl` (string, requis): URL de base de l'API
- `token` (string, requis): Token JWT d'authentification
- `timeout` (number, optionnel): Timeout en ms (défaut: 30000)

#### Méthodes

**`instances.create(options?)`**
- Créer une nouvelle instance
- Retourne: `Promise<Instance>`

**`instances.list()`**
- Lister toutes les instances
- Retourne: `Promise<Instance[]>`

**`instances.get(uuid)`**
- Obtenir une instance par UUID
- Retourne: `Promise<Instance>`

**`instances.start(uuid)`**
- Démarrer une instance
- Retourne: `Promise<Instance>`

**`instances.stop(uuid)`**
- Arrêter une instance
- Retourne: `Promise<Instance>`

**`instances.delete(uuid)`**
- Supprimer une instance
- Retourne: `Promise<void>`

**`instances.stats()`**
- Obtenir les statistiques
- Retourne: `Promise<InstanceStats>`

**`workflows.trigger(options)`**
- Trigger un workflow par ID
- Retourne: `Promise<any>`

**`workflows.webhook(options)`**
- Trigger un webhook personnalisé
- Retourne: `Promise<any>`

**`getProfile()`**
- Obtenir le profil utilisateur
- Retourne: `Promise<User>`

**`setToken(token)`**
- Mettre à jour le token
- Retourne: `void`

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📄 License

MIT

## 🔗 Liens

- [Documentation complète](https://docs.logicai.com)
- [GitHub](https://github.com/your-org/logicai)
- [Support](https://logicai.com/support)
