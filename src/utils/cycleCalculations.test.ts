import test from 'node:test';
import assert from 'node:assert/strict';
import {
  daysBetween,
  addDays,
  validatePeriodDates,
  calculateCycleAnalysis,
  getPredictedPeriodDates,
  inspectDateCycleStatus,
} from './cycleCalculations.ts';
import type { PeriodEntry } from '../types.ts';

test('1. First-time user with 0 periods', () => {
  const analysis = calculateCycleAnalysis([], '2026-10-15');
  assert.equal(analysis.hasData, false);
  assert.equal(analysis.cycleDay, null);
  assert.equal(analysis.currentPhase, 'insufficient_data');
  assert.equal(analysis.nextPeriodDate, null);
  assert.equal(analysis.confidence, 'insufficient');
  assert.equal(analysis.totalCyclesLogged, 0);

  const predicted = getPredictedPeriodDates(analysis);
  assert.deepEqual(predicted, []);

  const inspection = inspectDateCycleStatus('2026-10-15', analysis, [], {}, '2026-10-15');
  assert.equal(inspection.isLoggedPeriod, false);
  assert.equal(inspection.isPredictedPeriod, false);
  assert.equal(inspection.cycleDay, null);
});

test('2. User with 1 logged period (5 days ago)', () => {
  const periods: PeriodEntry[] = [
    {
      id: 'p1',
      startDate: '2026-10-10',
      endDate: '2026-10-14',
      flow: 'medium',
      symptoms: ['cramps'],
    },
  ];

  const analysis = calculateCycleAnalysis(periods, '2026-10-15');
  assert.equal(analysis.hasData, true);
  // Cycle day 6 (2026-10-10 was Day 1, 2026-10-15 is Day 6)
  assert.equal(analysis.cycleDay, 6);
  assert.equal(analysis.currentPhase, 'follicular');
  assert.equal(analysis.totalCyclesLogged, 1);
  // With only 1 period, no completed cycle intervals -> do not invent next period
  assert.equal(analysis.confidence, 'insufficient');
  assert.equal(analysis.nextPeriodDate, null);
  assert.equal(analysis.averageCycleLength, null);
  assert.equal(analysis.averagePeriodDuration, 5);
});

test('3. User with multiple cycles (2 cycles of 28 days)', () => {
  const periods: PeriodEntry[] = [
    {
      id: 'p1',
      startDate: '2026-08-15',
      endDate: '2026-08-19',
      flow: 'heavy',
      symptoms: ['cramps'],
    },
    {
      id: 'p2',
      startDate: '2026-09-12', // 28 days later
      endDate: '2026-09-16',
      flow: 'medium',
      symptoms: ['bloating'],
    },
    {
      id: 'p3',
      startDate: '2026-10-10', // 28 days later
      endDate: '2026-10-14',
      flow: 'medium',
      symptoms: ['fatigue'],
    },
  ];

  const analysis = calculateCycleAnalysis(periods, '2026-10-23');
  assert.equal(analysis.hasData, true);
  assert.equal(analysis.cycleDay, 14); // Day 14 (Ovulatory window)
  assert.equal(analysis.currentPhase, 'ovulatory');
  assert.equal(analysis.totalCyclesLogged, 3);
  assert.equal(analysis.averageCycleLength, 28);
  assert.equal(analysis.averagePeriodDuration, 5);
  // Next period = 2026-10-10 + 28 days = 2026-11-07
  assert.equal(analysis.nextPeriodDate, '2026-11-07');
  assert.equal(analysis.confidence, 'high');

  const predicted = getPredictedPeriodDates(analysis);
  assert.equal(predicted.length, 5);
  assert.equal(predicted[0], '2026-11-07');
  assert.equal(predicted[4], '2026-11-11');
});

test('4. Date validation rules', () => {
  const existing: PeriodEntry[] = [
    {
      id: 'p1',
      startDate: '2026-10-01',
      endDate: '2026-10-05',
      flow: 'medium',
      symptoms: [],
    },
  ];

  // Missing start date
  const v1 = validatePeriodDates('', '2026-10-05');
  assert.equal(v1.valid, false);

  // End date before start date
  const v2 = validatePeriodDates('2026-10-10', '2026-10-08');
  assert.equal(v2.valid, false);
  assert.match(v2.error || '', /on or after the start date/);

  // Overlapping period with existing entry
  const v3 = validatePeriodDates('2026-10-03', '2026-10-07', existing);
  assert.equal(v3.valid, false);
  assert.match(v3.error || '', /overlap/);

  // Updating existing entry (exclude self) should allow same dates
  const v4 = validatePeriodDates('2026-10-01', '2026-10-05', existing, 'p1');
  assert.equal(v4.valid, true);

  // Excessive duration > 16 days
  const v5 = validatePeriodDates('2026-10-01', '2026-10-20');
  assert.equal(v5.valid, false);
  assert.match(v5.error || '', /cannot exceed 16 days/);
});

test('5. Date navigation and math helpers', () => {
  assert.equal(daysBetween('2026-10-20', '2026-10-15'), 5);
  assert.equal(addDays('2026-10-15', 5), '2026-10-20');
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
});

test('6. Editing and deletion of period entries', () => {
  let periods: PeriodEntry[] = [
    { id: 'p1', startDate: '2026-09-12', endDate: '2026-09-16', flow: 'medium', symptoms: [] },
    { id: 'p2', startDate: '2026-10-10', endDate: '2026-10-14', flow: 'medium', symptoms: [] },
  ];

  // With 2 periods, average cycle is 28 days
  let analysis = calculateCycleAnalysis(periods, '2026-10-15');
  assert.equal(analysis.totalCyclesLogged, 2);
  assert.equal(analysis.nextPeriodDate, '2026-11-07');

  // Edit p2 start date to 2026-10-12 (cycle length becomes 30 days)
  periods = periods.map((p) => (p.id === 'p2' ? { ...p, startDate: '2026-10-12', endDate: '2026-10-16' } : p));
  analysis = calculateCycleAnalysis(periods, '2026-10-15');
  assert.equal(analysis.averageCycleLength, 30);
  assert.equal(analysis.nextPeriodDate, '2026-11-11');

  // Delete p2
  periods = periods.filter((p) => p.id !== 'p2');
  analysis = calculateCycleAnalysis(periods, '2026-10-15');
  assert.equal(analysis.totalCyclesLogged, 1);
  assert.equal(analysis.nextPeriodDate, null); // 1 period left -> no prediction invented
});

