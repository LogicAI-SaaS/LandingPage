import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface InstanceTab {
  id: string;
  name: string;
  uuid: string;
  port: number;
  type?: 'instance' | 'instance-dashboard';
  instanceUrl?: string;
  currentUrl?: string; // URL actuelle de navigation dans l'instance
}

interface TabsContextType {
  tabs: InstanceTab[];
  activeTab: string | null;
  openTab: (instance: InstanceTab) => InstanceTab | null;
  closeTab: (tabId: string) => InstanceTab | null;
  setActiveTab: (tabId: string) => InstanceTab | null;
  getActiveTab: () => InstanceTab | null;
  updateTab: (tabId: string, updates: Partial<InstanceTab>) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<InstanceTab[]>([]);
  const [activeTab, setActiveTabState] = useState<string | null>(null);

  const openTab = useCallback((instance: InstanceTab) => {
    let openedTab: InstanceTab | null = null;
    setTabs(prev => {
      const existing = prev.find(t => t.uuid === instance.uuid);
      if (existing) {
        setActiveTabState(existing.id);
        openedTab = existing;
        return prev;
      }

      const newTab = { ...instance, id: `tab-${Date.now()}` };
      setActiveTabState(newTab.id);
      openedTab = newTab;
      return [...prev, newTab];
    });
    return openedTab;
  }, []);

  const closeTab = useCallback((tabId: string) => {
    let nextTab: InstanceTab | null = null;
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTab === tabId) {
        if (newTabs.length > 0) {
          nextTab = newTabs[0];
          setActiveTabState(nextTab.id);
        } else {
          setActiveTabState(null);
        }
      }
      return newTabs;
    });
    return nextTab;
  }, [activeTab]);

  const setActiveTab = useCallback((tabId: string) => {
    let selectedTab: InstanceTab | null = null;
    setActiveTabState(tabId);
    setTabs(prev => {
      const tab = prev.find(t => t.id === tabId);
      selectedTab = tab || null;
      return prev;
    });
    return selectedTab;
  }, []);

  const getActiveTab = useCallback(() => {
    return tabs.find(t => t.id === activeTab) || null;
  }, [tabs, activeTab]);

  const updateTab = useCallback((tabId: string, updates: Partial<InstanceTab>) => {
    setTabs(prev => prev.map(t => t.id === tabId ? { ...t, ...updates } : t));
  }, []);

  return (
    <TabsContext.Provider value={{ tabs, activeTab, openTab, closeTab, setActiveTab, getActiveTab, updateTab }}>
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within TabsProvider');
  }
  return context;
}
