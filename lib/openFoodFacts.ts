// Open Food Facts barcode lookup. Free, no API key, ~3M products worldwide.
// Docs: https://openfoodfacts.github.io/openfoodfacts-server/api/
//
// Endpoint shape (v2):
//   https://world.openfoodfacts.org/api/v2/product/{barcode}.json
//
// We extract macros per 100g (their canonical unit) and return null for fields
// we can't trust. The caller decides what to do with partial data.

export interface OpenFoodFactsResult {
  found: boolean;
  barcode: string;
  name?: string;
  brand?: string;
  servingSizeG?: number; // suggested portion (often the package label)
  // All macros below are PER 100G as returned by the API
  caloriesPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatsPer100g?: number;
  imageUrl?: string;
}

// Pull a numeric nutriment safely. OFF returns these as numbers but missing
// fields are undefined, so we coalesce.
function num(x: unknown): number | undefined {
  if (typeof x === 'number' && !isNaN(x) && isFinite(x)) return x;
  return undefined;
}

export async function lookupBarcode(barcode: string): Promise<OpenFoodFactsResult> {
  const cleaned = barcode.replace(/\D/g, '');
  if (cleaned.length < 8) {
    return { found: false, barcode };
  }

  const url = `https://world.openfoodfacts.org/api/v2/product/${cleaned}.json`;

  try {
    const res = await fetch(url, {
      headers: {
        // OFF requests we identify our app for analytics. They don't enforce
        // it but it's polite.
        'User-Agent': 'KlinekraftGym/0.1 (https://github.com/klinekraft)',
      },
    });

    if (!res.ok) return { found: false, barcode: cleaned };

    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return { found: false, barcode: cleaned };
    }

    const p = data.product;
    const n = p.nutriments ?? {};

    // Serving size — OFF stores `serving_size` as a free-text string like
    // "30 g" or "1 cup (240 ml)". We try to extract grams.
    let servingSizeG: number | undefined;
    if (typeof p.serving_size === 'string') {
      const match = p.serving_size.match(/(\d+\.?\d*)\s*g/i);
      if (match) servingSizeG = parseFloat(match[1]);
    }

    return {
      found: true,
      barcode: cleaned,
      name: p.product_name || p.generic_name,
      brand: p.brands?.split(',')[0]?.trim(),
      servingSizeG,
      caloriesPer100g: num(n['energy-kcal_100g']) ?? num(n['energy-kcal']),
      proteinPer100g: num(n.proteins_100g),
      carbsPer100g: num(n.carbohydrates_100g),
      fatsPer100g: num(n.fat_100g),
      imageUrl: p.image_front_small_url || p.image_url,
    };
  } catch {
    return { found: false, barcode: cleaned };
  }
}

// Convert per-100g macros to a serving. If servingSizeG is provided, use it;
// otherwise default to 100g (1.0 multiplier).
export function macrosForServing(
  result: OpenFoodFactsResult,
  servingGrams: number
): { calories: number; proteinG: number; carbsG: number; fatsG: number } {
  const factor = servingGrams / 100;
  return {
    calories: Math.round((result.caloriesPer100g ?? 0) * factor),
    proteinG: Math.round((result.proteinPer100g ?? 0) * factor),
    carbsG: Math.round((result.carbsPer100g ?? 0) * factor),
    fatsG: Math.round((result.fatsPer100g ?? 0) * factor),
  };
}
