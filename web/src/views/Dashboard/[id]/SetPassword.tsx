import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Lock, ExternalLink, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';

export function SetPassword() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [instance, setInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id && token) {
      loadInstance();
    }
  }, [id, token]);

  const loadInstance = async () => {
    try {
      const result = await api.getInstances(token!);
      const foundInstance = result.data.instances.find((i: any) => i.uuid === id || i.id === parseInt(id!));
      if (foundInstance) {
        setInstance(foundInstance);
      }
    } catch (err) {
      console.error('Error loading instance:', err);
    }
  };

  const handleConfirmSetup = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Confirmer l'accès à l'instance LogicAI-N8N
      await fetch(`${import.meta.env.VITE_API_URL}/instances/${id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      setSuccess(true);

      // Rediriger vers l'instance après 2 secondes
      setTimeout(() => {
        navigate(`/dashboard/instances/${id}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la confirmation');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-bg-dark text-white flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Configuration terminée !</h2>
            <p className="text-gray-400 mb-6">
              Votre instance LogicAI-N8N est prête. Vous allez être redirigé vers votre dashboard...
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-bg-dark text-white flex items-center justify-center p-8">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  const instanceUrl = instance.url || `http://localhost:${instance.port}`;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg-dark text-white flex items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full"
      >
        <div className="bg-bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Icon */}
          <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-orange-500" />
          </div>

          <h2 className="text-2xl font-bold text-center mb-2">Configurez votre instance LogicAI-N8N</h2>
          <p className="text-gray-400 text-center mb-8">
            Suivez les étapes ci-dessous pour finaliser la configuration de votre instance LogicAI-N8N
          </p>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Steps */}
          <div className="space-y-6 mb-8">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-1">Ouvrez votre instance LogicAI-N8N</h3>
                <p className="text-gray-400 text-sm mb-3">
                  Cliquez sur le bouton ci-dessous pour ouvrir votre instance LogicAI-N8N dans un nouvel onglet
                </p>
                <a
                  href={instanceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all text-sm"
                >
                  Ouvrir LogicAI-N8N
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-1">Créez votre compte administrateur</h3>
                <p className="text-gray-400 text-sm">
                  Lors de votre première connexion, vous devrez créer votre compte administrateur.
                  Utilisez votre adresse email et choisissez un mot de passe sécurisé.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-1">Confirmez la configuration</h3>
                <p className="text-gray-400 text-sm">
                  Une fois votre compte créé, revenez ici et cliquez sur le bouton ci-dessous pour confirmer.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleConfirmSetup}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Confirmation en cours...
              </>
            ) : (
              <>
                J'ai créé mon compte
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
            <p className="text-sm text-blue-300">
              <strong>💡 Conseil :</strong> Conservez vos identifiants en lieu sûr. Vous pourrez les modifier
              directement depuis l'interface LogicAI-N8N si nécessaire.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
