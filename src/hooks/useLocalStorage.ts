import { useState, useCallback, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initial: T): [T, (updater: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      /* ignore */
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  }, [key, value]);

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof updater === 'function' ? (updater as (p: T) => T)(prev) : updater
    );
  }, []);

  return [value, update];
}

export const todayStr = (d = new Date()) => {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const daysAgoStr = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return todayStr(d);
};

export const addDaysStr = (base: string, n: number) => {
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return todayStr(d);
};
