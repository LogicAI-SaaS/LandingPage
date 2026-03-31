import { useState } from 'react';
import { Key, Loader2 } from 'lucide-react';

interface BetaGateProps {
  onUnlock: () => void;
}

export function BetaGate({ onUnlock }: BetaGateProps) {
  const [key, setKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const validateAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!key.trim()) {
      setError('Veuillez entrer une clé');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');

      // Valider la clé
      const validateResponse = await fetch(`${import.meta.env.VITE_API_URL}/beta/validate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      const validateData = await validateResponse.json();

      if (!validateData.success) {
        setError(validateData.message || 'Clé invalide');
        setIsValidating(false);
        return;
      }

      // Activer la clé
      const activateResponse = await fetch(`${import.meta.env.VITE_API_URL}/beta/activate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key }),
      });

      const activateData = await activateResponse.json();

      if (activateData.success) {
        localStorage.setItem('hasBetaAccess', 'true');
        onUnlock();
      } else {
        setError(activateData.message || 'Erreur lors de l\'activation');
      }
    } catch (err) {
      setError('Impossible de contacter le serveur');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/LogicAI.ico" alt="LogicAI" className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">LogicAI</h1>
          <p className="text-gray-400">Accès Bêta Requis</p>
        </div>

        {/* Card */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-orange-500/10 p-3 rounded-full">
              <Key className="size-8 text-orange-500" />
            </div>
          </div>

          <h2 className="text-xl font-semibold text-white text-center mb-2">
            Rejoindre la bêta
          </h2>
          <p className="text-gray-400 text-center text-sm mb-6">
            Entrez votre clé d'accès bêta pour continuer vers le tableau de bord.
          </p>

          <form onSubmit={validateAndActivate} className="space-y-4">
            <div>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value.toUpperCase())}
                placeholder="BETA-XXXX-XXXX-XXXX-XXXX"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none uppercase tracking-wider font-mono"
                disabled={isValidating}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={isValidating}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Vérification...</span>
                </>
              ) : (
                'Activer l\'accès bêta'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-500 text-xs text-center">
              Pas encore de clé ?{' '}
              <a href="/" className="text-orange-500 hover:text-orange-400">
                Rejoindre la liste d'attente
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
