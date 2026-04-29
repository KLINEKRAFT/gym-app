import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore, todayMacroTotalsSelector, todayFoodSelector } from '../../lib/store';
import { colors, spacing, radii } from '../../lib/tokens';
import { Card, Eyebrow, Button, ProgressBar, Divider } from '../../components/ui';
import { KlinekraftFooter } from '../../components/KlinekraftFooter';

export default function FuelTab() {
  const macros = useAppStore((s) => s.macros);
  const totals = useAppStore(todayMacroTotalsSelector);
  const todayFood = useAppStore(todayFoodSelector);
  const addFood = useAppStore((s) => s.addFood);
  const removeFood = useAppStore((s) => s.removeFood);

  const [logOpen, setLogOpen] = useState(false);
  const [meal, setMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');
  const [foodName, setFoodName] = useState('');
  const [foodDesc, setFoodDesc] = useState('');
  const [cals, setCals] = useState('');
  const [prot, setProt] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');

  if (!macros) return null;

  const caloriesLeft = Math.max(0, macros.calories - totals.calories);

  const submitMeal = () => {
    if (!foodName.trim()) return;
    addFood({
      meal,
      name: foodName.trim(),
      description: foodDesc.trim(),
      calories: parseInt(cals) || 0,
      proteinG: parseInt(prot) || 0,
      carbsG: parseInt(carbs) || 0,
      fatsG: parseInt(fats) || 0,
    });
    setFoodName('');
    setFoodDesc('');
    setCals('');
    setProt('');
    setCarbs('');
    setFats('');
    setLogOpen(false);
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Eyebrow>// TODAY · KCAL</Eyebrow>
        <View style={styles.bigNumberRow}>
          <Text style={styles.bigNumber}>{totals.calories.toLocaleString()}</Text>
        </View>
        <Text style={styles.bigCaption}>
          / {macros.calories.toLocaleString()} TARGET ·{' '}
          <Text style={{ color: colors.volt }}>{caloriesLeft} LEFT</Text>
        </Text>
        <ProgressBar value={totals.calories} max={macros.calories} style={{ marginTop: spacing.sm }} />
      </View>

      {/* Macro grid */}
      <View style={styles.macroGrid}>
        <MacroBlock label="PROTEIN" value={totals.proteinG} target={macros.proteinG} unit="g" />
        <MacroBlock label="CARBS" value={totals.carbsG} target={macros.carbsG} unit="g" />
        <MacroBlock label="FATS" value={totals.fatsG} target={macros.fatsG} unit="g" />
      </View>

      <Divider />

      <View style={styles.logHead}>
        <Eyebrow>// LOG</Eyebrow>
        <Eyebrow>{todayFood.length} ITEMS</Eyebrow>
      </View>

      {todayFood.length === 0 && (
        <Card variant="outlined">
          <Text style={styles.emptyText}>nothing logged yet today.{'\n'}tap below to log a meal.</Text>
        </Card>
      )}

      {todayFood.map((entry) => (
        <Pressable key={entry.id} onLongPress={() => removeFood(entry.id)}>
          <Card>
            <View style={styles.mealHead}>
              <View style={{ flex: 1 }}>
                <Eyebrow>{entry.meal.toUpperCase()}</Eyebrow>
                <Text style={styles.mealName}>{entry.name}</Text>
                {entry.description ? (
                  <Text style={styles.mealDesc}>{entry.description.toUpperCase()}</Text>
                ) : null}
              </View>
              <Text style={styles.mealCals}>{entry.calories}</Text>
            </View>
            <View style={styles.mealMacros}>
              <Text style={styles.mealMacro}>P {entry.proteinG}</Text>
              <Text style={styles.mealMacro}>C {entry.carbsG}</Text>
              <Text style={styles.mealMacro}>F {entry.fatsG}</Text>
            </View>
          </Card>
        </Pressable>
      ))}

      <View style={styles.actionRow}>
        <Button
          label="◌ scan barcode"
          onPress={() => router.push('/scan')}
          style={{ flex: 2 }}
        />
        <Button
          label="+ manual"
          variant="outline"
          onPress={() => setLogOpen(true)}
          style={{ flex: 1 }}
        />
      </View>

      <KlinekraftFooter />

      {/* Log Meal Modal */}
      <Modal visible={logOpen} animationType="slide" transparent>
        <View style={styles.modalRoot}>
          <ScrollView style={styles.modalSheet} contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Eyebrow volt>// LOG MEAL</Eyebrow>
              <Pressable onPress={() => setLogOpen(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </Pressable>
            </View>

            <Eyebrow>MEAL</Eyebrow>
            <View style={styles.mealChoiceRow}>
              {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => setMeal(m)}
                  style={[
                    styles.mealChoice,
                    meal === m ? styles.mealChoiceActive : styles.mealChoiceInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.mealChoiceLabel,
                      { color: meal === m ? colors.voltDark : colors.text },
                    ]}
                  >
                    {m}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Eyebrow style={{ marginTop: spacing.lg }}>NAME</Eyebrow>
            <TextInput
              style={styles.input}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="e.g. chicken & rice"
              placeholderTextColor={colors.textDim}
            />

            <Eyebrow style={{ marginTop: spacing.md }}>DESCRIPTION</Eyebrow>
            <TextInput
              style={styles.input}
              value={foodDesc}
              onChangeText={setFoodDesc}
              placeholder="optional ingredients"
              placeholderTextColor={colors.textDim}
            />

            <View style={styles.macroInputRow}>
              <View style={{ flex: 1 }}>
                <Eyebrow>CAL</Eyebrow>
                <TextInput
                  style={styles.input}
                  value={cals}
                  onChangeText={setCals}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Eyebrow>P (G)</Eyebrow>
                <TextInput
                  style={styles.input}
                  value={prot}
                  onChangeText={setProt}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            <View style={styles.macroInputRow}>
              <View style={{ flex: 1 }}>
                <Eyebrow>C (G)</Eyebrow>
                <TextInput
                  style={styles.input}
                  value={carbs}
                  onChangeText={setCarbs}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Eyebrow>F (G)</Eyebrow>
                <TextInput
                  style={styles.input}
                  value={fats}
                  onChangeText={setFats}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textDim}
                />
              </View>
            </View>

            <Button label="log it" onPress={submitMeal} style={{ marginTop: spacing.lg }} />
            <Button
              label="cancel"
              variant="outline"
              onPress={() => setLogOpen(false)}
              style={{ marginTop: spacing.sm }}
            />
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

function MacroBlock({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target: number;
  unit: string;
}) {
  return (
    <View style={macStyles.block}>
      <Eyebrow>{label}</Eyebrow>
      <View style={macStyles.row}>
        <Text style={macStyles.value}>{value}</Text>
        <Text style={macStyles.target}>
          /{target}{unit}
        </Text>
      </View>
      <ProgressBar
        value={value}
        max={target}
        height={3}
        color={colors.text}
        style={{ marginTop: spacing.xs }}
      />
    </View>
  );
}

const macStyles = StyleSheet.create({
  block: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: spacing.xs,
  },
  value: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  target: {
    fontFamily: 'Menlo',
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: 2,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.md,
    gap: spacing.md,
  },
  header: { gap: spacing.xs },
  bigNumberRow: { marginTop: spacing.xs },
  bigNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -3,
    lineHeight: 60,
  },
  bigCaption: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },
  macroGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  logHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  mealHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'lowercase',
    marginTop: 4,
  },
  mealDesc: {
    fontFamily: 'Menlo',
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.8,
    color: colors.textMuted,
    marginTop: 2,
  },
  mealCals: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.volt,
    letterSpacing: -0.5,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  mealMacro: {
    fontFamily: 'Menlo',
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
  },

  // Modal
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.bg,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderTopColor: colors.borderStrong,
  },
  modalContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
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
  mealChoiceRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  mealChoice: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  mealChoiceActive: {
    backgroundColor: colors.volt,
    borderColor: colors.volt,
  },
  mealChoiceInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  mealChoiceLabel: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
    marginTop: spacing.xs,
  },
  macroInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
