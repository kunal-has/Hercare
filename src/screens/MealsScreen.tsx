import { useState } from 'react';
import { Card, SectionTitle, EmptyState, ProgressBar } from '../components/ui';
import { UtensilsCrossed, Plus, Trash2, Flame } from 'lucide-react';
import { useStore, today } from '../store';
import type { Meal } from '../types';

const TYPES: { v: Meal['type']; label: string; emoji: string }[] = [
  { v: 'breakfast', label: 'Breakfast', emoji: 'Breakfast' },
  { v: 'lunch', label: 'Lunch', emoji: 'Lunch' },
  { v: 'dinner', label: 'Dinner', emoji: 'Dinner' },
  { v: 'snack', label: 'Snack', emoji: 'Snack' },
];

export function MealsScreen() {
  const { data, addMeal, removeMeal } = useStore();
  const t = today();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<Meal['type']>('breakfast');
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [items, setItems] = useState('');

  const mealsToday = data.meals.filter((m) => m.date === t).sort((a, b) => TYPES.findIndex((x) => x.v === a.type) - TYPES.findIndex((x) => x.v === b.type));
  const totalCal = mealsToday.reduce((s, m) => s + m.calories, 0);
  const goal = data.goals.calories;

  const submit = () => {
    if (!name.trim()) return;
    addMeal({
      date: t,
      type,
      name: name.trim(),
      calories: Number(calories) || 0,
      items: items.split(',').map((s) => s.trim()).filter(Boolean),
    });
    setName(''); setCalories(''); setItems(''); setType('breakfast');
    setShowForm(false);
  };

  return (
    <div className="tab-stagger space-y-5">
      <div className="flex items-center justify-between">
        <SectionTitle title="Nutrition" subtitle="Log meals & track calories" icon={<UtensilsCrossed className="h-5 w-5" />} />
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Plus className="h-4 w-4" /> {showForm ? 'Close' : 'Add meal'}
        </button>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-plum-500 dark:text-night-muted flex items-center gap-1.5">
            <Flame className="h-4 w-4 text-gold-500" /> Today's calories
          </p>
          <p className="font-display text-lg font-semibold text-plum-700 dark:text-night-text">{totalCal} / {goal}</p>
        </div>
        <ProgressBar value={totalCal} max={goal} colorClass="bg-gold-400" />
        <p className="text-xs text-plum-400 dark:text-night-muted mt-2">{goal - totalCal > 0 ? `${goal - totalCal} kcal remaining` : `${totalCal - goal} kcal over goal`}</p>
      </Card>

      {showForm && (
        <Card className="animate-slide-up">
          <p className="font-display text-base font-semibold text-plum-700 dark:text-night-text mb-3">New Meal</p>
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((ty) => (
                <button key={ty.v} onClick={() => setType(ty.v)}
                  className={`rounded-xl py-2 text-xs font-medium transition-all ${type === ty.v ? 'bg-blush-500 text-white' : 'bg-blush-50 dark:bg-night-600 text-plum-500 dark:text-night-muted hover:bg-blush-100 dark:hover:bg-night-500'}`}>
                  {ty.label}
                </button>
              ))}
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Meal name (e.g. Avocado Toast)"
              className="w-full rounded-2xl border border-blush-100 dark:border-night-500/50 bg-cream-50 dark:bg-night-600 p-3 text-sm text-plum-700 dark:text-night-text placeholder:text-plum-300 dark:placeholder:text-night-muted focus:outline-none focus:ring-2 focus:ring-blush-300" />
            <input value={calories} onChange={(e) => setCalories(e.target.value)} type="number" placeholder="Calories"
              className="w-full rounded-2xl border border-blush-100 dark:border-night-500/50 bg-cream-50 dark:bg-night-600 p-3 text-sm text-plum-700 dark:text-night-text placeholder:text-plum-300 dark:placeholder:text-night-muted focus:outline-none focus:ring-2 focus:ring-blush-300" />
            <input value={items} onChange={(e) => setItems(e.target.value)} placeholder="Items (comma separated)"
              className="w-full rounded-2xl border border-blush-100 dark:border-night-500/50 bg-cream-50 dark:bg-night-600 p-3 text-sm text-plum-700 dark:text-night-text placeholder:text-plum-300 dark:placeholder:text-night-muted focus:outline-none focus:ring-2 focus:ring-blush-300" />
            <button onClick={submit} className="btn-primary w-full">Save meal</button>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {mealsToday.length === 0 ? (
          <Card><EmptyState icon={<UtensilsCrossed className="h-6 w-6" />} text="No meals logged today. Tap Add meal to begin." /></Card>
        ) : (
          mealsToday.map((m) => (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="pill bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300 capitalize">{m.type}</span>
                    <span className="pill bg-gold-400/20 text-gold-500"><Flame className="h-3 w-3" /> {m.calories} kcal</span>
                  </div>
                  <p className="font-semibold text-plum-700 dark:text-night-text mt-2">{m.name}</p>
                  {m.items.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {m.items.map((it, i) => <span key={i} className="pill bg-cream-200 dark:bg-night-600 text-plum-500 dark:text-night-muted">{it}</span>)}
                    </div>
                  )}
                </div>
                <button onClick={() => removeMeal(m.id)} className="text-plum-300 dark:text-night-muted hover:text-blush-500 transition-colors p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
