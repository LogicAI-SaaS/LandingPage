import { useState, useEffect } from 'react';
import { Key, Plus, Copy, Check, Loader2, Users, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface BetaKey {
  id: number;
  key_code: string;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
  created_by_email: string;
}

interface BetaSignup {
  id: number;
  email: string;
  status: string;
  created_at: string;
}

export default function AdminBeta() {
  const { token } = useAuth();
  const [keys, setKeys] = useState<BetaKey[]>([]);
  const [signups, setSignups] = useState<BetaSignup[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [newKeyUses, setNewKeyUses] = useState(1);
  const [newKeyExpires, setNewKeyExpires] = useState('');

  const fetchKeys = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/beta/admin/keys`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setKeys(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
    }
  };

  const fetchSignups = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/beta/admin/signups`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSignups(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching signups:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchKeys(), fetchSignups()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/beta/admin/generate-key`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          maxUses: newKeyUses,
          expiresAt: newKeyExpires || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchKeys();
        await fetchSignups();
        setNewKeyUses(1);
        setNewKeyExpires('');
      }
    } catch (error) {
      console.error('Error generating key:', error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="size-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="">
      <div className="max-w-8xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestion Bêta</h1>
            <p className="text-gray-400">Gérez les clés d'accès bêta et les inscriptions</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Key className="size-5 text-orange-500" />
              <span className="text-sm text-gray-400">Clés actives</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {keys.filter(k => k.is_active).length}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="size-5 text-blue-500" />
              <span className="text-sm text-gray-400">Inscriptions en attente</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {signups.filter(s => s.status === 'pending').length}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <Check className="size-5 text-green-500" />
              <span className="text-sm text-gray-400">Utilisateurs approuvés</span>
            </div>
            <p className="text-3xl font-bold text-white">
              {signups.filter(s => s.status === 'approved').length}
            </p>
          </div>
        </div>

        {/* Générer une nouvelle clé */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Plus className="size-5" />
            Générer une nouvelle clé
          </h2>
          <form onSubmit={handleGenerateKey} className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">
                Nombre d'utilisations
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={newKeyUses}
                onChange={(e) => setNewKeyUses(parseInt(e.target.value))}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-gray-400 mb-2">
                Date d'expiration (optionnel)
              </label>
              <input
                type="datetime-local"
                value={newKeyExpires}
                onChange={(e) => setNewKeyExpires(e.target.value)}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-orange-500 focus:outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={generating}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Génération...</span>
                  </>
                ) : (
                  'Générer'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Liste des clés */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Clés générées</h2>
          {keys.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune clé générée</p>
          ) : (
            <div className="space-y-3">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-orange-500 font-mono">{key.key_code}</code>
                      <button
                        onClick={() => copyToClipboard(key.key_code)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                      >
                        {copiedKey === key.key_code ? (
                          <Check className="size-4 text-green-500" />
                        ) : (
                          <Copy className="size-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>{key.used_count}/{key.max_uses} utilisations</span>
                      <span>•</span>
                      <span>Par {key.created_by_email}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(key.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        key.is_active
                          ? 'bg-green-500/20 text-green-500'
                          : 'bg-gray-500/20 text-gray-500'
                      }`}
                    >
                      {key.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Liste des inscriptions */}
        <div className="bg-white/5 border border-white/10 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Inscriptions</h2>
          {signups.length === 0 ? (
            <p className="text-gray-400 text-center py-8">Aucune inscription</p>
          ) : (
            <div className="space-y-3">
              {signups.map((signup) => (
                <div
                  key={signup.id}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{signup.email}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      <Clock className="size-3" />
                      {new Date(signup.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      signup.status === 'approved'
                        ? 'bg-green-500/20 text-green-500'
                        : signup.status === 'rejected'
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}
                  >
                    {signup.status === 'approved'
                      ? 'Approuvé'
                      : signup.status === 'rejected'
                      ? 'Rejeté'
                      : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
