
import React from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedButton } from '@/components/ui/themed-button';
import { useNavigation } from '@react-navigation/native';

export default function HomeScreen() {
  const navigation = useNavigation();
  return (
    <ThemedView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ThemedText type="title" style={{ marginBottom: 12 }}>Bienvenue sur LogicAI</ThemedText>
      <ThemedText style={{ marginBottom: 32 }}>Votre assistant cloud, accessible partout.</ThemedText>
      <ThemedButton title="Accéder au Dashboard" onPress={() => navigation.navigate('Dashboard')} />
      <ThemedButton title="Explorer" variant="secondary" onPress={() => navigation.navigate('Explore')} />
    </ThemedView>
  );
}
