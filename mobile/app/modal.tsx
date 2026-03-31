import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useInstances } from '@/contexts/InstancesContext';
import { Colors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CreateInstanceModal() {
  const { createInstance } = useInstances();
  const [instanceName, setInstanceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!instanceName.trim()) {
      setError('Veuillez entrer un nom pour l\'instance');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await createInstance('cloud');
      Alert.alert(
        'Succès',
        'Votre instance cloud est en cours de création',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la création de l\'instance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      }}
    >
      <View
        style={{
          backgroundColor: Colors.dark.bgCard,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          padding: 24,
          maxHeight: '80%',
        }}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: Colors.dark.text }}>
              Nouvelle instance
            </Text>
            <Text style={{ fontSize: 14, color: Colors.dark.gray500, marginTop: 4 }}>
              Créez une instance cloud LogicAI
            </Text>
          </View>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close-outline" size={28} color={Colors.dark.text} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Info Cloud Only */}
          <View
            style={{
              backgroundColor: 'rgba(0, 112, 255, 0.1)',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              borderLeftWidth: 4,
              borderLeftColor: Colors.dark.brandBlue,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="information-circle" size={20} color={Colors.dark.brandBlue} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.dark.brandBlue, marginLeft: 8 }}>
                Mobile - Cloud uniquement
              </Text>
            </View>
            <Text style={{ fontSize: 12, color: Colors.dark.gray500, lineHeight: 18 }}>
              Les instances locales ne sont pas disponibles sur mobile. Seules les instances cloud sont accessibles depuis l'application mobile.
            </Text>
          </View>

          {/* Nom de l'instance */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '500', color: Colors.dark.text, marginBottom: 8 }}>
              Nom de l'instance
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: Colors.dark.background,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: error ? Colors.dark.danger : 'transparent',
              }}
            >
              <View style={{ paddingHorizontal: 12 }}>
                <Ionicons name="server-outline" size={20} color={Colors.dark.gray500} />
              </View>
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  paddingRight: 12,
                  color: Colors.dark.text,
                  fontSize: 16,
                }}
                placeholder="Mon instance LogicAI"
                placeholderTextColor={Colors.dark.gray500}
                value={instanceName}
                onChangeText={setInstanceName}
                autoCapitalize="words"
              />
            </View>
            {error ? (
              <Text style={{ color: Colors.dark.danger, fontSize: 12, marginTop: 8 }}>
                {error}
              </Text>
            ) : null}
          </View>

          {/* Type Cloud (Info) */}
          <View
            style={{
              backgroundColor: Colors.dark.background,
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="cloud-outline" size={24} color={Colors.dark.accentOrange} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: Colors.dark.text }}>
                  Instance Cloud
                </Text>
                <Text style={{ fontSize: 12, color: Colors.dark.gray500, marginTop: 4 }}>
                  Accessible partout via Internet • Sécurisé • Sauvegardé automatiquement
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={24} color={Colors.dark.success} />
            </View>
          </View>

          {/* Bouton créer */}
          <TouchableOpacity
            onPress={handleCreate}
            disabled={loading}
            style={{
              backgroundColor: Colors.dark.accentOrange,
              borderRadius: 12,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Créer l'instance cloud
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

