import type { Medication, MedLog } from '../types.ts';

export interface NextDueDose {
  med: Medication;
  time: string;
  isOverdue: boolean;
  isDueNow: boolean; // within 15 minutes of now
  minutesDiff: number; // positive = future, negative = overdue
  formattedTime: string;
}

/**
 * Returns the current time in HH:mm (24h)
 */
export function getCurrentTimeStr(d: Date = new Date()): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Calculates minutes between two HH:mm strings on the same day (timeA - timeB)
 */
export function timeDiffInMinutes(timeA: string, timeB: string): number {
  const [hA, mA] = timeA.split(':').map(Number);
  const [hB, mB] = timeB.split(':').map(Number);
  return (hA * 60 + mA) - (hB * 60 + mB);
}

/**
 * Finds the next untaken medication dose for a given date and time.
 */
export function getNextDueDose(
  meds: Medication[] = [],
  medLogs: Record<string, MedLog> = {},
  dateStr: string,
  currentTimeStr: string = getCurrentTimeStr()
): NextDueDose | null {
  if (!meds || meds.length === 0) return null;

  const candidateDoses: NextDueDose[] = [];

  for (const med of meds) {
    const log = medLogs[`${med.id}_${dateStr}`];
    const takenTimes = log?.taken || [];

    for (const time of med.times) {
      if (!takenTimes.includes(time)) {
        const diff = timeDiffInMinutes(time, currentTimeStr);
        // Due now: within 15 mins before or up to 30 mins after scheduled time
        const isDueNow = diff >= -30 && diff <= 15;
        const isOverdue = diff < -30;

        // Convert HH:mm to 12h format e.g. "8:00 AM" or "8:00 PM"
        const [h, m] = time.split(':').map(Number);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const formattedTime = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;

        candidateDoses.push({
          med,
          time,
          isOverdue,
          isDueNow,
          minutesDiff: diff,
          formattedTime,
        });
      }
    }
  }

  if (candidateDoses.length === 0) return null;

  // Prioritize:
  // 1. Doses that are due right now or overdue
  // 2. Earliest upcoming dose
  candidateDoses.sort((a, b) => {
    if (a.isDueNow && !b.isDueNow) return -1;
    if (!a.isDueNow && b.isDueNow) return 1;
    if (a.isOverdue && !b.isOverdue) return -1;
    if (!a.isOverdue && b.isOverdue) return 1;
    return a.minutesDiff - b.minutesDiff;
  });

  return candidateDoses[0];
}

/**
 * Native Web Audio chime sound
 */
export function playChimeSound(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    // Gentle 2-tone melodic chime (D5 -> A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.55);
  } catch {
    /* ignore audio restrictions */
  }
}

/**
 * Trigger browser native notification if permitted
 */
export async function triggerBrowserNotification(title: string, body: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    playChimeSound();
    return true;
  }

  if (Notification.permission !== 'denied') {
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      playChimeSound();
      return true;
    }
  }

  return false;
}
