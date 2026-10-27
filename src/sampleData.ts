import type { AppData, PeriodEntry } from './types';
import { todayStr, daysAgoStr, addDaysStr } from './hooks/useLocalStorage';

export function buildSampleData(): AppData {
  const t = todayStr();
  const period: AppData['period'] = {};

  // last period started 12 days ago, lasted 5 days
  const lastStart = daysAgoStr(12);
  const flows: ('light' | 'medium' | 'heavy')[] = ['medium', 'heavy', 'heavy', 'medium', 'light'];
  for (let i = 0; i < 5; i++) {
    const d = addDaysStr(lastStart, i);
    period[d] = {
      date: d,
      flow: flows[i],
      symptoms: i < 2 ? ['cramps', 'bloating'] : ['fatigue'],
      note: i === 0 ? 'Cycle started' : undefined,
    };
  }
  // a prior cycle ~28 days before
  const prevStart = daysAgoStr(40);
  for (let i = 0; i < 5; i++) {
    const d = addDaysStr(prevStart, i);
    period[d] = {
      date: d,
      flow: flows[i],
      symptoms: ['cramps'],
    };
  }

  const periods: PeriodEntry[] = [
    {
      id: 'p-prev',
      startDate: daysAgoStr(40),
      endDate: daysAgoStr(36),
      flow: 'medium',
      symptoms: ['cramps'],
      note: 'Previous cycle',
    },
    {
      id: 'p-last',
      startDate: daysAgoStr(12),
      endDate: daysAgoStr(8),
      flow: 'heavy',
      symptoms: ['cramps', 'bloating', 'fatigue'],
      note: 'Last cycle started',
    },
  ];

  const meds: AppData['meds'] = [
    {
      id: 'm1',
      name: 'Iron Supplement',
      dosage: '1 tablet (65mg)',
      instructions: 'Take in the morning with citrus juice, avoids dairy',
      times: ['08:00', '20:00'],
      color: 'blush',
      quantity: 14,
      initialQuantity: 60,
      lowStockThreshold: 10,
      refillOn: addDaysStr(t, 7),
      scheduleType: 'daily',
    },
    {
      id: 'm2',
      name: 'Vitamin D3 & K2',
      dosage: '2 drops (2000 IU)',
      instructions: 'Take with morning meal containing healthy fats',
      times: ['09:00'],
      color: 'gold',
      quantity: 45,
      initialQuantity: 90,
      lowStockThreshold: 15,
      scheduleType: 'daily',
    },
    {
      id: 'm3',
      name: 'Magnesium Glycinate',
      dosage: '1 capsule (200mg)',
      instructions: 'Take 30-45 minutes before sleep for relaxation',
      times: ['21:30'],
      color: 'plum',
      quantity: 8,
      initialQuantity: 60,
      lowStockThreshold: 10,
      refillOn: addDaysStr(t, 4),
      scheduleType: 'daily',
    },
  ];

  const medLogs: AppData['medLogs'] = {};
  const doseRecords: Record<string, import('./types').DoseRecord> = {};

  const mkMedLog = (date: string) => {
    meds.forEach((m) => {
      const taken = m.times.filter((_, i) => Math.random() > 0.3 || i === 0);
      medLogs[`${m.id}_${date}`] = { id: `${m.id}_${date}`, medId: m.id, date, taken };

      // Initialize individual dose records
      m.times.forEach((time) => {
        const isTaken = taken.includes(time);
        const doseKey = `${m.id}_${date}_${time}`;
        doseRecords[doseKey] = {
          id: doseKey,
          medId: m.id,
          date,
          scheduledTime: time,
          status: isTaken ? 'taken' : date === t ? 'scheduled' : 'missed',
          timestamp: isTaken ? `${date}T${time}:00` : undefined,
        };
      });
    });
  };
  mkMedLog(todayStr());
  mkMedLog(daysAgoStr(1));
  mkMedLog(daysAgoStr(2));

  const meals: AppData['meals'] = [
    { id: 'ml1', date: t, type: 'breakfast', name: 'Oatmeal & Berries', calories: 320, items: ['Oats', 'Almond milk', 'Blueberries', 'Honey'] },
    { id: 'ml2', date: t, type: 'lunch', name: 'Quinoa Buddha Bowl', calories: 480, items: ['Quinoa', 'Avocado', 'Chickpeas', 'Spinach'] },
    { id: 'ml3', date: t, type: 'snack', name: 'Greek Yogurt', calories: 150, items: ['Yogurt', 'Granola'] },
    { id: 'ml4', date: daysAgoStr(1), type: 'breakfast', name: 'Avocado Toast', calories: 290, items: ['Whole grain bread', 'Avocado', 'Egg'] },
    { id: 'ml5', date: daysAgoStr(1), type: 'lunch', name: 'Grilled Salmon', calories: 520, items: ['Salmon', 'Asparagus', 'Brown rice'] },
  ];

  const water: AppData['water'] = {};
  [0, 1, 2, 3].forEach((n) => {
    const d = daysAgoStr(n);
    water[d] = { date: d, glasses: n === 0 ? 5 : 6 + Math.floor(Math.random() * 3), goal: 8 };
  });

  const sleep: AppData['sleep'] = {};
  const moods: ('great' | 'good' | 'okay' | 'low' | 'stressed')[] = ['good', 'okay', 'great', 'okay', 'good'];
  [0, 1, 2, 3, 4].forEach((n) => {
    const d = daysAgoStr(n);
    sleep[d] = {
      date: d,
      hours: n === 0 ? 7.5 : 6 + Math.round(Math.random() * 2 * 10) / 10,
      quality: (3 + (n % 3)) as 1 | 2 | 3 | 4 | 5,
      mood: moods[n],
      note: n === 0 ? 'Felt refreshed' : undefined,
    };
  });

  const waterEntries: import('./types').WaterEntry[] = [
    { id: 'w1', date: t, time: '08:30', amountMl: 250, note: 'Morning glass with lemon' },
    { id: 'w2', date: t, time: '11:15', amountMl: 500, note: 'Refill at desk' },
    { id: 'w3', date: t, time: '13:45', amountMl: 250, note: 'Post-lunch water' },
    { id: 'w4', date: t, time: '16:20', amountMl: 250, note: 'Afternoon hydration' },
    { id: 'w5', date: daysAgoStr(1), time: '09:00', amountMl: 500 },
    { id: 'w6', date: daysAgoStr(1), time: '12:30', amountMl: 500 },
    { id: 'w7', date: daysAgoStr(1), time: '15:45', amountMl: 250 },
    { id: 'w8', date: daysAgoStr(1), time: '19:00', amountMl: 500 },
    { id: 'w9', date: daysAgoStr(2), time: '08:30', amountMl: 250 },
    { id: 'w10', date: daysAgoStr(2), time: '11:30', amountMl: 500 },
    { id: 'w11', date: daysAgoStr(2), time: '15:00', amountMl: 500 },
    { id: 'w12', date: daysAgoStr(2), time: '18:30', amountMl: 500 },
  ];

  const workouts: import('./types').WorkoutSession[] = [
    {
      id: 'wo-1',
      activityType: 'yoga',
      date: t,
      startTime: '07:15',
      endTime: '07:50',
      durationMinutes: 35,
      caloriesBurned: 140,
      intensity: 'light',
      notes: 'Morning gentle flow for hip opening & spine mobility',
    },
    {
      id: 'wo-2',
      activityType: 'running',
      date: daysAgoStr(1),
      startTime: '18:00',
      endTime: '18:32',
      durationMinutes: 32,
      distanceKm: 5.2,
      caloriesBurned: 310,
      intensity: 'vigorous',
      isPersonalRecord: true,
      notes: 'Sunset jog in the park. Felt strong throughout!',
    },
    {
      id: 'wo-3',
      activityType: 'gym_strength',
      date: daysAgoStr(3),
      startTime: '17:30',
      endTime: '18:20',
      durationMinutes: 50,
      caloriesBurned: 240,
      intensity: 'moderate',
      exercises: [
        {
          name: 'Goblet Squats',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 12, restSeconds: 60 },
            { setNumber: 2, reps: 10, weightKg: 16, restSeconds: 60 },
            { setNumber: 3, reps: 10, weightKg: 16, restSeconds: 60 },
          ],
        },
        {
          name: 'Dumbbell Romanian Deadlift',
          sets: [
            { setNumber: 1, reps: 12, weightKg: 14, restSeconds: 60 },
            { setNumber: 2, reps: 12, weightKg: 14, restSeconds: 60 },
          ],
        },
        {
          name: 'Glute Bridges',
          sets: [
            { setNumber: 1, reps: 15, weightKg: 10, restSeconds: 45 },
            { setNumber: 2, reps: 15, weightKg: 10, restSeconds: 45 },
          ],
        },
      ],
      notes: 'Lower body strength focusing on controlled form',
    },
    {
      id: 'wo-4',
      activityType: 'walking',
      date: daysAgoStr(4),
      startTime: '12:30',
      endTime: '13:05',
      durationMinutes: 35,
      distanceKm: 2.8,
      caloriesBurned: 115,
      intensity: 'light',
      notes: 'Lunchtime stroll under the sun',
    },
  ];

  return {
    profile: {
      id: 'hercare_user_default',
      name: 'Elena',
    },
    period,
    periods,
    meds,
    medLogs,
    doseRecords,
    medSettings: {
      quietHoursEnabled: true,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      privateLockScreen: true,
    },
    meals,
    water,
    waterEntries,
    hydrationSettings: {
      dailyGoalMl: 2000,
      reminderIntervalMinutes: 90,
      wakingHoursStart: '08:00',
      wakingHoursEnd: '22:00',
      remindersEnabled: true,
      pausedForToday: false,
    },
    workouts,
    activeTimer: null,
    sleep,
    goals: { calories: 2000, water: 8, sleep: 8, cycleLength: 28 },
  };
}
