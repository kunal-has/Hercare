import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type {
  AppData,
  PeriodDay,
  PeriodEntry,
  MedLog,
  Meal,
  WaterLog,
  WaterEntry,
  HydrationSettings,
  SleepLog,
  Medication,
  DoseRecord,
  DoseStatus,
  MedicationSettings,
  WorkoutSession,
} from './types';
import { useLocalStorage, todayStr, uid } from './hooks/useLocalStorage';
import { buildSampleData } from './sampleData';
import { validatePeriodDates, getDatesRange, daysBetween } from './utils/cycleCalculations';

export interface PeriodModalConfig {
  initialDate?: string;
  entryToEdit?: PeriodEntry;
}

interface Store {
  data: AppData;
  setPeriodDay: (day: PeriodDay) => void;
  addPeriodEntry: (p: Omit<PeriodEntry, 'id'>) => { success: boolean; error?: string };
  updatePeriodEntry: (p: PeriodEntry) => { success: boolean; error?: string };
  deletePeriodEntry: (id: string) => void;
  isPeriodModalOpen: boolean;
  periodModalConfig: PeriodModalConfig | null;
  openPeriodModal: (initialDate?: string, entryToEdit?: PeriodEntry) => void;
  closePeriodModal: () => void;
  addMed: (m: Omit<Medication, 'id'>) => void;
  updateMed: (m: Medication) => void;
  removeMed: (id: string) => void;
  archiveMed: (id: string) => void;
  togglePauseMed: (id: string) => void;
  toggleMedTaken: (medId: string, date: string, time: string) => void;
  recordDoseStatus: (medId: string, date: string, scheduledTime: string, status: DoseStatus, note?: string) => void;
  updateMedSettings: (settings: Partial<MedicationSettings>) => void;
  addMeal: (m: Omit<Meal, 'id'>) => void;
  removeMeal: (id: string) => void;
  setWater: (date: string, glasses: number) => void;
  addWater: (date: string, n: number) => void;
  addWaterEntry: (amountMl: number, date?: string, time?: string, note?: string) => void;
  updateWaterEntry: (entry: WaterEntry) => void;
  deleteWaterEntry: (id: string) => void;
  updateHydrationSettings: (settings: Partial<HydrationSettings>) => void;
  snoozeHydration: (minutes: number) => void;
  toggleHydrationPause: () => void;
  addWorkout: (w: Omit<WorkoutSession, 'id'>) => void;
  updateWorkout: (w: WorkoutSession) => void;
  deleteWorkout: (id: string) => void;
  setSleep: (log: SleepLog) => void;
  updateProfileName: (name: string) => void;
}

const Ctx = createContext<Store | null>(null);

function ensurePeriods(appData: AppData): PeriodEntry[] {
  if (appData.periods && Array.isArray(appData.periods) && appData.periods.length > 0) {
    return appData.periods;
  }

  // Extract from existing period day records if flow days exist
  const flowDays = Object.values(appData.period || {})
    .filter((d) => d.flow && d.flow !== 'none')
    .sort((a, b) => a.date.localeCompare(b.date));

  if (flowDays.length === 0) {
    return [];
  }

  const extracted: PeriodEntry[] = [];
  let currentGroup: PeriodDay[] = [];

  for (let i = 0; i < flowDays.length; i++) {
    const cur = flowDays[i];
    if (currentGroup.length === 0) {
      currentGroup.push(cur);
    } else {
      const prev = currentGroup[currentGroup.length - 1];
      if (daysBetween(cur.date, prev.date) === 1) {
        currentGroup.push(cur);
      } else {
        extracted.push({
          id: uid(),
          startDate: currentGroup[0].date,
          endDate: currentGroup[currentGroup.length - 1].date,
          flow: currentGroup[0].flow !== 'none' ? currentGroup[0].flow : 'medium',
          symptoms: Array.from(new Set(currentGroup.flatMap((x) => x.symptoms))),
          note: currentGroup[0].note,
        });
        currentGroup = [cur];
      }
    }
  }

  if (currentGroup.length > 0) {
    extracted.push({
      id: uid(),
      startDate: currentGroup[0].date,
      endDate: currentGroup[currentGroup.length - 1].date,
      flow: currentGroup[0].flow !== 'none' ? currentGroup[0].flow : 'medium',
      symptoms: Array.from(new Set(currentGroup.flatMap((x) => x.symptoms))),
      note: currentGroup[0].note,
    });
  }

  return extracted;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useLocalStorage<AppData>('hercare_data_v1', buildSampleData());
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodModalConfig, setPeriodModalConfig] = useState<PeriodModalConfig | null>(null);

  // Guarantee periods array exists
  const activePeriods = useMemo(() => ensurePeriods(data), [data]);

  const openPeriodModal = (initialDate?: string, entryToEdit?: PeriodEntry) => {
    setPeriodModalConfig({ initialDate, entryToEdit });
    setIsPeriodModalOpen(true);
  };

  const closePeriodModal = () => {
    setIsPeriodModalOpen(false);
    setPeriodModalConfig(null);
  };

  const store = useMemo<Store>(() => {
    // Synchronize active periods and safe defaults in data object
    const normalizedData: AppData = {
      ...data,
      periods: activePeriods,
      doseRecords: data.doseRecords || {},
      medSettings: data.medSettings || {
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        privateLockScreen: true,
      },
      waterEntries: data.waterEntries || [],
      hydrationSettings: data.hydrationSettings || {
        dailyGoalMl: 2000,
        reminderIntervalMinutes: 90,
        wakingHoursStart: '08:00',
        wakingHoursEnd: '22:00',
        remindersEnabled: true,
        pausedForToday: false,
      },
      workouts: data.workouts || [],
    };

    return {
      data: normalizedData,
      isPeriodModalOpen,
      periodModalConfig,
      openPeriodModal,
      closePeriodModal,

      setPeriodDay: (day) =>
        setData((p) => ({ ...p, period: { ...p.period, [day.date]: day } })),

      addPeriodEntry: (newEntry) => {
        const validation = validatePeriodDates(newEntry.startDate, newEntry.endDate, activePeriods);
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        const entry: PeriodEntry = {
          ...newEntry,
          id: uid(),
        };

        const updatedPeriods = [...activePeriods, entry].sort((a, b) =>
          a.startDate.localeCompare(b.startDate)
        );

        // Sync days in data.period
        const dateRange = getDatesRange(entry.startDate, entry.endDate || entry.startDate);

        setData((p) => {
          const nextPeriod = { ...p.period };
          dateRange.forEach((d, idx) => {
            const existing = nextPeriod[d];
            nextPeriod[d] = {
              date: d,
              flow: entry.flow,
              symptoms: Array.from(new Set([...(existing?.symptoms || []), ...entry.symptoms])),
              note: idx === 0 ? entry.note || existing?.note : existing?.note,
            };
          });

          return {
            ...p,
            periods: updatedPeriods,
            period: nextPeriod,
          };
        });

        return { success: true };
      },

      updatePeriodEntry: (updatedEntry) => {
        const validation = validatePeriodDates(
          updatedEntry.startDate,
          updatedEntry.endDate,
          activePeriods,
          updatedEntry.id
        );
        if (!validation.valid) {
          return { success: false, error: validation.error };
        }

        const prev = activePeriods.find((p) => p.id === updatedEntry.id);
        const prevRange = prev ? getDatesRange(prev.startDate, prev.endDate || prev.startDate) : [];
        const nextRange = getDatesRange(updatedEntry.startDate, updatedEntry.endDate || updatedEntry.startDate);

        const updatedPeriods = activePeriods
          .map((p) => (p.id === updatedEntry.id ? updatedEntry : p))
          .sort((a, b) => a.startDate.localeCompare(b.startDate));

        setData((p) => {
          const nextPeriod = { ...p.period };

          // Reset previous days not in new range
          prevRange.forEach((d) => {
            if (!nextRange.includes(d) && nextPeriod[d]) {
              nextPeriod[d] = { ...nextPeriod[d], flow: 'none' };
            }
          });

          // Set updated range
          nextRange.forEach((d, idx) => {
            const existing = nextPeriod[d];
            nextPeriod[d] = {
              date: d,
              flow: updatedEntry.flow,
              symptoms: Array.from(new Set([...(existing?.symptoms || []), ...updatedEntry.symptoms])),
              note: idx === 0 ? updatedEntry.note || existing?.note : existing?.note,
            };
          });

          return {
            ...p,
            periods: updatedPeriods,
            period: nextPeriod,
          };
        });

        return { success: true };
      },

      deletePeriodEntry: (id) => {
        const toDelete = activePeriods.find((p) => p.id === id);
        const updatedPeriods = activePeriods.filter((p) => p.id !== id);

        setData((p) => {
          const nextPeriod = { ...p.period };
          if (toDelete) {
            const range = getDatesRange(toDelete.startDate, toDelete.endDate || toDelete.startDate);
            range.forEach((d) => {
              if (nextPeriod[d]) {
                nextPeriod[d] = { ...nextPeriod[d], flow: 'none' };
              }
            });
          }
          return {
            ...p,
            periods: updatedPeriods,
            period: nextPeriod,
          };
        });
      },

      addMed: (m) =>
        setData((p) => ({ ...p, meds: [...p.meds, { ...m, id: uid() }] })),
      updateMed: (updated) =>
        setData((p) => ({
          ...p,
          meds: p.meds.map((m) => (m.id === updated.id ? updated : m)),
        })),
      removeMed: (id) =>
        setData((p) => ({ ...p, meds: p.meds.filter((m) => m.id !== id) })),
      archiveMed: (id) =>
        setData((p) => ({
          ...p,
          meds: p.meds.map((m) => (m.id === id ? { ...m, isArchived: !m.isArchived } : m)),
        })),
      togglePauseMed: (id) =>
        setData((p) => ({
          ...p,
          meds: p.meds.map((m) => (m.id === id ? { ...m, isPaused: !m.isPaused } : m)),
        })),
      toggleMedTaken: (medId, date, time) =>
        setData((p) => {
          const key = `${medId}_${date}`;
          const cur = p.medLogs[key];
          const taken = cur?.taken ?? [];
          const next = taken.includes(time) ? taken.filter((t) => t !== time) : [...taken, time];
          const log: MedLog = { id: key, medId, date, taken: next };
          return { ...p, medLogs: { ...p.medLogs, [key]: log } };
        }),
      recordDoseStatus: (medId, date, scheduledTime, status, note) => {
        setData((p) => {
          const key = `${medId}_${date}_${scheduledTime}`;
          const prevRecord = p.doseRecords?.[key];
          const prevStatus = prevRecord?.status;

          const newRecord: DoseRecord = {
            id: key,
            medId,
            date,
            scheduledTime,
            status,
            timestamp: status === 'taken' ? new Date().toISOString() : undefined,
            note: note !== undefined ? note : prevRecord?.note,
          };

          const nextDoseRecords = {
            ...(p.doseRecords || {}),
            [key]: newRecord,
          };

          // Synchronize legacy medLogs
          const logKey = `${medId}_${date}`;
          const curLog = p.medLogs[logKey];
          const curTaken = curLog?.taken ?? [];
          let nextTaken = [...curTaken];
          if (status === 'taken') {
            if (!nextTaken.includes(scheduledTime)) nextTaken.push(scheduledTime);
          } else {
            nextTaken = nextTaken.filter((t) => t !== scheduledTime);
          }

          // Inventory stock calculation
          let updatedMeds = p.meds;
          if (prevStatus !== 'taken' && status === 'taken') {
            updatedMeds = p.meds.map((m) =>
              m.id === medId && typeof m.quantity === 'number'
                ? { ...m, quantity: Math.max(0, m.quantity - 1) }
                : m
            );
          } else if (prevStatus === 'taken' && status !== 'taken') {
            updatedMeds = p.meds.map((m) =>
              m.id === medId && typeof m.quantity === 'number'
                ? { ...m, quantity: m.quantity + 1 }
                : m
            );
          }

          return {
            ...p,
            meds: updatedMeds,
            doseRecords: nextDoseRecords,
            medLogs: {
              ...p.medLogs,
              [logKey]: { id: logKey, medId, date, taken: nextTaken },
            },
          };
        });
      },
      updateMedSettings: (settings) =>
        setData((p) => ({
          ...p,
          medSettings: {
            quietHoursEnabled: p.medSettings?.quietHoursEnabled ?? true,
            quietHoursStart: p.medSettings?.quietHoursStart ?? '22:00',
            quietHoursEnd: p.medSettings?.quietHoursEnd ?? '07:00',
            privateLockScreen: p.medSettings?.privateLockScreen ?? true,
            ...settings,
          },
        })),
      addMeal: (m) =>
        setData((p) => ({ ...p, meals: [...p.meals, { ...m, id: uid() }] })),
      removeMeal: (id) =>
        setData((p) => ({ ...p, meals: p.meals.filter((m) => m.id !== id) })),
      setWater: (date, glasses) =>
        setData((p) => {
          const goal = p.water[date]?.goal ?? p.goals.water;
          const log: WaterLog = { date, glasses: Math.max(0, glasses), goal };
          return { ...p, water: { ...p.water, [date]: log } };
        }),
      addWater: (date, n) =>
        setData((p) => {
          const cur = p.water[date];
          const goal = cur?.goal ?? p.goals.water;
          const glasses = Math.max(0, (cur?.glasses ?? 0) + n);
          return { ...p, water: { ...p.water, [date]: { date, glasses, goal } } };
        }),
      addWaterEntry: (amountMl, date = todayStr(), time = new Date().toTimeString().slice(0, 5), note) => {
        setData((p) => {
          const newEntry: WaterEntry = {
            id: uid(),
            date,
            time,
            amountMl,
            note,
          };
          const nextEntries = [newEntry, ...(p.waterEntries || [])];

          // Compute today's total ml and sync glasses
          const totalTodayMl = nextEntries
            .filter((e) => e.date === date)
            .reduce((s, e) => s + e.amountMl, 0);

          const goalMl = p.hydrationSettings?.dailyGoalMl || (p.goals.water * 250);
          const glasses = Math.round(totalTodayMl / 250);

          // Auto pause reminders when goal reached
          const goalReached = totalTodayMl >= goalMl;
          const nextSettings = p.hydrationSettings
            ? { ...p.hydrationSettings, pausedForToday: goalReached ? true : p.hydrationSettings.pausedForToday }
            : p.hydrationSettings;

          return {
            ...p,
            waterEntries: nextEntries,
            hydrationSettings: nextSettings,
            water: {
              ...p.water,
              [date]: {
                date,
                glasses,
                goal: Math.round(goalMl / 250),
              },
            },
          };
        });
      },
      updateWaterEntry: (updated) => {
        setData((p) => {
          const nextEntries = (p.waterEntries || []).map((e) => (e.id === updated.id ? updated : e));
          const totalTodayMl = nextEntries
            .filter((e) => e.date === updated.date)
            .reduce((s, e) => s + e.amountMl, 0);
          const goalMl = p.hydrationSettings?.dailyGoalMl || (p.goals.water * 250);

          return {
            ...p,
            waterEntries: nextEntries,
            water: {
              ...p.water,
              [updated.date]: {
                date: updated.date,
                glasses: Math.round(totalTodayMl / 250),
                goal: Math.round(goalMl / 250),
              },
            },
          };
        });
      },
      deleteWaterEntry: (id) => {
        setData((p) => {
          const toDelete = (p.waterEntries || []).find((e) => e.id === id);
          const nextEntries = (p.waterEntries || []).filter((e) => e.id !== id);
          if (!toDelete) return { ...p, waterEntries: nextEntries };

          const date = toDelete.date;
          const totalTodayMl = nextEntries
            .filter((e) => e.date === date)
            .reduce((s, e) => s + e.amountMl, 0);
          const goalMl = p.hydrationSettings?.dailyGoalMl || (p.goals.water * 250);

          return {
            ...p,
            waterEntries: nextEntries,
            water: {
              ...p.water,
              [date]: {
                date,
                glasses: Math.round(totalTodayMl / 250),
                goal: Math.round(goalMl / 250),
              },
            },
          };
        });
      },
      updateHydrationSettings: (settings) =>
        setData((p) => ({
          ...p,
          hydrationSettings: {
            dailyGoalMl: p.hydrationSettings?.dailyGoalMl ?? 2000,
            reminderIntervalMinutes: p.hydrationSettings?.reminderIntervalMinutes ?? 90,
            wakingHoursStart: p.hydrationSettings?.wakingHoursStart ?? '08:00',
            wakingHoursEnd: p.hydrationSettings?.wakingHoursEnd ?? '22:00',
            remindersEnabled: p.hydrationSettings?.remindersEnabled ?? true,
            pausedForToday: p.hydrationSettings?.pausedForToday ?? false,
            ...settings,
          },
        })),
      snoozeHydration: (minutes) =>
        setData((p) => {
          const until = new Date(Date.now() + minutes * 60000).toISOString();
          return {
            ...p,
            hydrationSettings: {
              ...(p.hydrationSettings || {
                dailyGoalMl: 2000,
                reminderIntervalMinutes: 90,
                wakingHoursStart: '08:00',
                wakingHoursEnd: '22:00',
                remindersEnabled: true,
                pausedForToday: false,
              }),
              snoozedUntil: until,
            },
          };
        }),
      toggleHydrationPause: () =>
        setData((p) => ({
          ...p,
          hydrationSettings: {
            ...(p.hydrationSettings || {
              dailyGoalMl: 2000,
              reminderIntervalMinutes: 90,
              wakingHoursStart: '08:00',
              wakingHoursEnd: '22:00',
              remindersEnabled: true,
              pausedForToday: false,
            }),
            pausedForToday: !p.hydrationSettings?.pausedForToday,
          },
        })),
      addWorkout: (w) =>
        setData((p) => ({
          ...p,
          workouts: [{ ...w, id: uid() }, ...(p.workouts || [])],
        })),
      updateWorkout: (w) =>
        setData((p) => ({
          ...p,
          workouts: (p.workouts || []).map((item) => (item.id === w.id ? w : item)),
        })),
      deleteWorkout: (id) =>
        setData((p) => ({
          ...p,
          workouts: (p.workouts || []).filter((item) => item.id !== id),
        })),
      setSleep: (log) =>
        setData((p) => ({ ...p, sleep: { ...p.sleep, [log.date]: log } })),
      updateProfileName: (name) =>
        setData((p) => {
          const trimmed = name.trim();
          return {
            ...p,
            profile: {
              id: p.profile?.id || 'hercare_user_default',
              name: trimmed.length > 0 ? trimmed : undefined,
            },
          };
        }),
    };
  }, [data, activePeriods, isPeriodModalOpen, periodModalConfig, setData]);

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
}

export const today = todayStr;
