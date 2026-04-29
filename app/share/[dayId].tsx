import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { colors, spacing, radii } from '../../lib/tokens';
import { Eyebrow, Button } from '../../components/ui';

// Share screen. Builds a beautiful 9:16 card summarizing the workout, then
// exports as an image via react-native-view-shot + expo-sharing.
//
// On web, view-shot doesn't work the same way — we fall back to "open in new
// tab" with a render-to-canvas approach, but for v1 we just show the card and
// let the user screenshot it themselves on web.

const isWeb = Platform.OS === 'web';

// Lazy-import the native modules so web doesn't choke
let captureRef: any = null;
let Sharing: any = null;
let FileSystem: any = null;
if (!isWeb) {
  try {
    captureRef = require('react-native-view-shot').captureRef;
  } catch {}
  try {
    Sharing = require('expo-sharing');
  } catch {}
}

export default function ShareScreen() {
  const { dayId, session } = useLocalSearchParams<{ dayId: string; session: string }>();

  const weekPlan = useAppStore((s) => s.weekPlan);
  const completedSets = useAppStore((s) => s.completedSets);
  const profile = useAppStore((s) => s.profile);
  const sessions = useAppStore((s) => s.sessions);

  const day = weekPlan?.days.find((d) => d.id === dayId);
  const cardRef = useRef<View>(null);
  const [exporting, setExporting] = useState(false);

  if (!day || !profile) {
    return (
      <View style={styles.root}>
        <Text style={{ color: colors.text, padding: spacing.lg }}>
          workout not found.
        </Text>
      </View>
    );
  }

  // Filter sets to this session
  const sessionSets = session
    ? completedSets.filter((s) => s.sessionId === session)
    : completedSets.filter((s) => {
        // fallback: most recent sets matching the day's exercises
        const dayExerciseIds = new Set(day.exercises.map((e) => e.exercise.id));
        return dayExerciseIds.has(s.exerciseId);
      });

  // Compute summary
  const totalSets = sessionSets.length;
  const totalReps = sessionSets.reduce((sum, s) => sum + s.reps, 0);
  const totalVolume = sessionSets.reduce(
    (sum, s) => sum + (s.weight ?? 0) * s.reps,
    0
  );

  // Duration: from earliest completedAt to latest
  let durationMin = 0;
  if (sessionSets.length >= 2) {
    const times = sessionSets.map((s) => new Date(s.completedAt).getTime());
    durationMin = Math.round((Math.max(...times) - Math.min(...times)) / 60000);
  }

  // Group sets by exercise for the card display
  const exerciseSummary = day.exercises
    .map((wex) => {
      const sets = sessionSets.filter((s) => s.exerciseId === wex.exercise.id);
      if (sets.length === 0) return null;
      const topWeight = sets.reduce(
        (max, s) => Math.max(max, s.weight ?? 0),
        0
      );
      return {
        name: wex.exercise.name,
        completedSets: sets.length,
        plannedSets: wex.sets,
        topWeight,
      };
    })
    .filter(Boolean) as Array<{
    name: string;
    completedSets: number;
    plannedSets: number;
    topWeight: number;
  }>;

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();

  // ---------- Export handlers ----------
  const handleShare = async () => {
    if (isWeb) {
      Alert.alert(
        'Screenshot to share',
        'On web, take a screenshot of this card to share. Native iOS/Android apps will share automatically.'
      );
      return;
    }

    if (!captureRef || !Sharing) {
      Alert.alert('Not available', 'Sharing requires the native app build.');
      return;
    }

    setExporting(true);
    try {
      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1.0,
        result: 'tmpfile',
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Share workout',
          UTI: 'public.png',
        });
      } else {
        Alert.alert('Saved', `Card saved to ${uri}`);
      }
    } catch (e: any) {
      Alert.alert('Export failed', e?.message ?? 'Unknown error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scrollContent}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.exitBtn}>✕</Text>
        </Pressable>
        <Eyebrow volt>// SHARE</Eyebrow>
        <View style={{ width: 32 }} />
      </View>

      {/* The actual share card. Captured as image via captureRef. */}
      <View ref={cardRef} collapsable={false} style={styles.shareCard}>
        {/* Top eyebrow: brand */}
        <View style={styles.cardTop}>
          <Text style={styles.brandLabel}>KLINEKRAFT · GYM</Text>
          <Text style={styles.dateLabel}>{dateStr}</Text>
        </View>

        {/* Big day name */}
        <View style={styles.heroBlock}>
          <Text style={styles.cardEyebrow}>// COMPLETED</Text>
          <Text style={styles.dayName}>{day.name.toLowerCase()}</Text>
          <Text style={styles.dayFocus}>{day.focus}</Text>
        </View>

        {/* Volt strip — biggest stat */}
        <View style={styles.voltStrip}>
          <View style={{ flex: 1 }}>
            <Text style={styles.voltStripEyebrow}>VOLUME</Text>
            <Text style={styles.voltStripNum}>
              {totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}K` : totalVolume}
            </Text>
            <Text style={styles.voltStripUnit}>LBS MOVED</Text>
          </View>
          <View style={styles.voltStripDivider} />
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Text style={styles.voltStripEyebrow}>TIME</Text>
            <Text style={styles.voltStripNum}>{durationMin || '—'}</Text>
            <Text style={styles.voltStripUnit}>MINUTES</Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatBox label="EXERCISES" value={String(exerciseSummary.length)} />
          <StatBox label="SETS" value={String(totalSets)} />
          <StatBox label="REPS" value={String(totalReps)} />
        </View>

        {/* Exercise list */}
        <View style={styles.exList}>
          <Text style={styles.cardEyebrow}>// LIFTS</Text>
          {exerciseSummary.slice(0, 8).map((ex, i) => (
            <View key={i} style={styles.exRow}>
              <Text style={styles.exName}>{ex.name.toLowerCase()}</Text>
              <Text style={styles.exDetail}>
                {ex.completedSets}/{ex.plannedSets} sets
                {ex.topWeight > 0 ? ` · ${ex.topWeight} lb` : ''}
              </Text>
            </View>
          ))}
          {exerciseSummary.length > 8 && (
            <Text style={styles.exMore}>+{exerciseSummary.length - 8} more</Text>
          )}
        </View>

        {/* Footer with logo */}
        <View style={styles.cardFooter}>
          <Image
            source={require('../../assets/klinekraft-logo-white.png')}
            style={styles.cardLogo}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        <Button
          label={exporting ? 'exporting...' : '↑ share'}
          onPress={handleShare}
          disabled={exporting}
        />
        <Button
          label="back to dashboard"
          variant="outline"
          onPress={() => router.replace('/(tabs)')}
          style={{ marginTop: spacing.sm }}
        />
      </View>

      {isWeb && (
        <Text style={styles.webHint}>
          on web, take a screenshot of the card to share. native apps share automatically.
        </Text>
      )}
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statBoxLabel}>{label}</Text>
      <Text style={styles.statBoxValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
  },
  exitBtn: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    width: 32,
  },

  // ---------- Share card (the thing that gets captured) ----------
  shareCard: {
    backgroundColor: colors.bg,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    aspectRatio: 9 / 16, // social-friendly vertical ratio
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  brandLabel: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.volt,
  },
  dateLabel: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
  },
  cardEyebrow: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  heroBlock: {
    marginTop: spacing.lg,
  },
  dayName: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -2.5,
    textTransform: 'lowercase',
    lineHeight: 56,
    marginTop: spacing.xs,
  },
  dayFocus: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: colors.volt,
    marginTop: spacing.sm,
  },

  voltStrip: {
    flexDirection: 'row',
    backgroundColor: colors.volt,
    padding: spacing.lg,
    marginVertical: spacing.lg,
  },
  voltStripDivider: {
    width: 1,
    backgroundColor: colors.voltDark,
    opacity: 0.3,
    marginHorizontal: spacing.md,
  },
  voltStripEyebrow: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: colors.voltDark,
  },
  voltStripNum: {
    fontSize: 56,
    fontWeight: '900',
    color: colors.voltDark,
    letterSpacing: -2.5,
    lineHeight: 56,
    marginTop: spacing.xs,
  },
  voltStripUnit: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
    color: colors.voltDark,
    opacity: 0.8,
    marginTop: 4,
  },

  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    padding: spacing.md,
  },
  statBoxLabel: {
    fontFamily: 'Menlo',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.textMuted,
  },
  statBoxValue: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    marginTop: 4,
  },

  exList: {
    marginTop: spacing.lg,
    gap: 4,
  },
  exRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  exName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'lowercase',
    flex: 1,
  },
  exDetail: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  exMore: {
    fontFamily: 'Menlo',
    fontSize: 9,
    fontWeight: '700',
    color: colors.textDim,
    letterSpacing: 1,
    marginTop: 4,
  },

  cardFooter: {
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  cardLogo: {
    width: 100,
    height: 28,
    opacity: 0.6,
  },

  // ---------- Action buttons ----------
  actions: {
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  webHint: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.textDim,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
});
