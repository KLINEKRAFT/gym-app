import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { colors, spacing } from '../../lib/tokens';

// Custom brutalist tab bar — sharp corners, monospaced labels, volt active state.
function TabBar({ state, navigation }: any) {
  const labels = ['HOME', 'LIFT', 'FUEL', 'STATS', 'YOU'];

  return (
    <View style={styles.bar}>
      {state.routes.map((route: any, idx: number) => {
        const isFocused = state.index === idx;
        return (
          <Pressable
            key={route.key}
            onPress={() => navigation.navigate(route.name)}
            style={styles.item}
            accessibilityRole="tab"
            accessibilityLabel={labels[idx]}
          >
            <View style={[styles.dot, isFocused && styles.dotActive]} />
            <Text style={[styles.label, isFocused && styles.labelActive]}>
              {labels[idx]}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg + 8,
    paddingHorizontal: spacing.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 16,
    height: 16,
    backgroundColor: colors.textDim,
    borderRadius: 0,
  },
  dotActive: {
    backgroundColor: colors.volt,
  },
  label: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textDim,
  },
  labelActive: {
    color: colors.volt,
  },
});

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="lift" />
      <Tabs.Screen name="fuel" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
