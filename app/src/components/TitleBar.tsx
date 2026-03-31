import { useState } from 'react';
import { X, Minus, Square, Plus, GripVertical, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useTabs } from '../contexts/TabsContext';
import { useUnifiedInstances } from '../contexts/UnifiedInstancesContext';
import { api } from '../services/api';
import CreateInstanceModal from './CreateInstanceModal';

export default function TitleBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tabs, activeTab, closeTab, setActiveTab: selectTab, openTab } = useTabs();
  const { refreshInstances } = useUnifiedInstances();
  const [draggingTab, setDraggingTab] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleMinimize = async () => {
    const window = getCurrentWindow();
    await window.minimize();
  };

  const handleMaximize = async () => {
    const window = getCurrentWindow();
    await window.toggleMaximize();
  };

  const handleClose = async () => {
    const window = getCurrentWindow();
    await window.close();
  };

  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    if (tabId === 'dashboard') return; // Ne pas fermer l'onglet tableau de bord
    const nextTab = closeTab(tabId);
    if (nextTab) {
      navigate(`/dashboard/instances/${nextTab.uuid}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleAddTab = () => {
    setShowCreateModal(true);
  };

  const handleSelectType = async (type: 'local' | 'cloud') => {
    const token = localStorage.getItem('token');
    if (!token || creating) return;

    setCreating(true);
    setShowCreateModal(false);
    try {
      const result = await api.createInstance(token, type);

      if (result.success) {
        setTimeout(() => refreshInstances(), 2000);
      }
    } catch (error: any) {
      console.error('Error creating instance:', error);
      alert(error.message || 'Erreur lors de la création de l\'instance');
    } finally {
      setCreating(false);
    }
  };

  const handleTabClick = (tabId: string, tabUuid?: string, tabType?: string) => {
    // Mettre à jour l'onglet actif avant de naviguer
    selectTab(tabId);

    if (tabId === 'dashboard') {
      navigate('/dashboard');
    } else if (tabType === 'instance-dashboard' && tabUuid) {
      navigate(`/dashboard/instance/${tabUuid}`);
    } else if (tabUuid) {
      navigate(`/dashboard/instances/${tabUuid}`);
    }
  };

  const handleTabDragStart = (e: React.DragEvent, tabId: string) => {
    if (tabId === 'dashboard') {
      e.preventDefault();
      return;
    }
    setDraggingTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTabDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleTabDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    if (targetTabId === 'dashboard') return;
    setDraggingTab(null);
  };

  const isDashboardActive = location.pathname === '/dashboard';
  const currentInstanceUuid = location.pathname.match(/\/dashboard\/instances\/([^\/]+)/)?.[1];
  const currentInstanceDashboardUuid = location.pathname.match(/\/dashboard\/instance\/([^\/]+)/)?.[1];

  return (
    <>
      <div className="h-8 bg-[#1a1a1a] border-b border-white/10 flex items-center select-none" data-tauri-drag-region>
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mr-2">
          <img src="/LogicAI.ico" alt="LogicAI" className="w-4 h-4" />
        </div>

        {/* Tabs */}
        <div className="flex-1 flex items-center gap-1">
          {/* Dashboard Tab - Always visible */}
          <div
            onClick={() => handleTabClick('dashboard')}
            data-tauri-drag-region
            className={`
              group relative flex items-center gap-2 px-3 py-1 rounded-t text-xs cursor-pointer
              transition-all min-w-[100px] max-w-[150px]
              ${isDashboardActive && !currentInstanceUuid && !currentInstanceDashboardUuid
                ? 'bg-white/5 text-white border-t-2 border-orange-500'
                : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
              }
            `}
          >
            <LayoutDashboard className="w-3 h-3" />
            <span className="flex-1 truncate">Tableau de bord</span>
          </div>

          {/* Instance Tabs */}
          {tabs.map((tab) => {
            // Déterminer si cet onglet est actif en fonction du type et de l'UUID courant
            let isActive = false;
            if (tab.type === 'instance-dashboard') {
              isActive = currentInstanceDashboardUuid === tab.uuid;
            } else {
              isActive = (activeTab === tab.id) || (currentInstanceUuid === tab.uuid && !currentInstanceDashboardUuid);
            }
            const isInstanceDashboard = tab.type === 'instance-dashboard';
            return (
              <div
                key={tab.id}
                draggable={!isInstanceDashboard}
                onDragStart={(e) => handleTabDragStart(e, tab.id)}
                onDragOver={handleTabDragOver}
                onDrop={(e) => handleTabDrop(e, tab.id)}
                onClick={() => handleTabClick(tab.id, tab.uuid, tab.type)}
                data-tauri-drag-region
                className={`
                  group relative flex items-center gap-2 px-3 py-1 rounded-t text-xs cursor-pointer
                  transition-all min-w-[120px] max-w-[200px]
                  ${isActive
                    ? 'bg-white/5 text-white border-t-2 border-orange-500'
                    : 'bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }
                `}
              >
                {!isInstanceDashboard && <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
                <span className="flex-1 truncate">{tab.name}</span>
                <button
                  onClick={(e) => handleCloseTab(e, tab.id)}
                  className="opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded p-0.5 transition-all"
                  data-tauri-drag-region="false"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Add Tab Button */}
          <button
            onClick={handleAddTab}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            data-tauri-drag-region="false"
          >
            <Plus className="w-3 h-3" />
          </button>
        </div>

        {/* Window Controls - Right */}
        <div className="flex items-center">
          <button
            onClick={handleMinimize}
            className="px-3 py-1 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            data-tauri-drag-region="false"
          >
            <Minus className="w-3 h-3" />
          </button>
          <button
            onClick={handleMaximize}
            className="px-3 py-1 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            data-tauri-drag-region="false"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={handleClose}
            className="px-3 py-1 hover:bg-red-600 text-gray-400 hover:text-white transition-colors"
            data-tauri-drag-region="false"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Create Instance Modal */}
      <CreateInstanceModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSelect={handleSelectType}
        creating={creating}
      />
    </>
  );
}
