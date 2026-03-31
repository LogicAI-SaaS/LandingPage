import { useState, useEffect } from 'react';
import { Users, Server, Activity, TrendingUp, CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Shield, Mail, LayoutDashboard } from 'lucide-react';
import { Link as RouterLink } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { SEO } from '@/components/SEO';

interface User {
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
}

interface Stats {
  totalUsers: number;
  totalInstances: number;
  activeInstances: number;
  pendingBeta: number;
}

type TabType = 'overview' | 'users' | 'instances';

export default function AdminOverview() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalInstances: 0,
    activeInstances: 0,
    pendingBeta: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch instances
  const fetchInstances = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/instances`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setInstances(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchUsers(), fetchInstances()]);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        await fetchUsers();
        await fetchStats();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleRole = async (userId: number, newRole: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Error toggling role:', error);
    }
  };

  const handleDeleteInstance = async (instanceId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette instance ?')) return;

    try {
      await api.deleteInstance(token!, instanceId.toString());
      await fetchInstances();
      await fetchStats();
    } catch (error: any) {
      console.error('Error deleting instance:', error);
      alert(error.message || 'Erreur lors de la suppression');
    }
  };

  const tabs = [
    { id: 'overview' as TabType, label: 'Général', icon: LayoutDashboard },
    { id: 'users' as TabType, label: 'Utilisateurs', icon: Users },
    { id: 'instances' as TabType, label: 'Instances', icon: Server },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title="Administration"
        description="Panneau d'administration LogicAI - Gestion des utilisateurs, instances et statistiques."
        noIndex={true}
      />
      <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 transition-all font-medium ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <tab.icon className="size-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Users className="size-8 text-blue-500" />
                <span className="text-sm text-blue-400 font-medium">Total</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              <p className="text-sm text-gray-400 mt-2">Utilisateurs</p>
            </div>

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
                <CheckCircle className="size-8 text-green-500" />
                <span className="text-sm text-green-400 font-medium">Actives</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.activeInstances}</p>
              <p className="text-sm text-gray-400 mt-2">Instances en ligne</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <Clock className="size-8 text-orange-500" />
                <span className="text-sm text-orange-400 font-medium">En attente</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.pendingBeta}</p>
              <p className="text-sm text-gray-400 mt-2">Inscriptions bêta</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white/5 border border-white/10 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Activité Récente</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Users className="size-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Nouveaux utilisateurs</p>
                  <p className="text-sm text-gray-400">{users.slice(0, 3).map(u => u.email).join(', ')}</p>
                </div>
                <span className="text-sm text-gray-500">Aujourd'hui</span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <Server className="size-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">Instances actives</p>
                  <p className="text-sm text-gray-400">{stats.activeInstances} instances en cours d'exécution</p>
                </div>
                <span className="text-sm text-green-500">En ligne</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Utilisateurs ({users.length})
            </h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Accès Bêta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Inscrit le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <RouterLink
                        to={`/admin/users/${user.id}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      >
                        <div className="bg-gradient-to-br from-orange-500 to-amber-500 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white">
                          {user.firstName[0]}{user.lastName[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </RouterLink>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role}
                        onChange={(e) => handleToggleRole(user.id, e.target.value)}
                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-orange-500 focus:outline-none"
                      >
                        <option value="user">User</option>
                        <option value="mod">Mod</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.plan === 'business'
                          ? 'bg-purple-500/20 text-purple-500'
                          : user.plan === 'pro'
                          ? 'bg-blue-500/20 text-blue-500'
                          : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.has_beta_access ? (
                        <span className="flex items-center gap-1 text-green-500 text-sm">
                          <CheckCircle className="size-4" />
                          Oui
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-500 text-sm">
                          <XCircle className="size-4" />
                          Non
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => window.location.href = `mailto:${user.email}`}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Envoyer un email"
                        >
                          <Mail className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500 hover:text-red-400"
                          title="Supprimer"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Instances Tab */}
      {activeTab === 'instances' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              Instances ({instances.length})
            </h2>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Instance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">UUID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Sous-domaine</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Port</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Créée le</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {instances.map((instance) => (
                  <tr key={instance.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 p-2 rounded-lg">
                          <Server className="size-5 text-orange-500" />
                        </div>
                        <span className="text-white font-medium">{instance.name || `Instance ${instance.uuid.substring(0, 8)}`}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-gray-400 font-mono">{instance.uuid}</code>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-orange-500 font-mono">{instance.subdomain || '-'}</code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{instance.port}</td>
                    <td className="px-6 py-4">
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
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(instance.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {instances.length === 0 && (
            <div className="text-center py-12">
              <Server className="size-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400">Aucune instance pour le moment</p>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
