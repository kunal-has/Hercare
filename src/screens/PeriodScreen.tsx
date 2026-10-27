import { useState, useMemo } from 'react';
import { Card, SectionTitle } from '../components/ui';
import {
  CalendarHeart,
  ChevronLeft,
  ChevronRight,
  Plus,
  Sparkles,
  Info,
  Calendar as CalendarIcon,
  Edit2,
  Check,
} from 'lucide-react';
import { useStore } from '../store';
import { todayStr } from '../hooks/useLocalStorage';
import {
  calculateCycleAnalysis,
  inspectDateCycleStatus,
  formatDisplayDate,
  daysBetween,
} from '../utils/cycleCalculations';
import type { PeriodDay } from '../types';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const FLOWS: { v: PeriodDay['flow']; label: string }[] = [
  { v: 'none', label: 'None' },
  { v: 'light', label: 'Light' },
  { v: 'medium', label: 'Medium' },
  { v: 'heavy', label: 'Heavy' },
];

const SYMPTOMS_LIST = [
  'cramps',
  'bloating',
  'fatigue',
  'headache',
  'mood swings',
  'tender',
  'cravings',
  'backache',
];

export function PeriodScreen() {
  const { data, setPeriodDay, openPeriodModal } = useStore();
  const today = todayStr();

  const [view, setView] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [selected, setSelected] = useState<string>(today);

  // Cycle analysis from service
  const cycleAnalysis = useMemo(
    () => calculateCycleAnalysis(data.periods || [], today, data.goals.cycleLength || 28),
    [data.periods, today, data.goals.cycleLength]
  );

  // Status of the selected date
  const dateStatus = useMemo(
    () => inspectDateCycleStatus(selected, cycleAnalysis, data.periods || [], data.period, today),
    [selected, cycleAnalysis, data.periods, data.period, today]
  );

  // Calendar cells for current month view
  const firstDay = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();
  const cells: (string | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = `${view.y}-${String(view.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push(dayStr);
  }

  const changeMonth = (delta: number) => {
    setView((v) => {
      const nm = v.m + delta;
      return { y: v.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });
  };

  const jumpToToday = () => {
    const d = new Date();
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(today);
  };

  // Day-level notes / flow quick updates
  const handleFlowChange = (newFlow: PeriodDay['flow']) => {
    const current = data.period[selected] || { date: selected, flow: 'none', symptoms: [] };
    setPeriodDay({ ...current, flow: newFlow });
  };

  const handleToggleSymptom = (sym: string) => {
    const current = data.period[selected] || { date: selected, flow: 'none', symptoms: [] };
    const curSymptoms = current.symptoms || [];
    const nextSymptoms = curSymptoms.includes(sym)
      ? curSymptoms.filter((s) => s !== sym)
      : [...curSymptoms, sym];
    setPeriodDay({ ...current, symptoms: nextSymptoms });
  };

  const handleNoteChange = (text: string) => {
    const current = data.period[selected] || { date: selected, flow: 'none', symptoms: [] };
    setPeriodDay({ ...current, note: text || undefined });
  };

  const sortedPeriods = useMemo(() => {
    return [...(data.periods || [])].sort((a, b) => b.startDate.localeCompare(a.startDate));
  }, [data.periods]);

  return (
    <div className="tab-stagger space-y-6">
      {/* Title & Top Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionTitle
          title="Cycle Calendar"
          subtitle="Smart period logging, phase tracking & predictions"
          icon={<CalendarHeart className="h-5 w-5" />}
        />
        <button
          type="button"
          onClick={() => openPeriodModal(selected)}
          className="btn-primary shadow-soft shrink-0"
        >
          <Plus className="h-4 w-4" /> Log period
        </button>
      </div>

      {/* Cycle Overview & Next Period Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Phase Card */}
        <Card className="bg-gradient-to-br from-blush-500 to-blush-600 text-white border-blush-400 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/80">
              Current Status
            </span>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse" />
          </div>

          <div className="mt-3">
            <p className="font-display text-4xl font-semibold">
              {cycleAnalysis.cycleDay ? `Day ${cycleAnalysis.cycleDay}` : 'Not Active'}
            </p>
            <p className="text-white text-base font-medium mt-1">
              {cycleAnalysis.phaseLabel}
            </p>
            <p className="text-white/80 text-xs mt-2 leading-relaxed">
              {cycleAnalysis.phaseDescription}
            </p>
          </div>
        </Card>

        {/* Prediction Card */}
        <Card className="md:col-span-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-plum-400 dark:text-night-muted flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-gold-400" /> Next Period Estimate
            </span>
            {cycleAnalysis.confidence === 'high' && (
              <span className="pill bg-sage-100 dark:bg-night-600 text-sage-600 dark:text-sage-400">
                High Confidence
              </span>
            )}
          </div>

          {cycleAnalysis.nextPeriodDate ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-baseline gap-2">
                <p className="font-display text-2xl sm:text-3xl font-semibold text-plum-700 dark:text-night-text">
                  ~ {formatDisplayDate(cycleAnalysis.nextPeriodDate, { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
                <span className="text-xs text-plum-500 dark:text-night-muted">
                  (window: ±{cycleAnalysis.uncertaintyDays} days)
                </span>
              </div>
              <p className="text-xs text-plum-500 dark:text-night-muted leading-relaxed">
                Calculated from your historical average cycle length of{' '}
                <strong className="text-plum-700 dark:text-night-text">{cycleAnalysis.averageCycleLength} days</strong>.
                Actual cycles naturally fluctuate with sleep, stress, illness, and travel.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 py-1">
              <p className="text-base font-semibold text-plum-700 dark:text-night-text">
                {cycleAnalysis.totalCyclesLogged === 1
                  ? 'More Data Needed for Personalized Estimate'
                  : 'No Period History Recorded Yet'}
              </p>
              <p className="text-xs text-plum-400 dark:text-night-muted leading-relaxed">
                {cycleAnalysis.totalCyclesLogged === 1
                  ? 'You have logged 1 period. Log your next period to compute your personalized cycle length and predict future cycles.'
                  : 'Log at least 2 consecutive periods to calculate personalized cycle lengths and future estimates.'}
              </p>
            </div>
          )}

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-3 border-t border-blush-100 dark:border-night-500/40 text-xs">
            <div>
              <p className="text-plum-400 dark:text-night-muted">Avg Cycle</p>
              <p className="font-semibold text-plum-700 dark:text-night-text">
                {cycleAnalysis.averageCycleLength ? `${cycleAnalysis.averageCycleLength} days` : '—'}
              </p>
            </div>
            <div>
              <p className="text-plum-400 dark:text-night-muted">Avg Duration</p>
              <p className="font-semibold text-plum-700 dark:text-night-text">
                {cycleAnalysis.averagePeriodDuration ? `${cycleAnalysis.averagePeriodDuration} days` : '—'}
              </p>
            </div>
            <div>
              <p className="text-plum-400 dark:text-night-muted">Cycles Logged</p>
              <p className="font-semibold text-plum-700 dark:text-night-text">
                {cycleAnalysis.totalCyclesLogged}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Calendar & Day Inspection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Calendar View */}
        <Card className="lg:col-span-2">
          {/* Navigation Bar */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => changeMonth(-1)}
              className="btn-ghost px-2.5 py-2 text-xs"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg font-semibold text-plum-700 dark:text-night-text">
                {MONTHS[view.m]} {view.y}
              </h3>
              <button
                type="button"
                onClick={jumpToToday}
                className="text-[11px] font-semibold text-blush-500 hover:text-blush-600 underline ml-1"
              >
                Today
              </button>
            </div>

            <button
              type="button"
              onClick={() => changeMonth(1)}
              className="btn-ghost px-2.5 py-2 text-xs"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="text-center text-xs font-semibold text-plum-300 dark:text-night-muted">
                {w}
              </div>
            ))}
          </div>

          {/* Month Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square" />;

              const st = inspectDateCycleStatus(d, cycleAnalysis, data.periods || [], data.period, today);
              const isSel = d === selected;
              const dayNum = Number(d.slice(-2));

              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelected(d)}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all text-xs focus:outline-none focus:ring-2 focus:ring-blush-400 ${
                    isSel
                      ? 'ring-2 ring-plum-700 dark:ring-blush-400 shadow-md scale-105 z-10'
                      : 'hover:scale-102'
                  } ${
                    st.isLoggedPeriod
                      ? 'bg-blush-500 text-white font-bold shadow-soft'
                      : st.isPredictedPeriod
                      ? 'border-2 border-dashed border-blush-400/90 bg-blush-50/80 dark:bg-night-700 text-blush-600 dark:text-blush-300 font-medium'
                      : 'bg-white/60 dark:bg-night-700/60 hover:bg-blush-50 dark:hover:bg-night-600 text-plum-700 dark:text-night-text'
                  }`}
                  aria-label={`${formatDisplayDate(d)}${st.isLoggedPeriod ? ' - Logged period' : ''}${st.isPredictedPeriod ? ' - Estimated future period' : ''}`}
                >
                  <span className={`${st.isToday ? 'underline decoration-2 underline-offset-2' : ''}`}>
                    {dayNum}
                  </span>

                  {/* Badges / indicators */}
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {st.isPredictedOvulation && !st.isLoggedPeriod && !st.isPredictedPeriod && (
                      <span className="h-1.5 w-1.5 rounded-full bg-gold-400" title="Estimated ovulatory window" />
                    )}
                    {st.symptoms.length > 0 && !st.isLoggedPeriod && (
                      <span className="h-1 w-1 rounded-full bg-plum-400" />
                    )}
                    {st.isLoggedPeriod && st.flow !== 'none' && (
                      <span className="text-[8px] opacity-90 leading-none">
                        {st.flow === 'heavy' ? '•••' : st.flow === 'medium' ? '••' : '•'}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Visual Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-5 pt-3.5 border-t border-blush-100 dark:border-night-500/40 text-[11px] text-plum-500 dark:text-night-muted">
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-3.5 rounded-md bg-blush-500" />
              <span>Logged Period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-3.5 w-3.5 rounded-md border border-dashed border-blush-400 bg-blush-50 dark:bg-night-700" />
              <span>Estimated Future Period</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gold-400" />
              <span>Estimated Ovulatory Window</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="font-semibold underline">Underline</span>
              <span>Today</span>
            </div>
          </div>
        </Card>

        {/* Selected Date Details & Symptoms */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <p className="font-display text-base font-semibold text-plum-700 dark:text-night-text">
                  {formatDisplayDate(selected, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="pill bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300 text-[10px]">
                    {dateStatus.phaseLabel}
                  </span>
                  {dateStatus.cycleDay && (
                    <span className="text-[11px] text-plum-400 dark:text-night-muted">
                      Day {dateStatus.cycleDay}
                    </span>
                  )}
                </div>
              </div>

              {dateStatus.periodEntry ? (
                <button
                  type="button"
                  onClick={() => openPeriodModal(undefined, dateStatus.periodEntry)}
                  className="btn-ghost px-2.5 py-1 text-xs shrink-0 inline-flex items-center gap-1 text-blush-600"
                >
                  <Edit2 className="h-3 w-3" /> Edit Period
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openPeriodModal(selected)}
                  className="btn-ghost px-2.5 py-1 text-xs shrink-0 inline-flex items-center gap-1 text-blush-600"
                >
                  <Plus className="h-3 w-3" /> Log Start
                </button>
              )}
            </div>

            {/* Status indicator */}
            {dateStatus.isLoggedPeriod && (
              <div className="mb-3 p-2.5 rounded-xl bg-blush-50 dark:bg-night-700 border border-blush-100 dark:border-night-500/40 text-xs text-blush-600 dark:text-blush-300 flex items-center justify-between">
                <span>Logged Period Day</span>
                <span className="font-semibold capitalize">{dateStatus.flow} flow</span>
              </div>
            )}

            {dateStatus.isPredictedPeriod && (
              <div className="mb-3 p-2.5 rounded-xl bg-blush-50/80 dark:bg-night-700 border border-dashed border-blush-300 text-xs text-blush-600 dark:text-blush-300">
                Estimated future period window based on past cycle averages.
              </div>
            )}

            {/* Quick Flow selector */}
            <p className="text-xs font-semibold text-plum-400 dark:text-night-muted mb-1.5">
              Flow for this date
            </p>
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {FLOWS.map((f) => (
                <button
                  key={f.v}
                  type="button"
                  onClick={() => handleFlowChange(f.v)}
                  className={`rounded-xl py-1.5 text-xs font-medium transition-all ${
                    dateStatus.flow === f.v
                      ? 'bg-blush-500 text-white shadow-soft'
                      : 'bg-blush-50 dark:bg-night-600 text-plum-500 dark:text-night-muted hover:bg-blush-100 dark:hover:bg-night-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Quick Symptoms selector */}
            <p className="text-xs font-semibold text-plum-400 dark:text-night-muted mb-1.5">
              Symptoms
            </p>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {SYMPTOMS_LIST.map((s) => {
                const on = dateStatus.symptoms.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleToggleSymptom(s)}
                    className={`pill transition-all ${
                      on
                        ? 'bg-plum-500 text-white'
                        : 'bg-blush-50 dark:bg-night-600 text-plum-500 dark:text-night-muted hover:bg-blush-100 dark:hover:bg-night-500'
                    }`}
                  >
                    {on && <Check className="h-3 w-3" />} {s}
                  </button>
                );
              })}
            </div>

            {/* Daily Note */}
            <p className="text-xs font-semibold text-plum-400 dark:text-night-muted mb-1.5">
              Daily Note
            </p>
            <textarea
              value={dateStatus.note || ''}
              onChange={(e) => handleNoteChange(e.target.value)}
              placeholder="How are you feeling today?"
              className="w-full rounded-2xl border border-blush-100 dark:border-night-500/40 bg-cream-50 dark:bg-night-600 p-2.5 text-xs text-plum-600 dark:text-night-text placeholder:text-plum-300 dark:placeholder:text-night-muted focus:outline-none focus:ring-2 focus:ring-blush-300 resize-none"
              rows={2}
            />
          </Card>

          {/* Scientific Transparency & Disclaimer */}
          <Card className="bg-plum-900/5 dark:bg-night-700/40 border-plum-100 dark:border-night-500/40">
            <div className="flex items-start gap-2.5">
              <Info className="h-4 w-4 text-plum-400 dark:text-night-muted shrink-0 mt-0.5" />
              <div className="text-[11px] text-plum-500 dark:text-night-muted leading-relaxed">
                <p className="font-semibold text-plum-700 dark:text-night-text mb-0.5">
                  About Cycle Estimation
                </p>
                Phases are estimated using documented hormonal timeline windows centered around a ~14-day luteal phase. Calendar estimations are natural wellness approximations and must <strong>never</strong> be used as clinical contraception or diagnostic medical advice.
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Logged Periods History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-semibold text-plum-700 dark:text-night-text">
              Period History ({sortedPeriods.length})
            </h3>
            <p className="text-xs text-plum-400 dark:text-night-muted">
              Past cycles recorded in HERCARE
            </p>
          </div>
          <button
            type="button"
            onClick={() => openPeriodModal()}
            className="btn-ghost px-3 py-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" /> Add period
          </button>
        </div>

        {sortedPeriods.length === 0 ? (
          <div className="text-center py-8">
            <CalendarIcon className="h-8 w-8 text-plum-300 dark:text-night-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-plum-600 dark:text-night-text">No periods logged yet</p>
            <p className="text-xs text-plum-400 dark:text-night-muted mt-1">
              Tap "Log period" to record your cycle and unlock smart predictions.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedPeriods.map((p, idx) => {
              const duration = p.endDate ? daysBetween(p.endDate, p.startDate) + 1 : 'Ongoing';
              // Cycle length to next period in chronology
              const nextPeriod = sortedPeriods[idx - 1]; // sorted descending, so idx - 1 is chronologically after p
              const cycleLength = nextPeriod ? daysBetween(nextPeriod.startDate, p.startDate) : null;

              return (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/70 dark:bg-night-700/70 border border-blush-100 dark:border-night-500/40 hover:shadow-soft transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300 font-semibold text-xs shrink-0">
                      {p.startDate.slice(-2)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-plum-700 dark:text-night-text">
                        {formatDisplayDate(p.startDate, { month: 'short', day: 'numeric', year: 'numeric' })}
                        {p.endDate ? ` — ${formatDisplayDate(p.endDate, { month: 'short', day: 'numeric' })}` : ' (Ongoing)'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="pill bg-blush-50 dark:bg-night-600 text-plum-600 dark:text-night-text text-[10px] capitalize">
                          {p.flow} flow
                        </span>
                        <span className="text-[11px] text-plum-400 dark:text-night-muted">
                          Duration: {typeof duration === 'number' ? `${duration} days` : duration}
                        </span>
                        {cycleLength && (
                          <span className="text-[11px] text-sage-600 dark:text-sage-400 font-medium">
                            • Cycle length: {cycleLength} days
                          </span>
                        )}
                      </div>
                      {p.symptoms && p.symptoms.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {p.symptoms.map((s) => (
                            <span key={s} className="pill bg-cream-200 dark:bg-night-600 text-plum-500 dark:text-night-muted text-[9px] capitalize">
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => openPeriodModal(undefined, p)}
                    className="btn-ghost self-end sm:self-center px-3 py-1.5 text-xs inline-flex items-center gap-1.5 text-plum-600 dark:text-night-text"
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
