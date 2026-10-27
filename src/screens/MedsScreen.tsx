import { useState, useMemo } from 'react';
import { Card, SectionTitle, EmptyState } from '../components/ui';
import {
  Pill,
  Plus,
  Check,
  X,
  Trash2,
  Clock,
  Archive,
  Bell,
  BellOff,
  Edit3,
  Pause,
  Play,
  Shield,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useStore, today } from '../store';
import type { Medication } from '../types';
import {
  getScheduledDosesForDate,
  calculateAdherenceRate,
  estimateStockDaysRemaining,
} from '../utils/medicationScheduler';
import { MedicationReminderBanner } from '../components/MedicationReminderBanner';

const COLORS = ['blush', 'gold', 'plum', 'sage'];
const COLOR_CLASSES: Record<string, { bg: string; text: string; ring: string }> = {
  blush: { bg: 'bg-blush-100 dark:bg-blush-950/40', text: 'text-blush-600 dark:text-blush-300', ring: 'ring-blush-400' },
  gold: { bg: 'bg-gold-400/20 dark:bg-gold-500/20', text: 'text-gold-600 dark:text-gold-400', ring: 'ring-gold-400' },
  plum: { bg: 'bg-plum-100 dark:bg-plum-950/40', text: 'text-plum-600 dark:text-plum-300', ring: 'ring-plum-400' },
  sage: { bg: 'bg-sage-400/20 dark:bg-sage-500/20', text: 'text-sage-600 dark:text-sage-400', ring: 'ring-sage-400' },
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function MedsScreen() {
  const {
    data,
    addMed,
    updateMed,
    removeMed,
    archiveMed,
    togglePauseMed,
    recordDoseStatus,
    updateMedSettings,
  } = useStore();

  const t = today();
  const [activeTab, setActiveTab] = useState<'schedule' | 'medications' | 'stock' | 'settings'>('schedule');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00', '20:00']);
  const [newTimeInput, setNewTimeInput] = useState('');
  const [color, setColor] = useState('blush');
  const [scheduleType, setScheduleType] = useState<Medication['scheduleType']>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startDate, setStartDate] = useState(t);
  const [endDate, setEndDate] = useState('');
  const [quantity, setQuantity] = useState<string>('30');
  const [lowStockThreshold, setLowStockThreshold] = useState<string>('7');
  const [refillOn, setRefillOn] = useState('');

  const [snoozeFeedback, setSnoozeFeedback] = useState<string | null>(null);

  const now = new Date();
  const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const medSettings = useMemo(() => {
    return (
      data.medSettings || {
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        privateLockScreen: true,
      }
    );
  }, [data.medSettings]);

  // Doses scheduled for today
  const scheduledDoses = useMemo(() => {
    return getScheduledDosesForDate(
      data.meds || [],
      data.doseRecords || {},
      t,
      currentTimeStr,
      {
        enabled: medSettings.quietHoursEnabled,
        start: medSettings.quietHoursStart,
        end: medSettings.quietHoursEnd,
      }
    );
  }, [data.meds, data.doseRecords, t, currentTimeStr, medSettings]);

  const adherence = useMemo(() => calculateAdherenceRate(scheduledDoses), [scheduledDoses]);

  // Low stock and upcoming refill alerts
  const lowStockMeds = useMemo(() => {
    return (data.meds || []).filter(
      (m) =>
        !m.isArchived &&
        typeof m.quantity === 'number' &&
        typeof m.lowStockThreshold === 'number' &&
        m.quantity <= m.lowStockThreshold
    );
  }, [data.meds]);

  const upcomingRefills = useMemo(() => {
    return (data.meds || []).filter(
      (m) => !m.isArchived && m.refillOn && m.refillOn >= t && m.refillOn <= t.slice(0, 8) + '31'
    );
  }, [data.meds, t]);

  const openAddForm = () => {
    setEditingMed(null);
    setName('');
    setDosage('');
    setInstructions('');
    setNotes('');
    setTimes(['08:00', '20:00']);
    setNewTimeInput('');
    setColor('blush');
    setScheduleType('daily');
    setSelectedDays([1, 2, 3, 4, 5]);
    setStartDate(t);
    setEndDate('');
    setQuantity('30');
    setLowStockThreshold('7');
    setRefillOn('');
    setShowAddModal(true);
  };

  const openEditForm = (med: Medication) => {
    setEditingMed(med);
    setName(med.name);
    setDosage(med.dosage);
    setInstructions(med.instructions || '');
    setNotes(med.notes || '');
    setTimes(med.times || ['08:00']);
    setNewTimeInput('');
    setColor(med.color || 'blush');
    setScheduleType(med.scheduleType || 'daily');
    setSelectedDays(med.daysOfWeek || [1, 2, 3, 4, 5]);
    setStartDate(med.startDate || t);
    setEndDate(med.endDate || '');
    setQuantity(med.quantity !== undefined ? String(med.quantity) : '');
    setLowStockThreshold(med.lowStockThreshold !== undefined ? String(med.lowStockThreshold) : '7');
    setRefillOn(med.refillOn || '');
    setShowAddModal(true);
  };

  const handleSaveMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const medData = {
      name: name.trim(),
      dosage: dosage.trim() || '1 dose',
      instructions: instructions.trim() || undefined,
      notes: notes.trim() || undefined,
      times: times.length > 0 ? times.sort() : ['08:00'],
      color,
      scheduleType,
      daysOfWeek: scheduleType === 'specific_days' ? selectedDays : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      quantity: quantity ? parseInt(quantity, 10) : undefined,
      lowStockThreshold: lowStockThreshold ? parseInt(lowStockThreshold, 10) : undefined,
      refillOn: refillOn || undefined,
    };

    if (editingMed) {
      updateMed({ ...editingMed, ...medData });
    } else {
      addMed(medData);
    }

    setShowAddModal(false);
  };

  const addTimeSlot = () => {
    if (!newTimeInput) return;
    if (!times.includes(newTimeInput)) {
      setTimes([...times, newTimeInput].sort());
    }
    setNewTimeInput('');
  };

  const removeTimeSlot = (slot: string) => {
    setTimes(times.filter((t) => t !== slot));
  };

  const handleSnooze = (doseId: string, time: string) => {
    setSnoozeFeedback(`Reminder for ${time} snoozed by 15 minutes.`);
    setTimeout(() => setSnoozeFeedback(null), 4000);
  };

  return (
    <div className="tab-stagger space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle
          title="Medication & Health Reminders"
          subtitle="Strict adherence tracking, stock counts & schedule controls"
          icon={<Pill className="h-5 w-5" />}
        />
        <button onClick={openAddForm} className="btn-primary">
          <Plus className="h-4 w-4" /> Add Medication
        </button>
      </div>

      {/* Safety & Medical Disclaimer Banner */}
      <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3.5 flex items-start gap-3">
        <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-plum-600 dark:text-night-muted leading-relaxed">
          <strong className="font-semibold text-plum-700 dark:text-night-text">Healthcare Safety Notice: </strong>
          Reminders follow your personal prescribed schedule. Never double a missed dose or alter prescribed therapy
          without consulting your physician or licensed pharmacist.
        </div>
      </div>

      {/* Active Dose Reminder Banner */}
      <MedicationReminderBanner />

      {/* Snooze feedback toast */}
      {snoozeFeedback && (
        <div className="p-3 bg-blush-500 text-white text-xs rounded-xl shadow-md flex items-center justify-between animate-fade-in">
          <span>{snoozeFeedback}</span>
          <button onClick={() => setSnoozeFeedback(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="text-center">
          <p className="font-display text-2xl md:text-3xl font-semibold text-plum-700 dark:text-night-text">
            {adherence.taken}/{adherence.total}
          </p>
          <p className="text-xs text-plum-400 dark:text-night-muted mt-0.5">Doses taken today</p>
        </Card>
        <Card className="text-center">
          <p className="font-display text-2xl md:text-3xl font-semibold text-blush-500">
            {adherence.ratePercentage}%
          </p>
          <p className="text-xs text-plum-400 dark:text-night-muted mt-0.5">Today's adherence</p>
        </Card>
        <Card className="text-center">
          <p className="font-display text-2xl md:text-3xl font-semibold text-plum-700 dark:text-night-text">
            {(data.meds || []).filter((m) => !m.isArchived).length}
          </p>
          <p className="text-xs text-plum-400 dark:text-night-muted mt-0.5">Active medicines</p>
        </Card>
        <Card className="text-center">
          <p className={`font-display text-2xl md:text-3xl font-semibold ${lowStockMeds.length > 0 ? 'text-amber-500' : 'text-sage-600'}`}>
            {lowStockMeds.length}
          </p>
          <p className="text-xs text-plum-400 dark:text-night-muted mt-0.5">Low-stock items</p>
        </Card>
      </div>

      {/* Low-stock / Refill alerts callout */}
      {(lowStockMeds.length > 0 || upcomingRefills.length > 0) && (
        <div className="space-y-2">
          {lowStockMeds.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span className="font-semibold text-plum-700 dark:text-night-text">{m.name}</span>
                <span className="text-plum-500 dark:text-night-muted">
                  — Low stock: only {m.quantity} pills left (threshold: {m.lowStockThreshold})
                </span>
              </div>
              <button
                onClick={() => openEditForm(m)}
                className="text-amber-600 dark:text-amber-400 font-semibold hover:underline"
              >
                Update Stock
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-blush-100 dark:border-night-500/40 gap-2 overflow-x-auto pb-1">
        {[
          { id: 'schedule' as const, label: "Today's Schedule", count: scheduledDoses.length },
          { id: 'medications' as const, label: 'All Medications', count: (data.meds || []).length },
          { id: 'stock' as const, label: 'Stock & Refills', count: lowStockMeds.length || undefined },
          { id: 'settings' as const, label: 'Quiet Hours & Privacy' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'text-blush-600 dark:text-blush-300 border-b-2 border-blush-500 bg-blush-50/50 dark:bg-night-700/60'
                : 'text-plum-400 dark:text-night-muted hover:text-plum-700 dark:hover:text-night-text'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: TODAY'S SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="space-y-3">
          {scheduledDoses.length === 0 ? (
            <EmptyState
              icon={<Pill className="h-8 w-8" />}
              title="No doses scheduled for today"
              description="Add medications with regular daily times to automatically generate your upcoming reminder timeline."
            />
          ) : (
            scheduledDoses.map((dose) => {
              const colorStyle = COLOR_CLASSES[dose.color] || COLOR_CLASSES.blush;
              const isTaken = dose.status === 'taken';
              const isSkipped = dose.status === 'skipped';
              const isMissed = dose.status === 'missed';

              return (
                <Card
                  key={dose.id}
                  className={`transition-all ${
                    isTaken
                      ? 'bg-sage-50/40 dark:bg-night-800/60 border-sage-200 dark:border-sage-900/40 opacity-85'
                      : isMissed
                      ? 'border-amber-300 dark:border-amber-900/50'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-2xl ${colorStyle.bg} ${colorStyle.text} shrink-0`}>
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-display font-semibold text-base text-plum-700 dark:text-night-text">
                            {dose.medicationName}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-plum-100/70 dark:bg-night-600 text-plum-600 dark:text-night-muted">
                            {dose.dosage}
                          </span>
                          {dose.isInQuietHours && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-plum-200 dark:bg-night-600 text-plum-600 dark:text-night-muted inline-flex items-center gap-1">
                              <BellOff className="h-3 w-3" /> Quiet Hours
                            </span>
                          )}
                        </div>

                        {dose.instructions && (
                          <p className="text-xs text-plum-500 dark:text-night-muted mt-0.5 italic">
                            &ldquo;{dose.instructions}&rdquo;
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-1 text-xs text-plum-400 dark:text-night-muted">
                          <span>Scheduled for <strong className="text-plum-600 dark:text-night-text font-semibold">{dose.scheduledTime}</strong></span>
                          {dose.quantity !== undefined && (
                            <span>• Stock: {dose.quantity} left</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status & Action Buttons */}
                    <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
                      {isTaken ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage-600 dark:text-sage-400 bg-sage-100 dark:bg-sage-950/50 px-3 py-1.5 rounded-xl">
                            <CheckCircle2 className="h-4 w-4" /> Taken
                          </span>
                          <button
                            onClick={() => recordDoseStatus(dose.medId, dose.date, dose.scheduledTime, 'scheduled')}
                            className="text-[11px] text-plum-400 hover:text-blush-500 underline"
                            title="Undo dose record"
                          >
                            Undo
                          </button>
                        </div>
                      ) : isSkipped ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-plum-500 bg-plum-100 dark:bg-night-600 px-3 py-1.5 rounded-xl">
                            <XCircle className="h-4 w-4" /> Skipped
                          </span>
                          <button
                            onClick={() => recordDoseStatus(dose.medId, dose.date, dose.scheduledTime, 'scheduled')}
                            className="text-[11px] text-plum-400 hover:text-blush-500 underline"
                          >
                            Undo
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => recordDoseStatus(dose.medId, dose.date, dose.scheduledTime, 'taken')}
                            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
                          >
                            <Check className="h-3.5 w-3.5" /> Taken
                          </button>
                          <button
                            onClick={() => handleSnooze(dose.id, dose.scheduledTime)}
                            className="btn-ghost text-xs py-1.5 px-2.5 flex items-center gap-1"
                            title="Snooze 15 minutes"
                          >
                            <Clock className="h-3.5 w-3.5" /> Snooze
                          </button>
                          <button
                            onClick={() => recordDoseStatus(dose.medId, dose.date, dose.scheduledTime, 'skipped')}
                            className="btn-ghost text-xs py-1.5 px-2.5 text-plum-400 hover:text-plum-600"
                            title="Skip this dose"
                          >
                            Skip
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: ALL MEDICATIONS */}
      {activeTab === 'medications' && (
        <div className="space-y-3">
          {(data.meds || []).map((med) => {
            const colorStyle = COLOR_CLASSES[med.color] || COLOR_CLASSES.blush;
            const daysLeft = estimateStockDaysRemaining(med);

            return (
              <Card key={med.id} className={med.isArchived ? 'opacity-50' : ''}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-3 rounded-2xl ${colorStyle.bg} ${colorStyle.text} shrink-0`}>
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-semibold text-lg text-plum-700 dark:text-night-text">
                          {med.name}
                        </h4>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blush-100/70 dark:bg-night-600 text-blush-600 dark:text-blush-300">
                          {med.dosage}
                        </span>
                        {med.isPaused && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            Paused
                          </span>
                        )}
                        {med.isArchived && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-plum-100 text-plum-600">
                            Archived
                          </span>
                        )}
                      </div>

                      {med.instructions && (
                        <p className="text-xs text-plum-500 dark:text-night-muted">
                          <strong>Directions:</strong> {med.instructions}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-plum-400 dark:text-night-muted">
                        <span>
                          <strong>Schedule:</strong> {med.scheduleType || 'Daily'} ({(med.times || []).join(', ')})
                        </span>
                        {typeof med.quantity === 'number' && (
                          <span>
                            <strong>Stock:</strong> {med.quantity} doses {daysLeft !== null && `(~${daysLeft} days)`}
                          </span>
                        )}
                        {med.refillOn && (
                          <span>
                            <strong>Refill on:</strong> {med.refillOn}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditForm(med)}
                      className="p-1.5 rounded-lg text-plum-400 hover:text-blush-500 hover:bg-blush-50 dark:hover:bg-night-600"
                      title="Edit medication"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => togglePauseMed(med.id)}
                      className="p-1.5 rounded-lg text-plum-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-night-600"
                      title={med.isPaused ? 'Resume schedule' : 'Pause schedule'}
                    >
                      {med.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => archiveMed(med.id)}
                      className="p-1.5 rounded-lg text-plum-400 hover:text-plum-600 hover:bg-plum-50 dark:hover:bg-night-600"
                      title={med.isArchived ? 'Unarchive' : 'Archive'}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => removeMed(med.id)}
                      className="p-1.5 rounded-lg text-plum-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-night-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* TAB 3: STOCK & REFILLS */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <Card>
            <h3 className="font-display font-semibold text-lg text-plum-700 dark:text-night-text mb-3 flex items-center gap-2">
              <Package className="h-5 w-5 text-blush-500" /> Inventory & Stock Monitoring
            </h3>
            <p className="text-xs text-plum-500 dark:text-night-muted mb-4">
              Stock automatically deducts 1 unit each time you record a scheduled dose as taken, and restores 1 unit if
              you correct a recorded dose.
            </p>

            <div className="space-y-3">
              {(data.meds || []).map((med) => {
                const daysLeft = estimateStockDaysRemaining(med);
                const isLow =
                  typeof med.quantity === 'number' &&
                  typeof med.lowStockThreshold === 'number' &&
                  med.quantity <= med.lowStockThreshold;

                return (
                  <div
                    key={med.id}
                    className="p-3.5 rounded-2xl bg-cream-50 dark:bg-night-700/60 border border-blush-100 dark:border-night-500/30 flex items-center justify-between flex-wrap gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-plum-700 dark:text-night-text text-sm">
                          {med.name}
                        </span>
                        {isLow && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-700">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-plum-400 dark:text-night-muted mt-0.5">
                        Current Quantity: <strong className="text-plum-600 dark:text-night-text">{med.quantity ?? 'Not tracked'}</strong> units
                        {daysLeft !== null && ` • Estimated Supply: ~${daysLeft} days`}
                        {med.refillOn && ` • Target Refill: ${med.refillOn}`}
                      </div>
                    </div>

                    <button
                      onClick={() => openEditForm(med)}
                      className="btn-ghost text-xs py-1 px-3"
                    >
                      Update Inventory
                    </button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* TAB 4: QUIET HOURS & PRIVACY SETTINGS */}
      {activeTab === 'settings' && (
        <Card className="space-y-4">
          <h3 className="font-display font-semibold text-lg text-plum-700 dark:text-night-text flex items-center gap-2">
            <Bell className="h-5 w-5 text-blush-500" /> Quiet Hours & Lock Screen Privacy
          </h3>

          <div className="space-y-4 text-xs md:text-sm text-plum-600 dark:text-night-muted">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-cream-50 dark:bg-night-700/60 border border-blush-100 dark:border-night-500/30">
              <div>
                <p className="font-semibold text-plum-700 dark:text-night-text">Enable Quiet Hours</p>
                <p className="text-xs text-plum-400 dark:text-night-muted">
                  Silence sound chimes and intrusive alerts during sleeping hours.
                </p>
              </div>
              <input
                type="checkbox"
                checked={medSettings.quietHoursEnabled}
                onChange={(e) => updateMedSettings({ quietHoursEnabled: e.target.checked })}
                className="h-5 w-5 accent-blush-500 rounded cursor-pointer"
              />
            </div>

            {medSettings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-cream-50 dark:bg-night-700/60">
                <div>
                  <label className="block text-xs font-semibold text-plum-500 dark:text-night-muted mb-1">
                    Quiet Hours Start
                  </label>
                  <input
                    type="time"
                    value={medSettings.quietHoursStart}
                    onChange={(e) => updateMedSettings({ quietHoursStart: e.target.value })}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-white dark:bg-night-600 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-plum-500 dark:text-night-muted mb-1">
                    Quiet Hours End
                  </label>
                  <input
                    type="time"
                    value={medSettings.quietHoursEnd}
                    onChange={(e) => updateMedSettings({ quietHoursEnd: e.target.value })}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-white dark:bg-night-600 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between p-3 rounded-2xl bg-cream-50 dark:bg-night-700/60 border border-blush-100 dark:border-night-500/30">
              <div>
                <p className="font-semibold text-plum-700 dark:text-night-text">Lock Screen Privacy</p>
                <p className="text-xs text-plum-400 dark:text-night-muted">
                  Mask specific medication names in system notifications (e.g., &ldquo;Time for your scheduled dose&rdquo;).
                </p>
              </div>
              <input
                type="checkbox"
                checked={medSettings.privateLockScreen}
                onChange={(e) => updateMedSettings({ privateLockScreen: e.target.checked })}
                className="h-5 w-5 accent-blush-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </Card>
      )}

      {/* ADD / EDIT MEDICATION MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-night-800 rounded-3xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-blush-100 dark:border-night-500/50 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between border-b border-blush-100 dark:border-night-600 pb-3">
              <h3 className="font-display text-xl font-semibold text-plum-700 dark:text-night-text">
                {editingMed ? 'Edit Medication' : 'Add Medication'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-plum-400 hover:text-plum-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMed} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                  Medication Name *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Iron Supplement, Metformin"
                  className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-sm text-plum-700 dark:text-night-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Dosage *
                  </label>
                  <input
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="e.g. 1 tablet, 500mg"
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-sm text-plum-700 dark:text-night-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Schedule Frequency
                  </label>
                  <select
                    value={scheduleType}
                    onChange={(e) => setScheduleType(e.target.value as Medication['scheduleType'])}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-sm text-plum-700 dark:text-night-text"
                  >
                    <option value="daily">Every Day</option>
                    <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                    <option value="specific_days">Specific Days</option>
                    <option value="as_needed">As Needed (PRN)</option>
                  </select>
                </div>
              </div>

              {scheduleType === 'specific_days' && (
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Select Days of Week
                  </label>
                  <div className="flex gap-1.5 flex-wrap">
                    {DAYS_OF_WEEK.map((day, idx) => {
                      const isSel = selectedDays.includes(idx);
                      return (
                        <button
                          type="button"
                          key={day}
                          onClick={() =>
                            setSelectedDays(
                              isSel ? selectedDays.filter((d) => d !== idx) : [...selectedDays, idx]
                            )
                          }
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                            isSel ? 'bg-blush-500 text-white' : 'bg-plum-100 dark:bg-night-600 text-plum-600'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Dynamic Reminder Times */}
              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                  Scheduled Daily Reminder Times
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {times.map((slot) => (
                    <span
                      key={slot}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blush-100 dark:bg-night-600 text-blush-600 dark:text-blush-300 font-semibold"
                    >
                      {slot}
                      <button type="button" onClick={() => removeTimeSlot(slot)}>
                        <X className="h-3.5 w-3.5 hover:text-red-500" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="time"
                    value={newTimeInput}
                    onChange={(e) => setNewTimeInput(e.target.value)}
                    className="rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                  <button type="button" onClick={addTimeSlot} className="btn-ghost text-xs py-1 px-3">
                    + Add Time
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                  Prescribed Directions / Instructions (Optional)
                </label>
                <input
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Take with food, drink full glass of water"
                  className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2.5 text-xs text-plum-700 dark:text-night-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Current Stock Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 30"
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    placeholder="e.g. 7"
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1">
                    Refill Reminder Date
                  </label>
                  <input
                    type="date"
                    value={refillOn}
                    onChange={(e) => setRefillOn(e.target.value)}
                    className="w-full rounded-xl border border-blush-200 dark:border-night-500 bg-cream-50 dark:bg-night-700 p-2 text-xs text-plum-700 dark:text-night-text"
                  />
                </div>
              </div>

              {/* Color Tag */}
              <div>
                <label className="block font-semibold text-plum-600 dark:text-night-muted mb-1.5">
                  Color Tag
                </label>
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full ${COLOR_CLASSES[c].bg} ${
                        color === c ? 'ring-2 ring-offset-2 ring-blush-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-blush-100 dark:border-night-600">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary text-xs py-2 px-5">
                  {editingMed ? 'Save Changes' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
