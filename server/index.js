import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Persistent JSON Database Path
const DB_FILE = path.join(__dirname, 'database.json');

// Initialize database with default structure if not present
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading database file, resetting:', err);
  }

  // Default seed database
  const defaultData = {
    profile: {
      id: 'hercare_user_default',
      name: 'Elena',
    },
    periods: [
      {
        id: 'p-prev',
        startDate: '2026-09-18',
        endDate: '2026-09-22',
        flow: 'medium',
        symptoms: ['cramps'],
        note: 'Previous cycle',
      },
      {
        id: 'p-last',
        startDate: '2026-10-16',
        endDate: '2026-10-20',
        flow: 'heavy',
        symptoms: ['cramps', 'bloating', 'fatigue'],
        note: 'Last cycle started',
      },
    ],
    medications: [
      {
        id: 'm1',
        name: 'Iron Supplement',
        dosage: '1 tablet (65mg)',
        instructions: 'Take in the morning with citrus juice',
        times: ['08:00', '20:00'],
        color: 'blush',
        quantity: 14,
        initialQuantity: 60,
        lowStockThreshold: 10,
        refillOn: '2026-11-04',
        scheduleType: 'daily',
      },
      {
        id: 'm2',
        name: 'Vitamin D3 & K2',
        dosage: '2 drops (2000 IU)',
        instructions: 'Take with morning meal containing healthy fats',
        times: ['09:00'],
        color: 'gold',
        quantity: 45,
        initialQuantity: 90,
        lowStockThreshold: 15,
        scheduleType: 'daily',
      },
      {
        id: 'm3',
        name: 'Magnesium Glycinate',
        dosage: '1 capsule (200mg)',
        instructions: 'Take 30-45 minutes before sleep for relaxation',
        times: ['21:30'],
        color: 'plum',
        quantity: 8,
        initialQuantity: 60,
        lowStockThreshold: 10,
        refillOn: '2026-11-01',
        scheduleType: 'daily',
      },
    ],
    doseRecords: {},
    waterEntries: [
      { id: 'w1', date: '2026-10-28', time: '08:30', amountMl: 250, note: 'Morning glass' },
      { id: 'w2', date: '2026-10-28', time: '11:15', amountMl: 500, note: 'Desk refill' },
      { id: 'w3', date: '2026-10-28', time: '13:45', amountMl: 250, note: 'Post-lunch' },
    ],
    hydrationSettings: {
      dailyGoalMl: 2000,
      reminderIntervalMinutes: 90,
      wakingHoursStart: '08:00',
      wakingHoursEnd: '22:00',
      remindersEnabled: true,
      pausedForToday: false,
    },
    workouts: [
      {
        id: 'wo-1',
        activityType: 'yoga',
        date: '2026-10-28',
        startTime: '07:15',
        endTime: '07:50',
        durationMinutes: 35,
        caloriesBurned: 140,
        intensity: 'light',
        notes: 'Morning gentle mobility flow',
      },
      {
        id: 'wo-2',
        activityType: 'running',
        date: '2026-10-27',
        startTime: '18:00',
        endTime: '18:32',
        durationMinutes: 32,
        distanceKm: 5.2,
        caloriesBurned: 310,
        intensity: 'vigorous',
        isPersonalRecord: true,
        notes: 'Sunset park run. Great pace!',
      },
    ],
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
  return defaultData;
}

let db = loadDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save database file:', err);
  }
}

// ==========================================
// 1. HEALTH CHECK & SYSTEM STATUS
// ==========================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'HERCARE Women Wellness API Server',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 2. USER PROFILE ENDPOINTS
// ==========================================
app.get('/api/profile', (req, res) => {
  res.json(db.profile || { id: 'hercare_user_default', name: 'Elena' });
});

app.put('/api/profile', (req, res) => {
  const { name } = req.body;
  db.profile = {
    id: db.profile?.id || 'hercare_user_default',
    name: name?.trim() || undefined,
  };
  saveDatabase();
  res.json({ success: true, profile: db.profile });
});

// ==========================================
// 3. SMART CYCLE TRACKER ENDPOINTS
// ==========================================
app.get('/api/cycle', (req, res) => {
  res.json({
    periods: db.periods || [],
    totalCycles: (db.periods || []).length,
  });
});

app.post('/api/cycle', (req, res) => {
  const { startDate, endDate, flow, symptoms, note } = req.body;
  if (!startDate) {
    return res.status(400).json({ error: 'Start date is required' });
  }

  const newEntry = {
    id: 'p-' + Math.random().toString(36).slice(2, 9),
    startDate,
    endDate: endDate || undefined,
    flow: flow || 'medium',
    symptoms: Array.isArray(symptoms) ? symptoms : [],
    note: note || undefined,
  };

  db.periods = [...(db.periods || []), newEntry].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );
  saveDatabase();

  res.status(201).json({ success: true, entry: newEntry });
});

app.delete('/api/cycle/:id', (req, res) => {
  const { id } = req.params;
  db.periods = (db.periods || []).filter((p) => p.id !== id);
  saveDatabase();
  res.json({ success: true });
});

// ==========================================
// 4. MEDICATION & INVENTORY ENDPOINTS
// ==========================================
app.get('/api/meds', (req, res) => {
  res.json({
    medications: db.medications || [],
    doseRecords: db.doseRecords || {},
  });
});

app.post('/api/meds', (req, res) => {
  const newMed = {
    id: 'm-' + Math.random().toString(36).slice(2, 9),
    ...req.body,
  };
  db.medications = [...(db.medications || []), newMed];
  saveDatabase();
  res.status(201).json({ success: true, medication: newMed });
});

app.put('/api/meds/:id', (req, res) => {
  const { id } = req.params;
  db.medications = (db.medications || []).map((m) =>
    m.id === id ? { ...m, ...req.body } : m
  );
  saveDatabase();
  res.json({ success: true });
});

app.delete('/api/meds/:id', (req, res) => {
  const { id } = req.params;
  db.medications = (db.medications || []).filter((m) => m.id !== id);
  saveDatabase();
  res.json({ success: true });
});

app.post('/api/meds/dose', (req, res) => {
  const { medId, date, scheduledTime, status, note } = req.body;
  if (!medId || !date || !scheduledTime || !status) {
    return res.status(400).json({ error: 'Missing required dose parameters' });
  }

  const doseKey = `${medId}_${date}_${scheduledTime}`;
  const prevRecord = db.doseRecords?.[doseKey];
  const prevStatus = prevRecord?.status;

  db.doseRecords = db.doseRecords || {};
  db.doseRecords[doseKey] = {
    id: doseKey,
    medId,
    date,
    scheduledTime,
    status,
    timestamp: status === 'taken' ? new Date().toISOString() : undefined,
    note: note || prevRecord?.note,
  };

  // Stock tracking
  if (prevStatus !== 'taken' && status === 'taken') {
    db.medications = (db.medications || []).map((m) =>
      m.id === medId && typeof m.quantity === 'number'
        ? { ...m, quantity: Math.max(0, m.quantity - 1) }
        : m
    );
  } else if (prevStatus === 'taken' && status !== 'taken') {
    db.medications = (db.medications || []).map((m) =>
      m.id === medId && typeof m.quantity === 'number'
        ? { ...m, quantity: m.quantity + 1 }
        : m
    );
  }

  saveDatabase();
  res.json({ success: true, doseRecord: db.doseRecords[doseKey] });
});

// ==========================================
// 5. HYDRATION ENDPOINTS
// ==========================================
app.get('/api/water', (req, res) => {
  res.json({
    entries: db.waterEntries || [],
    settings: db.hydrationSettings || {},
  });
});

app.post('/api/water', (req, res) => {
  const { amountMl, date, time, note } = req.body;
  if (!amountMl) {
    return res.status(400).json({ error: 'Amount in ml is required' });
  }

  const now = new Date();
  const newEntry = {
    id: 'w-' + Math.random().toString(36).slice(2, 9),
    amountMl: parseInt(amountMl, 10),
    date: date || now.toISOString().slice(0, 10),
    time: time || now.toTimeString().slice(0, 5),
    note: note || undefined,
  };

  db.waterEntries = [newEntry, ...(db.waterEntries || [])];
  saveDatabase();

  res.status(201).json({ success: true, entry: newEntry });
});

app.delete('/api/water/:id', (req, res) => {
  const { id } = req.params;
  db.waterEntries = (db.waterEntries || []).filter((w) => w.id !== id);
  saveDatabase();
  res.json({ success: true });
});

app.put('/api/water/settings', (req, res) => {
  db.hydrationSettings = {
    ...(db.hydrationSettings || {}),
    ...req.body,
  };
  saveDatabase();
  res.json({ success: true, settings: db.hydrationSettings });
});

// ==========================================
// 6. FITNESS & SPORTS WORKOUT ENDPOINTS
// ==========================================
app.get('/api/fitness', (req, res) => {
  res.json({
    workouts: db.workouts || [],
    totalWorkouts: (db.workouts || []).length,
  });
});

app.post('/api/fitness', (req, res) => {
  const newWorkout = {
    id: 'wo-' + Math.random().toString(36).slice(2, 9),
    ...req.body,
  };
  db.workouts = [newWorkout, ...(db.workouts || [])];
  saveDatabase();
  res.status(201).json({ success: true, workout: newWorkout });
});

app.delete('/api/fitness/:id', (req, res) => {
  const { id } = req.params;
  db.workouts = (db.workouts || []).filter((w) => w.id !== id);
  saveDatabase();
  res.json({ success: true });
});

// Start Express Backend Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 HERCARE REST API Backend Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`📂 Database: ${DB_FILE}`);
  console.log(`===============================================`);
});
