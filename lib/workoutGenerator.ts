// Workout generator. Builds a weekly split based on goal + experience + gym access.
// Pure functions, no side effects, no React. Easy to test, easy to swap later.

export type Goal = 'cut' | 'maintain' | 'bulk';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type GymAccess = 'full_gym' | 'home_gym' | 'bodyweight';
export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps'
  | 'quads' | 'hamstrings' | 'glutes' | 'calves' | 'core';

export interface Exercise {
  id: string;
  name: string;
  primary: MuscleGroup;
  secondary: MuscleGroup[];
  equipment: GymAccess[]; // which environments this exercise works in
  compound: boolean;
}

export interface WorkoutSet {
  weight: number | null; // null for bodyweight
  reps: number;
  rpe?: number; // perceived exertion 1-10
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: number;
  targetReps: number;
  suggestedWeight: number | null;
  restSeconds: number;
}

export interface DayPlan {
  id: string;
  name: string;
  focus: string; // e.g. "CHEST · TRI"
  exercises: WorkoutExercise[];
  estimatedMinutes: number;
}

export interface WeekPlan {
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  days: DayPlan[];
}

// ---------- Exercise library ----------
// Curated, not exhaustive. Add more as you grow.
export const EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench press', primary: 'chest', secondary: ['triceps', 'shoulders'], equipment: ['full_gym', 'home_gym'], compound: true },
  { id: 'incline-db-press', name: 'Incline DB press', primary: 'chest', secondary: ['shoulders', 'triceps'], equipment: ['full_gym', 'home_gym'], compound: true },
  { id: 'cable-fly', name: 'Cable fly', primary: 'chest', secondary: [], equipment: ['full_gym'], compound: false },
  { id: 'pushup', name: 'Push-up', primary: 'chest', secondary: ['triceps', 'shoulders', 'core'], equipment: ['full_gym', 'home_gym', 'bodyweight'], compound: true },

  // Back
  { id: 'deadlift', name: 'Deadlift', primary: 'back', secondary: ['hamstrings', 'glutes', 'core'], equipment: ['full_gym', 'home_gym'], compound: true },
  { id: 'pullup', name: 'Pull-up', primary: 'back', secondary: ['biceps'], equipment: ['full_gym', 'home_gym', 'bodyweight'], compound: true },
  { id: 'barbell-row', name: 'Barbell row', primary: 'back', secondary: ['biceps'], equipment: ['full_gym', 'home_gym'], compound: true },
  { id: 'lat-pulldown', name: 'Lat pulldown', primary: 'back', secondary: ['biceps'], equipment: ['full_gym'], compound: true },

  // Shoulders
  { id: 'ohp', name: 'Overhead press', primary: 'shoulders', secondary: ['triceps'], equipment: ['full_gym', 'home_gym'], compound: true },
  { id: 'lateral-raise', name: 'Lateral raise', primary: 'shoulders', secondary: [], equipment: ['full_gym', 'home_gym'], compound: false },
  { id: 'rear-delt-fly', name: 'Rear delt fly', primary: 'shoulders', secondary: ['back'], equipment: ['full_gym', 'home_gym'], compound: false },

  // Arms
  { id: 'tricep-pushdown', name: 'Tricep pushdown', primary: 'triceps', secondary: [], equipment: ['full_gym'], compound: false },
  { id: 'db-curl', name: 'DB curl', primary: 'biceps', secondary: [], equipment: ['full_gym', 'home_gym'], compound: false },
  { id: 'hammer-curl', name: 'Hammer curl', primary: 'biceps', secondary: [], equipment: ['full_gym', 'home_gym'], compound: false },

  // Legs
  { id: 'squat', name: 'Back squat', primary: 'quads', secondary: ['glutes', 'hamstrings', 'core'], equipment: ['full_gym', 'home_gym'], compound: true },
  { id: 'rdl', name: 'Romanian deadlift', primary: 'hamstrings', secondary: ['glutes', 'back'], equipment: ['full_gym', 'home_gym'], compound: true },
  { id: 'leg-press', name: 'Leg press', primary: 'quads', secondary: ['glutes'], equipment: ['full_gym'], compound: true },
  { id: 'walking-lunge', name: 'Walking lunge', primary: 'quads', secondary: ['glutes', 'hamstrings'], equipment: ['full_gym', 'home_gym', 'bodyweight'], compound: true },
  { id: 'calf-raise', name: 'Calf raise', primary: 'calves', secondary: [], equipment: ['full_gym', 'home_gym', 'bodyweight'], compound: false },
  { id: 'hip-thrust', name: 'Hip thrust', primary: 'glutes', secondary: ['hamstrings'], equipment: ['full_gym', 'home_gym'], compound: true },

  // Core
  { id: 'plank', name: 'Plank', primary: 'core', secondary: [], equipment: ['full_gym', 'home_gym', 'bodyweight'], compound: false },
  { id: 'hanging-leg-raise', name: 'Hanging leg raise', primary: 'core', secondary: [], equipment: ['full_gym', 'home_gym'], compound: false },
];

// ---------- Split templates ----------
// Each split is a list of focuses. We'll fill each focus with exercises from
// the library that match the user's gym access.
type SplitTemplate = {
  daysPerWeek: number;
  days: { name: string; focus: string; primaryGroups: MuscleGroup[] }[];
};

const SPLITS: Record<Experience, SplitTemplate> = {
  beginner: {
    // Full body 3x/week — proven for novice progression
    daysPerWeek: 3,
    days: [
      { name: 'Full body A', focus: 'PUSH · PULL · LEGS', primaryGroups: ['chest', 'back', 'quads'] },
      { name: 'Full body B', focus: 'PUSH · PULL · LEGS', primaryGroups: ['shoulders', 'back', 'hamstrings'] },
      { name: 'Full body C', focus: 'PUSH · PULL · LEGS', primaryGroups: ['chest', 'back', 'glutes'] },
    ],
  },
  intermediate: {
    // PPL once through — 4 days lets the user choose 4 of 6 if recovery is tight
    daysPerWeek: 4,
    days: [
      { name: 'Push day', focus: 'CHEST · TRI', primaryGroups: ['chest', 'triceps', 'shoulders'] },
      { name: 'Pull day', focus: 'BACK · BI', primaryGroups: ['back', 'biceps'] },
      { name: 'Leg day', focus: 'QUAD · GLUTE', primaryGroups: ['quads', 'glutes', 'hamstrings', 'calves'] },
      { name: 'Upper', focus: 'CHEST · BACK · SHO', primaryGroups: ['chest', 'back', 'shoulders'] },
    ],
  },
  advanced: {
    // PPL x2 — high frequency, high volume
    daysPerWeek: 6,
    days: [
      { name: 'Push A', focus: 'CHEST · TRI', primaryGroups: ['chest', 'triceps', 'shoulders'] },
      { name: 'Pull A', focus: 'BACK · BI', primaryGroups: ['back', 'biceps'] },
      { name: 'Legs A', focus: 'QUAD FOCUS', primaryGroups: ['quads', 'glutes', 'calves'] },
      { name: 'Push B', focus: 'SHO · CHEST', primaryGroups: ['shoulders', 'chest', 'triceps'] },
      { name: 'Pull B', focus: 'BACK · ARMS', primaryGroups: ['back', 'biceps'] },
      { name: 'Legs B', focus: 'POSTERIOR', primaryGroups: ['hamstrings', 'glutes', 'calves'] },
    ],
  },
};

// ---------- Volume rules ----------
// Sets and reps tuned by goal. These are starting points; the adaptive
// engine (phase 2) can adjust them.
function setsRepsForGoal(goal: Goal, isCompound: boolean) {
  if (goal === 'bulk') return isCompound ? { sets: 4, reps: 6 } : { sets: 3, reps: 10 };
  if (goal === 'cut') return isCompound ? { sets: 3, reps: 8 } : { sets: 3, reps: 12 };
  return isCompound ? { sets: 3, reps: 8 } : { sets: 3, reps: 10 };
}

function restForExercise(isCompound: boolean) {
  return isCompound ? 120 : 60; // seconds
}

// ---------- Public API ----------
export interface PlanInput {
  goal: Goal;
  experience: Experience;
  gymAccess: GymAccess;
  bodyweightLbs: number;
}

export function generateWeekPlan(input: PlanInput): WeekPlan {
  const split = SPLITS[input.experience];

  // Track compound usage across the week. We allow each compound to appear
  // at most twice per week — never twice on adjacent training days. Isolation
  // lifts can repeat freely (same lateral raise on push A and push B is fine).
  const compoundUsageCount: Record<string, number> = {};

  const days: DayPlan[] = split.days.map((dayTpl, idx) => {
    const exercises = pickExercisesForDay(
      dayTpl.primaryGroups,
      input.gymAccess,
      input.experience,
      compoundUsageCount
    );

    // Mark compounds as used
    for (const ex of exercises) {
      if (ex.compound) {
        compoundUsageCount[ex.id] = (compoundUsageCount[ex.id] ?? 0) + 1;
      }
    }

    const workoutExercises: WorkoutExercise[] = exercises.map((ex) => {
      const { sets, reps } = setsRepsForGoal(input.goal, ex.compound);
      return {
        exercise: ex,
        sets,
        targetReps: reps,
        suggestedWeight: suggestStartingWeight(ex, input.bodyweightLbs, input.experience),
        restSeconds: restForExercise(ex.compound),
      };
    });

    // Estimate ~3.5 min per set (work + rest avg)
    const totalSets = workoutExercises.reduce((sum, e) => sum + e.sets, 0);
    const estimatedMinutes = Math.round(totalSets * 3.5);

    return {
      id: `day-${idx}`,
      name: dayTpl.name,
      focus: dayTpl.focus,
      exercises: workoutExercises,
      estimatedMinutes,
    };
  });

  return {
    goal: input.goal,
    experience: input.experience,
    daysPerWeek: split.daysPerWeek,
    days,
  };
}

function pickExercisesForDay(
  groups: MuscleGroup[],
  access: GymAccess,
  experience: Experience,
  compoundUsage: Record<string, number>
): Exercise[] {
  const numExercises = experience === 'beginner' ? 5 : experience === 'intermediate' ? 6 : 7;
  const MAX_COMPOUND_PER_WEEK = 2; // a compound can appear at most twice per week

  const available = EXERCISES.filter((ex) => ex.equipment.includes(access));
  const compoundAvailable = (id: string) =>
    (compoundUsage[id] ?? 0) < MAX_COMPOUND_PER_WEEK;

  const picked: Exercise[] = [];
  const usedToday = new Set<string>();

  // Pass 1: one compound per primary group, respecting weekly cap
  for (const group of groups) {
    const compound = available.find(
      (ex) =>
        ex.primary === group &&
        ex.compound &&
        !usedToday.has(ex.id) &&
        compoundAvailable(ex.id)
    );
    if (compound) {
      picked.push(compound);
      usedToday.add(compound.id);
    }
  }

  // Pass 2: isolation work for the same primary groups (no week cap on isolation)
  for (const group of groups) {
    if (picked.length >= numExercises) break;
    const isolation = available.find(
      (ex) => ex.primary === group && !ex.compound && !usedToday.has(ex.id)
    );
    if (isolation) {
      picked.push(isolation);
      usedToday.add(isolation.id);
    }
  }

  // Pass 3: secondary-hitting isolation lifts only. We don't want compounds
  // sneaking in here — that's how deadlift ends up on both Pull and Leg day.
  for (const group of groups) {
    if (picked.length >= numExercises) break;
    const secondary = available.find(
      (ex) =>
        !ex.compound &&
        ex.secondary.includes(group) &&
        !usedToday.has(ex.id)
    );
    if (secondary) {
      picked.push(secondary);
      usedToday.add(secondary.id);
    }
  }

  // Pass 4: backfill with any remaining isolation lifts that hit our groups
  for (const group of groups) {
    if (picked.length >= numExercises) break;
    const extra = available.find(
      (ex) =>
        !ex.compound &&
        (ex.primary === group || ex.secondary.includes(group)) &&
        !usedToday.has(ex.id)
    );
    if (extra) {
      picked.push(extra);
      usedToday.add(extra.id);
    }
  }

  // Pass 5: still short? Backfill with primary-group compounds (respecting
  // weekly cap). This is what pulls in barbell-row / lat-pulldown on pull day
  // when there's not enough back isolation work to fill the slots.
  for (const group of groups) {
    if (picked.length >= numExercises) break;
    const compound = available.find(
      (ex) =>
        ex.primary === group &&
        ex.compound &&
        !usedToday.has(ex.id) &&
        compoundAvailable(ex.id)
    );
    if (compound) {
      picked.push(compound);
      usedToday.add(compound.id);
    }
  }

  return picked.slice(0, numExercises);
}

// Naive starting-weight suggestion. Realistic enough for MVP; replace with
// 1RM-based progression once the user has logged a few sessions.
function suggestStartingWeight(
  ex: Exercise,
  bodyweight: number,
  experience: Experience
): number | null {
  if (ex.equipment.length === 1 && ex.equipment[0] === 'bodyweight') return null;

  const expMultiplier = experience === 'beginner' ? 0.5 : experience === 'intermediate' ? 0.75 : 1.0;

  // Compound lifts — multiples of bodyweight
  const compoundRatios: Record<string, number> = {
    'bench-press': 0.75,
    'squat': 1.0,
    'deadlift': 1.25,
    'ohp': 0.5,
    'barbell-row': 0.7,
    'rdl': 0.85,
    'leg-press': 1.5,
    'incline-db-press': 0.3, // per dumbbell
    'hip-thrust': 1.2,
    'lat-pulldown': 0.55,
  };

  // Isolation lifts — small fixed weights scaled by experience (in lbs per dumbbell)
  // Most cable/isolation work doesn't track bodyweight; these are realistic novice/intermediate starts.
  const isolationDefaults: Record<string, number> = {
    'tricep-pushdown': 30,   // cable stack
    'lateral-raise': 10,     // per DB
    'rear-delt-fly': 10,     // per DB
    'cable-fly': 20,         // per side
    'db-curl': 20,           // per DB
    'hammer-curl': 25,       // per DB
    'calf-raise': 90,        // body + machine load
  };

  const compoundRatio = compoundRatios[ex.id];
  if (compoundRatio !== undefined) {
    const raw = bodyweight * compoundRatio * expMultiplier;
    return Math.round(raw / 5) * 5; // round to nearest 5 lbs
  }

  const isolation = isolationDefaults[ex.id];
  if (isolation !== undefined) {
    const raw = isolation * expMultiplier;
    // round to nearest 2.5 lb for small isolation, 5 lb for cable/machine
    const step = isolation < 30 ? 2.5 : 5;
    return Math.round(raw / step) * step;
  }

  // Fallback: small dumbbell weight
  return Math.round((15 + (experience === 'advanced' ? 15 : experience === 'intermediate' ? 5 : 0)) / 5) * 5;
}
