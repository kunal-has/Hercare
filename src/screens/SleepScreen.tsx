import { useState } from 'react';
import { Card, SectionTitle, Ring } from '../components/ui';
import { MoonStar, Star } from 'lucide-react';
import { useStore, today } from '../store';
import type { SleepLog } from '../types';
import { daysAgoStr } from '../hooks/useLocalStorage';

const MOODS: { v: SleepLog['mood']; label: string; color: string }[] = [
  { v: 'great', label: 'Radiant', color: 'bg-sage-500' },
  { v: 'good', label: 'Calm', color: 'bg-blush-400' },
  { v: 'okay', label: 'Steady', color: 'bg-gold-400' },
  { v: 'low', label: 'Tender', color: 'bg-plum-300' },
  { v: 'stressed', label: 'Tense', color: 'bg-blush-600' },
];

export function SleepScreen() {
  const { data, setSleep } = useStore();
  const t = today();
  const existing = data.sleep[t];
  const [hours, setHours] = useState(existing?.hours ?? 7);
  const [quality, setQuality] = useState<1 | 2 | 3 | 4 | 5>(existing?.quality ?? 3);
  const [mood, setMood] = useState<SleepLog['mood']>(existing?.mood ?? 'good');
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSleep({ date: t, hours, quality, mood, note: note || undefined });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // weekly sleep data
  const history: { date: string; hours: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = daysAgoStr(i);
    history.push({ date: d, hours: data.sleep[d]?.hours ?? 0 });
  }
  const avgHours = (history.reduce((s, h) => s + h.hours, 0) / 7).toFixed(1);

  // mood distribution
  const moodCounts: Record<string, number> = {};
  Object.values(data.sleep).forEach((s) => { moodCounts[s.mood] = (moodCounts[s.mood] ?? 0) + 1; });
  const topMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="tab-stagger space-y-5">
      <SectionTitle title="Sleep & Mood" subtitle="How did you rest and feel today?" icon={<MoonStar className="h-5 w-5" />} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Logger */}
        <Card>
          <p className="font-display text-base font-semibold text-plum-700 dark:text-night-text mb-4">Last night</p>

          <p className="text-xs font-semibold text-plum-400 dark:text-night-muted mb-2">Hours slept: <span className="text-plum-700 dark:text-night-text font-bold">{hours}h</span></p>
          <input
            type="range" min={0} max={12} step={0.5} value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="w-full accent-blush-500"
          />
          <div className="flex justify-between text-[10px] text-plum-300 dark:text-night-muted mt-1"><span>0h</span><span>12h</span></div>

          <p className="text-xs font-semibold text-plum-400 dark:text-night-muted mt-4 mb-2">Sleep quality</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q as 1 | 2 | 3 | 4 | 5)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all ${quality >= q ? 'text-gold-500' : 'text-plum-200 dark:text-night-500'}`}
              >
                <Star className={`h-6 w-6 ${quality >= q ? 'fill-gold-400' : ''}`} />
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-plum-400 dark:text-night-muted mt-4 mb-2">Today's mood</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((m) => (
              <button
                key={m.v}
                onClick={() => setMood(m.v)}
                className={`pill transition-all ${mood === m.v ? `${m.color} text-white` : 'bg-blush-50 dark:bg-night-600 text-plum-500 dark:text-night-muted hover:bg-blush-100 dark:hover:bg-night-500'}`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p className="text-xs font-semibold text-plum-400 dark:text-night-muted mt-4 mb-1.5">Note</p>
          <textarea
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Dreams, energy, anything on your mind..."
            className="w-full rounded-2xl border border-blush-100 dark:border-night-500/50 bg-cream-50 dark:bg-night-600 p-3 text-sm text-plum-700 dark:text-night-text placeholder:text-plum-300 dark:placeholder:text-night-muted focus:outline-none focus:ring-2 focus:ring-blush-300 resize-none"
            rows={2}
          />

          <button onClick={save} className="btn-primary w-full mt-3">
            {saved ? 'Saved!' : 'Save entry'}
          </button>
        </Card>

        {/* Insights */}
        <div className="space-y-5">
          <Card className="flex items-center gap-4">
            <Ring value={hours} max={data.goals.sleep} size={110} color="#DA7484" track="#E8DBE1" darkTrack="#35293B">
              <span className="font-display text-2xl font-semibold text-plum-700 dark:text-night-text">{hours}</span>
              <span className="text-[10px] text-plum-400 dark:text-night-muted">hours</span>
            </Ring>
            <div>
              <p className="text-sm text-plum-400 dark:text-night-muted">vs {data.goals.sleep}h goal</p>
              <p className={`font-display text-lg font-semibold ${hours >= 7 ? 'text-sage-600 dark:text-sage-400' : 'text-plum-700 dark:text-night-text'}`}>
                {hours >= 7 ? 'Well rested' : hours >= 5 ? 'Could use more' : 'Too short'}
              </p>
              {topMood && <p className="text-xs text-plum-400 dark:text-night-muted mt-1">Frequent mood: {MOODS.find((m) => m.v === topMood[0])?.label}</p>}
            </div>
          </Card>

          <Card>
            <p className="text-sm font-semibold text-plum-500 dark:text-night-muted mb-3">Sleep — past 7 days</p>
            <div className="flex items-end justify-between gap-2 h-28">
              {history.map((h, i) => {
                const hgt = Math.max(4, (h.hours / 12) * 100);
                const isToday = i === history.length - 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-[10px] text-plum-400 dark:text-night-muted">{h.hours > 0 ? `${h.hours}h` : ''}</span>
                    <div className="w-full rounded-t-lg bg-plum-100 dark:bg-night-600 relative" style={{ height: '100%' }}>
                      <div className={`absolute bottom-0 inset-x-0 rounded-t-lg transition-all duration-700 ${isToday ? 'bg-plum-500' : 'bg-plum-300 dark:bg-night-500'}`} style={{ height: `${hgt}%` }} />
                    </div>
                    <span className="text-[10px] text-plum-400 dark:text-night-muted">{new Date(h.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-plum-400 dark:text-night-muted mt-3 text-center">7-day average: {avgHours}h</p>
          </Card>

          <Card className="bg-gradient-to-r from-plum-600 to-plum-800 dark:from-night-800 dark:to-night-700 text-white border-plum-600 dark:border-night-500/40">
            <p className="text-white/80 text-xs">Gentle reminder</p>
            <p className="text-sm mt-1 leading-relaxed">Sleep and mood are deeply connected with your cycle. During the luteal phase, your body may need extra rest — be kind to yourself.</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
