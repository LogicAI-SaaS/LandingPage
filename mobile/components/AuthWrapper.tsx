import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { InstancesProvider } from '@/contexts/InstancesContext';
import LoginScreen from '@/screens/LoginScreen';
import RegisterScreen from '@/screens/RegisterScreen';
import { Colors } from '@/constants/theme';

function AuthContent({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [showRegister, setShowRegister] = React.useState(false);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background }}>
        <ActivityIndicator size="large" color={Colors.dark.brandBlue} />
      </View>
    );
  }

  if (!user) {
    return showRegister ? (
      <RegisterScreen onSwitch={() => setShowRegister(false)} />
    ) : (
      <LoginScreen onSwitch={() => setShowRegister(true)} />
    );
  }

  // User connecté - rendu les tabs (children)
  return <>{children}</>;
}

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <InstancesProvider>
        <AuthContent children={children} />
      </InstancesProvider>
    </AuthProvider>
  );
}
