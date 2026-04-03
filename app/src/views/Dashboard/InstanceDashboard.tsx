import { useEffect, useState, useRef } from 'react';
import { useUnifiedInstances } from '../../contexts/UnifiedInstancesContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTabs } from '../../contexts/TabsContext';
import { api } from '../../services/api';

const LOCAL_BACKEND = 'http://localhost:3001';

// ─── Minimal HS256 JWT (no external lib needed) ──────────────────────────────
const INSTANCE_JWT_SECRET = 'logicai-secret-key-change-in-production';

function b64url(input: string): string {
  return btoa(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signHS256(payload: object): Promise<string> {
  const header  = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body    = b64url(JSON.stringify({ ...payload, iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 7 * 86400 }));
  const msg     = `${header}.${body}`;
  const key     = await crypto.subtle.importKey('raw', new TextEncoder().encode(INSTANCE_JWT_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig     = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(msg));
  const sigB64  = b64url(String.fromCharCode(...new Uint8Array(sig)));
  return `${msg}.${sigB64}`;
}

// Loading screen shown while the instance is booting or while auth is in progress
function InstanceLoadingOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#010101]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative size-12">
          <div className="absolute inset-0 rounded-full border-2 border-orange-500/20" />
          <div className="absolute inset-0 rounded-full border-t-2 border-orange-500 animate-spin" />
        </div>
        <p className="text-gray-300 text-sm font-medium">{message}</p>
      </div>
    </div>
  );
}

interface InstanceDashboardProps {
  uuid: string;
}

export default function InstanceDashboard({ uuid }: InstanceDashboardProps) {
  const { instances } = useUnifiedInstances();
  const { token: logicAIToken, user } = useAuth();
  const { updateTab } = useTabs();

  const [instanceUrl, setInstanceUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState('');
  const [error, setError] = useState('');

  // Overlay states
  const [bootMessage, setBootMessage] = useState('Démarrage de l\'instance...');
  const [instanceReady, setInstanceReady] = useState(false); // container HTTP is up
  const [tokenReady, setTokenReady] = useState(false);       // JWT is generated
  const [authDone, setAuthDone] = useState(false);           // LOGICAI_AUTH_SUCCESS received

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const instanceTokenRef = useRef('');
  // When LOGICAI_INSTANCE_READY fires before the token is generated, queue it
  const pendingReadyRef = useRef(false);

  // ── Resolve instance URL ──────────────────────────────────────────────────
  useEffect(() => {
    if (!uuid || instances.length === 0) return;
    const instance = instances.find(i => i.uuid === uuid);
    if (!instance) return;

    const baseUrl = instance.subdomain
      ? `https://${instance.subdomain}`
      : `http://localhost:${instance.port}`;

    const savedUrl = instance.currentUrl || baseUrl;
    setInstanceUrl(baseUrl);
    setCurrentUrl(savedUrl);
  }, [uuid, instances]);

  // ── Generate JWT ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!uuid || !instances.length) return;
    const instance = instances.find(i => i.uuid === uuid);
    if (!instance) return;

    if (instance.deployment_type === 'local') {
      if (!user) return;
      signHS256({
        userId: user.id,
        email: user.email,
        instanceId: uuid,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: (user as any).plan || 'free',
      }).then(token => {
        instanceTokenRef.current = token;
        setTokenReady(true);
        // If READY arrived before the token was ready, send now
        if (pendingReadyRef.current) {
          pendingReadyRef.current = false;
          sendAuthToken(token);
        }
      });
      return;
    }

    // Cloud instance — fetch token from API
    if (!logicAIToken) return;
    api.getInstanceAuthToken(logicAIToken, uuid).then(res => {
      if (res.success) {
        instanceTokenRef.current = res.data.instanceToken;
        setTokenReady(true);
        if (pendingReadyRef.current) {
          pendingReadyRef.current = false;
          sendAuthToken(res.data.instanceToken);
        }
      } else {
        setError(res.message || 'Impossible d\'obtenir le token');
      }
    }).catch((err: Error) => setError(err.message));
  }, [uuid, instances, logicAIToken, user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Poll instance readiness (local only) ─────────────────────────────────
  useEffect(() => {
    if (!uuid || !instanceUrl) return;
    const instance = instances.find(i => i.uuid === uuid);
    if (!instance) return;

    // Cloud instances are always considered "ready" (not a cold-start concern)
    if (instance.deployment_type !== 'local') {
      setInstanceReady(true);
      return;
    }

    let cancelled = false;
    let attempt = 0;

    const poll = async () => {
      while (!cancelled) {
        attempt++;
        if (attempt === 1)  setBootMessage('Démarrage de l\'instance...');
        if (attempt === 8)  setBootMessage('Initialisation en cours...');
        if (attempt === 20) setBootMessage('Presque prêt...');

        try {
          const res = await fetch(`${LOCAL_BACKEND}/api/instances/${uuid}/ready`);
          const data = await res.json();
          if (data?.data?.ready) {
            if (!cancelled) setInstanceReady(true);
            return;
          }
        } catch { /* backend not ready yet */ }

        if (!cancelled) await new Promise(r => setTimeout(r, 1000));
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [uuid, instanceUrl, instances]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── postMessage auth listener ─────────────────────────────────────────────
  const sendAuthToken = (token?: string) => {
    const t = token ?? instanceTokenRef.current;
    if (!t || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage({
      type: 'LOGICAI_INSTANCE_AUTH',
      token: t,
      cloudToken: logicAIToken ?? undefined,
    }, '*');
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'LOGICAI_INSTANCE_READY') {
        if (instanceTokenRef.current) {
          sendAuthToken();
        } else {
          // Token not ready yet — will send as soon as signHS256 resolves
          pendingReadyRef.current = true;
        }
      }
      if (event.data?.type === 'LOGICAI_AUTH_SUCCESS') {
        setAuthDone(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fallback: if AUTH_SUCCESS never arrives (e.g. cloud instance without the handler),
  // reveal the iframe 5s after the token was sent.
  useEffect(() => {
    if (!instanceReady || !tokenReady) return;
    const t = setTimeout(() => setAuthDone(true), 5000);
    return () => clearTimeout(t);
  }, [instanceReady, tokenReady]);

  // Save URL when updated from the instance
  const saveCurrentUrl = (newUrl: string) => {
    if (uuid && newUrl !== currentUrl) {
      setCurrentUrl(newUrl);
      updateTab(`instance-${uuid}`, { currentUrl: newUrl });
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!uuid || !instances.length) return;
      const instance = instances.find(i => i.uuid === uuid);
      if (!instance) return;
      const expectedOrigin = instance.subdomain
        ? `https://${instance.subdomain}`
        : `http://localhost:${instance.port}`;
      if (event.origin !== expectedOrigin) return;
      if (event.data?.type === 'LOGICAI_URL_UPDATE') saveCurrentUrl(event.data.url);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [uuid, instances, currentUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Overlay is visible until container is ready + auth confirmed ──────────
  const showOverlay = !instanceReady || !tokenReady || !authDone;

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-[#010101]">
        <div className="text-white text-center">
          <div className="text-red-500 mb-4">Erreur de connexion</div>
          <div className="text-sm text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-[#010101] relative">
      {/* Loading overlay — covers the iframe until auth is complete */}
      {showOverlay && (
        <InstanceLoadingOverlay
          message={!instanceReady ? bootMessage : !tokenReady ? 'Préparation de la connexion...' : 'Connexion en cours...'}
        />
      )}

      {/* Iframe — rendered as soon as we have instanceUrl, kept hidden behind overlay */}
      <div className="flex-1 overflow-hidden">
        {currentUrl && instanceReady && tokenReady ? (
          <iframe
            ref={iframeRef}
            src={currentUrl}
            className="w-full h-full border-0"
            title="LogicAI Instance Dashboard"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-top-navigation-by-user-activation"
          />
        ) : null}
      </div>
    </div>
  );
}
