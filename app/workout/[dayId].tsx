import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAppStore } from '../../lib/store';
import { colors, spacing, radii } from '../../lib/tokens';
import { Card, Eyebrow, Tag, Button, ProgressBar } from '../../components/ui';

// Active workout session. The user steps through sets one at a time. After
// each set we start a rest timer. When the timer hits 0 (or the user taps
// "skip rest"), they advance to the next set.
export default function WorkoutSession() {
  const { dayId } = useLocalSearchParams<{ dayId: string }>();
  const weekPlan = useAppStore((s) => s.weekPlan);
  const logSet = useAppStore((s) => s.logSet);
  const startSession = useAppStore((s) => s.startSession);
  const currentSessionId = useAppStore((s) => s.currentSessionId);

  const day = weekPlan?.days.find((d) => d.id === dayId);

  // current position
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setNumber, setSetNumber] = useState(1);

  // rest timer state
  const [restRemaining, setRestRemaining] = useState(0);
  const [restTotal, setRestTotal] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // weight/reps in progress for this set
  const [weightInput, setWeightInput] = useState('');
  const [repsInput, setRepsInput] = useState('');

  // Start a session when this screen mounts (only if one isn't already running)
  useEffect(() => {
    if (!currentSessionId && dayId) {
      startSession(dayId as string);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!day) {
    return (
      <View style={styles.root}>
        <Text style={styles.error}>workout not found.</Text>
      </View>
    );
  }

  const currentEx = day.exercises[exerciseIdx];
  if (!currentEx) {
    // session complete
    return <SessionComplete day={day} />;
  }

  // Initialize inputs to suggestions when exercise changes
  if (weightInput === '' && currentEx.suggestedWeight !== null) {
    setWeightInput(String(currentEx.suggestedWeight));
  }
  if (repsInput === '') {
    setRepsInput(String(currentEx.targetReps));
  }

  const completeSet = () => {
    const weight = parseFloat(weightInput) || 0;
    const reps = parseInt(repsInput) || 0;

    logSet({
      exerciseId: currentEx.exercise.id,
      setNumber,
      weight: currentEx.suggestedWeight === null ? null : weight,
      reps,
    });

    // Was that the last set of this exercise?
    if (setNumber >= currentEx.sets) {
      // Advance to next exercise
      const nextIdx = exerciseIdx + 1;
      setExerciseIdx(nextIdx);
      setSetNumber(1);
      setWeightInput('');
      setRepsInput('');
      // Start rest timer between exercises (use compound rest)
      startRest(currentEx.restSeconds);
    } else {
      setSetNumber(setNumber + 1);
      startRest(currentEx.restSeconds);
    }
  };

  const startRest = (seconds: number) => {
    setRestTotal(seconds);
    setRestRemaining(seconds);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const skipRest = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRestRemaining(0);
    setRestTotal(0);
  };

  const adjustWeight = (delta: number) => {
    const v = parseFloat(weightInput) || 0;
    setWeightInput(String(Math.max(0, v + delta)));
  };

  const adjustReps = (delta: number) => {
    const v = parseInt(repsInput) || 0;
    setRepsInput(String(Math.max(0, v + delta)));
  };

  const minutes = Math.floor(restRemaining / 60);
  const seconds = restRemaining % 60;
  const timerStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <>
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => {
          Alert.alert('End session?', 'Your logged sets will be saved.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'End', style: 'destructive', onPress: () => router.back() },
          ]);
        }}>
          <Text style={styles.exitBtn}>✕</Text>
        </Pressable>
        <Tag variant="outline">{day.focus}</Tag>
        <Tag>
          {exerciseIdx + 1} / {day.exercises.length}
        </Tag>
      </View>

      {/* Now lifting */}
      <View style={styles.nowSection}>
        <Eyebrow volt>// NOW LIFTING</Eyebrow>
        <Text style={styles.exerciseName}>{currentEx.exercise.name.toLowerCase()}</Text>
        <Eyebrow style={{ marginTop: spacing.xs }}>
          SET {String(setNumber).padStart(2, '0')} · OF {String(currentEx.sets).padStart(2, '0')}
        </Eyebrow>
      </View>

      {/* Weight + reps inputs */}
      <View style={styles.inputGrid}>
        <NumberStepper
          label="WEIGHT"
          unit="LBS"
          value={weightInput}
          onChange={setWeightInput}
          onMinus={() => adjustWeight(-5)}
          onPlus={() => adjustWeight(5)}
          disabled={currentEx.suggestedWeight === null}
        />
        <NumberStepper
          label="REPS"
          unit="TARGET"
          value={repsInput}
          onChange={setRepsInput}
          onMinus={() => adjustReps(-1)}
          onPlus={() => adjustReps(1)}
          accent
        />
      </View>

      <Button label="✓ complete set" onPress={completeSet} />

      {/* Up next */}
      {exerciseIdx + 1 < day.exercises.length && (
        <View>
          <Eyebrow style={{ marginBottom: spacing.sm }}>// UP NEXT</Eyebrow>
          {day.exercises.slice(exerciseIdx + 1, exerciseIdx + 4).map((wex, i) => (
            <Card key={wex.exercise.id} style={styles.upNextCard as any}>
              <View style={{ flex: 1 }}>
                <Text style={styles.upNextName}>{wex.exercise.name.toLowerCase()}</Text>
                <Text style={styles.upNextMeta}>
                  {wex.sets} × {wex.targetReps}
                  {wex.suggestedWeight ? ` · ${wex.suggestedWeight} LBS` : ' · BW'}
                </Text>
              </View>
              <View style={[styles.dot, i === 0 && { backgroundColor: colors.volt }]} />
            </Card>
          ))}
        </View>
      )}
    </ScrollView>

    {/* GIANT REST TIMER — full-screen takeover. Brutalist signature moment.
        While resting, the entire screen flips to accent color with a massive
        ticking timer. Tap anywhere to skip. */}
    {restRemaining > 0 && (
      <Pressable onPress={skipRest} style={styles.restOverlay}>
        <Text style={styles.restOverlayEyebrow}>REST</Text>
        <Text style={styles.restOverlayTimer}>{timerStr}</Text>
        <View style={styles.restOverlayProgressTrack}>
          <View
            style={[
              styles.restOverlayProgressFill,
              { width: `${((restTotal - restRemaining) / restTotal) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.restOverlayHint}>TAP ANYWHERE TO SKIP</Text>
        <View style={styles.restOverlayFooter}>
          <Text style={styles.restOverlayMeta}>NEXT</Text>
          <Text style={styles.restOverlayNextEx}>
            {(() => {
              // After last set of an exercise we've already advanced exerciseIdx,
              // so currentEx is already the NEW exercise. Show its name.
              const next = day.exercises[exerciseIdx];
              if (!next) return 'session complete';
              const setLabel =
                setNumber === 1 ? `${next.exercise.name.toLowerCase()} · set 1` : `set ${setNumber}`;
              return setLabel;
            })()}
          </Text>
        </View>
      </Pressable>
    )}
  </>);
}

function NumberStepper({
  label,
  unit,
  value,
  onChange,
  onMinus,
  onPlus,
  disabled,
  accent,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  onMinus: () => void;
  onPlus: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  return (
    <View style={[stepperStyles.card, disabled && { opacity: 0.4 }]}>
      <Eyebrow>{label}</Eyebrow>
      <View style={stepperStyles.row}>
        <Pressable onPress={onMinus} disabled={disabled} style={stepperStyles.btn}>
          <Text style={stepperStyles.btnText}>−</Text>
        </Pressable>
        <Text style={[stepperStyles.value, accent && { color: colors.volt }]}>
          {disabled ? 'BW' : value || '0'}
        </Text>
        <Pressable onPress={onPlus} disabled={disabled} style={stepperStyles.btn}>
          <Text style={stepperStyles.btnText}>+</Text>
        </Pressable>
      </View>
      <Eyebrow style={{ alignSelf: 'center', marginTop: spacing.xs }}>{unit}</Eyebrow>
    </View>
  );
}

const stepperStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  btn: {
    width: 32,
    height: 32,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
  },
  value: {
    fontSize: 44,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -2,
    minWidth: 80,
    textAlign: 'center',
  },
});

function SessionComplete({ day }: { day: any }) {
  const finishSession = useAppStore((s) => s.finishSession);
  const sessionId = useAppStore((s) => s.currentSessionId);

  // Capture the session ID *before* calling finishSession (which clears it),
  // so we can pass it to the share screen.
  const [capturedId] = React.useState(sessionId);

  React.useEffect(() => {
    finishSession();
  }, []);

  return (
    <View style={[styles.root, { padding: spacing.xl, justifyContent: 'center' }]}>
      <Eyebrow volt>// SESSION COMPLETE</Eyebrow>
      <Text style={styles.completeTitle}>well done.</Text>
      <Text style={styles.completeSub}>
        you finished {day.name.toLowerCase()}.{'\n'}
        every set is logged. recovery starts now.
      </Text>
      <View style={{ height: spacing.xl }} />
      <Button
        label="share workout ▶"
        onPress={() =>
          router.replace(`/share/${day.id}?session=${capturedId ?? ''}`)
        }
      />
      <Button
        label="back to dashboard"
        variant="outline"
        onPress={() => router.replace('/(tabs)')}
        style={{ marginTop: spacing.sm }}
      />
    </View>
  );
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
  error: {
    color: colors.text,
    padding: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exitBtn: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    width: 32,
  },
  nowSection: {
    marginTop: spacing.md,
  },
  exerciseName: {
    fontSize: 38,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1.2,
    marginTop: spacing.xs,
    textTransform: 'lowercase',
    lineHeight: 40,
  },
  inputGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // ---------- Full-screen rest timer overlay ----------
  restOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.volt,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    zIndex: 100,
  },
  restOverlayEyebrow: {
    fontFamily: 'Menlo',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    color: colors.voltDark,
    textTransform: 'uppercase',
  },
  restOverlayTimer: {
    fontFamily: 'Menlo',
    fontSize: 180,
    fontWeight: '900',
    color: colors.voltDark,
    letterSpacing: -8,
    lineHeight: 180,
    marginTop: spacing.lg,
  },
  restOverlayProgressTrack: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    marginTop: spacing.xl,
  },
  restOverlayProgressFill: {
    height: '100%',
    backgroundColor: colors.voltDark,
  },
  restOverlayHint: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.voltDark,
    opacity: 0.5,
    marginTop: spacing.xl,
  },
  restOverlayFooter: {
    position: 'absolute',
    bottom: spacing.xxl + spacing.lg,
    alignItems: 'center',
  },
  restOverlayMeta: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    color: colors.voltDark,
    opacity: 0.6,
  },
  restOverlayNextEx: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: colors.voltDark,
    marginTop: 4,
    textTransform: 'lowercase',
  },
  upNextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  upNextName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'lowercase',
  },
  upNextMeta: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: colors.borderStrong,
  },
  completeTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -2,
    marginTop: spacing.md,
    textTransform: 'lowercase',
  },
  completeSub: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: spacing.md,
  },
});
