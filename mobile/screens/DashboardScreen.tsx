import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '@/services/api';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

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

export default function DashboardScreen() {
  const { user, token } = useAuth();
  const [filteredInstances, setFilteredInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    cloud: 0,
  });

  const fetchInstances = async () => {
    if (!token) return;

    try {
      const response = await api.getInstances(token);
      if (response.success && response.data) {
        const allInstances = response.data.instances || [];

        // Sur mobile, on filtre uniquement les instances cloud
        const cloudInstances = allInstances.filter(
          (instance: Instance) => instance.deployment_type === 'cloud'
        );

        setFilteredInstances(cloudInstances);

        // Calculer les stats
        setStats({
          total: cloudInstances.length,
          running: cloudInstances.filter((i: Instance) => i.status === 'running').length,
          cloud: cloudInstances.length,
        });
      }
    } catch (error) {
      console.error('Error fetching instances:', error);
      Alert.alert('Erreur', 'Impossible de charger les instances');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchInstances();
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchInstances();
    }, [])
  );

  const handleStartInstance = async (uuid: string) => {
    try {
      await api.startInstance(token!, uuid);
      await fetchInstances();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de démarrer l\'instance');
    }
  };

  const handleStopInstance = async (uuid: string) => {
    try {
      await api.stopInstance(token!, uuid);
      await fetchInstances();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'arrêter l\'instance');
    }
  };

  const handleDeleteInstance = async (uuid: string, name: string) => {
    Alert.alert(
      'Supprimer l\'instance',
      `Êtes-vous sûr de vouloir supprimer l'instance "${name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteInstance(token!, uuid);
              await fetchInstances();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer l\'instance');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return Colors.dark.success;
      case 'stopped':
        return Colors.dark.warning;
      case 'creating':
        return Colors.dark.brandBlue;
      case 'error':
        return Colors.dark.danger;
      default:
        return Colors.dark.gray500;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'running':
        return 'En cours';
      case 'stopped':
        return 'Arrêté';
      case 'creating':
        return 'Création';
      case 'error':
        return 'Erreur';
      default:
        return status;
    }
  };

  const getInstanceUrl = (instance: Instance) => {
    // Pour les instances cloud, on utilise le subdomain
    if (instance.subdomain) {
      return `https://${instance.subdomain}`;
    }
    return null;
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background }}>
        <ActivityIndicator size="large" color={Colors.dark.brandBlue} />
        <Text style={{ marginTop: 16, color: Colors.dark.gray500 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      {/* Header */}
      <View style={{ padding: 20, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: Colors.dark.text }}>
              Tableau de bord
            </Text>
            <Text style={{ fontSize: 14, color: Colors.dark.gray500, marginTop: 4 }}>
              Bienvenue, {user?.firstName || user?.email} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/modal')}
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.dark.bgCard, justifyContent: 'center', alignItems: 'center' }}
          >
            <Ionicons name="add-outline" size={24} color={Colors.dark.brandBlue} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, backgroundColor: Colors.dark.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.gray950 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.brandBlue, marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: Colors.dark.gray500 }}>Total</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.dark.text }}>{stats.total}</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: Colors.dark.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.gray950 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.success, marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: Colors.dark.gray500 }}>En cours</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.dark.text }}>{stats.running}</Text>
          </View>

          <View style={{ flex: 1, backgroundColor: Colors.dark.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: Colors.dark.gray950 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.dark.accentOrange, marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: Colors.dark.gray500 }}>Cloud</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.dark.text }}>{stats.cloud}</Text>
          </View>
        </View>
      </View>

      {/* Instances List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingTop: 0 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.dark.brandBlue}
          />
        }
      >
        {filteredInstances.length === 0 ? (
          <View style={{ alignItems: 'center', paddingVertical: 60 }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.dark.bgCard, justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
              <Ionicons name="cloud-outline" size={40} color={Colors.dark.gray500} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '600', color: Colors.dark.text, marginBottom: 8 }}>
              Aucune instance cloud
            </Text>
            <Text style={{ fontSize: 14, color: Colors.dark.gray500, textAlign: 'center', marginBottom: 24, paddingHorizontal: 40 }}>
              Les instances locales ne sont pas disponibles sur mobile. Créez une instance cloud pour commencer.
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/modal')}
              style={{
                backgroundColor: Colors.dark.brandBlue,
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Ionicons name="add-outline" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                Créer une instance
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredInstances.map((instance) => (
            <View
              key={instance.uuid}
              style={{
                backgroundColor: Colors.dark.bgCard,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: Colors.dark.gray950,
              }}
            >
              {/* Header */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: getStatusColor(instance.status),
                      marginRight: 12,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.dark.text }} numberOfLines={1}>
                      {instance.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                      <Ionicons name="cloud-outline" size={14} color={Colors.dark.accentOrange} />
                      <Text style={{ fontSize: 12, color: Colors.dark.gray500, marginLeft: 4 }}>
                        {getStatusLabel(instance.status)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                {instance.status === 'running' ? (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        const url = getInstanceUrl(instance);
                        if (url) {
                          // Ouvrir dans un modal pour le moment
                          Alert.alert('Instance', `URL: ${url}`);
                        }
                      }}
                      style={{
                        flex: 1,
                        backgroundColor: Colors.dark.brandBlue,
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      <Ionicons name="open-outline" size={18} color="#fff" />
                      <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Ouvrir</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleStopInstance(instance.uuid)}
                      style={{
                        flex: 1,
                        backgroundColor: Colors.dark.bgModal,
                        paddingVertical: 12,
                        borderRadius: 10,
                        alignItems: 'center',
                        flexDirection: 'row',
                        justifyContent: 'center',
                        gap: 6,
                        borderWidth: 1,
                        borderColor: Colors.dark.danger,
                      }}
                    >
                      <Ionicons name="stop-outline" size={18} color={Colors.dark.danger} />
                      <Text style={{ color: Colors.dark.danger, fontSize: 14, fontWeight: '600' }}>Arrêter</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => handleStartInstance(instance.uuid)}
                    style={{
                      flex: 1,
                      backgroundColor: Colors.dark.success,
                      paddingVertical: 12,
                      borderRadius: 10,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Ionicons name="play-outline" size={18} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>Démarrer</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={() => {
                    // TODO: Naviguer vers les détails de l'instance
                    Alert.alert('Détails', `Instance: ${instance.name}`);
                  }}
                  style={{
                    width: 48,
                    backgroundColor: Colors.dark.bgModal,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: Colors.dark.gray500,
                  }}
                >
                  <Ionicons name="settings-outline" size={18} color={Colors.dark.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteInstance(instance.uuid, instance.name)}
                  style={{
                    width: 48,
                    backgroundColor: Colors.dark.bgModal,
                    paddingVertical: 12,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: Colors.dark.danger,
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.dark.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}
