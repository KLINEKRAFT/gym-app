import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useAppStore } from '../lib/store';
import { colors, spacing, radii } from '../lib/tokens';
import { Eyebrow, Button, Card } from '../components/ui';
import {
  lookupBarcode,
  macrosForServing,
  type OpenFoodFactsResult,
} from '../lib/openFoodFacts';

// On native, use the camera. On web, expo-camera doesn't do barcode scanning,
// so we fall back to a manual barcode input. The product lookup logic is
// shared between both paths.
const isWeb = Platform.OS === 'web';

// Try to import the camera. If we're on web, this will fail at runtime so we
// guard it with a try/catch wrapped in a dynamic require.
let CameraView: any = null;
let useCameraPermissions: any = null;
if (!isWeb) {
  try {
    const cam = require('expo-camera');
    CameraView = cam.CameraView;
    useCameraPermissions = cam.useCameraPermissions;
  } catch {
    // Module not available — native build must include it
  }
}

export default function ScanScreen() {
  const addFood = useAppStore((s) => s.addFood);

  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<OpenFoodFactsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [servingG, setServingG] = useState('100');
  const [meal, setMeal] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>(getDefaultMeal());

  // Camera permission (native only)
  const [permission, requestPermission] = useCameraPermissions
    ? useCameraPermissions()
    : [null, null];

  useEffect(() => {
    if (permission && !permission.granted && permission.canAskAgain) {
      requestPermission?.();
    }
  }, [permission?.granted]);

  const handleBarcode = async (barcode: string) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    setError(null);
    try {
      const result = await lookupBarcode(barcode);
      if (!result.found) {
        setError(`No product found for ${barcode}. Try entering it manually below.`);
        setScanned(false);
        return;
      }
      setProduct(result);
      if (result.servingSizeG) setServingG(String(result.servingSizeG));
    } catch {
      setError("Couldn't reach the food database. Check your connection.");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setScanned(false);
    setProduct(null);
    setError(null);
    setManualBarcode('');
    setServingG('100');
  };

  const logIt = () => {
    if (!product) return;
    const grams = parseFloat(servingG) || 100;
    const macros = macrosForServing(product, grams);
    addFood({
      meal,
      name: product.name ?? `Product ${product.barcode}`,
      description: [product.brand, `${grams}g serving`].filter(Boolean).join(' · '),
      ...macros,
    });
    router.replace('/(tabs)/fuel');
  };

  // ---------- Result view ----------
  if (product) {
    const grams = parseFloat(servingG) || 100;
    const macros = macrosForServing(product, grams);

    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.exitBtn}>✕</Text>
          </Pressable>
          <Eyebrow volt>// FOUND</Eyebrow>
          <View style={{ width: 32 }} />
        </View>

        <View style={styles.resultContent}>
          <Eyebrow>{product.brand?.toUpperCase() ?? 'UNKNOWN BRAND'}</Eyebrow>
          <Text style={styles.productName}>{product.name?.toLowerCase()}</Text>

          {/* Big calorie number */}
          <View style={styles.calBlock}>
            <Eyebrow volt>// {grams}G SERVING</Eyebrow>
            <Text style={styles.calNum}>{macros.calories}</Text>
            <Eyebrow>KCAL</Eyebrow>
          </View>

          {/* Macro grid */}
          <View style={styles.macroRow}>
            <MacroCell label="PROTEIN" value={macros.proteinG} />
            <MacroCell label="CARBS" value={macros.carbsG} />
            <MacroCell label="FATS" value={macros.fatsG} />
          </View>

          {/* Serving editor */}
          <View style={{ marginTop: spacing.lg }}>
            <Eyebrow>SERVING (G)</Eyebrow>
            <TextInput
              style={styles.servingInput}
              value={servingG}
              onChangeText={setServingG}
              keyboardType="numeric"
            />
          </View>

          {/* Meal selector */}
          <Eyebrow style={{ marginTop: spacing.md }}>MEAL</Eyebrow>
          <View style={styles.mealRow}>
            {(['breakfast', 'lunch', 'dinner', 'snack'] as const).map((m) => (
              <Pressable
                key={m}
                onPress={() => setMeal(m)}
                style={[
                  styles.mealChoice,
                  meal === m ? styles.mealActive : styles.mealInactive,
                ]}
              >
                <Text
                  style={[
                    styles.mealText,
                    { color: meal === m ? colors.voltDark : colors.text },
                  ]}
                >
                  {m}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button label="log it ▶" onPress={logIt} style={{ marginTop: spacing.lg }} />
          <Button label="scan another" variant="outline" onPress={reset} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    );
  }

  // ---------- Scanner / manual entry view ----------
  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.exitBtn}>✕</Text>
        </Pressable>
        <Eyebrow volt>// SCAN BARCODE</Eyebrow>
        <View style={{ width: 32 }} />
      </View>

      {/* Camera viewfinder (native only, with permission) */}
      {!isWeb && CameraView && permission?.granted && (
        <View style={styles.cameraWrap}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39'],
            }}
            onBarcodeScanned={scanned ? undefined : (e: any) => handleBarcode(e.data)}
          />
          {/* Reticle */}
          <View style={styles.reticle}>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </View>
          <View style={styles.cameraHint}>
            <Eyebrow volt>POINT AT BARCODE</Eyebrow>
          </View>
        </View>
      )}

      {/* Permission prompt */}
      {!isWeb && CameraView && permission && !permission.granted && (
        <View style={styles.fallback}>
          <Eyebrow>// CAMERA ACCESS NEEDED</Eyebrow>
          <Text style={styles.fallbackText}>
            we need camera permission to scan barcodes.
          </Text>
          <Button label="grant access" onPress={() => requestPermission?.()} style={{ marginTop: spacing.md }} />
        </View>
      )}

      {/* Web fallback or no camera available */}
      {(isWeb || !CameraView) && (
        <View style={styles.fallback}>
          <Eyebrow>// MANUAL ENTRY</Eyebrow>
          <Text style={styles.fallbackText}>
            barcode scanning works in the native iOS/android app.{'\n'}
            on web, type or paste the barcode below.
          </Text>
        </View>
      )}

      {/* Loading + errors */}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.volt} />
          <Eyebrow volt style={{ marginLeft: spacing.sm }}>LOOKING UP...</Eyebrow>
        </View>
      )}

      {error && (
        <Card variant="outlined" style={{ marginHorizontal: spacing.lg, marginTop: spacing.md } as any}>
          <Text style={styles.errorText}>{error}</Text>
        </Card>
      )}

      {/* Manual barcode entry — always visible as a fallback */}
      <View style={styles.manualWrap}>
        <Eyebrow>OR ENTER BARCODE</Eyebrow>
        <TextInput
          style={styles.manualInput}
          value={manualBarcode}
          onChangeText={setManualBarcode}
          placeholder="e.g. 0028400090005"
          placeholderTextColor={colors.textDim}
          keyboardType="numeric"
        />
        <Button
          label="look up"
          variant="outline"
          onPress={() => handleBarcode(manualBarcode)}
          disabled={!manualBarcode.trim() || loading}
          style={{ marginTop: spacing.sm }}
        />
      </View>
    </View>
  );
}

// ---------- Helpers ----------

function MacroCell({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.macroCell}>
      <Eyebrow>{label}</Eyebrow>
      <Text style={styles.macroValue}>{value}<Text style={styles.macroUnit}>g</Text></Text>
    </View>
  );
}

function getDefaultMeal(): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 14) return 'lunch';
  if (h < 19) return 'dinner';
  return 'snack';
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
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

  cameraWrap: {
    flex: 1,
    backgroundColor: '#000',
    position: 'relative',
    overflow: 'hidden',
  },
  reticle: {
    position: 'absolute',
    top: '30%',
    left: '15%',
    right: '15%',
    bottom: '40%',
  },
  corner: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderColor: colors.volt,
    borderWidth: 0,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  cameraHint: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
  },

  fallback: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  fallbackText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
  },

  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },

  manualWrap: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 'auto',
  },
  manualInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.xs,
    fontFamily: 'Menlo',
    letterSpacing: 1,
  },

  // Result view
  resultContent: {
    paddingHorizontal: spacing.lg,
  },
  productName: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    textTransform: 'lowercase',
    marginTop: 4,
    lineHeight: 32,
  },
  calBlock: {
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  calNum: {
    fontSize: 80,
    fontWeight: '900',
    color: colors.volt,
    letterSpacing: -3,
    lineHeight: 80,
    marginVertical: spacing.xs,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  macroCell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
  },
  macroValue: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -1,
    marginTop: 4,
  },
  macroUnit: {
    fontSize: 14,
    color: colors.textMuted,
  },
  servingInput: {
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
  mealRow: {
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
  mealActive: {
    backgroundColor: colors.volt,
    borderColor: colors.volt,
  },
  mealInactive: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  mealText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
