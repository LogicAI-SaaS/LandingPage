import React, { useEffect } from 'react';
import { ScrollView, ActivityIndicator } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedCard } from '@/components/ui/themed-card';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

export default function NotificationsScreen() {
  const { token } = useAuth();
  const { state, setNotifications, markRead } = useNotifications();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!token) return;
      setLoading(true);
      try {
        // Remplace par l'endpoint réel côté /server
        const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL || 'https://api.logicai.fr/api'}/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch (e) {
        setNotifications([]);
      }
      setLoading(false);
    };
    fetchNotifications();
  }, [token]);

  return (
    <ThemedView style={{ flex: 1, padding: 16 }}>
      <ThemedText type="title" style={{ marginBottom: 12 }}>Notifications</ThemedText>
      {loading ? (
        <ActivityIndicator />
      ) : (
        <ScrollView>
          {state.notifications.length === 0 ? (
            <ThemedText>Aucune notification.</ThemedText>
          ) : (
            state.notifications.map((notif) => (
              <ThemedCard key={notif.id} style={{ marginBottom: 12, opacity: notif.read ? 0.6 : 1 }}>
                <ThemedText>{notif.message}</ThemedText>
                <ThemedText style={{ fontSize: 12, marginTop: 4 }}>{notif.date}</ThemedText>
                {!notif.read && (
                  <ThemedText type="link" onPress={() => markRead(notif.id)} style={{ marginTop: 8 }}>
                    Marquer comme lu
                  </ThemedText>
                )}
              </ThemedCard>
            ))
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}
