import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, spacing } from '../lib/tokens';

// Built-by-klinekraft footer. The white logo sits directly on the off-black
// canvas — no card backing needed.
export function KlinekraftFooter() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>BUILT BY</Text>
      <Image
        source={require('../assets/klinekraft-logo-white.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    opacity: 0.7, // keep it subtle — it's a footer, not a banner
  },
  label: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.textDim,
  },
  logo: {
    width: 140,
    height: 38,
  },
});
