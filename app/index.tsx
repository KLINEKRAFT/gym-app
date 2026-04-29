import { Redirect } from 'expo-router';
import { useAppStore } from '../lib/store';

export default function Index() {
  const profile = useAppStore((s) => s.profile);
  if (!profile) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)" />;
}
