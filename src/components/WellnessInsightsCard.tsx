import { useState, useMemo } from 'react';
import { Card } from './ui';
import {
  Sparkles,
  Droplets,
  MoonStar,
  CalendarHeart,
  Pill,
  Activity,
  ArrowRight,
  X,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Info,
  RotateCcw,
} from 'lucide-react';
import { useStore, today } from '../store';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { generateWellnessInsights } from '../utils/insightsEngine';
import type { ScreenId, WellnessInsight } from '../types';

const CATEGORY_CONFIG: Record<
  WellnessInsight['category'],
  { label: string; icon: typeof Sparkles; badgeClass: string }
> = {
  cycle: {
    label: 'Cycle Rhythm',
    icon: CalendarHeart,
    badgeClass: 'bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300',
  },
  hydration: {
    label: 'Hydration Progress',
    icon: Droplets,
    badgeClass: 'bg-sage-100 dark:bg-night-600 text-sage-600 dark:text-sage-400',
  },
  sleep: {
    label: 'Sleep & Recovery',
    icon: MoonStar,
    badgeClass: 'bg-plum-100 dark:bg-night-600 text-plum-600 dark:text-plum-300',
  },
  symptoms: {
    label: 'Symptom Trend',
    icon: Activity,
    badgeClass: 'bg-gold-400/20 dark:bg-night-600 text-gold-600 dark:text-gold-400',
  },
  medication: {
    label: 'Medication Care',
    icon: Pill,
    badgeClass: 'bg-blush-100 dark:bg-night-600 text-blush-700 dark:text-blush-300',
  },
  nutrition: {
    label: 'Nutrition Habit',
    icon: Sparkles,
    badgeClass: 'bg-gold-400/20 dark:bg-night-600 text-gold-600 dark:text-gold-400',
  },
};

export function WellnessInsightsCard({ onNavigate }: { onNavigate: (screen: ScreenId) => void }) {
  const { data, openPeriodModal } = useStore();
  const t = today();

  const [dismissedIds, setDismissedIds] = useLocalStorage<string[]>('hercare_dismissed_insights', []);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Generate real insights from actual user records
  const activeInsights = useMemo(() => {
    return generateWellnessInsights(data, t, dismissedIds);
  }, [data, t, dismissedIds]);

  // Keep index within bounds
  const currentInsight: WellnessInsight | undefined = activeInsights[
    Math.min(currentIndex, Math.max(0, activeInsights.length - 1))
  ];

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (currentIndex >= activeInsights.length - 1 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleResetDismissals = () => {
    setDismissedIds([]);
    setCurrentIndex(0);
  };

  // 1. EMPTY STATE: When insufficient records exist
  if (activeInsights.length === 0) {
    const hasDismissed = dismissedIds.length > 0;

    return (
      <Card className="bg-gradient-to-r from-cream-100 via-blush-50 to-cream-50 dark:from-night-800 dark:via-night-800 dark:to-night-700 border-blush-100 dark:border-night-500/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blush-100 dark:bg-night-600 text-blush-500 dark:text-blush-300 shrink-0 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-base font-semibold text-plum-700 dark:text-night-text">
                {hasDismissed ? "You're All Caught Up on Insights" : 'Personalized Wellness Insights'}
              </p>
              <p className="text-xs text-plum-400 dark:text-night-muted mt-0.5 leading-relaxed max-w-xl">
                {hasDismissed
                  ? "You have reviewed all current observations based on your logged records. New insights will appear as you log today's activities."
                  : 'Log at least 3 days of water, sleep, or your cycle start to unlock explainable, data-backed observations about your body rhythm.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {hasDismissed ? (
              <button
                type="button"
                onClick={handleResetDismissals}
                className="btn-ghost text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restore insights
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openPeriodModal()}
                className="btn-primary text-xs px-4 py-2"
              >
                Log first entry
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  const config = CATEGORY_CONFIG[currentInsight.category];
  const IconComponent = config.icon;

  return (
    <Card className="bg-gradient-to-br from-white via-cream-50 to-blush-50/60 dark:from-night-800 dark:via-night-800 dark:to-night-700/80 border-blush-100 dark:border-night-500/40 shadow-soft">
      {/* Top Header / Meta */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blush-500 text-white text-[11px] font-semibold tracking-wide shadow-xs">
            <Sparkles className="h-3 w-3" /> TODAY'S INSIGHT
          </span>
          <span className={`pill text-[10px] ${config.badgeClass}`}>
            <IconComponent className="h-3 w-3" /> {config.label}
          </span>
          <span className="text-[11px] text-plum-400 dark:text-night-muted">
            • {currentInsight.dateRange}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {activeInsights.length > 1 && (
            <div className="flex items-center gap-1 mr-2 text-xs text-plum-400 dark:text-night-muted">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : activeInsights.length - 1))}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-blush-100 dark:hover:bg-night-600 transition-colors"
                aria-label="Previous insight"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-medium min-w-[32px] text-center">
                {currentIndex + 1} / {activeInsights.length}
              </span>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => (prev < activeInsights.length - 1 ? prev + 1 : 0))}
                className="h-7 w-7 rounded-full flex items-center justify-center hover:bg-blush-100 dark:hover:bg-night-600 transition-colors"
                aria-label="Next insight"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => handleDismiss(currentInsight.id)}
            className="flex h-7 w-7 items-center justify-center rounded-full text-plum-400 hover:text-plum-600 dark:text-night-muted dark:hover:text-night-text hover:bg-blush-100 dark:hover:bg-night-600 transition-colors"
            title="Dismiss this insight"
            aria-label="Dismiss insight"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Title & Observation */}
      <div className="space-y-1.5">
        <h3 className="font-display text-lg sm:text-xl font-semibold text-plum-700 dark:text-night-text">
          {currentInsight.title}
        </h3>
        <p className="text-sm text-plum-600 dark:text-night-text leading-relaxed font-medium">
          {currentInsight.observation}
        </p>
      </div>

      {/* Supporting Data Points */}
      {currentInsight.supportingData.length > 0 && (
        <div className="mt-3.5 p-3 rounded-2xl bg-white/70 dark:bg-night-700/60 border border-blush-100/80 dark:border-night-500/30 space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-plum-400 dark:text-night-muted mb-1">
            Supporting Records & Metrics
          </p>
          <ul className="space-y-1 text-xs text-plum-600 dark:text-night-muted">
            {currentInsight.supportingData.map((pt, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-blush-400 dark:bg-blush-400 mt-1.5 shrink-0" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Suggested Action */}
      {currentInsight.suggestedAction && (
        <div className="mt-3 flex items-start gap-2.5 p-3 rounded-2xl bg-blush-50/80 dark:bg-night-600/50 border border-blush-100 dark:border-night-500/40 text-xs text-plum-700 dark:text-night-text">
          <Lightbulb className="h-4 w-4 text-gold-500 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-plum-700 dark:text-night-text">Suggested Focus: </strong>
            {currentInsight.suggestedAction}
          </p>
        </div>
      )}

      {/* Footer: Uncertainty Note & Navigation Action */}
      <div className="mt-4 pt-3 border-t border-blush-100 dark:border-night-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-plum-400 dark:text-night-muted italic">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>{currentInsight.uncertaintyNote}</span>
        </div>

        <button
          type="button"
          onClick={() => onNavigate(currentInsight.targetScreen)}
          className="btn-ghost self-start sm:self-auto text-xs px-3.5 py-1.5 inline-flex items-center gap-1.5 font-semibold text-blush-600 dark:text-blush-300"
        >
          View supporting records <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
