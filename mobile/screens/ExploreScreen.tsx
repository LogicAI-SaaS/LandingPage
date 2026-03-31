
import React from 'react';
import { ScrollView } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedCard } from '@/components/ui/themed-card';

const features = [
  { title: 'Workflows', desc: 'Automatisez vos tâches et connectez vos outils.' },
  { title: 'Collaboration', desc: 'Travaillez en équipe sur vos projets cloud.' },
  { title: 'Sécurité', desc: 'Protégez vos données avec des standards avancés.' },
  { title: 'Support', desc: 'Accédez à la documentation et à l’aide en ligne.' },
];

export default function ExploreScreen() {
  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <ThemedText type="title" style={{ marginBottom: 12 }}>Explorer</ThemedText>
      <ScrollView>
        {features.map((f, idx) => (
          <ThemedCard key={f.title} style={{ marginBottom: 14 }}>
            <ThemedText type="subtitle">{f.title}</ThemedText>
            <ThemedText>{f.desc}</ThemedText>
          </ThemedCard>
        ))}
      </ScrollView>
    </ThemedView>
  );
}
