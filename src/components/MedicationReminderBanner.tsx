import { useState, useEffect } from 'react';
import { Card } from './ui';
import { Bell, Check, Clock, Volume2, BellOff } from 'lucide-react';
import { useStore, today } from '../store';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  getNextDueDose,
  playChimeSound,
  triggerBrowserNotification,
  getCurrentTimeStr,
} from '../utils/reminderService';

export function MedicationReminderBanner() {
  const { data, toggleMedTaken } = useStore();
  const t = today();

  const [currentTime, setCurrentTime] = useState(getCurrentTimeStr());
  const [remindersEnabled, setRemindersEnabled] = useLocalStorage<boolean>('hercare_med_reminders', true);
  const [testAlertSent, setTestAlertSent] = useState(false);

  // Update current time every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTimeStr());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const nextDose = getNextDueDose(data.meds || [], data.medLogs || {}, t, currentTime);

  const handleTakeDose = () => {
    if (nextDose) {
      toggleMedTaken(nextDose.med.id, t, nextDose.time);
      playChimeSound();
    }
  };

  const handleTestReminder = async () => {
    playChimeSound();
    const title = nextDose
      ? `Time for ${nextDose.med.name} (${nextDose.med.dosage})`
      : 'HERCARE Dose Reminder Alert';
    const body = nextDose
      ? `Scheduled for ${nextDose.formattedTime}. Stay consistent with your wellness routine!`
      : 'Your medication reminder alerts are active and working smoothly.';

    await triggerBrowserNotification(title, body);
    setTestAlertSent(true);
    setTimeout(() => setTestAlertSent(false), 3000);
  };

  if (!data.meds || data.meds.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-r from-cream-100 via-blush-50 to-cream-50 dark:from-night-800 dark:via-night-800 dark:to-night-700 border-blush-200 dark:border-night-500/40 shadow-soft">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Left Info */}
        <div className="flex items-start gap-3.5">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-2xl shrink-0 mt-0.5 ${
              nextDose?.isDueNow
                ? 'bg-blush-500 text-white animate-pulse shadow-soft'
                : 'bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300'
            }`}
          >
            <Bell className="h-5 w-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-plum-500 dark:text-night-muted">
                {nextDose?.isDueNow ? 'Dose Due Now' : 'Next Dose Reminder'}
              </span>
              {nextDose?.isDueNow && (
                <span className="pill bg-blush-500 text-white text-[10px] animate-pop">
                  Active
                </span>
              )}
            </div>

            {nextDose ? (
              <div className="mt-1">
                <p className="font-display text-base sm:text-lg font-semibold text-plum-700 dark:text-night-text">
                  {nextDose.med.name}{' '}
                  <span className="text-xs font-normal text-plum-500 dark:text-night-muted">
                    ({nextDose.med.dosage})
                  </span>
                </p>
                <p className="text-xs text-plum-500 dark:text-night-muted flex items-center gap-1.5 mt-0.5">
                  <Clock className="h-3.5 w-3.5 text-blush-400" />
                  Scheduled for <strong>{nextDose.formattedTime}</strong>
                  {nextDose.minutesDiff > 0 && !nextDose.isDueNow
                    ? ` (in ~${nextDose.minutesDiff} mins)`
                    : nextDose.isOverdue
                    ? ' (overdue)'
                    : ' (ready to take)'}
                </p>
              </div>
            ) : (
              <div className="mt-1">
                <p className="font-semibold text-plum-700 dark:text-night-text text-sm flex items-center gap-1.5">
                  <Check className="h-4 w-4 text-sage-600 dark:text-sage-400" /> All doses completed for today!
                </p>
                <p className="text-xs text-plum-400 dark:text-night-muted mt-0.5">
                  You have taken all your scheduled medications. Great consistency!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 self-end sm:self-center shrink-0">
          {nextDose && (
            <button
              type="button"
              onClick={handleTakeDose}
              className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5 shadow-soft"
            >
              <Check className="h-3.5 w-3.5" /> Mark taken
            </button>
          )}

          <button
            type="button"
            onClick={() => setRemindersEnabled((prev) => !prev)}
            className={`btn-ghost text-xs px-2.5 py-2 inline-flex items-center gap-1.5 ${
              remindersEnabled ? 'text-sage-600 dark:text-sage-400' : 'text-plum-400 dark:text-night-muted'
            }`}
            title={remindersEnabled ? 'Reminders active' : 'Reminders muted'}
          >
            {remindersEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{remindersEnabled ? 'Alerts On' : 'Alerts Off'}</span>
          </button>

          <button
            type="button"
            onClick={handleTestReminder}
            className="btn-ghost text-xs px-3.5 py-2 inline-flex items-center gap-1.5 text-plum-600 dark:text-night-text"
            title="Play reminder chime and test notification"
          >
            <Volume2 className="h-3.5 w-3.5 text-blush-500" />
            <span>{testAlertSent ? 'Alert Sent!' : 'Test Chime'}</span>
          </button>
        </div>
      </div>
    </Card>
  );
}
