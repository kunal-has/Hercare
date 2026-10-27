import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, SectionTitle, EmptyState } from '../components/ui';
import {
  Dumbbell,
  Play,
  Pause,
  Square,
  Plus,
  Trophy,
  Flame,
  Clock,
  MapPin,
  Calendar,
  Trash2,
  Edit2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore, today } from '../store';
import type { ActivityType, WorkoutSession, StrengthExercise, StrengthSet } from '../types';
import {
  ACTIVITY_META,
  calculateFitnessSummary,
  estimateCaloriesBurned,
  formatWorkoutDuration,
} from '../utils/fitnessStats';

export function FitnessScreen() {
  const { data, addWorkout, updateWorkout, deleteWorkout } = useStore();
  const t = today();

  const [activeTab, setActiveTab] = useState<'all' | 'strength' | 'cardio'>('all');
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);

  // Live Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActivity, setTimerActivity] = useState<ActivityType>('running');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form State
  const [formActivity, setFormActivity] = useState<ActivityType>('running');
  const [formCustomName, setFormCustomName] = useState('');
  const [formDate, setFormDate] = useState(t);
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formDuration, setFormDuration] = useState('30');
  const [formDistance, setFormDistance] = useState('');
  const [formCalories, setFormCalories] = useState('');
  const [formIntensity, setFormIntensity] = useState<'light' | 'moderate' | 'vigorous'>('moderate');
  const [formIsPR, setFormIsPR] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Strength Exercises state
  const [strengthExercises, setStrengthExercises] = useState<StrengthExercise[]>([]);
  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);

  // Workout Summary Stats
  const fitnessSummary = useMemo(() => {
    return calculateFitnessSummary(data.workouts || [], t, 150);
  }, [data.workouts, t]);

  // Handle Live Timer Ticking
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const formatTimerDigits = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const startLiveTimer = () => {
    setIsTimerRunning(true);
  };

  const pauseLiveTimer = () => {
    setIsTimerRunning(false);
  };

  const resetLiveTimer = () => {
    setIsTimerRunning(false);
    setTimerSeconds(0);
  };

  const finishAndSaveTimer = () => {
    setIsTimerRunning(false);
    const durationMinutes = Math.max(1, Math.round(timerSeconds / 60));

    // Pre-populate form with timer data
    setEditingSession(null);
    setFormActivity(timerActivity);
    setFormCustomName('');
    setFormDate(t);
    setFormStartTime(new Date().toTimeString().slice(0, 5));
    setFormDuration(String(durationMinutes));
    setFormDistance('');
    setFormCalories(String(estimateCaloriesBurned(timerActivity, durationMinutes)));
    setFormIntensity('moderate');
    setFormIsPR(false);
    setFormNotes('');
    setStrengthExercises(timerActivity === 'gym_strength' ? [{ name: 'Exercise 1', sets: [{ setNumber: 1, reps: 10, weightKg: 10, restSeconds: 60 }] }] : []);

    setTimerSeconds(0);
    setShowLogModal(true);
  };

  const openNewLogModal = () => {
    setEditingSession(null);
    setFormActivity('running');
    setFormCustomName('');
    setFormDate(t);
    setFormStartTime('08:00');
    setFormDuration('30');
    setFormDistance('');
    setFormCalories('250');
    setFormIntensity('moderate');
    setFormIsPR(false);
    setFormNotes('');
    setStrengthExercises([]);
    setShowLogModal(true);
  };

  const openEditLogModal = (w: WorkoutSession) => {
    setEditingSession(w);
    setFormActivity(w.activityType);
    setFormCustomName(w.customActivityName || '');
    setFormDate(w.date);
    setFormStartTime(w.startTime);
    setFormDuration(String(w.durationMinutes));
    setFormDistance(w.distanceKm !== undefined ? String(w.distanceKm) : '');
    setFormCalories(w.caloriesBurned !== undefined ? String(w.caloriesBurned) : '');
    setFormIntensity(w.intensity || 'moderate');
    setFormIsPR(!!w.isPersonalRecord);
    setFormNotes(w.notes || '');
    setStrengthExercises(w.exercises || []);
    setShowLogModal(true);
  };

  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    const durationNum = parseInt(formDuration, 10) || 1;
    const distanceNum = formDistance ? parseFloat(formDistance) : undefined;
    const caloriesNum = formCalories ? parseInt(formCalories, 10) : estimateCaloriesBurned(formActivity, durationNum);

    const workoutPayload: Omit<WorkoutSession, 'id'> = {
      activityType: formActivity,
      customActivityName: formCustomName.trim() || undefined,
      date: formDate,
      startTime: formStartTime,
      durationMinutes: durationNum,
      distanceKm: distanceNum,
      caloriesBurned: caloriesNum,
      intensity: formIntensity,
      isPersonalRecord: formIsPR,
      notes: formNotes.trim() || undefined,
      exercises: formActivity === 'gym_strength' && strengthExercises.length > 0 ? strengthExercises : undefined,
    };

    if (editingSession) {
      updateWorkout({ ...editingSession, ...workoutPayload });
    } else {
      addWorkout(workoutPayload);
    }

    setShowLogModal(false);
  };

  // Strength Exercise Helpers
  const addExercise = () => {
    setStrengthExercises([
      ...strengthExercises,
      {
        name: `Exercise ${strengthExercises.length + 1}`,
        sets: [{ setNumber: 1, reps: 10, weightKg: 10, restSeconds: 60 }],
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setStrengthExercises(strengthExercises.filter((_, i) => i !== index));
  };

  const addSetToExercise = (exIndex: number) => {
    const ex = strengthExercises[exIndex];
    const newSet: StrengthSet = {
      setNumber: ex.sets.length + 1,
      reps: ex.sets[ex.sets.length - 1]?.reps || 10,
      weightKg: ex.sets[ex.sets.length - 1]?.weightKg || 10,
      restSeconds: 60,
    };
    const updated = [...strengthExercises];
    updated[exIndex] = { ...ex, sets: [...ex.sets, newSet] };
    setStrengthExercises(updated);
  };

  const removeSetFromExercise = (exIndex: number, setIndex: number) => {
    const ex = strengthExercises[exIndex];
    const nextSets = ex.sets.filter((_, i) => i !== setIndex).map((s, idx) => ({ ...s, setNumber: idx + 1 }));
    const updated = [...strengthExercises];
    updated[exIndex] = { ...ex, sets: nextSets };
    setStrengthExercises(updated);
  };

  // Filtered workouts
  const filteredWorkouts = useMemo(() => {
    const all = data.workouts || [];
    if (activeTab === 'strength') {
      return all.filter((w) => w.activityType === 'gym_strength');
    }
    if (activeTab === 'cardio') {
      return all.filter((w) => ['running', 'walking', 'cycling', 'swimming', 'dance'].includes(w.activityType));
    }
    return all;
  }, [data.workouts, activeTab]);

  return (
    <div className="tab-stagger space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle
          title="Fitness, Sports & Movement"
          subtitle="Workout timers, strength tracking & weekly active minutes"
          icon={<Dumbbell className="h-5 w-5" />}
        />
        <div className="flex items-center gap-2">
          <button onClick={openNewLogModal} className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5">
            <Plus className="h-4 w-4" /> Log Workout
          </button>
        </div>
      </div>

      {/* Top Fitness Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="font-display text-2xl md:text-3xl font-semibold text-blush-500">
            {fitnessSummary.weeklyActiveMinutes} <span className="text-xs text-plum-400 font-normal">/ {fitnessSummary.weeklyTargetMinutes}m</span>
          </p>
          <div className="w-full bg-blush-100 dark:bg-night-600 rounded-full h-1.5 mt-2">
            <div
              className="bg-blush-500 h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min(100, Math.round((fitnessSummary.weeklyActiveMinutes / fitnessSummary.weeklyTargetMinutes) * 100))}%`,
              }}
            />
          </div>
          <p className="text-xs text-plum-400 dark:text-night-muted mt-1.5">Weekly Active Mins</p>
        </Card>

        <Card className="text-center">
          <p className="font-display text-2xl md:text-3xl font-semibold text-plum-700 dark:text-night-text">
            {fitnessSummary.weeklySessionsCount} <span className="text-xs text-plum-400 font-normal">days</span>
          </p>
          <p className="text-xs text-plum-400 dark:text-night-muted mt-2">Active This Week</p>
        </Card>

        <Card className="text-center">
          <p className="font-display text-2xl md:text-3xl font-semibold text-sage-600 dark:text-sage-400">
            {fitnessSummary.weeklyCalories}
          </p>
          <p className="text-xs text-plum-400 dark:text-night-muted mt-2">Kcal Burned (Week)</p>
        </Card>

        <Card className="text-center">
          <p className="font-display text-2xl md:text-3xl font-semibold text-gold-500 flex items-center justify-center gap-1">
            <Trophy className="h-5 w-5 text-gold-500 inline" /> {fitnessSummary.personalRecordsCount}
          </p>
          <p className="text-xs text-plum-400 dark:text-night-muted mt-2">Personal Records</p>
        </Card>
      </div>

      {/* Live Interactive Activity Stopwatch / Timer */}
      <Card className="bg-gradient-to-br from-blush-500/10 via-cream-50 to-sage-400/10 dark:from-night-800 dark:to-night-700 border-blush-200 dark:border-night-500/40">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-blush-600 dark:text-blush-300 uppercase tracking-wider block">
              Live Workout Timer
            </span>
            <div className="flex items-center gap-2 mt-1">
              <select
                value={timerActivity}
                onChange={(e) => setTimerActivity(e.target.value as ActivityType)}
                disabled={isTimerRunning}
                className="rounded-xl border border-blush-200 dark:border-night-500 bg-white dark:bg-night-600 px-3 py-1.5 text-xs font-semibold text-plum-700 dark:text-night-text"
              >
                {Object.entries(ACTIVITY_META).map(([key, meta]) => (
                  <option key={key} value={key}>
                    {meta.icon} {meta.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Digital Timer */}
          <div className="text-center font-mono text-4xl md:text-5xl font-bold tracking-tight text-plum-700 dark:text-night-text">
            {formatTimerDigits(timerSeconds)}
          </div>

          {/* Stopwatch Controls */}
          <div className="flex items-center gap-2">
            {!isTimerRunning ? (
              <button
                onClick={startLiveTimer}
                className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Play className="h-4 w-4 fill-white" /> {timerSeconds > 0 ? 'Resume' : 'Start Timer'}
              </button>
            ) : (
              <button
                onClick={pauseLiveTimer}
                className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Pause className="h-4 w-4" /> Pause
              </button>
            )}

            {timerSeconds > 0 && (
              <>
                <button
                  onClick={finishAndSaveTimer}
                  className="py-2 px-3.5 rounded-2xl bg-sage-500 hover:bg-sage-600 text-white text-xs font-semibold shadow-sm flex items-center gap-1 transition-all"
                  title="Finish and save workout"
                >
                  <Square className="h-3.5 w-3.5 fill-white" /> Finish & Log
                </button>
                <button
                  onClick={resetLiveTimer}
                  className="btn-ghost text-xs py-2 px-2.5 text-plum-400"
                  title="Reset timer"
                >
                  Reset
                </button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Workouts History Segment */}
      <div className="flex items-center justify-between border-b border-blush-100 dark:border-night-500/40 pb-1">
        <div className="flex gap-2 text-xs font-semibold">
          {[
            { id: 'all' as const, label: 'All Activities' },
            { id: 'cardio' as const, label: 'Cardio & Movement' },
            { id: 'strength' as const, label: 'Strength & Gym' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-blush-500 text-white shadow-sm'
                  : 'text-plum-400 hover:text-plum-600 dark:hover:text-night-text'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-plum-400 dark:text-night-muted">
          {filteredWorkouts.length} logged sessions
        </span>
      </div>

      {/* Workout Sessions Feed */}
      <div className="space-y-3">
        {filteredWorkouts.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="h-8 w-8" />}
            title="No workout sessions recorded"
            description="Start the timer or use 'Log Workout' to record your sessions, sets, and fitness milestones."
          />
        ) : (
          filteredWorkouts.map((wo) => {
            const meta = ACTIVITY_META[wo.activityType] || ACTIVITY_META.custom;
            const isExpanded = expandedWorkoutId === wo.id;
            const hasExercises = wo.exercises && wo.exercises.length > 0;

            return (
              <Card key={wo.id} className="transition-all hover:shadow-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl p-2.5 rounded-2xl bg-cream-100 dark:bg-night-700 shrink-0">
                      {meta.icon}
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-semibold text-base text-plum-700 dark:text-night-text">
                          {wo.customActivityName || meta.label}
                        </h4>
                        {wo.isPersonalRecord && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gold-400/20 text-gold-600 dark:text-gold-300 flex items-center gap-1">
                            <Trophy className="h-3 w-3" /> PR
                          </span>
                        )}
                        <span className="text-xs px-2 py-0.5 rounded-full bg-plum-100/70 dark:bg-night-600 text-plum-600 dark:text-night-muted capitalize">
                          {wo.intensity || 'moderate'}
                        </span>
                      </div>

                      {/* Stat Metrics Pills */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-plum-400 dark:text-night-muted">
                        <span className="flex items-center gap-1 font-medium text-plum-600 dark:text-night-text">
                          <Clock className="h-3.5 w-3.5 text-blush-400" /> {formatWorkoutDuration(wo.durationMinutes)}
                        </span>
                        {wo.distanceKm !== undefined && (
                          <span className="flex items-center gap-1 font-medium text-plum-600 dark:text-night-text">
                            <MapPin className="h-3.5 w-3.5 text-sage-500" /> {wo.distanceKm} km
                          </span>
                        )}
                        {wo.caloriesBurned !== undefined && (
                          <span className="flex items-center gap-1">
                            <Flame className="h-3.5 w-3.5 text-amber-500" /> {wo.caloriesBurned} kcal
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> {wo.date} at {wo.startTime}
                        </span>
                      </div>

                      {wo.notes && (
                        <p className="text-xs text-plum-500 dark:text-night-muted mt-1 italic">
                          &ldquo;{wo.notes}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {hasExercises && (
                      <button
                        onClick={() => setExpandedWorkoutId(isExpanded ? null : wo.id)}
                        className="p-1.5 rounded-lg text-plum-400 hover:text-plum-600 hover:bg-plum-50 dark:hover:bg-night-600"
                        title={isExpanded ? 'Hide sets' : 'View exercises & sets'}
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => openEditLogModal(wo)}
                      className="p-1.5 rounded-lg text-plum-400 hover:text-blush-500 hover:bg-blush-50 dark:hover:bg-night-600"
                      title="Edit session"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteWorkout(wo.id)}
                      className="p-1.5 rounded-lg text-plum-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-night-600"
                      title="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expanded Strength Sets Breakdown */}
                {isExpanded && hasExercises && (
                  <div className="mt-3 pt-3 border-t border-blush-100 dark:border-night-500/40 space-y-2 text-xs">
                    <p className="font-semibold text-plum-600 dark:text-night-text">
                      Logged Exercises & Sets:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {wo.exercises?.map((ex, exIdx) => (
                        <div
                          key={exIdx}
                          className="p-2.5 rounded-xl bg-cream-50 dark:bg-night-700/60 border border-blush-100 dark:border-night-500/30 space-y-1"
                        >
                          <span className="font-semibold text-plum-700 dark:text-night-text">
                            {ex.name}
                          </span>
                          <div className="space-y-0.5">
                            {ex.sets.map((set) => (
                              <div
                                key={set.setNumber}
                                className="flex justify-between text-[11px] text-plum-500 dark:text-night-muted"
                              >
                                <span>Set {set.setNumber}</span>
                                <span className="font-medium text-plum-600 dark:text-night-text">
                                  {set.reps} reps {set.weightKg ? `@ ${set.weightKg} kg` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* LOG WORKOUT MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-night-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-blush-100 dark:border-night-500/50 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-blush-100 dark:border-night-600 pb-2">
              <h3 className="font-display text-lg font-semibold text-plum-700 dark:text-night-text">
                {editingSession ? 'Edit Workout Session' : 'Record Workout Session'}
              </h3>
              <button onClick={() => setShowLogModal(false)} className="text-plum-400 hover:text-plum-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkout} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                  Activity Type *
                </label>
                <select
                  value={formActivity}
                  onChange={(e) => setFormActivity(e.target.value as ActivityType)}
                  className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-xs text-plum-700 dark:text-night-text"
                >
                  {Object.entries(ACTIVITY_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.icon} {meta.label}
                    </option>
                  ))}
                </select>
              </div>

              {formActivity === 'custom' && (
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Custom Activity Name *
                  </label>
                  <input
                    required
                    value={formCustomName}
                    onChange={(e) => setFormCustomName(e.target.value)}
                    placeholder="e.g. Pilates Reformer, Rock Climbing"
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Duration (mins) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="600"
                    value={formDuration}
                    onChange={(e) => setFormDuration(e.target.value)}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formDistance}
                    onChange={(e) => setFormDistance(e.target.value)}
                    placeholder="e.g. 5.2"
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Calories (kcal)
                  </label>
                  <input
                    type="number"
                    value={formCalories}
                    onChange={(e) => setFormCalories(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Perceived Intensity
                  </label>
                  <select
                    value={formIntensity}
                    onChange={(e) => setFormIntensity(e.target.value as 'light' | 'moderate' | 'vigorous')}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  >
                    <option value="light">Light (gentle warm-up)</option>
                    <option value="moderate">Moderate (steady effort)</option>
                    <option value="vigorous">Vigorous (high intensity)</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isPRCheck"
                    checked={formIsPR}
                    onChange={(e) => setFormIsPR(e.target.checked)}
                    className="h-4 w-4 accent-gold-500 rounded cursor-pointer"
                  />
                  <label htmlFor="isPRCheck" className="font-semibold text-plum-700 dark:text-night-text cursor-pointer">
                    🏆 Personal Record!
                  </label>
                </div>
              </div>

              {/* Strength Training Set Logger */}
              {formActivity === 'gym_strength' && (
                <div className="p-3.5 rounded-2xl bg-cream-50 dark:bg-night-700/60 border border-blush-100 dark:border-night-500/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-plum-700 dark:text-night-text">
                      Strength Exercises & Sets
                    </span>
                    <button
                      type="button"
                      onClick={addExercise}
                      className="btn-ghost text-[11px] py-1 px-2.5 text-blush-500 font-semibold"
                    >
                      + Add Exercise
                    </button>
                  </div>

                  {strengthExercises.map((ex, exIdx) => (
                    <div key={exIdx} className="p-2.5 rounded-xl bg-white dark:bg-night-600 border border-blush-200 dark:border-night-500 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={ex.name}
                          onChange={(e) => {
                            const updated = [...strengthExercises];
                            updated[exIdx].name = e.target.value;
                            setStrengthExercises(updated);
                          }}
                          placeholder="Exercise Name (e.g. Squat)"
                          className="font-semibold text-xs text-plum-700 dark:text-night-text bg-transparent border-b border-blush-300 dark:border-night-500 focus:outline-none flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => removeExercise(exIdx)}
                          className="text-plum-400 hover:text-red-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Sets list */}
                      <div className="space-y-1.5">
                        {ex.sets.map((set, setIdx) => (
                          <div key={setIdx} className="flex items-center gap-2 text-[11px]">
                            <span className="text-plum-400 w-10">Set {set.setNumber}</span>
                            <input
                              type="number"
                              value={set.reps}
                              onChange={(e) => {
                                const updated = [...strengthExercises];
                                updated[exIdx].sets[setIdx].reps = parseInt(e.target.value, 10) || 0;
                                setStrengthExercises(updated);
                              }}
                              className="w-14 rounded p-1 border border-blush-200 dark:border-night-500 text-center text-plum-700 dark:text-night-text"
                              title="Reps"
                            />
                            <span className="text-plum-400">reps</span>
                            <input
                              type="number"
                              value={set.weightKg || ''}
                              onChange={(e) => {
                                const updated = [...strengthExercises];
                                updated[exIdx].sets[setIdx].weightKg = parseFloat(e.target.value) || 0;
                                setStrengthExercises(updated);
                              }}
                              placeholder="kg"
                              className="w-14 rounded p-1 border border-blush-200 dark:border-night-500 text-center text-plum-700 dark:text-night-text"
                              title="Weight in kg"
                            />
                            <span className="text-plum-400">kg</span>
                            <button
                              type="button"
                              onClick={() => removeSetFromExercise(exIdx, setIdx)}
                              className="text-plum-300 hover:text-red-500 ml-auto"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => addSetToExercise(exIdx)}
                        className="text-[10px] text-blush-500 font-semibold hover:underline"
                      >
                        + Add Set
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                  Workout Notes / Reflection
                </label>
                <input
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. Felt energized, focused on slow tempo"
                  className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-xs text-plum-700 dark:text-night-text"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-blush-100 dark:border-night-600">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  {editingSession ? 'Update Workout' : 'Save Workout'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
