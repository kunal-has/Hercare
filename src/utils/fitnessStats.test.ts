import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACTIVITY_META,
  estimateCaloriesBurned,
  calculateFitnessSummary,
  formatWorkoutDuration,
} from './fitnessStats.ts';
import type { WorkoutSession } from '../types.ts';

test('1. Activity metadata covers all requested activities including strength, yoga, sports, and custom', () => {
  const expected = [
    'walking',
    'running',
    'gym_strength',
    'yoga',
    'cycling',
    'swimming',
    'dance',
    'team_sports',
    'racket_sports',
    'custom',
  ];
  expected.forEach((key) => {
    assert.ok(ACTIVITY_META[key as keyof typeof ACTIVITY_META], `Missing activity: ${key}`);
  });
  assert.equal(ACTIVITY_META.gym_strength.isStrength, true);
  assert.equal(ACTIVITY_META.running.supportsDistance, true);
});

test('2. Calorie estimation uses MET formula appropriately', () => {
  // 30 min running with MET 8.5 at 60kg
  // (8.5 * 3.5 * 60 / 200) * 30 = 8.925 * 30 = 267.75 -> 268
  const calRunning = estimateCaloriesBurned('running', 30, 60);
  assert.ok(calRunning > 250 && calRunning < 290, `Unexpected calories: ${calRunning}`);

  // 45 min yoga
  const calYoga = estimateCaloriesBurned('yoga', 45, 60);
  assert.ok(calYoga > 70 && calYoga < 150, `Unexpected calories: ${calYoga}`);
});

test('3. Summary calculates weekly minutes, session frequency, and records', () => {
  const workouts: WorkoutSession[] = [
    {
      id: 'w1',
      activityType: 'running',
      date: '2026-10-28', // Wed
      startTime: '07:00',
      durationMinutes: 40,
      caloriesBurned: 350,
      isPersonalRecord: true,
    },
    {
      id: 'w2',
      activityType: 'yoga',
      date: '2026-10-27', // Tue
      startTime: '18:00',
      durationMinutes: 30,
      caloriesBurned: 120,
    },
    {
      id: 'w3',
      activityType: 'walking',
      date: '2026-10-15', // Previous week
      startTime: '12:00',
      durationMinutes: 60,
    },
  ];

  const summary = calculateFitnessSummary(workouts, '2026-10-28', 150);
  assert.equal(summary.weeklyActiveMinutes, 70); // 40 + 30
  assert.equal(summary.weeklySessionsCount, 2);   // 2 unique days this week
  assert.equal(summary.personalRecordsCount, 1);
});

test('4. Duration formatting formats minutes to human readable string', () => {
  assert.equal(formatWorkoutDuration(45), '45m');
  assert.equal(formatWorkoutDuration(60), '1h');
  assert.equal(formatWorkoutDuration(75), '1h 15m');
  assert.equal(formatWorkoutDuration(120), '2h');
});
