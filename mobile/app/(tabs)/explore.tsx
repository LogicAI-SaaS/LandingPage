import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ExploreScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            await logout();
            // La navigation sera gérée par le root layout
          },
        },
      ]
    );
  };

  const settingsOptions = [
    {
      icon: 'person-outline',
      title: 'Profil',
      subtitle: user?.email || 'Chargement...',
      onPress: () => {},
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Sécurité',
      subtitle: 'Mot de passe et authentification',
      onPress: () => {},
    },
    {
      icon: 'card-outline',
      title: 'Abonnement',
      subtitle: user?.plan || 'free',
      onPress: () => {},
    },
  ];

  const supportOptions = [
    {
      icon: 'help-circle-outline',
      title: 'Centre d\'aide',
      subtitle: 'Documentation et tutoriels',
      onPress: () => {},
    },
    {
      icon: 'chatbubble-outline',
      title: 'Support',
      subtitle: 'Contacter l\'équipe',
      onPress: () => {},
    },
    {
      icon: 'document-text-outline',
      title: 'Conditions d\'utilisation',
      subtitle: 'Mentions légales',
      onPress: () => {},
    },
  ];

  const SettingItem = ({ icon, title, subtitle, onPress }: any) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.dark.bgCard,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.dark.gray950,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: Colors.dark.bgModal,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}
      >
        <Ionicons name={icon as any} size={20} color={Colors.dark.brandBlue} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: '500', color: Colors.dark.text }}>
          {title}
        </Text>
        <Text style={{ fontSize: 12, color: Colors.dark.gray500, marginTop: 2 }}>
          {subtitle}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.dark.gray500} />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.background }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 28, fontWeight: 'bold', color: Colors.dark.text }}>
            Paramètres
          </Text>
          <Text style={{ fontSize: 14, color: Colors.dark.gray500, marginTop: 4 }}>
            Gérez votre compte et vos préférences
          </Text>
        </View>

        {/* Compte */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{ fontSize: 12, fontWeight: '600', color: Colors.dark.gray500, marginBottom: 12, textTransform: 'uppercase' }}
          >
            Compte
          </Text>
          {settingsOptions.map((option, index) => (
            <SettingItem key={index} {...option} />
          ))}
        </View>

        {/* Support */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{ fontSize: 12, fontWeight: '600', color: Colors.dark.gray500, marginBottom: 12, textTransform: 'uppercase' }}
          >
            Support
          </Text>
          {supportOptions.map((option, index) => (
            <SettingItem key={index} {...option} />
          ))}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity
          onPress={handleLogout}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 59, 48, 0.1)',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: Colors.dark.danger,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.dark.danger} />
          <Text style={{ color: Colors.dark.danger, fontSize: 16, fontWeight: '600', marginLeft: 8 }}>
            Se déconnecter
          </Text>
        </TouchableOpacity>

        {/* Version */}
        <Text style={{ textAlign: 'center', color: Colors.dark.gray500, fontSize: 12, marginTop: 32 }}>
          LogicAI Mobile v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
