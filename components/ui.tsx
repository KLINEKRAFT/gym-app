// Brutalist UI primitives. Compose these instead of restyling from scratch.

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
} from 'react-native';
import { colors, radii, spacing, type } from '../lib/tokens';

// ---------- Eyebrow label ----------
export function Eyebrow({
  children,
  volt,
  style,
}: {
  children: React.ReactNode;
  volt?: boolean;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text style={[volt ? type.eyebrowVolt : type.eyebrow, style]}>{children}</Text>
  );
}

// ---------- Card ----------
export function Card({
  children,
  variant = 'default',
  style,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'flat' | 'volt' | 'outlined';
  style?: StyleProp<ViewStyle>;
}) {
  return <View style={[cardStyles.base, cardStyles[variant], style]}>{children}</View>;
}

const cardStyles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    padding: spacing.md,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flat: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  volt: {
    backgroundColor: colors.volt,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});

// ---------- Tag ----------
export function Tag({
  children,
  variant = 'volt',
}: {
  children: React.ReactNode;
  variant?: 'volt' | 'outline' | 'muted';
}) {
  return (
    <View style={[tagStyles.base, tagStyles[variant]]}>
      <Text style={[tagStyles.text, variant === 'volt' && { color: colors.voltDark }]}>
        {children}
      </Text>
    </View>
  );
}

const tagStyles = StyleSheet.create({
  base: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  volt: { backgroundColor: colors.volt },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  muted: { backgroundColor: colors.surface },
  text: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
});

// ---------- Button ----------
export function Button({
  label,
  onPress,
  variant = 'volt',
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'volt' | 'outline' | 'ghost';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        btnStyles.base,
        btnStyles[variant],
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[btnStyles.label, btnStyles[`${variant}Label`]]}>{label}</Text>
    </Pressable>
  );
}

const btnStyles = StyleSheet.create({
  base: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  volt: { backgroundColor: colors.volt },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  ghost: { backgroundColor: 'transparent' },
  label: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  voltLabel: { color: colors.voltDark },
  outlineLabel: { color: colors.text },
  ghostLabel: { color: colors.text },
});

// ---------- Progress bar ----------
export function ProgressBar({
  value,
  max = 100,
  color = colors.volt,
  height = 6,
  style,
}: {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={[progStyles.track, { height }, style]}>
      <View style={[progStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

const progStyles = StyleSheet.create({
  track: {
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

// ---------- Stat block ----------
export function Stat({
  label,
  value,
  unit,
  trend,
  style,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: { dir: 'up' | 'down'; text: string; positive?: boolean };
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card style={style}>
      <Eyebrow>{label}</Eyebrow>
      <View style={statStyles.valueRow}>
        <Text style={statStyles.value}>{value}</Text>
        {unit && <Text style={statStyles.unit}>{unit}</Text>}
      </View>
      {trend && (
        <Text
          style={[
            statStyles.trend,
            { color: trend.positive ? colors.volt : colors.textMuted },
          ]}
        >
          {trend.dir === 'up' ? '↑' : '↓'} {trend.text}
        </Text>
      )}
    </Card>
  );
}

const statStyles = StyleSheet.create({
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  value: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
  },
  unit: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginLeft: 4,
  },
  trend: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: spacing.xs,
  },
});

// ---------- Section divider ----------
export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, backgroundColor: colors.border, marginVertical: spacing.md }, style]} />;
}

// ---------- Screen scaffold ----------
export function Screen({
  children,
  scroll = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return <View style={screenStyles.root}>{children}</View>;
}

const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
