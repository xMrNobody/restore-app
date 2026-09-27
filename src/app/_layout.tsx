import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { initSubscriptions } from '@/lib/subscriptions';
import { theme } from '@/lib/theme';

export default function RootLayout() {
  useEffect(() => {
    initSubscriptions();
  }, []);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen
          name="processing"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="result" options={{ title: 'Your restoration' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
        <Stack.Screen name="legal" options={{ title: 'Terms & Privacy' }} />
        <Stack.Screen
          name="paywall"
          options={{
            presentation: 'modal',
            headerShown: false,
            gestureEnabled: false,
          }}
        />
      </Stack>
    </>
  );
}
