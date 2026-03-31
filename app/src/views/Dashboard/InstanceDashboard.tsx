import { useParams } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import { useUnifiedInstances } from '../../contexts/UnifiedInstancesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTabs } from '../../contexts/TabsContext';
import { api } from '../../services/api';

export default function InstanceDashboard() {
  const { uuid } = useParams<{ uuid: string }>();
  const { instances } = useUnifiedInstances();
  const { token: logicAIToken } = useAuth();
  const { updateTab } = useTabs();

  const [instanceUrl, setInstanceUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [instanceToken, setInstanceToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasInitialized = useRef(false);

  // Récupérer l'instance et initialiser l'URL
  useEffect(() => {
    if (uuid && instances.length > 0) {
      const instance = instances.find(i => i.uuid === uuid);
      if (instance) {
        const baseUrl = `http://localhost:${instance.port}`;

        // Récupérer l'URL sauvegardée si elle existe
        const savedUrl = instance.currentUrl || baseUrl;
        setInstanceUrl(baseUrl);
        setCurrentUrl(savedUrl);

        console.log('[Instance Dashboard] Initializing with URL:', savedUrl);
      }
    }
  }, [uuid, instances]);

  // Sauvegarder l'URL actuelle quand elle change
  const saveCurrentUrl = (newUrl: string) => {
    if (uuid && newUrl !== currentUrl) {
      console.log('[Instance Dashboard] Saving current URL:', newUrl);
      setCurrentUrl(newUrl);
      updateTab(`instance-${uuid}`, { currentUrl: newUrl });
    }
  };

  // Obtenir le token d'authentification pour l'instance
  useEffect(() => {
    const fetchInstanceToken = async () => {
      if (!uuid || !logicAIToken || hasInitialized.current) return;

      try {
        setLoading(true);
        setError('');

        console.log('[Instance Dashboard] Fetching auth token for instance:', uuid);

        const response = await api.getInstanceAuthToken(logicAIToken, uuid);

        if (response.success) {
          const { instanceToken, instanceUrl } = response.data;
          console.log('[Instance Dashboard] Auth token received successfully');
          setInstanceToken(instanceToken);
          hasInitialized.current = true;
        } else {
          setError(response.message || 'Impossible d\'obtenir le token d\'authentification');
        }
      } catch (err: any) {
        console.error('[Instance Dashboard] Error fetching auth token:', err);
        setError(err.message || 'Erreur lors de la récupération du token');
      } finally {
        setLoading(false);
      }
    };

    fetchInstanceToken();
  }, [uuid, logicAIToken]);

  // Authentification automatique via postMessage avec le token d'instance
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow && instanceToken && currentUrl) {
      const contentWindow = iframe.contentWindow;
      const handleLoad = () => {
        try {
          // Envoyer le token d'instance à l'iframe
          contentWindow.postMessage({
            type: 'LOGICAI_INSTANCE_AUTH',
            token: instanceToken
          }, '*');
          console.log('[Instance Dashboard] Auth token sent to iframe');
        } catch (error) {
          console.error('[Instance Dashboard] Error sending auth token to iframe:', error);
        }
      };

      iframe.addEventListener('load', handleLoad);

      return () => {
        iframe.removeEventListener('load', handleLoad);
      };
    }
  }, [currentUrl, instanceToken]);

  // Écouter les messages de l'instance pour détecter les changements d'URL
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Vérifier que le message vient de notre instance
      if (!uuid || !instances.length) return;

      const instance = instances.find(i => i.uuid === uuid);
      if (!instance) return;

      const expectedOrigin = `http://localhost:${instance.port}`;
      if (event.origin !== expectedOrigin) return;

      // Écouter les mises à jour d'URL depuis l'instance
      if (event.data && event.data.type === 'LOGICAI_URL_UPDATE') {
        const newUrl = event.data.url;
        if (newUrl && newUrl !== currentUrl) {
          console.log('[Instance Dashboard] URL updated in instance:', newUrl);
          saveCurrentUrl(newUrl);
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [uuid, instances, currentUrl]);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#010101]">
        <div className="text-white text-center">
          <div className="mb-4">Connexion à l'instance en cours...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#010101]">
        <div className="text-white text-center">
          <div className="text-red-500 mb-4">Erreur de connexion</div>
          <div className="text-sm">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#010101]">
      {/* Instance Dashboard iframe - Full Screen */}
      <div className="flex-1 overflow-hidden">
        {currentUrl ? (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            title="LogicAI Instance Dashboard"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation-by-user-activation"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-white">Chargement du dashboard...</div>
          </div>
        )}
      </div>
    </div>
  );
}
