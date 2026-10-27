import { Card, Ring, ProgressBar } from './ui';
import { Droplets, Flame, MoonStar, Pill, CalendarHeart, Sparkles, Plus, ChevronRight, Info, Clock, Dumbbell } from 'lucide-react';
import { useStore, today } from '../store';
import type { ScreenId } from '../types';
import { useMemo } from 'react';
import { calculateCycleAnalysis, formatDisplayDate } from '../utils/cycleCalculations';
import { getNextDueDose } from '../utils/reminderService';
import { calculateFitnessSummary } from '../utils/fitnessStats';
import { WellnessInsightsCard } from './WellnessInsightsCard';

export function Dashboard({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { data, openPeriodModal } = useStore();
  const t = today();

  const cycleAnalysis = useMemo(
    () => calculateCycleAnalysis(data.periods || [], t, data.goals.cycleLength || 28),
    [data.periods, t, data.goals.cycleLength]
  );

  const nextDose = useMemo(
    () => getNextDueDose(data.meds || [], data.medLogs || {}, t),
    [data.meds, data.medLogs, t]
  );

  const water = data.water[t];
  const waterGlasses = water?.glasses ?? 0;
  const waterGoal = water?.goal ?? data.goals.water;

  const mealsToday = data.meals.filter((m) => m.date === t);
  const calories = mealsToday.reduce((s, m) => s + m.calories, 0);

  const sleep = data.sleep[t];
  const sleepHours = sleep?.hours ?? 0;

  const medsToday = data.meds.map((m) => {
    const log = data.medLogs[`${m.id}_${t}`];
    return { med: m, taken: log?.taken ?? [] };
  });
  const medsDone = medsToday.filter((x) => x.taken.length === x.med.times.length).length;
  const medsTotal = data.meds.length;

  const fitnessSummary = useMemo(() => {
    return calculateFitnessSummary(data.workouts || [], t, 150);
  }, [data.workouts, t]);

  const moodLabel = sleep?.mood ?? '—';
  const moodEmoji: Record<string, string> = { great: 'Radiant', good: 'Calm', okay: 'Steady', low: 'Tender', stressed: 'Tense' };

  return (
    <div className="tab-stagger space-y-4 md:space-y-5">
      {/* Today's Personalized Wellness Insight */}
      <WellnessInsightsCard onNavigate={onNavigate} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Hero cycle card */}
        <div className="lg:col-span-2">
          <Card className="bg-gradient-to-br from-blush-500 via-blush-500 to-blush-400 border-blush-400 text-white h-full relative overflow-hidden shadow-card">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-semibold text-white tracking-wide">
                      <CalendarHeart className="h-3.5 w-3.5" /> SMART CYCLE TRACKER
                    </span>
                    {cycleAnalysis.confidence === 'high' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-sage-500/80 text-[10px] font-semibold text-white">
                        Personalized
                      </span>
                    )}
                  </div>

                  {cycleAnalysis.cycleDay ? (
                    <>
                      <div className="flex items-baseline gap-3 mt-3">
                        <p className="font-display text-4xl sm:text-5xl font-semibold">Day {cycleAnalysis.cycleDay}</p>
                        <span className="text-sm font-medium text-white/90 bg-white/15 px-3 py-1 rounded-full">
                          {cycleAnalysis.phaseLabel}
                        </span>
                      </div>
                      <p className="text-white/90 text-sm mt-1.5 max-w-md leading-relaxed">
                        {cycleAnalysis.phaseDescription}
                      </p>

                      {cycleAnalysis.nextPeriodDate ? (
                        <div className="mt-3 inline-flex items-center gap-2 text-xs text-white/90 bg-white/15 px-3 py-1.5 rounded-xl">
                          <Sparkles className="h-3.5 w-3.5 text-gold-300" />
                          <span>
                            Next estimated period: <strong>{formatDisplayDate(cycleAnalysis.nextPeriodDate, { month: 'short', day: 'numeric' })}</strong> (±{cycleAnalysis.uncertaintyDays} days)
                          </span>
                        </div>
                      ) : (
                        <p className="text-white/80 text-xs mt-3 flex items-center gap-1.5">
                          <Info className="h-3.5 w-3.5" />
                          {cycleAnalysis.totalCyclesLogged === 1
                            ? 'Log your next period to compute your personalized cycle length.'
                            : 'Log your cycle to begin.'}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="mt-3">
                      <p className="font-display text-3xl font-semibold">Begin Tracking Your Cycle</p>
                      <p className="text-white/90 text-sm mt-1 max-w-md">
                        Log your period dates to view your current cycle day, estimated phases, and predictions.
                      </p>
                    </div>
                  )}
                </div>

                <div className="hidden sm:flex h-20 w-20 rounded-2xl bg-white/15 backdrop-blur-sm items-center justify-center shrink-0">
                  <CalendarHeart className="h-10 w-10 text-white" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={() => openPeriodModal()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-blush-600 font-semibold text-xs shadow-soft hover:bg-cream-50 active:scale-95 transition-all"
                >
                  <Plus className="h-3.5 w-3.5" /> Log period
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('period')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-sm transition-all"
                >
                  View cycle <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <span className="text-[11px] text-white/70 italic ml-auto hidden md:inline">
                  Wellness estimates • Not for medical contraception
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Water ring */}
        <button onClick={() => onNavigate('water')} className="text-left transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.985] group">
          <Card className="h-full hover:shadow-soft transition-shadow">
            <p className="text-sm text-plum-400 dark:text-night-muted font-medium flex items-center gap-1.5 mb-2">
              <Droplets className="h-4 w-4 text-blush-400" /> Water
            </p>
            <div className="flex items-center justify-center gap-4">
              <Ring value={waterGlasses} max={waterGoal} size={110} color="#527E63" track="#E8F0EA" darkTrack="#35293B">
                <span className="font-display text-2xl font-semibold text-plum-700 dark:text-night-text">{waterGlasses}</span>
                <span className="text-[10px] text-plum-400 dark:text-night-muted">of {waterGoal}</span>
              </Ring>
              <div className="text-left">
                <p className="text-3xl font-display font-semibold text-plum-700 dark:text-night-text">{Math.round(waterGlasses * 250)}</p>
                <p className="text-xs text-plum-400 dark:text-night-muted">ml today</p>
              </div>
            </div>
          </Card>
        </button>

        {/* Calories */}
        <button onClick={() => onNavigate('meals')} className="text-left transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.985] group">
          <Card className="h-full hover:shadow-soft transition-shadow">
            <p className="text-sm text-plum-400 dark:text-night-muted font-medium flex items-center gap-1.5 mb-2">
              <Flame className="h-4 w-4 text-blush-400" /> Nutrition
            </p>
            <p className="font-display text-3xl font-semibold text-plum-700 dark:text-night-text">{calories}</p>
            <p className="text-xs text-plum-400 dark:text-night-muted mb-3">of {data.goals.calories} kcal</p>
            <ProgressBar value={calories} max={data.goals.calories} colorClass="bg-gold-400" />
            <p className="text-xs text-plum-400 dark:text-night-muted mt-2">{mealsToday.length} meals logged</p>
          </Card>
        </button>

        {/* Fitness & Sports Movement */}
        <button onClick={() => onNavigate('fitness')} className="text-left transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.985] group">
          <Card className="h-full hover:shadow-soft transition-shadow">
            <p className="text-sm text-plum-400 dark:text-night-muted font-medium flex items-center gap-1.5 mb-2">
              <Dumbbell className="h-4 w-4 text-blush-400" /> Fitness & Sports
            </p>
            <p className="font-display text-3xl font-semibold text-plum-700 dark:text-night-text">
              {fitnessSummary.weeklyActiveMinutes}m
            </p>
            <p className="text-xs text-plum-400 dark:text-night-muted mb-3">of {fitnessSummary.weeklyTargetMinutes}m weekly goal</p>
            <ProgressBar value={fitnessSummary.weeklyActiveMinutes} max={fitnessSummary.weeklyTargetMinutes} colorClass="bg-blush-500" />
            <p className="text-xs text-plum-400 dark:text-night-muted mt-2">
              {fitnessSummary.weeklySessionsCount} days active • {fitnessSummary.personalRecordsCount} PRs
            </p>
          </Card>
        </button>

        {/* Sleep + mood */}
        <button onClick={() => onNavigate('sleep')} className="text-left transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.985] group">
          <Card className="h-full hover:shadow-soft transition-shadow">
            <p className="text-sm text-plum-400 dark:text-night-muted font-medium flex items-center gap-1.5 mb-2">
              <MoonStar className="h-4 w-4 text-plum-400" /> Sleep & Mood
            </p>
            <p className="font-display text-3xl font-semibold text-plum-700 dark:text-night-text">{sleepHours > 0 ? `${sleepHours}h` : '—'}</p>
            <p className="text-xs text-plum-400 dark:text-night-muted mb-3">of {data.goals.sleep}h goal</p>
            {sleep && (
              <div className="flex items-center gap-2">
                <span className="pill bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300">Mood: {moodEmoji[moodLabel]}</span>
                <span className="pill bg-plum-100 dark:bg-night-600 text-plum-600 dark:text-night-text">Q: {sleep.quality}/5</span>
              </div>
            )}
          </Card>
        </button>

        {/* Medications */}
        <button onClick={() => onNavigate('meds')} className="text-left transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-0.5 active:scale-[0.985] group">
          <Card className="h-full hover:shadow-soft transition-shadow">
            <p className="text-sm text-plum-400 dark:text-night-muted font-medium flex items-center gap-1.5 mb-2">
              <Pill className="h-4 w-4 text-blush-400" /> Medications
            </p>
            <p className="font-display text-3xl font-semibold text-plum-700 dark:text-night-text">{medsDone}/{medsTotal}</p>
            <p className="text-xs text-plum-400 dark:text-night-muted mb-3">doses complete today</p>
            <div className="space-y-1.5">
              {medsToday.slice(0, 3).map(({ med, taken }) => (
                <div key={med.id} className="flex items-center justify-between text-xs">
                  <span className="text-plum-600 dark:text-night-text truncate">{med.name}</span>
                  <span className={taken.length === med.times.length ? 'text-sage-600 font-semibold' : 'text-plum-300 dark:text-night-muted'}>
                    {taken.length}/{med.times.length}
                  </span>
                </div>
              ))}
            </div>

            {nextDose && (
              <div className="mt-3 pt-2 border-t border-blush-100 dark:border-night-500/30 flex items-center justify-between text-xs">
                <span className="text-[11px] text-plum-400 dark:text-night-muted flex items-center gap-1">
                  <Clock className="h-3 w-3 text-blush-400" /> Due: {nextDose.formattedTime}
                </span>
                <span className="text-[11px] font-semibold text-blush-600 dark:text-blush-300 truncate max-w-[100px]">
                  {nextDose.med.name}
                </span>
              </div>
            )}
          </Card>
        </button>

        {/* Wellness summary */}
        <div className="lg:col-span-3">
          <Card className="bg-gradient-to-r from-cream-100 to-blush-50 dark:from-night-800 dark:to-night-700 border-blush-100 dark:border-night-500/40">
            <p className="font-display text-lg font-semibold text-plum-700 dark:text-night-text mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blush-400" /> Daily Wellness Summary
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <SummaryStat label="Hydration" value={`${Math.round((waterGlasses / waterGoal) * 100)}%`} good={waterGlasses >= waterGoal} />
              <SummaryStat label="Nutrition" value={`${Math.round((calories / data.goals.calories) * 100)}%`} good={calories >= data.goals.calories * 0.8 && calories <= data.goals.calories} />
              <SummaryStat label="Sleep" value={sleepHours >= 7 ? 'Restful' : sleepHours > 0 ? 'Short' : '—'} good={sleepHours >= 7} />
              <SummaryStat label="Meds" value={`${medsDone}/${medsTotal}`} good={medsDone === medsTotal && medsTotal > 0} />
            </div>
            <p className="text-xs text-plum-400 dark:text-night-muted mt-4 italic">
              Remember: this is a wellness companion, not medical advice. Listen to your body and consult a healthcare provider for concerns.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-2xl bg-white/70 dark:bg-night-600/70 p-3 text-center">
      <p className="text-xs text-plum-400 dark:text-night-muted mb-1">{label}</p>
      <p className={`font-display text-lg font-semibold ${good ? 'text-sage-600' : 'text-plum-700 dark:text-night-text'}`}>{value}</p>
    </div>
  );
}
