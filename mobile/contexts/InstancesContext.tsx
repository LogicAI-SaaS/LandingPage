import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';
import { useAuth } from './AuthContext';

interface Instance {
  id: number;
  uuid: string;
  name: string;
  status: 'running' | 'stopped' | 'creating' | 'error';
  port?: number;
  subdomain?: string;
  deployment_type: 'local' | 'cloud';
  created_at: string;
}

interface InstancesContextType {
  instances: Instance[];
  cloudInstances: Instance[];
  loading: boolean;
  refreshing: boolean;
  fetchInstances: () => Promise<void>;
  refreshInstances: () => Promise<void>;
  createInstance: (type: 'cloud') => Promise<void>;
  startInstance: (uuid: string) => Promise<void>;
  stopInstance: (uuid: string) => Promise<void>;
  deleteInstance: (uuid: string) => Promise<void>;
  getInstanceByUrl: (uuid: string) => Instance | undefined;
}

const InstancesContext = createContext<InstancesContextType | undefined>(undefined);

export const InstancesProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInstances = useCallback(async () => {
    if (!token) return;

    setLoading(true);
    try {
      const response = await api.getInstances(token);
      if (response.success && response.data) {
        setInstances(response.data.instances || []);
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const refreshInstances = useCallback(async () => {
    if (!token) return;

    setRefreshing(true);
    try {
      const response = await api.getInstances(token);
      if (response.success && response.data) {
        setInstances(response.data.instances || []);
      }
    } catch (error) {
      console.error('Error refreshing instances:', error);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  const createInstance = useCallback(async (type: 'cloud') => {
    if (!token) throw new Error('Non authentifié');

    // Sur mobile, on force le type 'cloud'
    const response = await api.createInstance(token, 'cloud');
    if (response.success) {
      await fetchInstances();
    } else {
      throw new Error(response.message || 'Erreur lors de la création');
    }
  }, [token, fetchInstances]);

  const startInstance = useCallback(async (uuid: string) => {
    if (!token) throw new Error('Non authentifié');

    const response = await api.startInstance(token, uuid);
    if (response.success) {
      await fetchInstances();
    } else {
      throw new Error(response.message || 'Erreur lors du démarrage');
    }
  }, [token, fetchInstances]);

  const stopInstance = useCallback(async (uuid: string) => {
    if (!token) throw new Error('Non authentifié');

    const response = await api.stopInstance(token, uuid);
    if (response.success) {
      await fetchInstances();
    } else {
      throw new Error(response.message || 'Erreur lors de l\'arrêt');
    }
  }, [token, fetchInstances]);

  const deleteInstance = useCallback(async (uuid: string) => {
    if (!token) throw new Error('Non authentifié');

    const response = await api.deleteInstance(token, uuid);
    if (response.success) {
      await fetchInstances();
    } else {
      throw new Error(response.message || 'Erreur lors de la suppression');
    }
  }, [token, fetchInstances]);

  const getInstanceByUrl = useCallback((uuid: string) => {
    return instances.find(i => i.uuid === uuid);
  }, [instances]);

  // Sur mobile, on filtre automatiquement pour ne garder que les instances cloud
  const cloudInstances = instances.filter(i => i.deployment_type === 'cloud');

  return (
    <InstancesContext.Provider
      value={{
        instances,
        cloudInstances,
        loading,
        refreshing,
        fetchInstances,
        refreshInstances,
        createInstance,
        startInstance,
        stopInstance,
        deleteInstance,
        getInstanceByUrl,
      }}
    >
      {children}
    </InstancesContext.Provider>
  );
};

export const useInstances = () => {
  const context = useContext(InstancesContext);
  if (!context) {
    throw new Error('useInstances must be used within an InstancesProvider');
  }
  return context;
};
