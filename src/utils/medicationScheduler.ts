import type { Medication, DoseRecord, DoseStatus } from '../types.ts';

export interface ScheduledDoseItem {
  id: string; // `${medId}_${date}_${time}`
  medId: string;
  medicationName: string;
  dosage: string;
  instructions?: string;
  scheduledTime: string;
  date: string;
  status: DoseStatus;
  color: string;
  quantity?: number;
  isLowStock: boolean;
  isInQuietHours: boolean;
  note?: string;
}

/**
 * Checks if a given time (HH:mm) falls within user's quiet hours window.
 * Supports quiet hours spanning midnight (e.g. 22:00 to 07:00).
 */
export function isTimeInQuietHours(
  timeStr: string,
  startStr: string = '22:00',
  endStr: string = '07:00'
): boolean {
  if (!timeStr || !startStr || !endStr) return false;

  const toMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };

  const current = toMins(timeStr);
  const start = toMins(startStr);
  const end = toMins(endStr);

  if (start <= end) {
    // Normal window in same day (e.g. 13:00 to 15:00)
    return current >= start && current <= end;
  } else {
    // Overnight window (e.g. 22:00 to 07:00)
    return current >= start || current <= end;
  }
}

/**
 * Determines whether a medication is scheduled on a specific calendar date.
 * Respects startDate, endDate, paused state, archived state, and scheduleType.
 */
export function isMedicationActiveOnDate(med: Medication, dateStr: string): boolean {
  if (med.isArchived || med.isPaused) return false;

  if (med.startDate && dateStr < med.startDate) return false;
  if (med.endDate && dateStr > med.endDate) return false;

  const dateObj = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat

  switch (med.scheduleType) {
    case 'weekdays':
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    case 'specific_days':
      return Array.isArray(med.daysOfWeek) && med.daysOfWeek.includes(dayOfWeek);
    case 'as_needed':
      return false; // PRN / as needed, doesn't generate fixed scheduled doses
    case 'daily':
    default:
      return true;
  }
}

/**
 * Builds all scheduled dose items for a given date from active medications.
 */
export function getScheduledDosesForDate(
  medications: Medication[],
  doseRecords: Record<string, DoseRecord>,
  dateStr: string,
  currentTimeStr: string = '23:59',
  quietHours: { enabled: boolean; start: string; end: string } = {
    enabled: true,
    start: '22:00',
    end: '07:00',
  }
): ScheduledDoseItem[] {
  const result: ScheduledDoseItem[] = [];

  medications.forEach((med) => {
    if (!isMedicationActiveOnDate(med, dateStr)) return;

    const times = med.times && med.times.length > 0 ? med.times : ['08:00'];
    const isLow =
      typeof med.quantity === 'number' &&
      typeof med.lowStockThreshold === 'number' &&
      med.quantity <= med.lowStockThreshold;

    times.forEach((time) => {
      const doseKey = `${med.id}_${dateStr}_${time}`;
      const record = doseRecords[doseKey];

      let status: DoseStatus = record?.status || 'scheduled';

      // Auto-detect missed if scheduled time has passed and not taken/skipped
      if (status === 'scheduled' && time < currentTimeStr) {
        status = 'missed';
      }

      const inQuiet = quietHours.enabled
        ? isTimeInQuietHours(time, quietHours.start, quietHours.end)
        : false;

      result.push({
        id: doseKey,
        medId: med.id,
        medicationName: med.name,
        dosage: med.dosage,
        instructions: med.instructions,
        scheduledTime: time,
        date: dateStr,
        status,
        color: med.color || 'blush',
        quantity: med.quantity,
        isLowStock: isLow,
        isInQuietHours: inQuiet,
        note: record?.note,
      });
    });
  });

  // Sort chronologically by scheduled time
  return result.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
}

/**
 * Calculates remaining days of supply based on current stock and daily doses.
 */
export function estimateStockDaysRemaining(med: Medication): number | null {
  if (typeof med.quantity !== 'number') return null;
  const dosesPerDay = Math.max(1, med.times?.length || 1);
  return Math.floor(med.quantity / dosesPerDay);
}

/**
 * Calculates adherence rate for a set of dose items.
 */
export function calculateAdherenceRate(doses: ScheduledDoseItem[]): {
  total: number;
  taken: number;
  skipped: number;
  missed: number;
  scheduled: number;
  ratePercentage: number;
} {
  const total = doses.length;
  if (total === 0) {
    return { total: 0, taken: 0, skipped: 0, missed: 0, scheduled: 0, ratePercentage: 100 };
  }

  const taken = doses.filter((d) => d.status === 'taken').length;
  const skipped = doses.filter((d) => d.status === 'skipped').length;
  const missed = doses.filter((d) => d.status === 'missed').length;
  const scheduled = doses.filter((d) => d.status === 'scheduled').length;

  // Adherence = taken / (taken + missed + skipped), excluding future scheduled
  const completedOrPast = taken + missed + skipped;
  const ratePercentage =
    completedOrPast > 0 ? Math.round((taken / completedOrPast) * 100) : 100;

  return { total, taken, skipped, missed, scheduled, ratePercentage };
}
