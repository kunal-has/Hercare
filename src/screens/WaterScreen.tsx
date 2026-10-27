import { useState, useMemo } from 'react';
import { Card, SectionTitle, Ring } from '../components/ui';
import {
  Droplets,
  Plus,
  Bell,
  BellOff,
  Settings,
  Trash2,
  Edit2,
  Check,
  X,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useStore, today } from '../store';
import type { WaterEntry } from '../types';
import { daysAgoStr } from '../hooks/useLocalStorage';

export function WaterScreen() {
  const {
    data,
    addWaterEntry,
    updateWaterEntry,
    deleteWaterEntry,
    updateHydrationSettings,
    snoozeHydration,
    toggleHydrationPause,
  } = useStore();

  const t = today();
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showCustomAddModal, setShowCustomAddModal] = useState(false);
  const [customMl, setCustomMl] = useState('350');
  const [customNote, setCustomNote] = useState('');

  // Editing single entry state
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(250);
  const [editNote, setEditNote] = useState<string>('');

  // Settings form state
  const settings = data.hydrationSettings || {
    dailyGoalMl: 2000,
    reminderIntervalMinutes: 90,
    wakingHoursStart: '08:00',
    wakingHoursEnd: '22:00',
    remindersEnabled: true,
    pausedForToday: false,
  };

  const [tempGoal, setTempGoal] = useState<string>(String(settings.dailyGoalMl));
  const [tempInterval, setTempInterval] = useState<number>(settings.reminderIntervalMinutes);
  const [tempWakingStart, setTempWakingStart] = useState<string>(settings.wakingHoursStart);
  const [tempWakingEnd, setTempWakingEnd] = useState<string>(settings.wakingHoursEnd);
  const [tempEnabled, setTempEnabled] = useState<boolean>(settings.remindersEnabled);

  // Active chart view
  const [chartView, setChartView] = useState<'weekly' | 'monthly'>('weekly');

  // Compute today's entries
  const todayEntries = useMemo(() => {
    return (data.waterEntries || [])
      .filter((e) => e.date === t)
      .sort((a, b) => b.time.localeCompare(a.time));
  }, [data.waterEntries, t]);

  const totalConsumedMl = useMemo(() => {
    return todayEntries.reduce((s, e) => s + e.amountMl, 0);
  }, [todayEntries]);

  const dailyGoalMl = settings.dailyGoalMl || 2000;
  const remainingMl = Math.max(0, dailyGoalMl - totalConsumedMl);
  const percentComplete = Math.min(100, Math.round((totalConsumedMl / dailyGoalMl) * 100));
  const goalReached = totalConsumedMl >= dailyGoalMl;

  // Past 7 days history
  const past7Days = useMemo(() => {
    const list: { date: string; dayLabel: string; ml: number; reached: boolean }[] = [];
    for (let i = 6; i >= 0; i--) {
      const dStr = daysAgoStr(i);
      const dayMl = (data.waterEntries || [])
        .filter((e) => e.date === dStr)
        .reduce((s, e) => s + e.amountMl, 0);
      const dayLabel = new Date(dStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3);
      list.push({
        date: dStr,
        dayLabel,
        ml: dayMl,
        reached: dayMl >= dailyGoalMl,
      });
    }
    return list;
  }, [data.waterEntries, dailyGoalMl]);

  // Past 30 days monthly history
  const past30Days = useMemo(() => {
    const list: { date: string; ml: number; reached: boolean }[] = [];
    for (let i = 29; i >= 0; i--) {
      const dStr = daysAgoStr(i);
      const dayMl = (data.waterEntries || [])
        .filter((e) => e.date === dStr)
        .reduce((s, e) => s + e.amountMl, 0);
      list.push({
        date: dStr,
        ml: dayMl,
        reached: dayMl >= dailyGoalMl,
      });
    }
    return list;
  }, [data.waterEntries, dailyGoalMl]);

  const monthlyAvgMl = useMemo(() => {
    const total = past30Days.reduce((s, d) => s + d.ml, 0);
    return Math.round(total / 30);
  }, [past30Days]);

  const monthlyDaysReached = useMemo(() => {
    return past30Days.filter((d) => d.reached).length;
  }, [past30Days]);

  const handleQuickAdd = (amount: number, note?: string) => {
    addWaterEntry(amount, t, undefined, note);
  };

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const mlNum = parseInt(customMl, 10);
    if (mlNum > 0) {
      addWaterEntry(mlNum, t, undefined, customNote.trim() || undefined);
    }
    setShowCustomAddModal(false);
    setCustomMl('350');
    setCustomNote('');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedGoal = parseInt(tempGoal, 10) || 2000;
    updateHydrationSettings({
      dailyGoalMl: parsedGoal,
      reminderIntervalMinutes: tempInterval,
      wakingHoursStart: tempWakingStart,
      wakingHoursEnd: tempWakingEnd,
      remindersEnabled: tempEnabled,
    });
    setShowSettingsModal(false);
  };

  const startEdit = (entry: WaterEntry) => {
    setEditingEntryId(entry.id);
    setEditAmount(entry.amountMl);
    setEditNote(entry.note || '');
  };

  const saveEdit = (entry: WaterEntry) => {
    updateWaterEntry({
      ...entry,
      amountMl: editAmount,
      note: editNote.trim() || undefined,
    });
    setEditingEntryId(null);
  };

  return (
    <div className="tab-stagger space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle
          title="Hydration & Water Intake"
          subtitle="Precision tracking, customizable goals & smart reminders"
          icon={<Droplets className="h-5 w-5" />}
        />
        <button
          onClick={() => {
            setTempGoal(String(settings.dailyGoalMl));
            setTempInterval(settings.reminderIntervalMinutes);
            setTempWakingStart(settings.wakingHoursStart);
            setTempWakingEnd(settings.wakingHoursEnd);
            setTempEnabled(settings.remindersEnabled);
            setShowSettingsModal(true);
          }}
          className="btn-ghost flex items-center gap-1.5 text-xs py-2 px-3"
        >
          <Settings className="h-4 w-4" /> Goal & Reminders
        </button>
      </div>

      {/* Main Hydration Progress Hero Card */}
      <Card className="bg-gradient-to-br from-sage-400/15 to-cream-100 dark:from-night-800 dark:to-night-700">
        <div className="flex flex-col md:flex-row items-center justify-around gap-6 py-2">
          {/* Ring */}
          <div className="relative">
            <Ring
              value={totalConsumedMl}
              max={dailyGoalMl}
              size={190}
              stroke={14}
              color="#527E63"
              track="#E8F0EA"
              darkTrack="#35293B"
            >
              <span className="font-display text-4xl font-semibold text-plum-700 dark:text-night-text">
                {percentComplete}%
              </span>
              <span className="text-xs text-plum-400 dark:text-night-muted">of daily goal</span>
            </Ring>
          </div>

          {/* Stats breakdown */}
          <div className="space-y-3 text-center md:text-left">
            <div>
              <p className="text-xs text-plum-400 dark:text-night-muted uppercase tracking-wider font-semibold">
                Consumed Today
              </p>
              <p className="font-display text-3xl md:text-4xl font-semibold text-sage-600 dark:text-sage-400">
                {totalConsumedMl} <span className="text-lg font-normal text-plum-400">/ {dailyGoalMl} ml</span>
              </p>
            </div>

            <div className="flex gap-4 text-xs text-plum-500 dark:text-night-muted">
              <div>
                <span className="block text-plum-400 font-medium">Remaining</span>
                <span className="font-semibold text-plum-700 dark:text-night-text">{remainingMl} ml</span>
              </div>
              <div className="border-l border-blush-200 dark:border-night-500 pl-4">
                <span className="block text-plum-400 font-medium">Logs Count</span>
                <span className="font-semibold text-plum-700 dark:text-night-text">{todayEntries.length} entries</span>
              </div>
            </div>

            {goalReached ? (
              <p className="pill bg-sage-500 text-white animate-pop inline-flex items-center gap-1.5 text-xs">
                <Sparkles className="h-3.5 w-3.5" /> Goal reached — beautifully hydrated!
              </p>
            ) : (
              <p className="text-xs text-plum-400 dark:text-night-muted">
                Keep going! Sip regularly to reach your personal target.
              </p>
            )}
          </div>
        </div>

        {/* Quick Add Action Buttons */}
        <div className="mt-6 pt-5 border-t border-blush-100 dark:border-night-500/40">
          <p className="text-xs font-semibold text-plum-500 dark:text-night-muted mb-2.5 text-center">
            Quick Log Water
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              onClick={() => handleQuickAdd(150, 'Teacup (150ml)')}
              className="py-2.5 px-3 rounded-2xl bg-white dark:bg-night-600 border border-blush-100 dark:border-night-500 hover:border-sage-400 text-plum-700 dark:text-night-text text-xs font-semibold shadow-soft flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-sage-600" /> 150 ml (Cup)
            </button>
            <button
              onClick={() => handleQuickAdd(250, 'Glass of water (250ml)')}
              className="py-2.5 px-3 rounded-2xl bg-white dark:bg-night-600 border border-blush-100 dark:border-night-500 hover:border-sage-400 text-plum-700 dark:text-night-text text-xs font-semibold shadow-soft flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-sage-600" /> 250 ml (Glass)
            </button>
            <button
              onClick={() => handleQuickAdd(500, 'Water bottle (500ml)')}
              className="py-2.5 px-3 rounded-2xl bg-white dark:bg-night-600 border border-blush-100 dark:border-night-500 hover:border-sage-400 text-plum-700 dark:text-night-text text-xs font-semibold shadow-soft flex items-center justify-center gap-1.5 transition-all active:scale-95"
            >
              <Plus className="h-3.5 w-3.5 text-sage-600" /> 500 ml (Bottle)
            </button>
            <button
              onClick={() => setShowCustomAddModal(true)}
              className="btn-primary text-xs py-2.5 px-3 flex items-center justify-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" /> Custom ml
            </button>
          </div>
        </div>
      </Card>

      {/* Reminder Controls & Status */}
      <Card className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sage-100 dark:bg-night-700 text-sage-600 dark:text-sage-400">
            {settings.remindersEnabled && !settings.pausedForToday ? (
              <Bell className="h-5 w-5" />
            ) : (
              <BellOff className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-plum-700 dark:text-night-text">
                Recurring Hydration Reminders
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  settings.remindersEnabled && !settings.pausedForToday
                    ? 'bg-sage-100 text-sage-700 dark:bg-sage-950 dark:text-sage-300'
                    : 'bg-plum-100 text-plum-600 dark:bg-night-600 dark:text-night-muted'
                }`}
              >
                {settings.remindersEnabled
                  ? settings.pausedForToday
                    ? 'Paused for today'
                    : `Active (every ${settings.reminderIntervalMinutes}m)`
                  : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-plum-400 dark:text-night-muted mt-0.5">
              Active between {settings.wakingHoursStart} and {settings.wakingHoursEnd}.
              {goalReached && ' Automatically paused because your daily goal is reached!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => snoozeHydration(30)}
            className="btn-ghost text-xs py-1.5 px-3"
            title="Snooze for 30 minutes"
          >
            Snooze 30m
          </button>
          <button
            onClick={toggleHydrationPause}
            className="btn-ghost text-xs py-1.5 px-3"
          >
            {settings.pausedForToday ? 'Resume Reminders' : 'Pause for Day'}
          </button>
        </div>
      </Card>

      {/* Visual Glass Units */}
      <Card>
        <p className="text-xs font-semibold text-plum-500 dark:text-night-muted mb-3">
          Visual Glasses Equivalent (250 ml each)
        </p>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: Math.max(Math.ceil(dailyGoalMl / 250), Math.ceil(totalConsumedMl / 250)) }).map(
            (_, i) => {
              const currentGlasses = Math.floor(totalConsumedMl / 250);
              const filled = i < currentGlasses;
              return (
                <div
                  key={i}
                  className={`relative h-12 w-9 rounded-lg rounded-b-xl border-2 transition-all ${
                    filled
                      ? 'border-sage-500 bg-gradient-to-b from-sage-400/40 to-sage-500'
                      : 'border-blush-200 dark:border-night-500 bg-blush-50/50 dark:bg-night-600'
                  }`}
                  title={`Glass ${i + 1} (250 ml)`}
                >
                  {filled && <div className="absolute inset-x-0 top-1 h-1 rounded-full bg-white/40" />}
                </div>
              );
            }
          )}
        </div>
      </Card>

      {/* Today's Hydration Log Timeline (Edit & Delete entries) */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-semibold text-base text-plum-700 dark:text-night-text">
            Today&apos;s Water Entries ({todayEntries.length})
          </h3>
          <span className="text-xs text-plum-400 dark:text-night-muted">
            Total: <strong>{totalConsumedMl} ml</strong>
          </span>
        </div>

        {todayEntries.length === 0 ? (
          <p className="text-xs text-plum-400 dark:text-night-muted py-4 text-center">
            No water logged yet today. Use the quick buttons above to record your first glass!
          </p>
        ) : (
          <div className="divide-y divide-blush-100 dark:divide-night-500/30">
            {todayEntries.map((entry) => (
              <div key={entry.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                {editingEntryId === entry.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      value={editAmount}
                      onChange={(e) => setEditAmount(parseInt(e.target.value, 10) || 0)}
                      className="w-24 rounded-lg border border-blush-300 dark:border-night-500 p-1 text-xs text-plum-700 dark:text-night-text"
                    />
                    <input
                      type="text"
                      value={editNote}
                      onChange={(e) => setEditNote(e.target.value)}
                      placeholder="Note"
                      className="flex-1 rounded-lg border border-blush-300 dark:border-night-500 p-1 text-xs text-plum-700 dark:text-night-text"
                    />
                    <button
                      onClick={() => saveEdit(entry)}
                      className="p-1 rounded-lg bg-sage-500 text-white"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingEntryId(null)}
                      className="p-1 rounded-lg text-plum-400 hover:text-plum-600"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 rounded-lg bg-sage-100 dark:bg-night-600 text-sage-600">
                        <Droplets className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-semibold text-plum-700 dark:text-night-text text-sm">
                          +{entry.amountMl} ml
                        </span>
                        {entry.note && (
                          <span className="text-plum-400 dark:text-night-muted ml-2 italic">
                            ({entry.note})
                          </span>
                        )}
                        <span className="text-plum-300 dark:text-night-muted block text-[11px]">
                          Logged at {entry.time}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1 text-plum-400 hover:text-blush-500"
                        title="Edit entry"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteWaterEntry(entry.id)}
                        className="p-1 text-plum-400 hover:text-red-500"
                        title="Delete entry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Charts: Past 7 Days & 30 Days */}
      <Card>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blush-500" />
            <span className="font-display font-semibold text-base text-plum-700 dark:text-night-text">
              Hydration Consistency & History
            </span>
          </div>
          <div className="flex rounded-xl bg-cream-50 dark:bg-night-700 p-0.5 border border-blush-100 dark:border-night-500/40 text-xs">
            <button
              onClick={() => setChartView('weekly')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                chartView === 'weekly'
                  ? 'bg-white dark:bg-night-600 text-blush-600 dark:text-blush-300 shadow-sm'
                  : 'text-plum-400'
              }`}
            >
              Past 7 Days
            </button>
            <button
              onClick={() => setChartView('monthly')}
              className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                chartView === 'monthly'
                  ? 'bg-white dark:bg-night-600 text-blush-600 dark:text-blush-300 shadow-sm'
                  : 'text-plum-400'
              }`}
            >
              30-Day Trends
            </button>
          </div>
        </div>

        {chartView === 'weekly' ? (
          <div>
            <div className="flex items-end justify-between gap-2 h-36 pt-4">
              {past7Days.map((d, idx) => {
                const heightPercent = Math.min(100, Math.max(5, (d.ml / dailyGoalMl) * 100));
                const isToday = idx === past7Days.length - 1;

                return (
                  <div key={d.date} className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
                    <span className="text-[10px] text-plum-500 dark:text-night-muted font-medium">
                      {d.ml > 0 ? `${d.ml}` : '0'}
                    </span>
                    <div className="w-full rounded-t-lg bg-blush-100/60 dark:bg-night-600 h-24 relative overflow-hidden">
                      <div
                        className={`absolute bottom-0 inset-x-0 rounded-t-lg transition-all duration-700 ${
                          d.reached
                            ? 'bg-sage-500'
                            : isToday
                            ? 'bg-blush-400'
                            : 'bg-blush-300 dark:bg-blush-400/60'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      />
                    </div>
                    <span
                      className={`text-[10px] ${
                        isToday ? 'font-bold text-blush-500' : 'text-plum-400 dark:text-night-muted'
                      }`}
                    >
                      {d.dayLabel}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-plum-400 dark:text-night-muted text-center mt-3">
              Target line: {dailyGoalMl} ml per day (green denotes reached goal)
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-2xl bg-cream-50 dark:bg-night-700">
                <span className="text-xs text-plum-400 dark:text-night-muted block">30-Day Average</span>
                <span className="font-display text-2xl font-semibold text-sage-600 dark:text-sage-400">
                  {monthlyAvgMl} ml/day
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-cream-50 dark:bg-night-700">
                <span className="text-xs text-plum-400 dark:text-night-muted block">Goal Reached</span>
                <span className="font-display text-2xl font-semibold text-plum-700 dark:text-night-text">
                  {monthlyDaysReached} of 30 days
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {past30Days.map((d) => (
                <div
                  key={d.date}
                  className={`h-4 flex-1 min-w-[7px] rounded-sm transition-all ${
                    d.reached
                      ? 'bg-sage-500'
                      : d.ml > 0
                      ? 'bg-blush-300 dark:bg-blush-950/60'
                      : 'bg-plum-100 dark:bg-night-600'
                  }`}
                  title={`${d.date}: ${d.ml} ml`}
                />
              ))}
            </div>
            <p className="text-[11px] text-plum-400 dark:text-night-muted text-center">
              Past 30 days consistency heatmap
            </p>
          </div>
        )}
      </Card>

      {/* CUSTOM WATER LOG MODAL */}
      {showCustomAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-night-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-blush-100 dark:border-night-500/50 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-blush-100 dark:border-night-600 pb-2">
              <h3 className="font-display text-lg font-semibold text-plum-700 dark:text-night-text">
                Custom Water Amount
              </h3>
              <button onClick={() => setShowCustomAddModal(false)} className="text-plum-400 hover:text-plum-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustom} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                  Amount in Millilitres (ml) *
                </label>
                <input
                  type="number"
                  required
                  min="10"
                  max="3000"
                  value={customMl}
                  onChange={(e) => setCustomMl(e.target.value)}
                  className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-sm text-plum-700 dark:text-night-text"
                />
              </div>

              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                  Optional Note
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. Infused cucumber water"
                  className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-xs text-plum-700 dark:text-night-text"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomAddModal(false)}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  Add Water
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL: GOAL & REMINDERS */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-night-800 rounded-3xl p-6 max-w-md w-full shadow-2xl border border-blush-100 dark:border-night-500/50 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-blush-100 dark:border-night-600 pb-2">
              <h3 className="font-display text-lg font-semibold text-plum-700 dark:text-night-text">
                Hydration Settings & Schedule
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-plum-400 hover:text-plum-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                  Daily Hydration Goal (ml)
                </label>
                <input
                  type="number"
                  step="50"
                  min="500"
                  max="6000"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-sm text-plum-700 dark:text-night-text"
                />
                <span className="text-[11px] text-plum-400 dark:text-night-muted">
                  Common guidelines suggest ~2,000 to 2,500 ml daily depending on personal activity level.
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-cream-50 dark:bg-night-700">
                <div>
                  <p className="font-semibold text-plum-700 dark:text-night-text">Enable Water Reminders</p>
                  <p className="text-[11px] text-plum-400 dark:text-night-muted">
                    Get regular gentle prompts during your waking hours.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={tempEnabled}
                  onChange={(e) => setTempEnabled(e.target.checked)}
                  className="h-5 w-5 accent-blush-500 rounded cursor-pointer"
                />
              </div>

              {tempEnabled && (
                <>
                  <div>
                    <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                      Reminder Interval
                    </label>
                    <select
                      value={tempInterval}
                      onChange={(e) => setTempInterval(parseInt(e.target.value, 10))}
                      className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-xs text-plum-700 dark:text-night-text"
                    >
                      <option value={60}>Every 60 minutes (1 hour)</option>
                      <option value={90}>Every 90 minutes (1.5 hours)</option>
                      <option value={120}>Every 120 minutes (2 hours)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                        Waking Hours Start
                      </label>
                      <input
                        type="time"
                        value={tempWakingStart}
                        onChange={(e) => setTempWakingStart(e.target.value)}
                        className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                        Waking Hours End
                      </label>
                      <input
                        type="time"
                        value={tempWakingEnd}
                        onChange={(e) => setTempWakingEnd(e.target.value)}
                        className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-blush-100 dark:border-night-600">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
