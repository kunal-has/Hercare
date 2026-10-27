import type { PeriodEntry, PeriodDay, CycleAnalysis, CyclePhase } from '../types';

/**
 * Standard utility to parse YYYY-MM-DD into a localized Date with time 00:00:00
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a Date object to YYYY-MM-DD
 */
export function toDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Difference in calendar days (dateA - dateB)
 */
export function daysBetween(dateA: string, dateB: string): number {
  const a = parseDate(dateA);
  const b = parseDate(dateB);
  const msDiff = a.getTime() - b.getTime();
  return Math.round(msDiff / 86400000);
}

/**
 * Add N calendar days to a YYYY-MM-DD string
 */
export function addDays(baseDate: string, n: number): string {
  const d = parseDate(baseDate);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/**
 * Human friendly display of dates (e.g. "Oct 15, 2026")
 */
export function formatDisplayDate(dateStr: string, options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }): string {
  const d = parseDate(dateStr);
  return d.toLocaleDateString('en-US', options);
}

/**
 * Get all dates inclusive between start and end
 */
export function getDatesRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const count = daysBetween(end, start);
  if (count < 0) return [start];
  for (let i = 0; i <= count; i++) {
    dates.push(addDays(start, i));
  }
  return dates;
}

/**
 * Validate period entry dates
 */
export function validatePeriodDates(
  startDate: string,
  endDate?: string,
  existingEntries: PeriodEntry[] = [],
  excludeId?: string
): { valid: boolean; error?: string } {
  if (!startDate) {
    return { valid: false, error: 'Start date is required.' };
  }

  // Regex check for YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate)) {
    return { valid: false, error: 'Start date must be in YYYY-MM-DD format.' };
  }

  const today = toDateStr();
  const maxFutureDays = 1; // allow today or up to 1 day ahead for timezone variance
  if (daysBetween(startDate, today) > maxFutureDays) {
    return { valid: false, error: 'Start date cannot be set in the distant future.' };
  }

  if (endDate) {
    if (!dateRegex.test(endDate)) {
      return { valid: false, error: 'End date must be in YYYY-MM-DD format.' };
    }

    const duration = daysBetween(endDate, startDate) + 1;
    if (duration <= 0) {
      return { valid: false, error: 'End date must be on or after the start date.' };
    }

    if (duration > 16) {
      return { valid: false, error: 'A single period duration cannot exceed 16 days. If longer, please log separate intervals.' };
    }
  }

  // Check overlap with other logged periods
  const targetStart = startDate;
  const targetEnd = endDate || startDate;

  for (const entry of existingEntries) {
    if (excludeId && entry.id === excludeId) continue;
    const existingStart = entry.startDate;
    const existingEnd = entry.endDate || entry.startDate;

    // Two intervals [A_start, A_end] and [B_start, B_end] overlap if A_start <= B_end && B_start <= A_end
    if (targetStart <= existingEnd && existingStart <= targetEnd) {
      return {
        valid: false,
        error: `Dates overlap with an existing period (${formatDisplayDate(existingStart)} - ${formatDisplayDate(existingEnd)}).`,
      };
    }
  }

  return { valid: true };
}

/**
 * Main Smart Cycle Calculator
 * Estimates cycle length, phase, and next-period window with scientific humility.
 */
export function calculateCycleAnalysis(
  periods: PeriodEntry[] = [],
  todayDate: string = toDateStr(),
  defaultCycleLen: number = 28
): CycleAnalysis {
  if (!periods || periods.length === 0) {
    return {
      hasData: false,
      cycleDay: null,
      currentPhase: 'insufficient_data',
      phaseLabel: 'No Periods Logged',
      phaseDescription: 'Log your first period to begin tracking your cycle day, phases, and wellness trends.',
      phaseTip: 'Tap "Log period" to get started.',
      averageCycleLength: null,
      averagePeriodDuration: null,
      lastPeriodStart: null,
      lastPeriodEnd: null,
      nextPeriodDate: null,
      uncertaintyDays: 0,
      confidence: 'insufficient',
      totalCyclesLogged: 0,
      cycleLengths: [],
      isPeriodOngoing: false,
    };
  }

  // Sort periods by start date ascending
  const sorted = [...periods].sort((a, b) => a.startDate.localeCompare(b.startDate));
  const mostRecent = sorted[sorted.length - 1];

  const lastPeriodStart = mostRecent.startDate;
  const lastPeriodEnd = mostRecent.endDate || null;

  // Is period currently ongoing?
  const isPeriodOngoing = !mostRecent.endDate || mostRecent.endDate >= todayDate;

  // Calculate current cycle day
  const daysSinceStart = daysBetween(todayDate, lastPeriodStart);
  let cycleDay: number | null = null;
  if (daysSinceStart >= 0) {
    cycleDay = daysSinceStart + 1;
  }

  // Calculate cycle lengths between successive starts
  const cycleLengths: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const len = daysBetween(sorted[i + 1].startDate, sorted[i].startDate);
    // Biological sanity filter: typical cycles are 20-50 days. Discard skipped log gaps (> 60 days).
    if (len >= 18 && len <= 60) {
      cycleLengths.push(len);
    }
  }

  // Average duration of bleeding (days)
  const durations: number[] = [];
  sorted.forEach((p) => {
    if (p.endDate) {
      const d = daysBetween(p.endDate, p.startDate) + 1;
      if (d >= 1 && d <= 15) durations.push(d);
    }
  });

  const averagePeriodDuration = durations.length > 0
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 5; // standard medical baseline if user hasn't supplied end dates

  const averageCycleLength = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : null;

  // Next period estimate & uncertainty
  let nextPeriodDate: string | null = null;
  let uncertaintyDays = 2;
  let confidence: CycleAnalysis['confidence'] = 'insufficient';

  if (cycleLengths.length >= 1 && averageCycleLength !== null) {
    nextPeriodDate = addDays(lastPeriodStart, averageCycleLength);

    if (cycleLengths.length >= 2) {
      confidence = 'high';
      // Calculate standard deviation
      const avg = averageCycleLength;
      const variance = cycleLengths.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / cycleLengths.length;
      const stdDev = Math.sqrt(variance);
      uncertaintyDays = Math.max(1, Math.min(5, Math.round(stdDev)));
    } else {
      confidence = 'medium';
      uncertaintyDays = 2;
    }
  } else {
    // Only 1 period logged:
    // Prompt guidance: "Avoid inventing a prediction for users without enough records.
    // Display the estimate and explain that cycles can vary... Show when there is insufficient information."
    // We do NOT invent a confirmed prediction; confidence is 'insufficient' and nextPeriodDate is null,
    // encouraging user to log their 2nd period for personalized prediction.
    confidence = 'insufficient';
    nextPeriodDate = null;
    uncertaintyDays = 3;
  }

  // Phase estimation based on cycle day and effective cycle length
  const effectiveLen = averageCycleLength || defaultCycleLen;
  let currentPhase: CyclePhase = 'insufficient_data';
  let phaseLabel = 'Tracking Active';
  let phaseDescription = '';
  let phaseTip = '';

  if (cycleDay === null) {
    currentPhase = 'insufficient_data';
    phaseLabel = 'Future Date';
    phaseDescription = 'Last recorded period is set after today.';
    phaseTip = 'Keep your start dates current with your body.';
  } else if (isPeriodOngoing || cycleDay <= averagePeriodDuration) {
    currentPhase = 'menstrual';
    phaseLabel = 'Menstrual Phase';
    phaseDescription = 'Hormone levels (estrogen and progesterone) are at their lowest baseline.';
    phaseTip = 'Prioritize rest, gentle warmth, hydration, and nourishing iron-rich meals.';
  } else if (cycleDay <= effectiveLen - 17) {
    currentPhase = 'follicular';
    phaseLabel = 'Follicular Phase';
    phaseDescription = 'Estrogen rises steadily as ovarian follicles develop. Energy and mental clarity often increase.';
    phaseTip = 'Great phase for focused creative work, challenging tasks, and refreshing workouts.';
  } else if (cycleDay >= effectiveLen - 16 && cycleDay <= effectiveLen - 12) {
    currentPhase = 'ovulatory';
    phaseLabel = 'Estimated Ovulatory Window';
    phaseDescription = 'Luteinizing hormone peak occurs around this window (~14 days before your next expected period).';
    phaseTip = 'Energy is often high. Reminder: Calendar windows are approximations, not for clinical contraception.';
  } else if (cycleDay <= effectiveLen) {
    currentPhase = 'luteal';
    phaseLabel = 'Luteal Phase';
    phaseDescription = 'Progesterone dominates to nurture the uterine lining. Body temperature may be slightly higher.';
    phaseTip = 'Support yourself with magnesium, steady protein, gentle yoga, and restorative sleep.';
  } else {
    currentPhase = 'late';
    phaseLabel = `Cycle Day ${cycleDay} (Pending)`;
    phaseDescription = `Your cycle is currently longer than your expected ${effectiveLen}-day timeframe.`;
    phaseTip = 'Cycle shifts are normal and commonly caused by stress, illness, travel, or routine changes.';
  }

  return {
    hasData: true,
    cycleDay,
    currentPhase,
    phaseLabel,
    phaseDescription,
    phaseTip,
    averageCycleLength,
    averagePeriodDuration,
    lastPeriodStart,
    lastPeriodEnd,
    nextPeriodDate,
    uncertaintyDays,
    confidence,
    totalCyclesLogged: sorted.length,
    cycleLengths,
    isPeriodOngoing,
  };
}

/**
 * Returns a list of predicted next-period days based on analysis
 */
export function getPredictedPeriodDates(analysis: CycleAnalysis): string[] {
  if (!analysis.nextPeriodDate) return [];
  const duration = analysis.averagePeriodDuration || 5;
  const dates: string[] = [];
  for (let i = 0; i < duration; i++) {
    dates.push(addDays(analysis.nextPeriodDate, i));
  }
  return dates;
}

/**
 * Returns estimated ovulatory window dates (roughly 5-day window centered ~14 days before next period)
 */
export function getEstimatedOvulationDates(analysis: CycleAnalysis): string[] {
  if (!analysis.nextPeriodDate) return [];
  const dates: string[] = [];
  // 16 to 12 days before next period
  for (let i = 16; i >= 12; i--) {
    dates.push(addDays(analysis.nextPeriodDate, -i));
  }
  return dates;
}

export interface DayCycleStatus {
  date: string;
  isToday: boolean;
  isLoggedPeriod: boolean;
  isPredictedPeriod: boolean;
  isPredictedOvulation: boolean;
  periodEntry?: PeriodEntry;
  flow: 'none' | 'light' | 'medium' | 'heavy';
  symptoms: string[];
  note?: string;
  cycleDay: number | null;
  phaseLabel: string;
}

/**
 * Analyze any given date in the calendar
 */
export function inspectDateCycleStatus(
  date: string,
  analysis: CycleAnalysis,
  periods: PeriodEntry[] = [],
  periodDays: Record<string, PeriodDay> = {},
  todayDate: string = toDateStr()
): DayCycleStatus {
  const isToday = date === todayDate;
  const existingDay = periodDays[date];

  // Find if date falls inside any logged period
  const matchingPeriod = periods.find((p) => {
    const end = p.endDate || p.startDate;
    return date >= p.startDate && date <= end;
  });

  const isLoggedPeriod = Boolean(matchingPeriod) || (existingDay && existingDay.flow !== 'none');
  const flow: DayCycleStatus['flow'] = matchingPeriod?.flow || existingDay?.flow || 'none';
  const symptoms: string[] = matchingPeriod?.symptoms?.length ? matchingPeriod.symptoms : existingDay?.symptoms || [];
  const note = matchingPeriod?.note || existingDay?.note;

  // Predicted dates
  const predictedPeriodDates = getPredictedPeriodDates(analysis);
  const isPredictedPeriod = !isLoggedPeriod && predictedPeriodDates.includes(date);

  const predictedOvulationDates = getEstimatedOvulationDates(analysis);
  const isPredictedOvulation = !isLoggedPeriod && !isPredictedPeriod && predictedOvulationDates.includes(date);

  // Cycle day on this date
  let cycleDay: number | null = null;
  let phaseLabel = 'No cycle data';

  if (analysis.lastPeriodStart) {
    const diff = daysBetween(date, analysis.lastPeriodStart);
    if (diff >= 0) {
      cycleDay = diff + 1;
      const effectiveLen = analysis.averageCycleLength || 28;
      const avgDuration = analysis.averagePeriodDuration || 5;

      if (isLoggedPeriod || cycleDay <= avgDuration) {
        phaseLabel = 'Menstrual Phase';
      } else if (cycleDay <= effectiveLen - 17) {
        phaseLabel = 'Follicular Phase';
      } else if (cycleDay >= effectiveLen - 16 && cycleDay <= effectiveLen - 12) {
        phaseLabel = 'Estimated Ovulatory Window';
      } else if (cycleDay <= effectiveLen) {
        phaseLabel = 'Luteal Phase';
      } else {
        phaseLabel = 'Pending Next Cycle';
      }
    }
  }

  return {
    date,
    isToday,
    isLoggedPeriod: Boolean(isLoggedPeriod),
    isPredictedPeriod,
    isPredictedOvulation,
    periodEntry: matchingPeriod,
    flow,
    symptoms,
    note,
    cycleDay,
    phaseLabel,
  };
}
