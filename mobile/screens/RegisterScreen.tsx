import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterScreenProps {
  onSwitch?: () => void;
}

export default function RegisterScreen({ onSwitch }: RegisterScreenProps) {
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await register(email, password, firstName, lastName);
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingHorizontal: 16,
          paddingVertical: 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Logo - Exactement comme web */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={{ width: 48, height: 48 }}
                resizeMode="contain"
              />
              <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#fff' }}>
                LogicAI
              </Text>
            </View>
          </View>

          {/* Formulaire - Même design que web */}
          <View
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 16,
              padding: 32,
            }}
          >
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 }}>
              Créer un compte
            </Text>
            <Text style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>
              Rejoignez LogicAI et automatisez vos workflows
            </Text>

            {error && (
              <View
                style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(239, 68, 68, 0.5)',
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 24,
                }}
              >
                <Text style={{ color: '#f87171', fontSize: 14, textAlign: 'center' }}>
                  {error}
                </Text>
              </View>
            )}

            <View style={{ gap: 16 }}>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#d1d5db', marginBottom: 8 }}>
                    Prénom
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                    }}
                    placeholder="Jean"
                    placeholderTextColor="#9ca3af"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#d1d5db', marginBottom: 8 }}>
                    Nom
                  </Text>
                  <TextInput
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 8,
                      color: '#fff',
                      fontSize: 16,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                    }}
                    placeholder="Dupont"
                    placeholderTextColor="#9ca3af"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#d1d5db', marginBottom: 8 }}>
                  Email
                </Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  }}
                  placeholder="jean.dupont@email.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
              </View>

              <View>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#d1d5db', marginBottom: 8 }}>
                  Mot de passe
                </Text>
                <TextInput
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 8,
                    color: '#fff',
                    fontSize: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  }}
                  placeholder="Min. 8 caractères"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  textContentType="password"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              style={{
                backgroundColor: '#0070FF',
                borderRadius: 8,
                paddingVertical: 14,
                alignItems: 'center',
                marginTop: 8,
                opacity: isLoading ? 0.7 : 1,
              }}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>
                  Créer mon compte
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Lien connexion */}
          <View style={{ alignItems: 'center', marginTop: 24 }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>
              Déjà membre ?{' '}
            </Text>
            <TouchableOpacity onPress={onSwitch}>
              <Text style={{ color: '#0070FF', fontSize: 14, fontWeight: '600' }}>
                Se connecter
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}
