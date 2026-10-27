import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextDueDose, timeDiffInMinutes } from './reminderService.ts';
import type { Medication, MedLog } from '../types.ts';

test('1. Time diff in minutes calculation', () => {
  assert.equal(timeDiffInMinutes('08:30', '08:00'), 30);
  assert.equal(timeDiffInMinutes('08:00', '08:30'), -30);
  assert.equal(timeDiffInMinutes('12:00', '12:00'), 0);
});

test('2. Finds next upcoming dose when morning dose already taken', () => {
  const meds: Medication[] = [
    {
      id: 'm1',
      name: 'Iron Supplement',
      dosage: '1 tablet',
      times: ['08:00', '20:00'],
      color: 'blush',
    },
    {
      id: 'm2',
      name: 'Vitamin D',
      dosage: '2 drops',
      times: ['09:00'],
      color: 'gold',
    },
  ];

  const date = '2026-10-27';
  // 08:00 dose is already taken
  const medLogs: Record<string, MedLog> = {
    'm1_2026-10-27': { id: 'm1_2026-10-27', medId: 'm1', date, taken: ['08:00'] },
  };

  // At 08:30, the next due dose is Vitamin D at 09:00
  const nextDose = getNextDueDose(meds, medLogs, date, '08:30');
  assert.ok(nextDose);
  assert.equal(nextDose.med.name, 'Vitamin D');
  assert.equal(nextDose.time, '09:00');
  assert.equal(nextDose.minutesDiff, 30);
});

test('3. Detects due now dose within 15 mins window', () => {
  const meds: Medication[] = [
    {
      id: 'm1',
      name: 'Magnesium',
      dosage: '1 capsule',
      times: ['21:00'],
      color: 'plum',
    },
  ];

  const date = '2026-10-27';
  const medLogs = {};

  // At 20:50 (10 minutes before 21:00)
  const dose = getNextDueDose(meds, medLogs, date, '20:50');
  assert.ok(dose);
  assert.equal(dose.isDueNow, true);
  assert.equal(dose.med.name, 'Magnesium');
});

test('4. Returns null when all doses are complete for today', () => {
  const meds: Medication[] = [
    {
      id: 'm1',
      name: 'Vitamin D',
      dosage: '2 drops',
      times: ['09:00'],
      color: 'gold',
    },
  ];

  const date = '2026-10-27';
  const medLogs: Record<string, MedLog> = {
    'm1_2026-10-27': { id: 'm1_2026-10-27', medId: 'm1', date, taken: ['09:00'] },
  };

  const nextDose = getNextDueDose(meds, medLogs, date, '12:00');
  assert.equal(nextDose, null);
});
