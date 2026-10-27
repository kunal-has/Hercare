import { LayoutDashboard, CalendarHeart, Pill, UtensilsCrossed, Droplets, MoonStar, Heart, Sun, Moon, Dumbbell } from 'lucide-react';
import type { ScreenId } from '../types';
import { useTheme } from '../context/ThemeContext';

export const NAV_ITEMS: { id: ScreenId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Today', icon: LayoutDashboard },
  { id: 'period', label: 'Cycle', icon: CalendarHeart },
  { id: 'meds', label: 'Medications', icon: Pill },
  { id: 'water', label: 'Hydration', icon: Droplets },
  { id: 'fitness', label: 'Fitness & Sports', icon: Dumbbell },
  { id: 'meals', label: 'Meals', icon: UtensilsCrossed },
  { id: 'sleep', label: 'Sleep & Mood', icon: MoonStar },
];

export function Sidebar({ active, onChange }: { active: ScreenId; onChange: (id: ScreenId) => void }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="hidden md:flex md:flex-col w-64 shrink-0 h-screen sticky top-0 bg-gradient-to-b from-cream-100 to-blush-50 dark:from-night-950 dark:to-night-900 border-r border-blush-100 dark:border-night-500/40 px-4 py-6 transition-colors">
      <div className="flex items-center justify-between px-2 mb-8">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blush-500 text-white shadow-soft">
            <Heart className="h-5 w-5 fill-white" />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-plum-700 dark:text-night-text leading-none">HERCARE</p>
            <p className="text-[11px] text-plum-400 dark:text-night-muted tracking-wider">WELLNESS</p>
          </div>
        </div>

        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 dark:bg-night-700 hover:bg-white dark:hover:bg-night-600 border border-blush-100 dark:border-night-500/50 text-plum-600 dark:text-night-text shadow-soft transition-all duration-200 active:scale-95"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-gold-400" /> : <Moon className="h-4 w-4 text-plum-500" />}
        </button>
      </div>

      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={`group flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] ${
                isActive
                  ? 'bg-white dark:bg-night-700 text-blush-600 dark:text-blush-300 shadow-soft dark:shadow-[0_2px_15px_-4px_rgba(0,0,0,0.4)]'
                  : 'text-plum-500 dark:text-night-muted hover:bg-white/60 dark:hover:bg-night-800/80 hover:text-plum-700 dark:hover:text-night-text'
              }`}
            >
              <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-blush-500 dark:text-blush-300' : 'text-plum-300 dark:text-night-500 group-hover:text-blush-400'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="rounded-2xl bg-blush-100/60 dark:bg-night-700/50 p-4 border border-transparent dark:border-night-500/30">
          <p className="text-xs text-plum-500 dark:text-night-muted leading-relaxed">
            This prototype is for wellness awareness only — not a medical device or diagnosis tool.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({ active, onChange }: { active: ScreenId; onChange: (id: ScreenId) => void }) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/90 dark:bg-night-900/90 backdrop-blur-md border-t border-blush-100 dark:border-night-500/40 px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] transition-colors">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className="flex flex-col items-center gap-0.5 px-1 py-1.5 transition-transform duration-150 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.92] select-none"
            >
              <div
                className={`flex h-8 w-12 items-center justify-center rounded-xl transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  isActive ? 'bg-blush-500 text-white shadow-sm' : 'text-plum-300 dark:text-night-500'
                }`}
              >
                <Icon className="h-[18px] w-[18px]" />
              </div>
              <span className={`text-[9px] font-semibold ${isActive ? 'text-blush-600 dark:text-blush-300' : 'text-plum-300 dark:text-night-muted'}`}>
                {item.label.split(' ')[0]}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function MobileHeader() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="md:hidden sticky top-0 z-30 bg-cream-50/80 dark:bg-night-900/80 backdrop-blur-md border-b border-blush-100 dark:border-night-500/40 px-5 py-3 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blush-500 text-white">
          <Heart className="h-4 w-4 fill-white" />
        </div>
        <div>
          <p className="font-display text-base font-semibold text-plum-700 dark:text-night-text leading-none">HERCARE</p>
          <p className="text-[10px] text-plum-400 dark:text-night-muted tracking-wider">WELLNESS</p>
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 dark:bg-night-700 border border-blush-100 dark:border-night-500/50 text-plum-600 dark:text-night-text shadow-soft"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4 text-gold-400" /> : <Moon className="h-4 w-4 text-plum-500" />}
      </button>
    </header>
  );
}

const SCREEN_LABELS: Record<ScreenId, string> = {
  dashboard: 'Today',
  period: 'Cycle Calendar',
  meds: 'Medications & Reminders',
  water: 'Hydration Tracking',
  fitness: 'Fitness, Sports & Activity',
  meals: 'Nutrition & Meals',
  sleep: 'Sleep & Mood Analytics',
};

export function DesktopHeader({ currentScreen }: { currentScreen: ScreenId }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="hidden md:flex items-center justify-between px-8 py-3.5 border-b border-blush-100/60 dark:border-night-500/30 bg-cream-50/60 dark:bg-night-900/60 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-plum-400 dark:text-night-muted uppercase tracking-wider">
          HERCARE
        </span>
        <span className="text-plum-300 dark:text-night-500">•</span>
        <span className="text-sm font-semibold text-plum-700 dark:text-night-text">
          {SCREEN_LABELS[currentScreen]}
        </span>
      </div>

      <button
        onClick={toggleTheme}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-night-700 hover:bg-white dark:hover:bg-night-600 border border-blush-100 dark:border-night-500/50 shadow-soft text-xs font-semibold text-plum-600 dark:text-night-text transition-all duration-200 active:scale-95"
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? (
          <>
            <Sun className="h-3.5 w-3.5 text-gold-400" />
            <span className="text-[11px] font-medium tracking-wide">Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-3.5 w-3.5 text-plum-500" />
            <span className="text-[11px] font-medium tracking-wide">Dark Mode</span>
          </>
        )}
      </button>
    </header>
  );
}
