import type { ActivityType, WorkoutSession } from '../types.ts';

export interface FitnessSummary {
  weeklyActiveMinutes: number;
  weeklyTargetMinutes: number;
  weeklySessionsCount: number;
  weeklyCalories: number;
  personalRecordsCount: number;
}

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; icon: string; met: number; supportsDistance: boolean; isStrength: boolean }
> = {
  walking: { label: 'Walking', icon: '🚶‍♀️', met: 3.5, supportsDistance: true, isStrength: false },
  running: { label: 'Running', icon: '🏃‍♀️', met: 8.5, supportsDistance: true, isStrength: false },
  gym_strength: {
    label: 'Gym & Strength',
    icon: '🏋️‍♀️',
    met: 5.0,
    supportsDistance: false,
    isStrength: true,
  },
  yoga: { label: 'Yoga & Stretching', icon: '🧘‍♀️', met: 2.8, supportsDistance: false, isStrength: false },
  cycling: { label: 'Cycling', icon: '🚴‍♀️', met: 6.8, supportsDistance: true, isStrength: false },
  swimming: { label: 'Swimming', icon: '🏊‍♀️', met: 7.0, supportsDistance: true, isStrength: false },
  dance: { label: 'Dance & Aerobics', icon: '💃', met: 5.5, supportsDistance: false, isStrength: false },
  team_sports: { label: 'Team Sports', icon: '⚽', met: 6.5, supportsDistance: false, isStrength: false },
  racket_sports: { label: 'Racket Sports', icon: '🎾', met: 7.0, supportsDistance: false, isStrength: false },
  custom: { label: 'Custom Activity', icon: '⭐', met: 4.5, supportsDistance: false, isStrength: false },
};

/**
 * Calculates estimated calories burned using MET formula if not provided manually.
 * Calories = (MET * 3.5 * weightKg / 200) * minutes
 */
export function estimateCaloriesBurned(
  activityType: ActivityType,
  durationMinutes: number,
  weightKg: number = 60
): number {
  const met = ACTIVITY_META[activityType]?.met || 4.5;
  const burned = ((met * 3.5 * weightKg) / 200) * durationMinutes;
  return Math.round(burned);
}

/**
 * Gets start date of current week (Monday) in YYYY-MM-DD.
 */
export function getWeekStartStr(dateStr?: string): string {
  const now = dateStr ? new Date(dateStr + 'T00:00:00') : new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const mon = new Date(now.setDate(diff));
  const tz = mon.getTimezoneOffset() * 60000;
  return new Date(mon.getTime() - tz).toISOString().slice(0, 10);
}

/**
 * Aggregates fitness statistics for the current week.
 */
export function calculateFitnessSummary(
  workouts: WorkoutSession[],
  currentDateStr: string,
  targetWeeklyMinutes: number = 150
): FitnessSummary {
  const weekStart = getWeekStartStr(currentDateStr);

  const thisWeekWorkouts = workouts.filter(
    (w) => w.date >= weekStart && w.date <= currentDateStr
  );

  const weeklyActiveMinutes = thisWeekWorkouts.reduce((s, w) => s + (w.durationMinutes || 0), 0);
  const weeklyCalories = thisWeekWorkouts.reduce(
    (s, w) => s + (w.caloriesBurned || estimateCaloriesBurned(w.activityType, w.durationMinutes)),
    0
  );

  // Unique active days this week
  const activeDays = new Set(thisWeekWorkouts.map((w) => w.date));
  const weeklySessionsCount = activeDays.size;

  const personalRecordsCount = workouts.filter((w) => w.isPersonalRecord).length;

  return {
    weeklyActiveMinutes,
    weeklyTargetMinutes: targetWeeklyMinutes,
    weeklySessionsCount,
    weeklyCalories,
    personalRecordsCount,
  };
}

/**
 * Formats duration in minutes to user-friendly "1h 15m" or "45m".
 */
export function formatWorkoutDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
