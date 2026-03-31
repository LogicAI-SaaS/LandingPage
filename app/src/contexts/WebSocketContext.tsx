import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Instance {
  id: number;
  uuid: string;
  name: string;
  status: string;
  port: number;
  subdomain: string;
  is_shared?: boolean;
  container_id: string;
  instance_email?: string;
  password_set: boolean;
  deployment_type?: 'local' | 'cloud';
}

interface WebSocketContextType {
  instances: Instance[];
  isConnected: boolean;
  refreshInstances: () => Promise<void>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const MAX_RECONNECT_ATTEMPTS = 5;

  // Fonction pour rafraîchir les instances via API
  const refreshInstances = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/instances/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInstances(data.data.instances || []);
      }
    } catch (error) {
      console.error('Error refreshing instances:', error);
    }
  };

  // Connecter WebSocket
  const connect = () => {
    if (!token) return;

    const wsUrl = `${import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'wss://api.logicai.fr'}/ws?token=${token}`;

    try {
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('[WebSocket] Connected');
        setIsConnected(true);
        setReconnectAttempts(0);
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'instances:update':
              setInstances(message.data.instances || []);
              break;
            case 'instance:created':
              setInstances(prev => [...prev, message.data.instance]);
              break;
            case 'instance:updated':
              setInstances(prev =>
                prev.map(instance =>
                  instance.uuid === message.data.instance.uuid
                    ? { ...instance, ...message.data.instance }
                    : instance
                )
              );
              break;
            case 'instance:deleted':
              setInstances(prev =>
                prev.filter(instance => instance.uuid !== message.data.instanceId)
              );
              break;
            case 'ping':
              // Répondre au ping avec un pong
              websocket.send(JSON.stringify({ type: 'pong' }));
              break;
            default:
              console.log('[WebSocket] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      websocket.onclose = () => {
        console.log('[WebSocket] Disconnected');
        setIsConnected(false);

        // Tentative de reconnexion
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
          console.log(`[WebSocket] Reconnecting in ${delay}ms... (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`);

          setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.log('[WebSocket] Max reconnection attempts reached');
        }
      };

      setWs(websocket);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
    }
  };

  // Effet pour gérer la connexion WebSocket
  useEffect(() => {
    if (token) {
      // Charger les instances initiales
      refreshInstances();
      // Connecter WebSocket
      connect();
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [token]);

  // Effet pour mettre à jour les instances depuis le serveur périodiquement si WebSocket n'est pas connecté
  useEffect(() => {
    if (!isConnected && token) {
      const interval = setInterval(() => {
        refreshInstances();
      }, 5000); // Polling toutes les 5 secondes si WebSocket n'est pas connecté

      return () => clearInterval(interval);
    }
  }, [isConnected, token]);

  return (
    <WebSocketContext.Provider value={{ instances, isConnected, refreshInstances }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider');
  }
  return context;
}
