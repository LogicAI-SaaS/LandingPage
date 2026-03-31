import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import * as localInstances from '../services/localInstances';

interface UnifiedInstance {
  id: string | number;
  uuid: string;
  name: string;
  status: string;
  port: number;
  subdomain?: string;
  is_shared?: boolean;
  container_id?: string;
  instance_email?: string;
  password_set: boolean;
  deployment_type: 'local' | 'cloud';
  currentUrl?: string;
}

interface UnifiedInstancesContextType {
  instances: UnifiedInstance[];
  isLocalBackendAvailable: boolean;
  refreshInstances: () => Promise<void>;
  loading: boolean;
}

const UnifiedInstancesContext = createContext<UnifiedInstancesContextType | undefined>(undefined);

export function UnifiedInstancesProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [instances, setInstances] = useState<UnifiedInstance[]>([]);
  const [isLocalBackendAvailable, setIsLocalBackendAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localBackendChecked, setLocalBackendChecked] = useState(false);
  const localWsRef = useRef<WebSocket | null>(null);
  const cloudWsRef = useRef<WebSocket | null>(null);

  // Vérifier si le backend local est disponible
  const checkLocalBackend = useCallback(async () => {
    const available = await localInstances.isLocalBackendAvailable();
    setIsLocalBackendAvailable(available);
    return available;
  }, []);

  // Récupérer les instances cloud depuis le serveur
  const getCloudInstances = useCallback(async (): Promise<UnifiedInstance[]> => {
    if (!token) return [];

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://api.logicai.fr/api'}/instances/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const cloudInstances = data.data.instances || [];
        return cloudInstances.map((inst: any) => ({ ...inst, deployment_type: 'cloud' as const }));
      }
    } catch (error) {
      console.error('[UnifiedInstances] Error fetching cloud instances:', error);
    }

    return [];
  }, [token]);

  // Récupérer les instances locales
  const getLocalInstances = useCallback(async (): Promise<UnifiedInstance[]> => {
    try {
      const localInstancesList = await localInstances.getLocalInstances();
      return localInstancesList.map(inst => ({
        ...inst,
        deployment_type: 'local' as const,
        subdomain: undefined,
        is_shared: false,
        password_set: true,
        instance_email: undefined,
      }));
    } catch (error) {
      console.error('[UnifiedInstances] Error fetching local instances:', error);
      return [];
    }
  }, []);

  // Rafraîchir toutes les instances (cloud + local)
  const refreshInstances = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [cloudInstances, localInstancesList] = await Promise.all([
        getCloudInstances(),
        getLocalInstances(),
      ]);

      const allInstances = [...cloudInstances, ...localInstancesList];
      setInstances(allInstances);
    } catch (error) {
      console.error('[UnifiedInstances] Error refreshing instances:', error);
    } finally {
      setLoading(false);
    }
  }, [token, getCloudInstances, getLocalInstances]);

  // Connecter WebSocket Cloud
  const connectCloudWebSocket = useCallback(() => {
    if (!token) return;

    const wsUrl = `${import.meta.env.VITE_API_URL?.replace('http', 'ws') || 'wss://api.logicai.fr'}/ws?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket Cloud] Connected');
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'instances:update':
              const cloudInstances = (message.data.instances || []).map((inst: any) => ({
                ...inst,
                deployment_type: 'cloud' as const,
              }));

              setInstances(prev => {
                const localInstances = prev.filter(inst => inst.deployment_type === 'local');
                return [...cloudInstances, ...localInstances];
              });
              break;

            case 'instance:created':
              const newInstance = { ...message.data.instance, deployment_type: 'cloud' as const };
              setInstances(prev => [...prev, newInstance]);
              break;

            case 'instance:updated':
              setInstances(prev =>
                prev.map(instance =>
                  instance.uuid === message.data.instance.uuid && instance.deployment_type === 'cloud'
                    ? { ...instance, ...message.data.instance, deployment_type: 'cloud' as const }
                    : instance
                )
              );
              break;

            case 'instance:deleted':
              setInstances(prev =>
                prev.filter(instance =>
                  !(instance.uuid === message.data.instanceId && instance.deployment_type === 'cloud')
                )
              );
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('[WebSocket Cloud] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket Cloud] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket Cloud] Disconnected');
        // Tentative de reconnexion après 5 secondes
        setTimeout(() => {
          if (token) {
            connectCloudWebSocket();
          }
        }, 5000);
      };

      cloudWsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket Cloud] Connection error:', error);
    }
  }, [token]);

  // Connecter WebSocket Local
  const connectLocalWebSocket = useCallback(() => {
    // Ne pas tenter de connexion si on a déjà vérifié que le backend n'est pas disponible
    if (localBackendChecked && !isLocalBackendAvailable) {
      return;
    }

    // Fermer l'ancienne connexion si elle existe
    if (localWsRef.current) {
      localWsRef.current.close();
    }

    const wsUrl = 'ws://localhost:3001/ws';

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket Local] Connected');
        setIsLocalBackendAvailable(true);
        setLocalBackendChecked(true);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          switch (message.type) {
            case 'instances:update':
              const localInstancesList = (message.data.instances || []).map((inst: any) => ({
                ...inst,
                deployment_type: 'local' as const,
                subdomain: undefined,
                is_shared: false,
                password_set: true,
                instance_email: undefined,
              }));

              setInstances(prev => {
                const cloudInstances = prev.filter(inst => inst.deployment_type === 'cloud');
                return [...cloudInstances, ...localInstancesList];
              });
              break;

            case 'instance:created':
              const newInstance = {
                ...message.data.instance,
                deployment_type: 'local' as const,
                subdomain: undefined,
                is_shared: false,
                password_set: true,
                instance_email: undefined,
              };
              setInstances(prev => [...prev, newInstance]);
              break;

            case 'instance:updated':
              setInstances(prev =>
                prev.map(instance =>
                  instance.uuid === message.data.instance.uuid && instance.deployment_type === 'local'
                    ? {
                        ...instance,
                        ...message.data.instance,
                        deployment_type: 'local' as const,
                      }
                    : instance
                )
              );
              break;

            case 'instance:deleted':
              setInstances(prev =>
                prev.filter(instance =>
                  !(instance.uuid === message.data.instanceId && instance.deployment_type === 'local')
                )
              );
              break;

            case 'instance:started':
            case 'instance:stopped':
              setInstances(prev =>
                prev.map(instance =>
                  instance.uuid === message.data.instance.uuid && instance.deployment_type === 'local'
                    ? { ...instance, status: message.data.instance.status }
                    : instance
                )
              );
              break;

            case 'ping':
              ws.send(JSON.stringify({ type: 'pong' }));
              break;
          }
        } catch (error) {
          console.error('[WebSocket Local] Error parsing message:', error);
        }
      };

      ws.onerror = () => {
        // Mode silencieux - pas de log d'erreur pour le backend local
        setIsLocalBackendAvailable(false);
        setLocalBackendChecked(true);
      };

      ws.onclose = () => {
        console.log('[WebSocket Local] Disconnected');
        setIsLocalBackendAvailable(false);
        // Ne pas tenter de reconnexion automatique pour le backend local
        // On laisse l'utilisateur le démarrer manuellement si besoin
      };

      localWsRef.current = ws;
    } catch (error) {
      // Mode silencieux - pas de log d'erreur
      setIsLocalBackendAvailable(false);
      setLocalBackendChecked(true);
    }
  }, [localBackendChecked, isLocalBackendAvailable]);

  // Effet pour initialiser les connexions WebSocket et charger les instances
  useEffect(() => {
    if (token) {
      // Charger les instances initiales
      refreshInstances();
      // Connecter WebSocket Cloud
      connectCloudWebSocket();
      // Tenter de connecter WebSocket Local une seule fois
      if (!localBackendChecked) {
        connectLocalWebSocket();
      }
    }

    // Cleanup
    return () => {
      if (cloudWsRef.current) {
        cloudWsRef.current.close();
      }
      if (localWsRef.current) {
        localWsRef.current.close();
      }
    };
  }, [token, refreshInstances, connectCloudWebSocket, connectLocalWebSocket, localBackendChecked]);

  return (
    <UnifiedInstancesContext.Provider value={{ instances, isLocalBackendAvailable, refreshInstances, loading }}>
      {children}
    </UnifiedInstancesContext.Provider>
  );
}

export function useUnifiedInstances() {
  const context = useContext(UnifiedInstancesContext);
  if (!context) {
    throw new Error('useUnifiedInstances must be used within UnifiedInstancesProvider');
  }
  return context;
}
