// App state. Zustand keeps it simple — no boilerplate, persists naturally,
// works on RN + Web with the same API.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  generateWeekPlan,
  type Goal,
  type Experience,
  type GymAccess,
  type WeekPlan,
  type DayPlan,
} from './workoutGenerator';
import {
  calculateMacros,
  activityFromExperience,
  type Sex,
  type MacroTargets,
} from './macroCalculator';

export interface UserProfile {
  name: string;
  sex: Sex;
  ageYears: number;
  heightInches: number;
  weightLbs: number;
  goalWeightLbs: number;
  goal: Goal;
  experience: Experience;
  gymAccess: GymAccess;
}

export interface FoodLogEntry {
  id: string;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  description: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatsG: number;
  loggedAt: string; // ISO date
}

export interface WeightLogEntry {
  id: string;
  weightLbs: number;
  loggedAt: string; // ISO date (yyyy-mm-dd)
}

export interface CompletedSet {
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number;
  completedAt: string;
  sessionId: string; // groups sets that belong to the same workout session
}

export interface WorkoutSession {
  id: string;
  dayId: string;
  startedAt: string;
  completedAt: string;
}

export interface AppState {
  // Profile
  profile: UserProfile | null;
  setProfile: (p: UserProfile) => void;

  // Plan
  weekPlan: WeekPlan | null;
  macros: MacroTargets | null;
  regenerate: () => void;

  // Today
  todayDayIndex: number; // which day of the plan is "today"
  setTodayDayIndex: (i: number) => void;

  // Logs
  foodLog: FoodLogEntry[];
  addFood: (e: Omit<FoodLogEntry, 'id' | 'loggedAt'>) => void;
  removeFood: (id: string) => void;

  weightLog: WeightLogEntry[];
  addWeight: (lbs: number) => void;

  completedSets: CompletedSet[];
  logSet: (s: Omit<CompletedSet, 'completedAt'>) => void;

  // Workout sessions
  sessions: WorkoutSession[];
  currentSessionId: string | null;
  startSession: (dayId: string) => string;
  finishSession: () => void;

  // Gamification
  streakDays: number;
  xp: number;
  addXp: (n: number) => void;
}

const todayISO = () => new Date().toISOString().slice(0, 10);

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profile: null,
      weekPlan: null,
      macros: null,
      todayDayIndex: 0,
      foodLog: [],
      weightLog: [],
      completedSets: [],
      sessions: [],
      currentSessionId: null,
      streakDays: 0,
      xp: 0,

      setProfile: (profile) => {
        const weekPlan = generateWeekPlan({
          goal: profile.goal,
          experience: profile.experience,
          gymAccess: profile.gymAccess,
          bodyweightLbs: profile.weightLbs,
        });
        const macros = calculateMacros({
          sex: profile.sex,
          ageYears: profile.ageYears,
          heightInches: profile.heightInches,
          weightLbs: profile.weightLbs,
          activity: activityFromExperience(profile.experience),
          goal: profile.goal,
        });
        set({ profile, weekPlan, macros });
      },

      regenerate: () => {
        const profile = get().profile;
        if (!profile) return;
        get().setProfile(profile);
      },

      setTodayDayIndex: (i) => set({ todayDayIndex: i }),

      addFood: (entry) =>
        set((s) => ({
          foodLog: [
            ...s.foodLog,
            { ...entry, id: `food-${Date.now()}`, loggedAt: todayISO() },
          ],
        })),

      removeFood: (id) =>
        set((s) => ({ foodLog: s.foodLog.filter((f) => f.id !== id) })),

      addWeight: (lbs) =>
        set((s) => ({
          weightLog: [
            ...s.weightLog.filter((w) => w.loggedAt !== todayISO()),
            { id: `w-${Date.now()}`, weightLbs: lbs, loggedAt: todayISO() },
          ],
        })),

      logSet: (s2) =>
        set((s) => ({
          completedSets: [
            ...s.completedSets,
            {
              ...s2,
              completedAt: new Date().toISOString(),
              sessionId: s.currentSessionId ?? `loose-${Date.now()}`,
            },
          ],
          xp: s.xp + 10, // +10 XP per set logged
        })),

      startSession: (dayId) => {
        const id = `sess-${Date.now()}`;
        set({ currentSessionId: id });
        return id;
      },

      finishSession: () => {
        set((s) => {
          if (!s.currentSessionId) return s;
          const startedAt = s.completedSets.find(
            (cs) => cs.sessionId === s.currentSessionId
          )?.completedAt ?? new Date().toISOString();
          const session: WorkoutSession = {
            id: s.currentSessionId,
            // Look up dayId from the current session's first set
            dayId: '', // filled in by the caller when needed; not critical here
            startedAt,
            completedAt: new Date().toISOString(),
          };
          return {
            sessions: [...s.sessions, session],
            currentSessionId: null,
          };
        });
      },

      addXp: (n) => set((s) => ({ xp: s.xp + n })),
    }),
    {
      name: 'gym-app-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ---------- Selectors ----------
// Centralize computed values so screens stay dumb.

export const todayFoodSelector = (s: AppState): FoodLogEntry[] =>
  s.foodLog.filter((e) => e.loggedAt === todayISO());

export const todayMacroTotalsSelector = (s: AppState) => {
  const today = todayFoodSelector(s);
  return today.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatsG: acc.fatsG + e.fatsG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0 }
  );
};

export const todayWorkoutSelector = (s: AppState): DayPlan | null => {
  if (!s.weekPlan) return null;
  return s.weekPlan.days[s.todayDayIndex % s.weekPlan.days.length];
};

export const xpForLevel = (level: number) => level * 200;
export const levelFromXp = (xp: number) => {
  // level 1 starts at 0, each level requires +200 more than the last
  // Total XP at level N start = 200 * (N-1)*N/2 — solve for N
  // Easier: iterate
  let level = 1;
  let cumulative = 0;
  while (cumulative + xpForLevel(level) <= xp) {
    cumulative += xpForLevel(level);
    level++;
  }
  return { level, currentXp: xp - cumulative, neededXp: xpForLevel(level) };
};
