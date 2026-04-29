import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAppStore, levelFromXp } from '../../lib/store';
import { colors, spacing, radii } from '../../lib/tokens';
import { Card, Eyebrow, Divider, Button } from '../../components/ui';
import { KlinekraftFooter } from '../../components/KlinekraftFooter';

export default function ProfileTab() {
  const profile = useAppStore((s) => s.profile);
  const macros = useAppStore((s) => s.macros);
  const xp = useAppStore((s) => s.xp);
  const streakDays = useAppStore((s) => s.streakDays);
  const regenerate = useAppStore((s) => s.regenerate);

  if (!profile || !macros) return null;

  const { level } = levelFromXp(xp);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Identity card */}
      <View style={styles.identityRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{profile.name.toLowerCase()}</Text>
          <Text style={styles.meta}>
            LV {level} · {streakDays}D STREAK
          </Text>
        </View>
      </View>

      {/* Goal/level summary */}
      <View style={styles.gridRow}>
        <Card variant="flat" style={{ flex: 1 }}>
          <Eyebrow>GOAL</Eyebrow>
          <Text style={styles.cellLabel}>{profile.goal}</Text>
        </Card>
        <Card variant="flat" style={{ flex: 1 }}>
          <Eyebrow>LEVEL</Eyebrow>
          <Text style={styles.cellLabel}>{profile.experience}</Text>
        </Card>
      </View>

      {/* Macro targets summary */}
      <Card>
        <Eyebrow volt>// YOUR TARGETS</Eyebrow>
        <View style={styles.targetRow}>
          <TargetCell label="KCAL" value={macros.calories.toLocaleString()} />
          <TargetCell label="PROTEIN" value={`${macros.proteinG}G`} />
        </View>
        <View style={styles.targetRow}>
          <TargetCell label="CARBS" value={`${macros.carbsG}G`} />
          <TargetCell label="FATS" value={`${macros.fatsG}G`} />
        </View>
      </Card>

      <Divider />

      <Eyebrow>// SETTINGS</Eyebrow>
      <Row label="macro targets" />
      <Row label="workout schedule" />
      <Row label="notifications" />
      <Row label="connected apps" />

      <Divider />

      <Button
        label="regenerate plan"
        variant="outline"
        onPress={() => {
          regenerate();
          Alert.alert('Plan regenerated', 'Your workout plan and macros have been refreshed.');
        }}
      />

      <Button
        label="reset everything"
        variant="ghost"
        onPress={() => {
          Alert.alert(
            'Reset?',
            'This wipes your profile, plan, logs, and progress. Cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: () => {
                  useAppStore.persist.clearStorage();
                  useAppStore.setState({
                    profile: null,
                    weekPlan: null,
                    macros: null,
                    foodLog: [],
                    weightLog: [],
                    completedSets: [],
                    streakDays: 0,
                    xp: 0,
                    todayDayIndex: 0,
                  });
                  router.replace('/onboarding');
                },
              },
            ]
          );
        }}
        style={{ marginTop: spacing.xs }}
      />

      <KlinekraftFooter />
    </ScrollView>
  );
}

function Row({ label }: { label: string }) {
  return (
    <Pressable>
      <Card style={styles.row as any}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowArrow}>→</Text>
      </Card>
    </Pressable>
  );
}

function TargetCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.targetCell}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={styles.targetValue}>{value}</Text>
    </View>
  );
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    gap: spacing.md,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.volt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.voltDark,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
  },
  meta: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  gridRow: { flexDirection: 'row', gap: spacing.sm },
  cellLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  targetRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  targetCell: {
    flex: 1,
  },
  targetValue: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'lowercase',
  },
  rowArrow: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.volt,
  },
});
