const WebSocket = require('ws');
const { verifyToken } = require('../utils/auth');
const Instance = require('../models/Instance');
const InstanceMember = require('../models/InstanceMember');

async function getInstancesForUser(userId) {
  const owned = await Instance.findByUserId(userId);
  const shared = await InstanceMember.findAcceptedInstancesByUserId(userId);
  return [...owned, ...shared.map(i => ({ ...i, is_shared: true }))];
}
// Stocker les connexions WebSocket actives
const clients = new Map();

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({
      server,
      path: '/ws'
    });

    this.setupWebSocketServer();
  }

  setupWebSocketServer() {
    this.wss.on('connection', async (ws, req) => {
      // Extraire le token des paramètres de requête
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'Token manquant');
        return;
      }

      try {
        // Vérifier le token
        const decoded = verifyToken(token);
        const userId = decoded.userId;

        console.log(`[WebSocket] Client connected: userId=${userId}`);

        // Stocker la connexion
        clients.set(userId, ws);

        // Envoyer les instances actuelles au client
        try {
          const instances = await getInstancesForUser(userId);
          ws.send(JSON.stringify({
            type: 'instances:update',
            data: { instances }
          }));
        } catch (error) {
          console.error('[WebSocket] Error loading instances:', error);
        }

        // Gérer les messages du client
        ws.on('message', async (message) => {
          try {
            const data = JSON.parse(message);

            switch (data.type) {
              case 'pong':
                // Réponse au ping - garder la connexion alive
                break;
              case 'refresh':
                // Demande de rafraîchissement des instances
                try {
                  const instances = await getInstancesForUser(userId);
                  ws.send(JSON.stringify({
                    type: 'instances:update',
                    data: { instances }
                  }));
                } catch (error) {
                  console.error('[WebSocket] Error refreshing instances:', error);
                }
                break;
              default:
                console.log('[WebSocket] Unknown message type:', data.type);
            }
          } catch (error) {
            console.error('[WebSocket] Error handling message:', error);
          }
        });

        // Gérer la déconnexion
        ws.on('close', () => {
          console.log(`[WebSocket] Client disconnected: userId=${userId}`);
          clients.delete(userId);
        });

        // Gérer les erreurs
        ws.on('error', (error) => {
          console.error('[WebSocket] Error:', error);
          clients.delete(userId);
        });

        // Envoyer un ping périodique pour garder la connexion alive
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // Ping toutes les 30 secondes

        ws.on('close', () => {
          clearInterval(pingInterval);
        });

      } catch (error) {
        console.error('[WebSocket] Authentication error:', error);
        ws.close(4001, 'Token invalide');
      }
    });

    console.log('[WebSocket] Server initialized on path /ws');
  }

  // Envoyer une mise à jour à un utilisateur spécifique
  sendToUser(userId, message) {
    const client = clients.get(userId.toString());
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
      return true;
    }
    return false;
  }

  // Envoyer une mise à jour à tous les clients connectés
  broadcast(message) {
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }

  // Notifier tous les clients d'un utilisateur quand ses instances sont mises à jour
  notifyUserInstancesUpdated(userId) {
    getInstancesForUser(userId)
      .then(instances => {
        this.sendToUser(userId, {
          type: 'instances:update',
          data: { instances }
        });
      })
      .catch(error => {
        console.error('[WebSocket] Error notifying user:', error);
      });
  }

  // Notifier quand une instance est créée
  notifyInstanceCreated(userId, instance) {
    this.sendToUser(userId, {
      type: 'instance:created',
      data: { instance }
    });
  }

  // Notifier quand une instance est mise à jour
  notifyInstanceUpdated(userId, instance) {
    this.sendToUser(userId, {
      type: 'instance:updated',
      data: { instance }
    });
  }

  // Notifier quand une instance est supprimée
  notifyInstanceDeleted(userId, instanceId) {
    this.sendToUser(userId, {
      type: 'instance:deleted',
      data: { instanceId }
    });
  }

  // Obtenir le nombre de clients connectés
  getConnectedClientsCount() {
    return clients.size;
  }
}

// Singleton instance
let websocketServer = null;

function initWebSocketServer(server) {
  if (!websocketServer) {
    websocketServer = new WebSocketServer(server);
  }
  return websocketServer;
}

function getWebSocketServer() {
  return websocketServer;
}

module.exports = {
  initWebSocketServer,
  getWebSocketServer
};
