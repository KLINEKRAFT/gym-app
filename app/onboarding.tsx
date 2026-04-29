import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../lib/store';
import { colors, spacing, radii, type } from '../lib/tokens';
import { Button, Card, Eyebrow, Tag } from '../components/ui';
import type { Goal, Experience, GymAccess } from '../lib/workoutGenerator';
import type { Sex } from '../lib/macroCalculator';

type Step = 0 | 1 | 2 | 3 | 4;

export default function Onboarding() {
  const setProfile = useAppStore((s) => s.setProfile);
  const [step, setStep] = useState<Step>(0);

  const [name, setName] = useState('Colin');
  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('34');
  const [heightFt, setHeightFt] = useState('5');
  const [heightIn, setHeightIn] = useState('11');
  const [weight, setWeight] = useState('185');
  const [goalWeight, setGoalWeight] = useState('175');
  const [goal, setGoal] = useState<Goal>('cut');
  const [experience, setExperience] = useState<Experience>('intermediate');
  const [gymAccess, setGymAccess] = useState<GymAccess>('full_gym');

  const next = () => setStep((s) => Math.min(4, (s + 1) as Step));
  const back = () => setStep((s) => Math.max(0, (s - 1) as Step));

  const finish = () => {
    setProfile({
      name,
      sex,
      ageYears: parseInt(age) || 30,
      heightInches: (parseInt(heightFt) || 5) * 12 + (parseInt(heightIn) || 0),
      weightLbs: parseFloat(weight) || 180,
      goalWeightLbs: parseFloat(goalWeight) || 180,
      goal,
      experience,
      gymAccess,
    });
    router.replace('/(tabs)');
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Eyebrow>STEP {step + 1} / 5</Eyebrow>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 5) * 100}%` }]} />
        </View>
      </View>

      {step === 0 && (
        <View style={styles.stepContent}>
          <Text style={styles.title}>welcome.{'\n'}let's get you set up.</Text>
          <Text style={styles.subtitle}>
            Five quick questions. We use them to build your plan, your macros, and your starting numbers.
          </Text>
          <View style={{ marginTop: spacing.xl }}>
            <Eyebrow>NAME</Eyebrow>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="your name"
              placeholderTextColor={colors.textDim}
            />
          </View>
        </View>
      )}

      {step === 1 && (
        <View style={styles.stepContent}>
          <Text style={styles.title}>the basics.</Text>
          <Text style={styles.subtitle}>Used to calculate your daily calorie target.</Text>

          <View style={{ marginTop: spacing.lg }}>
            <Eyebrow>SEX</Eyebrow>
            <View style={styles.choiceRow}>
              <Choice label="male" active={sex === 'male'} onPress={() => setSex('male')} />
              <Choice label="female" active={sex === 'female'} onPress={() => setSex('female')} />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Eyebrow>AGE</Eyebrow>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow>WEIGHT (LBS)</Eyebrow>
              <TextInput
                style={styles.input}
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Eyebrow>HEIGHT (FT)</Eyebrow>
              <TextInput
                style={styles.input}
                value={heightFt}
                onChangeText={setHeightFt}
                keyboardType="numeric"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Eyebrow>HEIGHT (IN)</Eyebrow>
              <TextInput
                style={styles.input}
                value={heightIn}
                onChangeText={setHeightIn}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      )}

      {step === 2 && (
        <View style={styles.stepContent}>
          <Text style={styles.title}>what's the goal?</Text>
          <Text style={styles.subtitle}>This sets your calories and rep ranges.</Text>

          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <BigChoice
              label="cut"
              caption="LOSE FAT — 20% CALORIE DEFICIT"
              active={goal === 'cut'}
              onPress={() => setGoal('cut')}
            />
            <BigChoice
              label="maintain"
              caption="HOLD WEIGHT — RECOMP FOCUS"
              active={goal === 'maintain'}
              onPress={() => setGoal('maintain')}
            />
            <BigChoice
              label="bulk"
              caption="BUILD MUSCLE — 10% SURPLUS"
              active={goal === 'bulk'}
              onPress={() => setGoal('bulk')}
            />
          </View>

          <View style={{ marginTop: spacing.lg }}>
            <Eyebrow>GOAL WEIGHT (LBS)</Eyebrow>
            <TextInput
              style={styles.input}
              value={goalWeight}
              onChangeText={setGoalWeight}
              keyboardType="numeric"
            />
          </View>
        </View>
      )}

      {step === 3 && (
        <View style={styles.stepContent}>
          <Text style={styles.title}>experience level?</Text>
          <Text style={styles.subtitle}>
            Decides your training split, volume, and starting weights.
          </Text>

          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <BigChoice
              label="beginner"
              caption="UNDER 1 YEAR · FULL BODY 3X"
              active={experience === 'beginner'}
              onPress={() => setExperience('beginner')}
            />
            <BigChoice
              label="intermediate"
              caption="1–3 YEARS · PPL 4X"
              active={experience === 'intermediate'}
              onPress={() => setExperience('intermediate')}
            />
            <BigChoice
              label="advanced"
              caption="3+ YEARS · PPL 6X"
              active={experience === 'advanced'}
              onPress={() => setExperience('advanced')}
            />
          </View>
        </View>
      )}

      {step === 4 && (
        <View style={styles.stepContent}>
          <Text style={styles.title}>where do you train?</Text>
          <Text style={styles.subtitle}>We pick exercises that match your equipment.</Text>

          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <BigChoice
              label="full gym"
              caption="BARBELLS · MACHINES · CABLES"
              active={gymAccess === 'full_gym'}
              onPress={() => setGymAccess('full_gym')}
            />
            <BigChoice
              label="home gym"
              caption="DBS · BARBELL · BENCH"
              active={gymAccess === 'home_gym'}
              onPress={() => setGymAccess('home_gym')}
            />
            <BigChoice
              label="bodyweight"
              caption="NO EQUIPMENT NEEDED"
              active={gymAccess === 'bodyweight'}
              onPress={() => setGymAccess('bodyweight')}
            />
          </View>
        </View>
      )}

      <View style={styles.actions}>
        {step > 0 && <Button label="back" variant="outline" onPress={back} style={{ flex: 1 }} />}
        <Button
          label={step === 4 ? 'generate plan ▶' : 'next'}
          onPress={step === 4 ? finish : next}
          style={{ flex: 2 }}
        />
      </View>
    </ScrollView>
  );
}

// ---------- Sub-components ----------

function Choice({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Card
      variant={active ? 'volt' : 'default'}
      style={{ flex: 1, alignItems: 'center' } as any}
    >
      <Text
        onPress={onPress}
        style={[
          choiceStyles.label,
          { color: active ? colors.voltDark : colors.text },
        ]}
      >
        {label}
      </Text>
    </Card>
  );
}

function BigChoice({
  label,
  caption,
  active,
  onPress,
}: {
  label: string;
  caption: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <View
      style={[
        choiceStyles.bigBase,
        active ? choiceStyles.bigActive : choiceStyles.bigInactive,
      ]}
      onTouchEnd={onPress}
    >
      <Text
        style={[
          choiceStyles.bigLabel,
          { color: active ? colors.voltDark : colors.text },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          choiceStyles.bigCaption,
          { color: active ? colors.voltDark : colors.textMuted },
        ]}
      >
        {caption}
      </Text>
    </View>
  );
}

const choiceStyles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: spacing.sm,
  },
  bigBase: {
    padding: spacing.lg,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  bigActive: {
    backgroundColor: colors.volt,
    borderColor: colors.volt,
  },
  bigInactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  bigLabel: {
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  bigCaption: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 4,
  },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  header: {
    gap: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.volt,
  },
  stepContent: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    lineHeight: 36,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMuted,
    lineHeight: 20,
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
  fieldRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
