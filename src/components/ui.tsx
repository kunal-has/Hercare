import type { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ title, subtitle, icon }: { title: string; subtitle?: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-1">
      {icon && (
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300">
          {icon}
        </div>
      )}
      <div>
        <h2 className="font-display text-xl font-semibold text-plum-700 dark:text-night-text leading-tight">{title}</h2>
        {subtitle && <p className="text-sm text-plum-400 dark:text-night-muted">{subtitle}</p>}
      </div>
    </div>
  );
}

export function ProgressBar({ value, max, colorClass = 'bg-blush-400' }: { value: number; max: number; colorClass?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="h-2.5 w-full rounded-full bg-blush-100 dark:bg-night-500 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function Ring({ value, max, size = 120, stroke = 10, color = '#DA7484', track = '#FAE6E9', darkTrack, children }: {
  value: number; max: number; size?: number; stroke?: number; color?: string; track?: string; darkTrack?: string; children?: ReactNode;
}) {
  const { theme } = useTheme();
  const effectiveTrack = theme === 'dark' ? (darkTrack || '#3D2F44') : track;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / Math.max(1, max));
  const offset = c * (1 - pct);
  return (
    <div className="relative inline-flex items-center justify-center transition-transform duration-300" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={effectiveTrack} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.32, 0.72, 0, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-300">{children}</div>
    </div>
  );
}

export function EmptyState({
  icon,
  text,
  title,
  description,
}: {
  icon: ReactNode;
  text?: string;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blush-50 dark:bg-night-600 text-blush-300 dark:text-blush-400">
        {icon}
      </div>
      {title && <p className="font-semibold text-sm text-plum-700 dark:text-night-text mb-1">{title}</p>}
      <p className="text-xs md:text-sm text-plum-400 dark:text-night-muted max-w-sm">{description || text}</p>
    </div>
  );
}

export const FLOW_COLORS: Record<string, string> = {
  none: 'bg-blush-50 dark:bg-night-600',
  light: 'bg-blush-200 dark:bg-blush-700',
  medium: 'bg-blush-400 dark:bg-blush-500',
  heavy: 'bg-blush-600 dark:bg-blush-400',
};
