import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, Modal } from 'react-native';
import Svg, { Path, Line, Rect, Circle } from 'react-native-svg';
import { useAppStore } from '../../lib/store';
import { colors, spacing, radii } from '../../lib/tokens';
import { Card, Eyebrow, Tag, Button } from '../../components/ui';
import { KlinekraftFooter } from '../../components/KlinekraftFooter';

type Range = '30' | '90' | 'all';

export default function StatsTab() {
  const profile = useAppStore((s) => s.profile);
  const weightLog = useAppStore((s) => s.weightLog);
  const completedSets = useAppStore((s) => s.completedSets);
  const streakDays = useAppStore((s) => s.streakDays);
  const xp = useAppStore((s) => s.xp);
  const addWeight = useAppStore((s) => s.addWeight);

  const [range, setRange] = useState<Range>('30');
  const [logOpen, setLogOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  if (!profile) return null;

  // Compute weight trend
  const sortedWeights = [...weightLog].sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const startWeight = sortedWeights[0]?.weightLbs ?? profile.weightLbs;
  const latestWeight = sortedWeights[sortedWeights.length - 1]?.weightLbs ?? profile.weightLbs;
  const delta = latestWeight - startWeight;

  // Workouts this month
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const setsThisMonth = completedSets.filter((s) => s.completedAt >= monthStart);
  const workoutsThisMonth = new Set(
    setsThisMonth.map((s) => s.completedAt.slice(0, 10))
  ).size;
  const volumeThisMonth = setsThisMonth.reduce(
    (sum, s) => sum + (s.weight ?? 0) * s.reps,
    0
  );

  const submitWeight = () => {
    const w = parseFloat(newWeight);
    if (!isNaN(w) && w > 0) {
      addWeight(w);
      setNewWeight('');
      setLogOpen(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Eyebrow>// PROGRESS</Eyebrow>
        <Text style={styles.title}>stats.</Text>
      </View>

      {/* Range tabs */}
      <View style={styles.rangeRow}>
        <RangePill label="30D" active={range === '30'} onPress={() => setRange('30')} />
        <RangePill label="90D" active={range === '90'} onPress={() => setRange('90')} />
        <RangePill label="ALL" active={range === 'all'} onPress={() => setRange('all')} />
      </View>

      {/* Weight chart */}
      <Card>
        <View style={styles.weightHead}>
          <Eyebrow>// WEIGHT</Eyebrow>
          {delta !== 0 && (
            <Eyebrow volt>
              {delta < 0 ? '↓' : '↑'} {Math.abs(delta).toFixed(1)} LBS
            </Eyebrow>
          )}
        </View>
        <Text style={styles.weightNow}>{latestWeight.toFixed(1)}</Text>
        <Text style={styles.weightUnit}>LBS · GOAL {profile.goalWeightLbs}</Text>

        <View style={{ marginTop: spacing.md }}>
          <WeightChart data={sortedWeights.map((w) => w.weightLbs)} />
        </View>

        <Button
          label="+ log weight"
          variant="outline"
          onPress={() => setLogOpen(true)}
          style={{ marginTop: spacing.md }}
        />
      </Card>

      {/* Stat grid */}
      <View style={styles.gridRow}>
        <Card style={{ flex: 1 }}>
          <Eyebrow>WORKOUTS</Eyebrow>
          <Text style={styles.statBig}>{workoutsThisMonth}</Text>
          <Eyebrow style={{ marginTop: spacing.xs }}>THIS MONTH</Eyebrow>
        </Card>
        <Card style={{ flex: 1 }}>
          <Eyebrow>VOLUME</Eyebrow>
          <Text style={styles.statBig}>
            {volumeThisMonth >= 1000
              ? `${(volumeThisMonth / 1000).toFixed(0)}K`
              : volumeThisMonth}
          </Text>
          <Eyebrow style={{ marginTop: spacing.xs }}>LBS · MONTH</Eyebrow>
        </Card>
      </View>

      {/* Achievements */}
      <Eyebrow>// ACHIEVEMENTS</Eyebrow>
      <View style={styles.achGrid}>
        <Achievement
          label="STREAK"
          sub={`${streakDays}D`}
          earned={streakDays >= 7}
        />
        <Achievement
          label="100 SETS"
          sub={`${completedSets.length}`}
          earned={completedSets.length >= 100}
        />
        <Achievement
          label="LV 5"
          sub={`XP ${xp}`}
          earned={xp >= 1000}
        />
      </View>

      <KlinekraftFooter />

      {/* Weight log modal */}
      <Modal visible={logOpen} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Eyebrow volt>// LOG WEIGHT</Eyebrow>
              <Pressable onPress={() => setLogOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>
            <Eyebrow>WEIGHT (LBS)</Eyebrow>
            <TextInput
              style={styles.input}
              value={newWeight}
              onChangeText={setNewWeight}
              keyboardType="numeric"
              placeholder="e.g. 182.4"
              placeholderTextColor={colors.textDim}
              autoFocus
            />
            <Button label="save" onPress={submitWeight} style={{ marginTop: spacing.lg }} />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function RangePill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}>
      <Text style={[styles.pillText, { color: active ? colors.voltDark : colors.textMuted }]}>{label}</Text>
    </Pressable>
  );
}

function WeightChart({ data }: { data: number[] }) {
  const W = 280;
  const H = 70;

  if (data.length < 2) {
    return (
      <View style={{ height: H, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontFamily: 'Menlo', fontSize: 10, color: colors.textDim, letterSpacing: 1 }}>
          LOG MORE WEIGHTS TO SEE TREND
        </Text>
      </View>
    );
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * (W - 10) + 5;
    const y = H - 10 - ((v - min) / range) * (H - 20);
    return { x, y };
  });

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const last = points[points.length - 1];

  return (
    <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
      <Line x1="5" y1={H - 5} x2={W - 5} y2={H - 5} stroke={colors.border} strokeWidth="1" />
      <Path
        d={path}
        fill="none"
        stroke={colors.volt}
        strokeWidth="2.5"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <Rect x={last.x - 4} y={last.y - 4} width="8" height="8" fill={colors.volt} />
    </Svg>
  );
}

function Achievement({ label, sub, earned }: { label: string; sub: string; earned: boolean }) {
  return (
    <View
      style={[
        styles.achBlock,
        earned ? styles.achEarned : styles.achLocked,
      ]}
    >
      <View
        style={[
          styles.achIcon,
          {
            backgroundColor: earned ? colors.volt : 'transparent',
            borderColor: earned ? colors.volt : colors.borderStrong,
          },
        ]}
      />
      <Text
        style={[
          styles.achLabel,
          { color: earned ? colors.volt : colors.textDim },
        ]}
      >
        {label}
      </Text>
      <Text style={styles.achSub}>{sub}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    gap: spacing.md,
  },
  header: { gap: 4 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    textTransform: 'lowercase',
  },
  rangeRow: { flexDirection: 'row', gap: spacing.xs },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  pillActive: { backgroundColor: colors.volt, borderColor: colors.volt },
  pillInactive: { backgroundColor: 'transparent', borderColor: colors.borderStrong },
  pillText: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  weightHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  weightNow: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.2,
    marginTop: spacing.xs,
  },
  weightUnit: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  gridRow: { flexDirection: 'row', gap: spacing.sm },
  statBig: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    marginTop: spacing.xs,
  },
  achGrid: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  achBlock: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  achEarned: {
    backgroundColor: colors.surface,
    borderColor: colors.volt,
  },
  achLocked: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  achIcon: {
    width: 24,
    height: 24,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  achLabel: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  achSub: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1,
    marginTop: 2,
  },

  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalClose: {
    fontSize: 18,
    color: colors.text,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
  },
});
