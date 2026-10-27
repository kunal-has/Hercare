import { useState, useEffect } from 'react';
import { useStore, today } from '../store';
import { X, CalendarHeart, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { addDays, toDateStr } from '../utils/cycleCalculations';
import type { PeriodEntry } from '../types';

const SYMPTOM_OPTIONS = [
  'cramps',
  'bloating',
  'fatigue',
  'headache',
  'mood swings',
  'tender',
  'cravings',
  'backache',
  'acne',
  'nausea',
];

const FLOW_OPTIONS: { id: PeriodEntry['flow']; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'medium', label: 'Medium' },
  { id: 'heavy', label: 'Heavy' },
];

export function PeriodLogModal() {
  const { isPeriodModalOpen, periodModalConfig, closePeriodModal, addPeriodEntry, updatePeriodEntry, deletePeriodEntry } = useStore();

  const isEditing = Boolean(periodModalConfig?.entryToEdit);
  const existing = periodModalConfig?.entryToEdit;

  const [startDate, setStartDate] = useState('');
  const [isOngoing, setIsOngoing] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [flow, setFlow] = useState<PeriodEntry['flow']>('medium');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isPeriodModalOpen) {
      if (existing) {
        setStartDate(existing.startDate);
        setEndDate(existing.endDate || '');
        setIsOngoing(!existing.endDate);
        setFlow(existing.flow);
        setSymptoms(existing.symptoms || []);
        setNote(existing.note || '');
      } else {
        const defaultStart = periodModalConfig?.initialDate || today();
        setStartDate(defaultStart);
        setEndDate(addDays(defaultStart, 4)); // default 5-day period
        setIsOngoing(false);
        setFlow('medium');
        setSymptoms([]);
        setNote('');
      }
      setErrorMsg(null);
      setSuccessMsg(null);
      setShowDeleteConfirm(false);
    }
  }, [isPeriodModalOpen, existing, periodModalConfig]);

  if (!isPeriodModalOpen) return null;

  const handleToggleSymptom = (sym: string) => {
    setSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const finalEndDate = isOngoing ? undefined : endDate || undefined;

    if (isEditing && existing) {
      const res = updatePeriodEntry({
        id: existing.id,
        startDate,
        endDate: finalEndDate,
        flow,
        symptoms,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to update period entry.');
        return;
      }
      setSuccessMsg('Period updated successfully!');
      setTimeout(() => closePeriodModal(), 600);
    } else {
      const res = addPeriodEntry({
        startDate,
        endDate: finalEndDate,
        flow,
        symptoms,
        note: note.trim() || undefined,
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to log period.');
        return;
      }
      setSuccessMsg('Period logged successfully!');
      setTimeout(() => closePeriodModal(), 600);
    }
  };

  const handleDelete = () => {
    if (existing) {
      deletePeriodEntry(existing.id);
      closePeriodModal();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum-950/60 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="period-modal-title"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-cream-50 dark:bg-night-800 border border-blush-100 dark:border-night-500/50 shadow-2xl p-6 md:p-7 max-h-[90vh] overflow-y-auto animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blush-500 text-white shadow-soft">
              <CalendarHeart className="h-5 w-5" />
            </div>
            <div>
              <h2 id="period-modal-title" className="font-display text-xl font-semibold text-plum-700 dark:text-night-text">
                {isEditing ? 'Edit Period Entry' : 'Log Period'}
              </h2>
              <p className="text-xs text-plum-400 dark:text-night-muted">
                {isEditing ? 'Update your cycle records' : 'Record your period start and symptoms'}
              </p>
            </div>
          </div>
          <button
            onClick={closePeriodModal}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-50 dark:bg-night-700 text-plum-500 dark:text-night-muted hover:bg-blush-100 dark:hover:bg-night-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Feedback Alerts */}
        {errorMsg && (
          <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 p-3.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 animate-pop">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dates Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="period-start" className="block text-xs font-semibold text-plum-500 dark:text-night-muted mb-1.5">
                Start Date *
              </label>
              <input
                id="period-start"
                type="date"
                required
                max={toDateStr()}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-blush-100 dark:border-night-500/50 bg-white dark:bg-night-700 p-3 text-sm text-plum-700 dark:text-night-text focus:outline-none focus:ring-2 focus:ring-blush-300 dark:focus:ring-blush-400"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="period-end" className="block text-xs font-semibold text-plum-500 dark:text-night-muted">
                  End Date
                </label>
                <label className="flex items-center gap-1.5 text-[11px] text-plum-500 dark:text-night-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isOngoing}
                    onChange={(e) => setIsOngoing(e.target.checked)}
                    className="accent-blush-500 rounded"
                  />
                  <span>Ongoing</span>
                </label>
              </div>
              <input
                id="period-end"
                type="date"
                disabled={isOngoing}
                value={isOngoing ? '' : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="w-full rounded-2xl border border-blush-100 dark:border-night-500/50 bg-white dark:bg-night-700 p-3 text-sm text-plum-700 dark:text-night-text focus:outline-none focus:ring-2 focus:ring-blush-300 dark:focus:ring-blush-400 disabled:opacity-40 disabled:cursor-not-allowed"
                placeholder={isOngoing ? 'Period is currently ongoing' : ''}
              />
            </div>
          </div>

          {/* Flow Intensity */}
          <div>
            <label className="block text-xs font-semibold text-plum-500 dark:text-night-muted mb-1.5">
              Flow Intensity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {FLOW_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setFlow(opt.id)}
                  className={`rounded-2xl py-2.5 text-xs font-semibold transition-all ${
                    flow === opt.id
                      ? 'bg-blush-500 text-white shadow-soft'
                      : 'bg-white dark:bg-night-700 text-plum-600 dark:text-night-muted border border-blush-100 dark:border-night-500/40 hover:bg-blush-50 dark:hover:bg-night-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Symptoms */}
          <div>
            <label className="block text-xs font-semibold text-plum-500 dark:text-night-muted mb-1.5">
              Symptoms Experienced
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SYMPTOM_OPTIONS.map((sym) => {
                const active = symptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => handleToggleSymptom(sym)}
                    className={`pill capitalize transition-all ${
                      active
                        ? 'bg-plum-600 text-white shadow-sm'
                        : 'bg-white dark:bg-night-700 text-plum-600 dark:text-night-muted border border-blush-100 dark:border-night-500/40 hover:bg-blush-50 dark:hover:bg-night-600'
                    }`}
                  >
                    {active ? '✓ ' : ''}{sym}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="period-notes" className="block text-xs font-semibold text-plum-500 dark:text-night-muted mb-1.5">
              Personal Notes
            </label>
            <textarea
              id="period-notes"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How are you feeling? Details about flow, mood, or energy..."
              className="w-full rounded-2xl border border-blush-100 dark:border-night-500/50 bg-white dark:bg-night-700 p-3 text-sm text-plum-700 dark:text-night-text placeholder:text-plum-300 dark:placeholder:text-night-muted focus:outline-none focus:ring-2 focus:ring-blush-300 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {isEditing && (
              <div>
                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-3 py-1.5 rounded-full bg-rose-500 text-white text-xs font-semibold hover:bg-rose-600 shadow-soft"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="text-xs text-plum-400 dark:text-night-muted"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={closePeriodModal}
                className="btn-ghost px-4 py-2.5 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary px-6 py-2.5 text-xs font-semibold shadow-soft"
              >
                {isEditing ? 'Save Changes' : 'Save Period'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
