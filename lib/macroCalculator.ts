// Macro calculator. Mifflin-St Jeor for BMR, activity multiplier for TDEE,
// then goal-based calorie offset and macro distribution.
// Pure functions, no React. Same as workoutGenerator.

import type { Goal, Experience } from './workoutGenerator';

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'high' | 'athlete';

export interface MacroInput {
  sex: Sex;
  ageYears: number;
  heightInches: number;
  weightLbs: number;
  activity: ActivityLevel;
  goal: Goal;
}

export interface MacroTargets {
  bmr: number;        // basal metabolic rate
  tdee: number;       // total daily energy expenditure
  calories: number;   // target intake
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,   // desk job, no training
  light: 1.375,     // 1-3 sessions/week
  moderate: 1.55,   // 4-5 sessions/week
  high: 1.725,      // 6-7 sessions/week
  athlete: 1.9,     // 2x/day or physical labor + training
};

// Mifflin-St Jeor (metric internally, convert at the boundary)
function mifflinStJeor(
  sex: Sex,
  ageYears: number,
  heightCm: number,
  weightKg: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}

const LBS_TO_KG = 0.453592;
const IN_TO_CM = 2.54;

export function calculateMacros(input: MacroInput): MacroTargets {
  const weightKg = input.weightLbs * LBS_TO_KG;
  const heightCm = input.heightInches * IN_TO_CM;

  const bmr = mifflinStJeor(input.sex, input.ageYears, heightCm, weightKg);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[input.activity];

  // Goal-based calorie offset
  // Cut: -20% (sustainable; aggressive cuts wreck adherence)
  // Maintain: 0
  // Bulk: +10% (lean gain; +20% just adds fat)
  let calories: number;
  if (input.goal === 'cut') calories = tdee * 0.8;
  else if (input.goal === 'bulk') calories = tdee * 1.1;
  else calories = tdee;

  // Macro split. Protein scales with bodyweight (1g/lb on cut, 0.9g on
  // maintain, 0.8g on bulk — protein need is mostly bodyweight-driven, not
  // calorie-driven).
  const proteinG = Math.round(
    input.weightLbs * (input.goal === 'cut' ? 1.0 : input.goal === 'bulk' ? 0.8 : 0.9)
  );

  // Fats: 25% of calories (floor at 0.3g/lb for hormonal health)
  const fatsFromPct = (calories * 0.25) / 9;
  const fatsFloor = input.weightLbs * 0.3;
  const fatsG = Math.round(Math.max(fatsFromPct, fatsFloor));

  // Carbs fill the rest
  const proteinCals = proteinG * 4;
  const fatCals = fatsG * 9;
  const carbsCals = Math.max(0, calories - proteinCals - fatCals);
  const carbsG = Math.round(carbsCals / 4);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories: Math.round(calories),
    proteinG,
    carbsG,
    fatsG,
  };
}

// Map a user's training experience to a sensible default activity level.
// Useful for onboarding so they don't have to answer two redundant questions.
export function activityFromExperience(exp: Experience): ActivityLevel {
  if (exp === 'beginner') return 'light';
  if (exp === 'intermediate') return 'moderate';
  return 'high';
}
