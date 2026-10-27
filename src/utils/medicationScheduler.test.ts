import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isTimeInQuietHours,
  isMedicationActiveOnDate,
  getScheduledDosesForDate,
  estimateStockDaysRemaining,
  calculateAdherenceRate,
} from './medicationScheduler.ts';
import type { Medication, DoseRecord } from '../types.ts';

test('1. Quiet hours detection handles normal windows and overnight windows', () => {
  // Overnight 22:00 to 07:00
  assert.equal(isTimeInQuietHours('23:30', '22:00', '07:00'), true);
  assert.equal(isTimeInQuietHours('02:15', '22:00', '07:00'), true);
  assert.equal(isTimeInQuietHours('06:59', '22:00', '07:00'), true);
  assert.equal(isTimeInQuietHours('08:00', '22:00', '07:00'), false);
  assert.equal(isTimeInQuietHours('14:00', '22:00', '07:00'), false);

  // Normal window 13:00 to 16:00
  assert.equal(isTimeInQuietHours('14:30', '13:00', '16:00'), true);
  assert.equal(isTimeInQuietHours('12:00', '13:00', '16:00'), false);
});

test('2. Medication date filtering respects start/end dates, pause, archive, and weekday schedules', () => {
  const baseMed: Medication = {
    id: 'm-test',
    name: 'Prenatal Vitamin',
    dosage: '1 tablet',
    times: ['09:00'],
    color: 'blush',
    scheduleType: 'daily',
    startDate: '2026-10-01',
    endDate: '2026-10-31',
  };

  assert.equal(isMedicationActiveOnDate(baseMed, '2026-10-15'), true);
  assert.equal(isMedicationActiveOnDate(baseMed, '2026-09-30'), false); // before start
  assert.equal(isMedicationActiveOnDate(baseMed, '2026-11-01'), false); // after end

  // Archived or paused
  assert.equal(isMedicationActiveOnDate({ ...baseMed, isArchived: true }, '2026-10-15'), false);
  assert.equal(isMedicationActiveOnDate({ ...baseMed, isPaused: true }, '2026-10-15'), false);

  // Weekdays only (2026-10-24 is Saturday, 2026-10-26 is Monday)
  const weekdayMed: Medication = { ...baseMed, scheduleType: 'weekdays' };
  assert.equal(isMedicationActiveOnDate(weekdayMed, '2026-10-24'), false); // Saturday
  assert.equal(isMedicationActiveOnDate(weekdayMed, '2026-10-26'), true);  // Monday
});

test('3. Scheduled doses builder correctly identifies taken, scheduled, and past missed doses', () => {
  const meds: Medication[] = [
    {
      id: 'm1',
      name: 'Iron',
      dosage: '1 tab',
      times: ['08:00', '20:00'],
      color: 'blush',
      quantity: 12,
      lowStockThreshold: 10,
    },
  ];

  const date = '2026-10-28';
  const doseRecords: Record<string, DoseRecord> = {
    'm1_2026-10-28_08:00': {
      id: 'm1_2026-10-28_08:00',
      medId: 'm1',
      date,
      scheduledTime: '08:00',
      status: 'taken',
    },
  };

  // When current time is 14:00 (after 08:00, before 20:00)
  const doses = getScheduledDosesForDate(meds, doseRecords, date, '14:00');
  assert.equal(doses.length, 2);

  const morningDose = doses.find((d) => d.scheduledTime === '08:00');
  const eveningDose = doses.find((d) => d.scheduledTime === '20:00');

  assert.equal(morningDose?.status, 'taken');
  assert.equal(eveningDose?.status, 'scheduled'); // in the future

  // When current time is 22:00 (past 20:00, and evening dose was not taken)
  const dosesLate = getScheduledDosesForDate(meds, doseRecords, date, '22:00');
  const eveningDoseLate = dosesLate.find((d) => d.scheduledTime === '20:00');
  assert.equal(eveningDoseLate?.status, 'missed'); // automatically marked missed
});

test('4. Stock estimation and adherence calculation', () => {
  const med: Medication = {
    id: 'm2',
    name: 'Calcium',
    dosage: '1 cap',
    times: ['08:00', '14:00', '20:00'], // 3 per day
    color: 'gold',
    quantity: 45,
  };

  const daysSupply = estimateStockDaysRemaining(med);
  assert.equal(daysSupply, 15); // 45 / 3 = 15 days

  const sampleDoses = [
    { status: 'taken' },
    { status: 'taken' },
    { status: 'skipped' },
    { status: 'missed' },
  ] as Parameters<typeof calculateAdherenceRate>[0];

  const adherence = calculateAdherenceRate(sampleDoses);
  // 2 taken out of 4 resolved doses = 50%
  assert.equal(adherence.ratePercentage, 50);
  assert.equal(adherence.taken, 2);
  assert.equal(adherence.skipped, 1);
  assert.equal(adherence.missed, 1);
});
