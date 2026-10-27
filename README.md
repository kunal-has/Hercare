# HERCARE — Women's Wellness & Health Tracking Platform

A modern, responsive, privacy-first women's wellness, health reminders, and fitness platform built with a decoupled **3-Tier Architecture**: **Frontend Client (React 18 + TypeScript + Tailwind CSS)**, **Backend REST API (Node.js + Express + JSON Database)**, and **Core Health Intelligence Engines**. Designed with an elegant blush-pink and velvet-plum aesthetic, iOS-style fluid motion physics, and zero-friction data persistence.

---

## 🏛️ System Architecture: 3-Tier Decoupled Design

```
                     HERCARE SYSTEM ARCHITECTURE
                     
  +-------------------------------------------------------------+
  |              TIER 1: FRONTEND PRESENTATION LAYER            |
  |  (React 18, TypeScript, Tailwind CSS, Lucide, CSS Keyframes)|
  |                                                             |
  |  [Dashboard] [MedsScreen] [WaterScreen] [FitnessScreen]     |
  |  [Calendar]  [Navigation] [ThemeToggle] [Modals & Sheets]   |
  +------------------------------+------------------------------+
                                 |
                                 | HTTP / REST (Fetch API)
                                 v
  +-------------------------------------------------------------+
  |                TIER 2: BACKEND REST API SERVER              |
  |            (Node.js, Express 5, CORS, File Persistence)     |
  |                                                             |
  |  Endpoints:                                                 |
  |  • /api/health        • /api/profile    • /api/cycle        |
  |  • /api/meds          • /api/meds/dose  • /api/water        |
  |  • /api/fitness       • /api/water/settings                 |
  |                                                             |
  |  Database: `server/database.json` (Structured JSON Datastore)|
  +------------------------------+------------------------------+
                                 |
                                 v
  +-------------------------------------------------------------+
  |             TIER 3: CORE ALGORITHMIC INTELLIGENCE           |
  |  (Domain Engines, Medical Logic, Formulas & Safety Rules)   |
  |                                                             |
  |  • Cycle & Phase Prediction Engine (`cycleCalculations.ts`)  |
  |  • Multi-Domain Rules Insights Engine (`insightsEngine.ts`)  |
  |  • Medication Scheduler & Adherence (`medicationScheduler`) |
  |  • MET-Based Fitness & Calorie Engine (`fitnessStats.ts`)   |
  |  • Deterministic Daily Greeting System (`greetingService.ts`)|
  +-------------------------------------------------------------+
```

---

## 👥 3-Person Team Workload & Contribution Breakdown

| Team Member | Domain / Role | Core Modules & Responsibilities | Key Files / Utilities |
| :--- | :--- | :--- | :--- |
| **Member 1 (Person 1)** | **Backend & Database Architect** | • Node.js / Express REST API Server (`server/index.js`)<br>• Persistent JSON Database schema & file read/write<br>• 15+ REST Endpoints for Meds, Hydration, Cycle, Fitness<br>• Dose decrement/restock logic & stock audit logs<br>• API client service layer (`src/services/api.ts`) | `server/index.js`<br>`server/database.json`<br>`src/services/api.ts`<br>`package.json` |
| **Member 2 (Person 2)** | **Frontend & UI/UX Motion Engineer** | • Responsive App Screens: Today, Fitness, Meds, Water<br>• iOS-style top-to-bottom slide transitions & micro-staggers<br>• Dual Theme Architecture (Velvet Plum Dark / Blush Light)<br>• Header & Navigation relocation and mobile bottom tabs<br>• Modals, slide sheets, active workout stopwatch timer | `src/screens/*`<br>`src/components/*`<br>`src/context/ThemeContext.tsx`<br>`src/index.css`<br>`src/App.tsx` |
| **Member 3 (Person 3)** | **Health Intelligence & Core Algorithms** | • Smart Cycle phase estimation & confidence intervals<br>• Explainable Rules-Based Wellness Insights Engine<br>• Medication adherence & overnight quiet hours logic<br>• MET-based calorie burn and fitness PR calculations<br>• 29 automated test cases ensuring algorithmic precision | `src/utils/cycleCalculations.ts`<br>`src/utils/insightsEngine.ts`<br>`src/utils/medicationScheduler.ts`<br>`src/utils/fitnessStats.ts`<br>`src/utils/*.test.ts` |

---

## 🌟 Key Application Modules

### 1. 🌸 Smart Cycle Tracker
- Menstrual, follicular, ovulatory, and luteal cycle phase estimation with documented confidence intervals.
- Next-period prediction calculated from prior cycle history with variance ranges.
- Interactive monthly calendar with flow colors, symptom tagging, and period logging modal.

### 2. 💡 Explainable Wellness Insights Engine
- Multi-domain observational rules engine evaluating hydration streaks, sleep quality, recurring symptoms, and medication refill alerts.
- Every insight provides title, observation, supporting data points, date range, actionable tip, and medical uncertainty disclaimer.

### 3. 💊 Medication Scheduling & Inventory Tracking
- Configurable schedules: Daily, Weekdays, Specific Days of Week, and As Needed (PRN).
- Independent dose tracking with Taken, Snooze (15m), and Skip options.
- Dynamic pill inventory that decrements on dose taken and automatically restocks on accidental status correction.
- Low-stock warnings, refill countdowns, and overnight quiet hours (`22:00` to `07:00`).

### 4. 💧 Smart Hydration Engine
- Configurable daily water target in millilitres with quick-add presets (150 ml, 250 ml, 500 ml, Custom).
- Automated recurring reminders respecting waking hours that automatically pause when the daily goal is reached.
- 7-day volume bar chart and 30-day consistency heatmap.

### 5. 🏃‍♀️ Fitness, Sports & Movement
- Built-in live workout timer with Start, Pause, Resume, and Finish & Log.
- Support for 10 activity categories (Walking, Running, Strength, Yoga, Cycling, Swimming, Dance, Sports, Custom).
- Multi-set strength logger tracking exercises, reps, weight in kg, and rest intervals.
- MET-based calorie burn estimation and personal record (PR 🏆) tracking.

### 6. 🌙 Dual Theme & iOS Motion Physics
- Velvet Plum Dark Mode (`#19151F`) and Blush Pink Light Mode (`#FFFBF7`).
- Relocated sticky top-right header and sidebar toggle switchers.
- Hardware-accelerated `translate3d(0, -26px, 0)` downward opening transitions with cascading 35ms micro-staggers.
- Full `@media (prefers-reduced-motion: reduce)` accessibility compliance.

---

## 🛠️ Tech Stack & Engineering Standards

- **Frontend Client**: React 18, TypeScript, Tailwind CSS 3, Lucide Icons, Vite 7
- **Backend Server**: Node.js, Express 5, CORS middleware
- **Data Persistence**: Dedicated JSON Database (`server/database.json`) + Client LocalStorage fallback
- **Test Runner**: Node Test Runner (`--experimental-strip-types`) with 29 automated unit tests
- **Styling Architecture**: Custom CSS variables, dark-mode class strategy, iOS spring keyframes

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested on Node v24)
- npm (bundled with Node.js)

### 1. Installation
```bash
npm install
```

### 2. Run the Full Stack Architecture

**Terminal 1 — Backend REST API Server (Port 5000):**
```bash
npm run server
# Starts Express REST API at http://localhost:5000
# Verifiable at: http://localhost:5000/api/health
```

**Terminal 2 — Frontend Application (Port 5173):**
```bash
npm run dev
# Starts Vite React client at http://localhost:5173
```

### 3. Automated Testing & Quality Checks
```bash
# Run all 29 automated unit tests across health engines
npm test

# Type-check TypeScript codebase
npm run typecheck

# Code quality & ESLint check
npm run lint

# Production build test
npm run build
```

---

## ⚖️ Health & Safety Disclaimer
HERCARE is an educational wellness companion designed for lifestyle awareness. It is not a certified medical device and does not diagnose medical conditions, prescribe medication, or predict fertility with clinical certainty. Always consult a licensed healthcare professional for medical concerns.
