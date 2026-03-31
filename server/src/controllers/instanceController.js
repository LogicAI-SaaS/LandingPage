const Instance = require('../models/Instance');
const User = require('../models/User');
const docker = require('../config/docker');
const { sendInstanceEmail } = require('../services/instanceService');
const { verifyEmailConfig } = require('../config/email');
const { getWebSocketServer } = require('../config/websocket');
const InstanceMember = require('../models/InstanceMember');

// Vérifier la configuration email au démarrage
verifyEmailConfig();

// Trouver un port disponible

// Trouver un port disponible
async function findAvailablePort() {
  const START_PORT = 5678;
  const MAX_PORT = 6000;

  for (let port = START_PORT; port <= MAX_PORT; port++) {
    try {
      const containers = await docker.listContainers({ all: true });
      const portInUse = containers.some(container => {
        const ports = container.Ports || [];
        return ports.some(p => p.PublicPort === port);
      });

      if (!portInUse) {
        return port;
      }
    } catch (error) {
      // Vérifier si c'est une erreur de connexion Docker
      if (error.code === 'ENOENT' || error.code === 'EACCES') {
        throw new Error('Docker n\'est pas accessible. Veuillez vérifier que Docker Desktop est installé et démarré.');
      }
      console.error('Error checking port:', error);
    }
  }

  throw new Error('No available port found');
}

// Créer une nouvelle instance LogicAI
exports.createInstance = async (req, res) => {
  try {
    // L'utilisateur est déjà vérifié par le middleware auth
    const user = req.user;
    const { deploymentType = 'cloud' } = req.body; // 'cloud' ou 'local'

    // Validation du type de déploiement
    if (!['local', 'cloud'].includes(deploymentType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de déploiement invalide. Doit être "local" ou "cloud"'
      });
    }

    // Vérifier le quota uniquement pour les instances cloud
    if (deploymentType === 'cloud') {
      const instanceCount = await Instance.countCloudInstances(user.id);
      const planLimits = await User.getPlanLimits(user.plan);
      const maxInstances = planLimits.max_instances;

      if (maxInstances !== -1 && instanceCount >= maxInstances) {
        return res.status(400).json({
          success: false,
          message: `Limite d'instances cloud atteinte pour le plan ${user.plan}. Maximum: ${maxInstances}`
        });
      }
    }

    const instance = await Instance.create({
      userId: user.id,
      name: `instance-${Date.now()}`,
      deploymentType
    });

    // Instance locale : retourner les infos pour que le client gère lui-même
    if (deploymentType === 'local') {
      console.log(`[Local Instance] Created local instance ${instance.uuid} for user ${user.id}`);

      await Instance.updateStatus(instance.id, 'running');

      // Notifier les clients WebSocket
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.notifyUserInstancesUpdated(user.id);
      }

      return res.json({
        success: true,
        message: 'Instance locale créée avec succès. Vous pouvez maintenant la déployer localement.',
        data: {
          instance: {
            id: instance.id,
            uuid: instance.uuid,
            name: instance.name,
            subdomain: instance.subdomain,
            status: 'running',
            deployment_type: 'local'
          }
        }
      });
    }

    // Instance cloud : création via Docker
    try {
      console.log(`[Cloud Instance] Starting LogicAI creation for user ${user.id}, instance UUID: ${instance.uuid}`);

      // Vérifier la connexion Docker
      try {
        await docker.ping();
        console.log('[Docker] Connection verified');
      } catch (dockerPingError) {
        console.error('[Docker] Cannot connect to Docker daemon:', dockerPingError);
        await Instance.updateStatus(instance.id, 'error');
        return res.status(500).json({
          success: false,
          message: 'Docker daemon n\'est pas accessible. Vérifiez que Docker est démarré.',
          error: dockerPingError.message
        });
      }

      const port = await findAvailablePort();
      console.log(`[Instance Creation] Allocated port: ${port}`);

      // Préparer les variables d'environnement pour LogicAI
      const envVars = [
        `INSTANCE_ID=${instance.uuid}`,
        `INSTANCE_NAME=${instance.name}`,
        `EXTERNAL_PORT=${port}`,
        'NODE_ENV=production',
        'PORT=3000',
        `DATABASE_URL=file:/app/data/instance.db`,
        `CORS_ORIGIN=https://${instance.subdomain}`,
        'JWT_SECRET=logicai-instance-secret-key-change-in-production',
        `GLOBAL_API_URL=https://api.logicai.fr`
      ];

      // Port bindings: LogicAI utilise le port 3000 en interne
      const portBindings = {};
      portBindings['3000/tcp'] = [{ HostPort: String(port) }];

      // Volume pour les données
      const binds = [];
      if (process.platform === 'win32') {
        // Sur Windows, utiliser un volume nommé
        binds.push(`logicai-data-${instance.uuid}:/app/data`);
      } else {
        binds.push(`/var/lib/logicai-${instance.uuid}:/app/data`);
      }

      const containerConfig = {
        Image: 'logicai:latest',
        name: `logicai-${instance.uuid}`,
        Env: envVars,
        HostConfig: {
          PortBindings: portBindings,
          Binds: binds,
          RestartPolicy: {
            Name: 'unless-stopped'
          }
        },
        ExposedPorts: {
          '3000/tcp': {}
        }
      };

      console.log(`[Instance Creation] Creating LogicAI container with config:`, {
        name: containerConfig.name,
        image: containerConfig.Image,
        port: port,
        binds: binds
      });

      const container = await docker.createContainer(containerConfig);
      console.log(`[Instance Creation] Container created: ${container.id}`);

      await container.start();
      console.log(`[Instance Creation] Container started: ${container.id}`);

      // Attendre que LogicAI soit prêt (initialisation de la base de données)
      console.log('[Instance Creation] Waiting for LogicAI to initialize database...');
      await new Promise(resolve => setTimeout(resolve, 10000)); // Attendre 10 secondes

      const instanceUrl = `http://localhost:${port}`;
      console.log(`[Instance Creation] LogicAI instance ready at ${instanceUrl}`);

      // Marquer comme mot de passe défini (LogicAI a son propre système d'auth)
      await Instance.markPasswordSet(instance.id);

      // Envoyer l'email avec l'URL de l'instance
      await sendInstanceEmail(user.email, instanceUrl, instance.name);

      await Instance.updatePort(instance.id, port);
      await Instance.updateContainerId(instance.id, container.id);
      await Instance.updateStatus(instance.id, 'running');

      // Notifier les clients WebSocket
      const wsServer = getWebSocketServer();
      if (wsServer) {
        wsServer.notifyUserInstancesUpdated(user.id);
      }

      res.json({
        success: true,
        message: 'Instance LogicAI créée avec succès. Un email avec les instructions a été envoyé.',
        data: {
          instance: {
            id: instance.id,
            uuid: instance.uuid,
            name: instance.name,
            subdomain: instance.subdomain,
            port: port,
            status: 'running',
            password_set: true,
            url: instanceUrl
          }
        }
      });
    } catch (dockerError) {
      console.error('[Docker Error Details]:', {
        message: dockerError.message,
        stack: dockerError.stack,
        code: dockerError.code
      });

      await Instance.updateStatus(instance.id, 'error');

      // Messages d'erreur plus spécifiques
      let errorMessage = 'Erreur lors de la création du container Docker';
      if (dockerError.message.includes('EACCES') || dockerError.message.includes('permission')) {
        errorMessage = 'Permission refusée. Vérifiez les permissions Docker.';
      } else if (dockerError.message.includes('ENOENT') || dockerError.message.includes('connect')) {
        errorMessage = 'Docker daemon n\'est pas accessible. Vérifiez que Docker Desktop est démarré.';
      } else if (dockerError.message.includes('image')) {
        errorMessage = 'Erreur lors du chargement de l\'image LogicAI. Assurez-vous d\'avoir exécuté le script de build.';
      } else if (dockerError.message.includes('port')) {
        errorMessage = 'Erreur d\'allocation de port. Aucun port disponible.';
      }

      res.status(500).json({
        success: false,
        message: errorMessage,
        error: dockerError.message
      });
    }
  } catch (error) {
    console.error('Create instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.getInstances = async (req, res) => {
  try {
    const ownedInstances = await Instance.findByUserId(req.user.id);
    const sharedInstances = await InstanceMember.findAcceptedInstancesByUserId(req.user.id);
    const sharedWithFlag = sharedInstances.map(i => ({ ...i, is_shared: true }));
    const instances = [...ownedInstances, ...sharedWithFlag];

    res.json({
      success: true,
      data: { instances }
    });
  } catch (error) {
    console.error('Get instances error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.getInstance = async (req, res) => {
  try {
    const { uuid } = req.params;
    // L'utilisateur est déjà vérifié par le middleware auth
    const instance = await Instance.findByUuid(uuid);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance non trouvée' });
    }

    if (instance.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    res.json({
      success: true,
      data: { instance }
    });
  } catch (error) {
    console.error('Get instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.stopInstance = async (req, res) => {
  try {
    const { uuid } = req.params;
    // L'utilisateur est déjà vérifié par le middleware auth
    const instance = await Instance.findByUuid(uuid);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance non trouvée' });
    }

    if (instance.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const container = docker.getContainer(instance.container_id);
    await container.stop();
    await Instance.updateStatus(instance.id, 'stopped');

    // Notifier les clients WebSocket
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.notifyUserInstancesUpdated(instance.user_id);
    }

    res.json({
      success: true,
      message: 'Instance arrêtée avec succès'
    });
  } catch (error) {
    console.error('Stop instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.startInstance = async (req, res) => {
  try {
    const { uuid } = req.params;
    // L'utilisateur est déjà vérifié par le middleware auth
    const instance = await Instance.findByUuid(uuid);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance non trouvée' });
    }

    if (instance.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    const container = docker.getContainer(instance.container_id);
    await container.start();
    await Instance.updateStatus(instance.id, 'running');

    // Notifier les clients WebSocket
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.notifyUserInstancesUpdated(instance.user_id);
    }

    res.json({
      success: true,
      message: 'Instance démarrée avec succès'
    });
  } catch (error) {
    console.error('Start instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

exports.deleteInstance = async (req, res) => {
  try {
    const { uuid } = req.params;
    // L'utilisateur est déjà vérifié par le middleware auth
    const instance = await Instance.findByUuid(uuid);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance non trouvée' });
    }

    if (instance.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    console.log(`[Instance Deletion] Starting deletion for instance ${instance.uuid}`);

    // Supprimer le container Docker s'il existe
    if (instance.container_id) {
      try {
        const container = docker.getContainer(instance.container_id);
        console.log(`[Instance Deletion] Removing container ${instance.container_id}...`);

        // Force: true arrête le container s'il est en cours d'exécution
        // v: true supprime les volumes anonymes associés
        await container.remove({ force: true, v: true });

        console.log(`[Instance Deletion] Container removed successfully`);
      } catch (dockerError) {
        if (dockerError.statusCode === 404) {
          console.log(`[Instance Deletion] Container not found (already removed): ${instance.container_id}`);
        } else {
          console.error('[Instance Deletion] Docker error:', dockerError.message);
          // Continuer quand même pour supprimer l'instance de la base de données
        }
      }
    }

    // Supprimer le volume nommé s'il existe
    const volumeName = `logicai-data-${instance.uuid}`;
    try {
      const volume = docker.getVolume(volumeName);
      await volume.remove();
      console.log(`[Instance Deletion] Volume ${volumeName} removed`);
    } catch (volumeError) {
      if (volumeError.statusCode === 404) {
        console.log(`[Instance Deletion] Volume not found: ${volumeName}`);
      } else {
        console.error('[Instance Deletion] Volume error:', volumeError.message);
      }
    }

    // Supprimer l'instance de la base de données
    await Instance.delete(instance.id);
    console.log(`[Instance Deletion] Instance ${instance.uuid} deleted from database`);

    // Notifier les clients WebSocket
    const wsServer = getWebSocketServer();
    if (wsServer) {
      wsServer.notifyInstanceDeleted(instance.user_id, instance.uuid);
    }

    res.json({
      success: true,
      message: 'Instance supprimée avec succès'
    });
  } catch (error) {
    console.error('Delete instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};

// Confirmer l'accès à l'instance (LogicAI a son propre système d'auth)
exports.setPassword = async (req, res) => {
  try {
    const { uuid } = req.params;
    // L'utilisateur est déjà vérifié par le middleware auth
    const instance = await Instance.findByUuid(uuid);

    if (!instance) {
      return res.status(404).json({ success: false, message: 'Instance non trouvée' });
    }

    if (instance.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    // LogicAI a son propre système d'authentification
    // On marque juste l'instance comme configurée
    await Instance.markPasswordSet(instance.id);

    res.json({
      success: true,
      message: 'Instance confirmée avec succès. Vous pouvez maintenant vous connecter.'
    });
  } catch (error) {
    console.error('Confirm instance error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
      error: error.message
    });
  }
};
