/**
 * HERCARE API Client Service
 * 
 * Provides HTTP client integration with the HERCARE Node/Express Backend.
 * Features automated error-handling and fallback capability.
 */

import type { Medication, PeriodEntry, WaterEntry, WorkoutSession, DoseStatus } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  // System Health
  async getHealth(): Promise<{ status: string; uptime: number; timestamp: string }> {
    return request('/health');
  },

  // User Profile
  async getProfile(): Promise<{ id: string; name: string }> {
    return request('/profile');
  },
  async updateProfile(name: string): Promise<{ success: boolean; profile: { id: string; name: string } }> {
    return request('/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
  },

  // Cycle & Periods
  async getCycle(): Promise<{ periods: PeriodEntry[] }> {
    return request('/cycle');
  },
  async addCycleEntry(entry: Omit<PeriodEntry, 'id'>): Promise<{ success: boolean; entry: PeriodEntry }> {
    return request('/cycle', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
  async deleteCycleEntry(id: string): Promise<{ success: boolean; id: string }> {
    return request(`/cycle/${id}`, {
      method: 'DELETE',
    });
  },

  // Medications & Dosages
  async getMedications(): Promise<{ medications: Medication[]; doseRecords: Record<string, unknown> }> {
    return request('/meds');
  },
  async addMedication(med: Omit<Medication, 'id'>): Promise<{ success: boolean; medication: Medication }> {
    return request('/meds', {
      method: 'POST',
      body: JSON.stringify(med),
    });
  },
  async updateMedication(med: Medication): Promise<{ success: boolean; medication: Medication }> {
    return request(`/meds/${med.id}`, {
      method: 'PUT',
      body: JSON.stringify(med),
    });
  },
  async deleteMedication(id: string): Promise<{ success: boolean; id: string }> {
    return request(`/meds/${id}`, {
      method: 'DELETE',
    });
  },
  async recordDose(dose: {
    medicationId: string;
    date: string;
    scheduledTime: string;
    status: DoseStatus;
    note?: string;
  }): Promise<{ success: boolean; remainingQuantity?: number }> {
    return request('/meds/dose', {
      method: 'POST',
      body: JSON.stringify(dose),
    });
  },

  // Hydration
  async getWater(): Promise<{ entries: WaterEntry[]; settings: unknown }> {
    return request('/water');
  },
  async addWaterEntry(entry: { amountMl: number; date?: string; time?: string; note?: string }): Promise<{ success: boolean; entry: WaterEntry }> {
    return request('/water', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  },
  async deleteWaterEntry(id: string): Promise<{ success: boolean; id: string }> {
    return request(`/water/${id}`, {
      method: 'DELETE',
    });
  },

  // Fitness Workouts
  async getWorkouts(): Promise<{ workouts: WorkoutSession[] }> {
    return request('/fitness');
  },
  async addWorkout(workout: Omit<WorkoutSession, 'id'>): Promise<{ success: boolean; workout: WorkoutSession }> {
    return request('/fitness', {
      method: 'POST',
      body: JSON.stringify(workout),
    });
  },
  async deleteWorkout(id: string): Promise<{ success: boolean; id: string }> {
    return request(`/fitness/${id}`, {
      method: 'DELETE',
    });
  },
};
