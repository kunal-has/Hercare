export type ScreenId =
  | 'dashboard'
  | 'period'
  | 'meds'
  | 'meals'
  | 'water'
  | 'sleep'
  | 'fitness';

export interface PeriodDay {
  date: string; // YYYY-MM-DD
  flow: 'none' | 'light' | 'medium' | 'heavy';
  symptoms: string[];
  note?: string;
}

export interface PeriodEntry {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD, optional if ongoing
  flow: 'light' | 'medium' | 'heavy';
  symptoms: string[];
  note?: string;
}

export type CyclePhase =
  | 'menstrual'
  | 'follicular'
  | 'ovulatory'
  | 'luteal'
  | 'late'
  | 'insufficient_data';

export interface CycleAnalysis {
  hasData: boolean;
  cycleDay: number | null;
  currentPhase: CyclePhase;
  phaseLabel: string;
  phaseDescription: string;
  phaseTip: string;
  averageCycleLength: number | null;
  averagePeriodDuration: number | null;
  lastPeriodStart: string | null;
  lastPeriodEnd: string | null;
  nextPeriodDate: string | null;
  uncertaintyDays: number;
  confidence: 'high' | 'medium' | 'provisional' | 'insufficient';
  totalCyclesLogged: number;
  cycleLengths: number[];
  isPeriodOngoing: boolean;
}

export interface WellnessInsight {
  id: string;
  category: 'cycle' | 'sleep' | 'hydration' | 'nutrition' | 'medication' | 'symptoms';
  priority: number;
  title: string;
  observation: string;
  supportingData: string[];
  dateRange: string;
  suggestedAction?: string;
  uncertaintyNote: string;
  targetScreen: ScreenId;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  instructions?: string;
  notes?: string;
  times: string[]; // ["08:00","20:00"]
  color: string;
  scheduleType?: 'daily' | 'weekdays' | 'specific_days' | 'as_needed';
  daysOfWeek?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  quantity?: number;  // Current pills/units in stock
  initialQuantity?: number;
  lowStockThreshold?: number;
  refillOn?: string;
  isArchived?: boolean;
  isPaused?: boolean;
}

export type DoseStatus = 'scheduled' | 'taken' | 'skipped' | 'missed';

export interface DoseRecord {
  id: string; // `${medId}_${date}_${scheduledTime}`
  medId: string;
  date: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: DoseStatus;
  timestamp?: string;
  note?: string;
}

export interface MedicationSettings {
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "22:00"
  quietHoursEnd: string;   // "07:00"
  privateLockScreen: boolean;
}

export interface MedLog {
  id: string; // medId + date
  medId: string;
  date: string;
  taken: string[]; // times taken
}

export interface Meal {
  id: string;
  date: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  items: string[];
}

export interface WaterLog {
  date: string;
  glasses: number; // 250ml glasses
  goal: number;
}

export interface WaterEntry {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  amountMl: number;
  note?: string;
}

export interface HydrationSettings {
  dailyGoalMl: number;
  reminderIntervalMinutes: number; // 60, 90, 120
  wakingHoursStart: string; // "08:00"
  wakingHoursEnd: string;   // "22:00"
  remindersEnabled: boolean;
  pausedForToday: boolean;
  snoozedUntil?: string;
}

export type ActivityType =
  | 'walking'
  | 'running'
  | 'gym_strength'
  | 'yoga'
  | 'cycling'
  | 'swimming'
  | 'dance'
  | 'team_sports'
  | 'racket_sports'
  | 'custom';

export interface StrengthSet {
  setNumber: number;
  reps: number;
  weightKg?: number;
  restSeconds?: number;
}

export interface StrengthExercise {
  name: string;
  sets: StrengthSet[];
}

export interface WorkoutSession {
  id: string;
  activityType: ActivityType;
  customActivityName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string;  // HH:mm
  durationMinutes: number;
  distanceKm?: number;
  caloriesBurned?: number;
  exercises?: StrengthExercise[];
  notes?: string;
  intensity?: 'light' | 'moderate' | 'vigorous';
  isPersonalRecord?: boolean;
}

export interface ActiveWorkoutTimer {
  activityType: ActivityType;
  customActivityName?: string;
  startTime: string; // ISO timestamp
  elapsedSeconds: number;
  isPaused: boolean;
}

export interface SleepLog {
  date: string;
  hours: number;
  quality: 1 | 2 | 3 | 4 | 5;
  mood: 'great' | 'good' | 'okay' | 'low' | 'stressed';
  note?: string;
}

export interface UserProfile {
  id: string;
  name?: string;
}

export interface AppData {
  profile?: UserProfile;
  period: Record<string, PeriodDay>;
  periods?: PeriodEntry[];
  meds: Medication[];
  medLogs: Record<string, MedLog>;
  doseRecords?: Record<string, DoseRecord>;
  medSettings?: MedicationSettings;
  meals: Meal[];
  water: Record<string, WaterLog>;
  waterEntries?: WaterEntry[];
  hydrationSettings?: HydrationSettings;
  workouts?: WorkoutSession[];
  activeTimer?: ActiveWorkoutTimer | null;
  sleep: Record<string, SleepLog>;
  goals: {
    calories: number;
    water: number;
    sleep: number;
    cycleLength?: number;
  };
}
