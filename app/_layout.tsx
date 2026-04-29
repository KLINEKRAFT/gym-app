import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useAppStore } from '../lib/store';
import { colors } from '../lib/tokens';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/[dayId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="share/[dayId]" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
  );
}
