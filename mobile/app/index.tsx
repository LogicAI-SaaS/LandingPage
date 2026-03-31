import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/theme';

export default function AppEntry() {
  // Simple loader while auth is being checked in _layout.tsx
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.dark.background }}>
      <ActivityIndicator size="large" color={Colors.dark.brandBlue} />
    </View>
  );
}
