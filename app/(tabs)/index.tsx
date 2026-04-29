import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import {
  useAppStore,
  todayMacroTotalsSelector,
  todayWorkoutSelector,
  levelFromXp,
} from '../../lib/store';
import { colors, spacing, radii } from '../../lib/tokens';
import { Card, Eyebrow, Tag, Button, ProgressBar } from '../../components/ui';
import { KlinekraftFooter } from '../../components/KlinekraftFooter';

export default function Dashboard() {
  const profile = useAppStore((s) => s.profile);
  const macros = useAppStore((s) => s.macros);
  const todayWorkout = useAppStore(todayWorkoutSelector);
  const todayTotals = useAppStore(todayMacroTotalsSelector);
  const xp = useAppStore((s) => s.xp);
  const streakDays = useAppStore((s) => s.streakDays);
  const weightLog = useAppStore((s) => s.weightLog);

  if (!profile || !macros || !todayWorkout) return null;

  const { level, currentXp, neededXp } = levelFromXp(xp);
  const xpPct = (currentXp / neededXp) * 100;

  const latestWeight = weightLog.length
    ? weightLog[weightLog.length - 1].weightLbs
    : profile.weightLbs;
  const startWeight = weightLog.length ? weightLog[0].weightLbs : profile.weightLbs;
  const weightDelta = latestWeight - startWeight;

  const caloriesLeft = Math.max(0, macros.calories - todayTotals.calories);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Eyebrow>{getTimeLabel()}</Eyebrow>
          <Text style={styles.greeting}>{profile.name.toLowerCase()}.</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(tabs)/profile')}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>{getInitials(profile.name)}</Text>
        </Pressable>
      </View>

      {/* Streak hero */}
      <Card variant="volt">
        <Text style={styles.heroEyebrow}>STREAK · LOCKED IN</Text>
        <View style={styles.heroNumberRow}>
          <Text style={styles.heroNumber}>{streakDays}</Text>
          <Text style={styles.heroUnit}>d</Text>
        </View>
      </Card>

      {/* XP + Weight */}
      <View style={styles.gridRow}>
        <Card style={{ flex: 1 }}>
          <Eyebrow>XP</Eyebrow>
          <Text style={styles.statBig}>{xp.toLocaleString()}</Text>
          <ProgressBar value={xpPct} style={{ marginTop: spacing.sm }} />
          <Eyebrow style={{ marginTop: spacing.xs }}>
            LV {level} → {level + 1}
          </Eyebrow>
        </Card>
        <Card style={{ flex: 1 }}>
          <Eyebrow>WEIGHT</Eyebrow>
          <Text style={styles.statBig}>{latestWeight.toFixed(1)}</Text>
          <Eyebrow volt style={{ marginTop: spacing.md }}>
            {weightDelta === 0
              ? 'NO CHANGE'
              : `${weightDelta < 0 ? '↓' : '↑'} ${Math.abs(weightDelta).toFixed(1)} LBS`}
          </Eyebrow>
        </Card>
      </View>

      {/* Today's workout */}
      <Card>
        <View style={styles.workoutHead}>
          <View style={{ flex: 1 }}>
            <Eyebrow>TODAY · WORKOUT</Eyebrow>
            <Text style={styles.workoutTitle}>{todayWorkout.name}</Text>
            <Text style={styles.workoutMeta}>
              {todayWorkout.focus} · {todayWorkout.exercises.length} EX ·{' '}
              {todayWorkout.estimatedMinutes} MIN
            </Text>
          </View>
          <Tag>READY</Tag>
        </View>
        <Button
          label="start session ▶"
          onPress={() => router.push(`/workout/${todayWorkout.id}`)}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Macros snapshot */}
      <Card variant="flat">
        <View style={styles.macroHead}>
          <Eyebrow volt>// FUEL TODAY</Eyebrow>
          <Eyebrow>{caloriesLeft} LEFT</Eyebrow>
        </View>
        <View style={styles.macroNumberRow}>
          <Text style={styles.macroNumber}>{todayTotals.calories.toLocaleString()}</Text>
          <Text style={styles.macroOf}>/ {macros.calories.toLocaleString()} kcal</Text>
        </View>
        <ProgressBar
          value={todayTotals.calories}
          max={macros.calories}
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      {/* Coach */}
      <Card variant="flat">
        <Eyebrow volt>// COACH</Eyebrow>
        <Text style={styles.coachText}>{coachMessage(profile, weightDelta, streakDays)}</Text>
      </Card>

      <KlinekraftFooter />
    </ScrollView>
  );
}

// ---------- helpers ----------
function getTimeLabel() {
  const h = new Date().getHours();
  const day = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()];
  const greeting = h < 12 ? 'GOOD MORNING' : h < 18 ? 'GOOD AFTERNOON' : 'GOOD EVENING';
  return `${greeting} · ${day}`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function coachMessage(profile: any, weightDelta: number, streak: number): string {
  if (streak === 0) return "let's start your streak today. one session, that's all.";
  if (streak >= 14) return `${streak} days locked in. you're built different now.`;
  if (profile.goal === 'cut' && weightDelta < 0)
    return `down ${Math.abs(weightDelta).toFixed(1)} lbs. the deficit is working — stay disciplined.`;
  if (profile.goal === 'bulk' && weightDelta > 0)
    return `up ${weightDelta.toFixed(1)} lbs. growth is happening — keep eating.`;
  return '2 more sessions to hit your weekly target. push hard tonight.';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.volt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.voltDark,
  },
  heroEyebrow: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.voltDark,
  },
  heroNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.sm,
  },
  heroNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.voltDark,
    letterSpacing: -3,
    lineHeight: 60,
  },
  heroUnit: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.voltDark,
    marginLeft: 4,
  },
  gridRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBig: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    marginTop: spacing.xs,
  },
  workoutHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  workoutTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    textTransform: 'lowercase',
    marginTop: spacing.xs,
  },
  workoutMeta: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: 4,
  },
  macroHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  macroNumberRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  macroNumber: {
    fontSize: 36,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.5,
  },
  macroOf: {
    fontFamily: 'Menlo',
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  coachText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
