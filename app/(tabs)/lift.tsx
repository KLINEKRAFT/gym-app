import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { colors, spacing, radii } from '../../lib/tokens';
import { Card, Eyebrow, Tag } from '../../components/ui';
import { KlinekraftFooter } from '../../components/KlinekraftFooter';

export default function LiftTab() {
  const weekPlan = useAppStore((s) => s.weekPlan);
  const todayDayIndex = useAppStore((s) => s.todayDayIndex);

  if (!weekPlan) return null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Eyebrow>// YOUR PLAN</Eyebrow>
        <Text style={styles.title}>lift.</Text>
        <Text style={styles.subtitle}>
          {weekPlan.daysPerWeek} days/week · {weekPlan.experience} · goal: {weekPlan.goal}
        </Text>
      </View>

      {weekPlan.days.map((day, idx) => (
        <Pressable
          key={day.id}
          onPress={() => router.push(`/workout/${day.id}`)}
          style={({ pressed }) => [pressed && { opacity: 0.85 }]}
        >
          <Card style={idx === todayDayIndex ? styles.todayCard : undefined}>
            <View style={styles.dayHead}>
              <View style={{ flex: 1 }}>
                <Eyebrow volt={idx === todayDayIndex}>
                  DAY {idx + 1}
                  {idx === todayDayIndex && ' · TODAY'}
                </Eyebrow>
                <Text style={styles.dayName}>{day.name}</Text>
                <Text style={styles.dayMeta}>
                  {day.focus} · {day.exercises.length} EX · {day.estimatedMinutes} MIN
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </View>

            <View style={styles.exList}>
              {day.exercises.slice(0, 3).map((wex) => (
                <Text key={wex.exercise.id} style={styles.exItem}>
                  · {wex.exercise.name}{' '}
                  <Text style={styles.exDetail}>
                    {wex.sets}×{wex.targetReps}
                    {wex.suggestedWeight ? ` · ${wex.suggestedWeight}lb` : ''}
                  </Text>
                </Text>
              ))}
              {day.exercises.length > 3 && (
                <Text style={styles.exMore}>+{day.exercises.length - 3} more</Text>
              )}
            </View>
          </Card>
        </Pressable>
      ))}

      <KlinekraftFooter />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    gap: spacing.md,
  },
  header: { gap: 4, marginBottom: spacing.sm },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  todayCard: {
    borderColor: colors.volt,
    borderWidth: 1,
  },
  dayHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dayName: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    textTransform: 'lowercase',
    marginTop: 4,
  },
  dayMeta: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: 4,
  },
  arrow: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.volt,
  },
  exList: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  exItem: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  exDetail: {
    fontFamily: 'Menlo',
    fontSize: 11,
    color: colors.textMuted,
  },
  exMore: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
