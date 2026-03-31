import { Outlet, Link } from 'react-router';
import {
  LayoutDashboard,
  Plus,
  LogOut,
  User,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  type: 'dashboard' | 'instance';
  label: string;
  instanceId?: string;
  closable: boolean;
}

export default function DashboardLayout() {
  const { user, logout, token } = useAuth();
  const { instances } = useWebSocket();
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'dashboard', type: 'dashboard', label: 'Dashboard', closable: false },
  ]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateInstance = async (type: 'local' | 'cloud') => {
    if (creating || !token) return;

    setCreating(true);
    try {
      const response = await fetch('http://localhost:3000/api/instances/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          const newInstance = result.data.instance;

          // Créer nouvel onglet
          const newTab: Tab = {
            id: `instance-${newInstance.uuid}`,
            type: 'instance',
            label: newInstance.name,
            instanceId: newInstance.uuid,
            closable: true,
          };

          setTabs((prev) => [...prev, newTab]);
          setActiveTab(newTab.id);
        }
      }
    } catch (error: any) {
      console.error('Error creating instance:', error);
      alert(error.message || 'Erreur lors de la création de l\'instance');
    } finally {
      setCreating(false);
      setShowCreateModal(false);
    }
  };

  const closeTab = (tabId: string) => {
    setTabs((prev) => prev.filter((tab) => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab('dashboard');
    }
  };

  const openInstance = (instanceId: string) => {
    const existingTab = tabs.find((t) => t.instanceId === instanceId);
    if (existingTab) {
      setActiveTab(existingTab.id);
    } else {
      const instance = instances.find((i: any) => i.uuid === instanceId);
      if (instance) {
        const newTab: Tab = {
          id: `instance-${instanceId}`,
          type: 'instance',
          label: instance.name,
          instanceId,
          closable: true,
        };
        setTabs((prev) => [...prev, newTab]);
        setActiveTab(newTab.id);
      }
    }
  };

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-800">
          <Link to="/" className="flex items-center gap-3">
            <img src="/LogicAI.ico" alt="LogicAI" className="h-8 w-8" />
            <span className="text-xl font-bold text-white">LogicAI</span>
          </Link>
        </div>

        {/* New Instance Button */}
        <div className="p-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Instance
          </button>
        </div>

        {/* Tabs List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <AnimatePresence>
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-orange-500/20 text-orange-400'
                    : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.type === 'dashboard' ? (
                    <LayoutDashboard className="w-4 h-4" />
                  ) : (
                    <div className="w-4 h-4">
                      <div className={`w-2 h-2 rounded-full ${
                        instances.find((i: any) => i.uuid === tab.instanceId)?.status === 'running'
                          ? 'bg-green-500'
                          : instances.find((i: any) => i.uuid === tab.instanceId)?.status === 'stopped'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`} />
                    </div>
                  )}
                  <span className="text-sm font-medium truncate">{tab.label}</span>
                </div>
                {tab.closable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      closeTab(tab.id);
                    }}
                    className="p-1 hover:bg-gray-600 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
              {user?.firstName?.[0] || user?.email?.[0] || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName && user?.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user?.email}
              </p>
              <p className="text-xs text-gray-400 capitalize">{user?.plan}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {activeTab === 'dashboard' ? (
          <Outlet />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-400 mb-4">Instance View</p>
              <p className="text-gray-500">Instance interface will be implemented in Phase 4</p>
            </div>
          </div>
        )}

        {/* Create Instance Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-2xl w-full mx-4 border border-gray-800"
            >
              <h2 className="text-2xl font-bold mb-6 text-white">Choisir le type d'instance</h2>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <button
                  onClick={() => handleCreateInstance('local')}
                  disabled={creating}
                  className="p-6 border-2 border-orange-500 rounded-xl hover:bg-orange-500/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-3.31 0-6-2.69-6-6 0-1.23.39-2.37 1.06-3.22 3.81l-1.46-1.46C5.2 15.77 8.33 18.78 12 20.73v-5.11c0-.66-.28-1.28-.77-1.79-.5-.5-.52-1.19-.52-1.95v-5.11c0-3.86-3.14-7-7-7s-7 3.14-7 7c0 .76.02 1.45.52 1.95.51 1.06 3.81 2.48 3.81 1.79 5.19 1.79zm-3.5 6.95L12 19.5l3.5-3.5 3.5 3.5-3.5-3.5-3.5 3.5z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">Instance Locale</h3>
                      <p className="text-sm text-gray-400">Exécution locale avec Docker</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Requiert Docker Desktop installé
                  </p>
                </button>

                <button
                  onClick={() => handleCreateInstance('cloud')}
                  disabled={creating}
                  className="p-6 border-2 border-purple-500 rounded-xl hover:bg-purple-500/10 transition-colors text-left"
                >
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.27 4 6.4 6.59 5.65 10.04c.59 1.69 1.63 3.56 2.3 5.36l2.86-8.47c.5-1.48.6-1.25 1.34-2.96.43-2.2-1.29-.13-2.7.43-2.96l-2.2 6.5c-.51 1.52-1.27 2.3-2.48 2.37-.52.02-1.26-.15-2.7-.43-2.96l-2.2 6.5c-.51 1.52-1.27 2.3-2.48 2.37zM8.38 12.95l-.67 2.03c-.19.56-.4 1.17-.17 1.83l2.2 6.5c.23.69.6 1.17.17 1.83-.17l2.03-.66c.56-.19 1.17-.4 1.83.17l-6.5 2.2c-.69.23-1.17.6-1.83.17l-.66-2.03z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-white">Instance Cloud</h3>
                      <p className="text-sm text-gray-400">Hébergement LogicAI</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Géré par les serveurs LogicAI
                  </p>
                </button>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-full px-4 py-2 border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors text-gray-300"
              >
                Annuler
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
