/**
 * Exemple: Intégration avec Express.js
 * 
 * Serveur Express avec routes pour:
 * - Soumettre des formulaires
 * - Trigger des workflows
 * - Gérer les instances
 */

import express, { Request, Response } from 'express';
import { LogicAIClient, LogicAIError } from '../src';

const app = express();
app.use(express.json());

// Initialisation du client LogicAI
const logicai = new LogicAIClient({
  apiUrl: process.env.LOGICAI_API_URL || 'http://localhost:3000',
  token: process.env.LOGICAI_TOKEN || 'your-token-here',
});

const INSTANCE_UUID = process.env.INSTANCE_UUID || 'your-instance-uuid';

// Route: Soumettre un formulaire
app.post('/api/contact', async (req: Request, res: Response) => {
  try {
    console.log('📨 Nouvelle soumission de formulaire');

    const result = await logicai.workflows.webhook({
      instanceUuid: INSTANCE_UUID,
      webhookPath: 'contact-form',
      data: {
        ...req.body,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.socket.remoteAddress
      }
    });

    res.json({
      success: true,
      message: 'Formulaire soumis avec succès',
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    
    if (error instanceof LogicAIError) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
});

// Route: Trigger un workflow spécifique
app.post('/api/trigger/:workflowId', async (req: Request, res: Response) => {
  try {
    const { workflowId } = req.params;
    console.log(`🚀 Trigger workflow: ${workflowId}`);

    const result = await logicai.workflows.trigger({
      instanceUuid: INSTANCE_UUID,
      workflowId,
      data: req.body
    });

    res.json({
      success: true,
      message: 'Workflow déclenché avec succès',
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    
    if (error instanceof LogicAIError) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: error.message,
        code: error.code
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur'
      });
    }
  }
});

// Route: Lister les instances
app.get('/api/instances', async (req: Request, res: Response) => {
  try {
    const instances = await logicai.instances.list();
    const stats = await logicai.instances.stats();

    res.json({
      success: true,
      data: {
        instances,
        stats
      }
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route: Créer une instance
app.post('/api/instances', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    
    const instance = await logicai.instances.create({ name });

    res.status(201).json({
      success: true,
      message: 'Instance créée avec succès',
      data: instance
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route: Gérer une instance (start/stop)
app.post('/api/instances/:uuid/:action', async (req: Request, res: Response) => {
  try {
    const { uuid, action } = req.params;

    let result;
    if (action === 'start') {
      result = await logicai.instances.start(uuid);
      console.log(`▶️ Instance démarrée: ${uuid}`);
    } else if (action === 'stop') {
      result = await logicai.instances.stop(uuid);
      console.log(`⏸️ Instance arrêtée: ${uuid}`);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Action invalide. Utilisez "start" ou "stop"'
      });
    }

    res.json({
      success: true,
      message: `Instance ${action === 'start' ? 'démarrée' : 'arrêtée'} avec succès`,
      data: result
    });
  } catch (error) {
    console.error('❌ Erreur:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Route: Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Démarrer le serveur
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\n🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`\nEndpoints disponibles:`);
  console.log(`  POST   /api/contact - Soumettre un formulaire`);
  console.log(`  POST   /api/trigger/:workflowId - Trigger un workflow`);
  console.log(`  GET    /api/instances - Lister les instances`);
  console.log(`  POST   /api/instances - Créer une instance`);
  console.log(`  POST   /api/instances/:uuid/start - Démarrer une instance`);
  console.log(`  POST   /api/instances/:uuid/stop - Arrêter une instance`);
  console.log(`  GET    /health - Health check\n`);
});

export default app;
