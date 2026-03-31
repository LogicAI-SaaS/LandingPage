import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import {
  ArrowLeft,
  Mail,
  Calendar,
  Shield,
  User,
  Server,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Eye,
  Workflow,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  plan: string;
  role: string;
  has_beta_access: boolean;
  created_at: string;
}

interface Instance {
  id: number;
  uuid: string;
  name: string;
  subdomain: string;
  port: number;
  status: string;
  created_at: string;
  userId?: number;
}

interface UserStats {
  totalInstances: number;
  activeInstances: number;
  stoppedInstances: number;
}

export default function AdminUserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { token, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [accessibleInstances, setAccessibleInstances] = useState<number[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalInstances: 0,
    activeInstances: 0,
    stoppedInstances: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.data.user);
          setInstances(data.data.instances);
          setStats(data.data.stats);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, token]);

  const handleDeleteInstance = async (instanceId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette instance ?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/instances/${instanceId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setInstances(instances.filter(i => i.id !== instanceId));
        setStats({
          ...stats,
          totalInstances: stats.totalInstances - 1,
          activeInstances: instances.find(i => i.id === instanceId)?.status === 'running'
            ? stats.activeInstances - 1
            : stats.activeInstances,
          stoppedInstances: instances.find(i => i.id === instanceId)?.status === 'stopped'
            ? stats.stoppedInstances - 1
            : stats.stoppedInstances
        });
      }
    } catch (error) {
      console.error('Error deleting instance:', error);
    }
  };

  const handleGrantAccess = async (instanceId: number) => {
    if (!currentUser || !['admin', 'mod'].includes(currentUser.role)) {
      alert('Vous n\'avez pas les droits pour effectuer cette action');
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/instances/${instanceId}/grant-access`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: currentUser.id,
          role: 'admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        setAccessibleInstances([...accessibleInstances, instanceId]);
        alert('Accès accordé avec succès !');
      } else {
        alert(data.message || 'Erreur lors de l\'accord d\'accès');
      }
    } catch (error) {
      console.error('Error granting access:', error);
      alert('Erreur lors de l\'accord d\'accès');
    }
  };

  const canAccessInstance = (instance: Instance) => {
    // L'utilisateur est le propriétaire de l'instance
    if (instance.userId === parseInt(userId!)) return true;
    // L'utilisateur a déjà accès
    if (accessibleInstances.includes(instance.id)) return true;
    return false;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <User className="size-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">Utilisateur non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin"
          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Profil Utilisateur</h1>
      </div>

      {/* User Info Card */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-start gap-6">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 h-20 w-20 rounded-full flex items-center justify-center text-2xl font-bold text-white">
            {user.firstName[0]}{user.lastName[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-2">
              {user.firstName} {user.lastName}
            </h2>
            <div className="flex items-center gap-2 text-gray-400 mb-4">
              <Mail className="size-4" />
              <span>{user.email}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user.role === 'admin'
                  ? 'bg-red-500/20 text-red-500'
                  : user.role === 'mod'
                  ? 'bg-purple-500/20 text-purple-500'
                  : 'bg-gray-500/20 text-gray-500'
              }`}>
                {user.role.toUpperCase()}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                user.plan === 'business'
                  ? 'bg-purple-500/20 text-purple-500'
                  : user.plan === 'pro'
                  ? 'bg-blue-500/20 text-blue-500'
                  : 'bg-gray-500/20 text-gray-500'
              }`}>
                {user.plan.toUpperCase()}
              </span>
              {user.has_beta_access && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500">
                  BÊTA
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <Calendar className="size-4" />
              <span>Inscrit le</span>
            </div>
            <p className="text-white">{new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Server className="size-8 text-purple-500" />
            <span className="text-sm text-purple-400 font-medium">Total</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.totalInstances}</p>
          <p className="text-sm text-gray-400 mt-2">Instances</p>
        </div>

        <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <Activity className="size-8 text-green-500" />
            <span className="text-sm text-green-400 font-medium">Actives</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.activeInstances}</p>
          <p className="text-sm text-gray-400 mt-2">En ligne</p>
        </div>

        <div className="bg-gradient-to-br from-gray-500/10 to-gray-600/10 border border-gray-500/20 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <XCircle className="size-8 text-gray-500" />
            <span className="text-sm text-gray-400 font-medium">Arrêtées</span>
          </div>
          <p className="text-3xl font-bold text-white">{stats.stoppedInstances}</p>
          <p className="text-sm text-gray-400 mt-2">Offline</p>
        </div>
      </div>

      {/* Instances Section */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Server className="size-5" />
            Instances N8N
          </h3>
          <span className="text-gray-400">{instances.length} instance(s)</span>
        </div>

        {instances.length === 0 ? (
          <div className="text-center py-12">
            <Server className="size-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Aucune instance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {instances.map((instance) => (
              <div
                key={instance.id}
                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-3 rounded-lg">
                      <Server className="size-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {instance.name || `Instance ${instance.uuid.substring(0, 8)}`}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                        <span className="font-mono">{instance.uuid}</span>
                        {instance.subdomain && (
                          <>
                            <span>•</span>
                            <span className="text-orange-500 font-mono">{instance.subdomain}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Port {instance.port}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                      instance.status === 'running'
                        ? 'bg-green-500/20 text-green-500'
                        : instance.status === 'stopped'
                        ? 'bg-gray-500/20 text-gray-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      <span className={`size-2 rounded-full ${instance.status === 'running' ? 'bg-green-500 animate-pulse' : ''}`} />
                      {instance.status === 'running' ? 'En ligne' : instance.status === 'stopped' ? 'Arrêté' : instance.status}
                    </span>
                    <div className="flex items-center gap-2">
                      {/* Bouton Accéder pour les admins/mods si ce n'est pas leur instance */}
                      {currentUser && ['admin', 'mod'].includes(currentUser.role) && instance.user_id !== currentUser.id && !accessibleInstances.includes(instance.id) && (
                        <button
                          onClick={() => handleGrantAccess(instance.id)}
                          className="p-2 hover:bg-orange-500/10 rounded-lg transition-colors text-orange-500 hover:text-orange-400 flex items-center gap-1"
                          title="S'accorder l'accès"
                        >
                          <Plus className="size-4" />
                          Accéder
                        </button>
                      )}
                      <button
                        onClick={() => window.open(`http://localhost:${instance.port}`, '_blank')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-blue-500 hover:text-blue-400"
                        title="Voir l'instance"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteInstance(instance.id)}
                        className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Créée le {new Date(instance.created_at).toLocaleDateString('fr-FR')}</span>
                    <Link
                      to={`/dashboard/instances/${instance.uuid}`}
                      className="flex items-center gap-1 text-orange-500 hover:text-orange-400 transition-colors"
                    >
                      <Workflow className="size-3" />
                      Voir les workflows
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Clock className="size-5" />
          Activité Récente
        </h3>
        <div className="space-y-4">
          {instances.slice(0, 5).map((instance) => (
            <div key={instance.id} className="flex items-center gap-4">
              <div className="bg-orange-500/20 p-2 rounded-lg">
                <Server className="size-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm">
                  Instance <span className="font-mono text-orange-500">{instance.uuid}</span> {instance.status === 'running' ? 'démarrée' : 'créée'}
                </p>
                <p className="text-xs text-gray-500">{new Date(instance.created_at).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          ))}
          {instances.length === 0 && (
            <p className="text-gray-400 text-center py-8">Aucune activité récente</p>
          )}
        </div>
      </div>
    </div>
  );
}
