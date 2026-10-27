import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWellnessInsights } from './insightsEngine.ts';
import type { AppData } from '../types.ts';

test('1. Empty data generates zero insights without errors', () => {
  const emptyData: AppData = {
    period: {},
    periods: [],
    meds: [],
    medLogs: {},
    meals: [],
    water: {},
    sleep: {},
    goals: { calories: 2000, water: 8, sleep: 8 },
  };

  const insights = generateWellnessInsights(emptyData, '2026-10-27');
  assert.equal(Array.isArray(insights), true);
  assert.equal(insights.length, 0);
});

test('2. Generates hydration streak insight when goal reached 4+ times', () => {
  const data: AppData = {
    period: {},
    periods: [],
    meds: [],
    medLogs: {},
    meals: [],
    water: {
      '2026-10-21': { date: '2026-10-21', glasses: 8, goal: 8 },
      '2026-10-22': { date: '2026-10-22', glasses: 9, goal: 8 },
      '2026-10-23': { date: '2026-10-23', glasses: 8, goal: 8 },
      '2026-10-24': { date: '2026-10-24', glasses: 8, goal: 8 },
      '2026-10-25': { date: '2026-10-25', glasses: 6, goal: 8 },
    },
    sleep: {},
    goals: { calories: 2000, water: 8, sleep: 8 },
  };

  const insights = generateWellnessInsights(data, '2026-10-27');
  const hydrationInsight = insights.find((i) => i.category === 'hydration');
  assert.ok(hydrationInsight);
  assert.equal(hydrationInsight.title, 'Strong Hydration Consistency');
  assert.match(hydrationInsight.observation, /met your daily hydration goal on 4/);
  assert.equal(hydrationInsight.targetScreen, 'water');
});

test('3. Generates sleep and mood correlation insight', () => {
  const data: AppData = {
    period: {},
    periods: [],
    meds: [],
    medLogs: {},
    meals: [],
    water: {},
    sleep: {
      '2026-10-24': { date: '2026-10-24', hours: 7.5, quality: 4, mood: 'great' },
      '2026-10-25': { date: '2026-10-25', hours: 8.0, quality: 5, mood: 'good' },
      '2026-10-26': { date: '2026-10-26', hours: 7.0, quality: 4, mood: 'good' },
    },
    goals: { calories: 2000, water: 8, sleep: 8 },
  };

  const insights = generateWellnessInsights(data, '2026-10-27');
  const sleepInsight = insights.find((i) => i.category === 'sleep');
  assert.ok(sleepInsight);
  assert.match(sleepInsight.title, /Restful Sleep Correlates with Calm Mood/);
  assert.equal(sleepInsight.targetScreen, 'sleep');
});

test('4. Dismissing an insight filters it out', () => {
  const data: AppData = {
    period: {},
    periods: [],
    meds: [],
    medLogs: {},
    meals: [],
    water: {
      '2026-10-21': { date: '2026-10-21', glasses: 8, goal: 8 },
      '2026-10-22': { date: '2026-10-22', glasses: 9, goal: 8 },
      '2026-10-23': { date: '2026-10-23', glasses: 8, goal: 8 },
      '2026-10-24': { date: '2026-10-24', glasses: 8, goal: 8 },
    },
    sleep: {},
    goals: { calories: 2000, water: 8, sleep: 8 },
  };

  const all = generateWellnessInsights(data, '2026-10-27');
  assert.ok(all.length > 0);
  const targetId = all[0].id;

  const afterDismiss = generateWellnessInsights(data, '2026-10-27', [targetId]);
  assert.equal(afterDismiss.some((i) => i.id === targetId), false);
});

test('5. Medication refill alert generates priority insight', () => {
  const data: AppData = {
    period: {},
    periods: [],
    meds: [
      { id: 'm1', name: 'Iron Supplement', dosage: '1 tablet', times: ['08:00'], color: 'blush', refillOn: '2026-10-30' },
    ],
    medLogs: {},
    meals: [],
    water: {},
    sleep: {},
    goals: { calories: 2000, water: 8, sleep: 8 },
  };

  const insights = generateWellnessInsights(data, '2026-10-27');
  const medInsight = insights.find((i) => i.category === 'medication');
  assert.ok(medInsight);
  assert.match(medInsight.title, /Prescription Refill Reminder: Iron Supplement/);
  assert.equal(medInsight.priority, 88);
  assert.equal(medInsight.targetScreen, 'meds');
});
