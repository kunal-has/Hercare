import { useState, useMemo, type FormEvent } from 'react';
import { Pencil, Check, X, Sparkles } from 'lucide-react';
import type { ScreenId } from '../types';
import { useStore, today } from '../store';
import { getDailyWellnessGreeting, type WellnessCategory } from '../utils/greetingService';

const CATEGORY_LABELS: Record<WellnessCategory, { label: string; icon: string }> = {
  hydration: { label: 'Hydration', icon: '💧' },
  'self-care': { label: 'Self-Care', icon: '🌸' },
  rest: { label: 'Rest & Recovery', icon: '🌙' },
  confidence: { label: 'Confidence', icon: '✨' },
  habits: { label: 'Body Wisdom', icon: '🌿' },
  emotional: { label: 'Emotional Peace', icon: '💖' },
};

export function GreetingHeader({ onNavigate }: { onNavigate: (s: ScreenId) => void }) {
  const { data, updateProfileName, openPeriodModal } = useStore();
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const todayDateStr = today();
  const dateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const savedName = data.profile?.name;
  const userId = data.profile?.id || 'hercare_user_default';

  // Deterministic daily greeting & message calculation
  const dailyGreeting = useMemo(() => {
    return getDailyWellnessGreeting({
      userId,
      userName: savedName,
      dateStr: todayDateStr,
      hour: new Date().getHours(),
    });
  }, [userId, savedName, todayDateStr]);

  const handleStartEditing = () => {
    setNameInput(savedName || '');
    setIsEditingName(true);
  };

  const handleSaveName = (e?: FormEvent) => {
    if (e) e.preventDefault();
    updateProfileName(nameInput);
    setIsEditingName(false);
  };

  const handleCancelEditing = () => {
    setIsEditingName(false);
  };

  const catMeta = CATEGORY_LABELS[dailyGreeting.category] || { label: 'Wellness', icon: '🌸' };

  return (
    <div className="flex flex-col gap-1.5 mb-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs md:text-sm text-plum-400 dark:text-night-muted font-medium tracking-wide">
          {dateFormatted}
        </p>

        {/* Category Pill */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blush-50/80 dark:bg-night-700/70 text-blush-600 dark:text-blush-300 border border-blush-200/50 dark:border-night-500/40">
          <span>{catMeta.icon}</span>
          <span>{catMeta.label}</span>
        </span>
      </div>

      {/* Main Heading with Inline Name Edit */}
      <div className="flex items-center gap-2 flex-wrap">
        {isEditingName ? (
          <form onSubmit={handleSaveName} className="flex items-center gap-2 py-1 flex-wrap">
            <span className="font-display text-2xl md:text-3xl font-semibold text-plum-700 dark:text-night-text">
              {dailyGreeting.timeGreeting},{' '}
            </span>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name (e.g. Elena)"
              autoFocus
              maxLength={24}
              className="text-lg md:text-xl font-display font-semibold px-3 py-1 rounded-xl bg-white dark:bg-night-700 border border-blush-300 dark:border-night-500 text-plum-700 dark:text-night-text focus:outline-none focus:ring-2 focus:ring-blush-400"
            />
            <button
              type="submit"
              className="p-1.5 rounded-xl bg-blush-500 hover:bg-blush-600 text-white shadow-sm transition-all"
              title="Save name"
              aria-label="Save name"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleCancelEditing}
              className="p-1.5 rounded-xl bg-plum-100 hover:bg-plum-200 dark:bg-night-700 dark:hover:bg-night-600 text-plum-600 dark:text-night-muted transition-all"
              title="Cancel"
              aria-label="Cancel editing"
            >
              <X className="h-4 w-4" />
            </button>
            <span className="text-[11px] text-plum-400 dark:text-night-muted">
              (Leave empty for &ldquo;beautiful&rdquo;)
            </span>
          </form>
        ) : (
          <div className="flex items-center gap-2 group">
            <h1 className="font-display text-3xl md:text-4xl font-semibold text-plum-700 dark:text-night-text tracking-tight">
              {dailyGreeting.heading}
            </h1>
            <button
              onClick={handleStartEditing}
              className="opacity-60 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-blush-100/60 dark:hover:bg-night-700 text-plum-400 dark:text-night-muted hover:text-blush-500 dark:hover:text-blush-300 transition-all"
              title={savedName ? 'Edit your name' : 'Set your name'}
              aria-label="Edit display name"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Rotating Deterministic Daily Subtitle */}
      <p className="text-sm md:text-base text-plum-500 dark:text-night-muted mt-0.5 max-w-2xl leading-relaxed flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-blush-400 dark:text-blush-300 shrink-0 mt-1 hidden sm:inline" />
        <span>{dailyGreeting.subtitle}</span>
      </p>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={() => openPeriodModal()} className="btn-ghost">
          Log period
        </button>
        <button onClick={() => onNavigate('period')} className="btn-ghost">
          View cycle
        </button>
        <button onClick={() => onNavigate('meals')} className="btn-ghost">
          Add meal
        </button>
        <button onClick={() => onNavigate('water')} className="btn-ghost">
          Drink water
        </button>
      </div>
    </div>
  );
}
