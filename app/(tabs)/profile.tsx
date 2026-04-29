import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal } from 'react-native';
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

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  if (!profile || !macros) return null;

  const { level } = levelFromXp(xp);

  // Bulletproof reset: clear persisted storage, reset every state slice
  // explicitly, then navigate. Works on web and native — we don't rely on
  // Alert.alert which has flaky behavior on iOS Safari.
  const performReset = () => {
    try {
      useAppStore.persist.clearStorage();
    } catch {
      // Storage clear can fail silently on web — that's fine, the setState
      // below still resets in-memory state.
    }
    useAppStore.setState({
      profile: null,
      weekPlan: null,
      macros: null,
      foodLog: [],
      weightLog: [],
      completedSets: [],
      sessions: [],
      currentSessionId: null,
      streakDays: 0,
      xp: 0,
      todayDayIndex: 0,
    });
    setConfirmReset(false);
    // Use replace so the user can't swipe back to the tabs after reset
    router.replace('/onboarding');
  };

  const performRegenerate = () => {
    regenerate();
    setConfirmRegenerate(false);
  };

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
        onPress={() => setConfirmRegenerate(true)}
      />

      <Button
        label="start over"
        variant="ghost"
        onPress={() => setConfirmReset(true)}
        style={{ marginTop: spacing.xs }}
      />

      <KlinekraftFooter />

      {/* ---------- Confirm reset modal ---------- */}
      <Modal visible={confirmReset} animationType="fade" transparent>
        <View style={styles.modalRoot}>
          <View style={styles.modalSheet}>
            <Eyebrow volt>// START OVER?</Eyebrow>
            <Text style={styles.modalTitle}>this wipes everything.</Text>
            <Text style={styles.modalBody}>
              your profile, workout plan, macros, food log, weight log, and progress
              will all be deleted. you'll be sent back to the welcome screen.
            </Text>
            <Text style={styles.modalBodyAccent}>
              this cannot be undone.
            </Text>

            <Button
              label="yes — start over"
              onPress={performReset}
              style={{ marginTop: spacing.lg }}
            />
            <Button
              label="cancel"
              variant="outline"
              onPress={() => setConfirmReset(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>

      {/* ---------- Confirm regenerate modal ---------- */}
      <Modal visible={confirmRegenerate} animationType="fade" transparent>
        <View style={styles.modalRoot}>
          <View style={styles.modalSheet}>
            <Eyebrow volt>// REGENERATE PLAN?</Eyebrow>
            <Text style={styles.modalTitle}>fresh week.</Text>
            <Text style={styles.modalBody}>
              this rebuilds your workout plan and recalculates your macros based on
              your current profile. your logs and progress are preserved.
            </Text>

            <Button
              label="regenerate"
              onPress={performRegenerate}
              style={{ marginTop: spacing.lg }}
            />
            <Button
              label="cancel"
              variant="outline"
              onPress={() => setConfirmRegenerate(false)}
              style={{ marginTop: spacing.sm }}
            />
          </View>
        </View>
      </Modal>
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

  // ---------- Confirm modals ----------
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    textTransform: 'lowercase',
    marginTop: spacing.sm,
    lineHeight: 34,
  },
  modalBody: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    lineHeight: 20,
    marginTop: spacing.md,
  },
  modalBodyAccent: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: colors.volt,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
});
