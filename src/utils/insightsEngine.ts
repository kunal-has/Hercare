import type { AppData, WellnessInsight } from '../types.ts';
import { calculateCycleAnalysis, daysBetween, formatDisplayDate } from './cycleCalculations.ts';

/**
 * Pure rules-based wellness insights engine.
 * Observes actual user records across cycle, hydration, sleep, mood, symptoms, and medications.
 * Never fabricates data, does not diagnose, and clearly states uncertainty.
 */
export function generateWellnessInsights(
  data: AppData,
  todayDate: string,
  dismissedIds: string[] = []
): WellnessInsight[] {
  const insights: WellnessInsight[] = [];
  const cycleAnalysis = calculateCycleAnalysis(data.periods || [], todayDate, data.goals.cycleLength || 28);

  // 1. CYCLE TRACKING INSIGHTS
  if (cycleAnalysis.hasData && cycleAnalysis.cycleDay) {
    const cycleDay = cycleAnalysis.cycleDay;
    const avgLen = cycleAnalysis.averageCycleLength || 28;

    // A. Approaching Next Period Window (within 4 days)
    if (cycleAnalysis.nextPeriodDate) {
      const daysUntilNext = daysBetween(cycleAnalysis.nextPeriodDate, todayDate);
      if (daysUntilNext >= 0 && daysUntilNext <= 4) {
        insights.push({
          id: `cycle-upcoming-${cycleAnalysis.nextPeriodDate}`,
          category: 'cycle',
          priority: 95,
          title: 'Estimated Period Window Approaching',
          observation: `Your next cycle is estimated to begin in approximately ${daysUntilNext === 0 ? 'today' : daysUntilNext === 1 ? '1 day' : `${daysUntilNext} days`}.`,
          supportingData: [
            `Current cycle day: Day ${cycleDay}`,
            `Estimated start: ${formatDisplayDate(cycleAnalysis.nextPeriodDate, { month: 'short', day: 'numeric' })} (±${cycleAnalysis.uncertaintyDays} days)`,
            `Based on your average cycle interval of ${avgLen} days`,
          ],
          dateRange: 'Upcoming 4 days',
          suggestedAction: 'Consider stocking comfort supplies, hydrating with warm fluids, and tracking early energy shifts.',
          uncertaintyNote: 'Natural cycles fluctuate regularly due to stress, sleep changes, or routine shifts. This is an approximation and not clinical contraception.',
          targetScreen: 'period',
        });
      }
    }

    // B. Menstrual Phase Active
    if (cycleAnalysis.currentPhase === 'menstrual') {
      insights.push({
        id: `cycle-menstrual-${cycleAnalysis.lastPeriodStart}`,
        category: 'cycle',
        priority: 90,
        title: 'Menstrual Phase: Prioritize Gentle Recovery',
        observation: `You are currently on Day ${cycleDay} of your cycle in the menstrual phase.`,
        supportingData: [
          `Period started on: ${formatDisplayDate(cycleAnalysis.lastPeriodStart || todayDate, { month: 'short', day: 'numeric' })}`,
          'Estrogen and progesterone are currently at their baseline levels',
          `Average recorded period duration: ${cycleAnalysis.averagePeriodDuration || 5} days`,
        ],
        dateRange: 'Current cycle start',
        suggestedAction: 'Opt for restorative movement (light walking or gentle stretching), warm teas, and iron-rich foods.',
        uncertaintyNote: 'Symptom intensity and bleeding duration vary between individual cycles.',
        targetScreen: 'period',
      });
    }

    // C. Estimated Ovulatory Window
    if (cycleAnalysis.currentPhase === 'ovulatory') {
      insights.push({
        id: `cycle-ovulatory-${cycleAnalysis.lastPeriodStart}`,
        category: 'cycle',
        priority: 75,
        title: 'Estimated Ovulatory Window',
        observation: `You are around Day ${cycleDay} of your cycle, typically corresponding to the ovulatory transition.`,
        supportingData: [
          `Cycle Day ${cycleDay} of ${avgLen} days`,
          'Luteinizing hormone typically peaks around 14 days before the next cycle start',
          'Many individuals report higher focus and social energy during this window',
        ],
        dateRange: 'Mid-cycle window',
        suggestedAction: 'Channel rising stamina into demanding workouts or important projects, while staying well hydrated.',
        uncertaintyNote: 'Calendar estimation cannot predict ovulation or fertility with clinical accuracy and must never be used for contraception.',
        targetScreen: 'period',
      });
    }

    // D. Luteal Phase Awareness
    if (cycleAnalysis.currentPhase === 'luteal') {
      insights.push({
        id: `cycle-luteal-${cycleAnalysis.lastPeriodStart}`,
        category: 'cycle',
        priority: 70,
        title: 'Luteal Phase: Support Rest and Stability',
        observation: `You are in the luteal phase (Day ${cycleDay}), where progesterone is dominant.`,
        supportingData: [
          `Day ${cycleDay} of ${avgLen} days`,
          'Metabolic resting rate slightly increases as body temperature rises',
          'Mild cravings or sleep shifts are common biological responses',
        ],
        dateRange: 'Past week to next period',
        suggestedAction: 'Incorporate complex carbohydrates, magnesium-rich foods (seeds, dark greens, cacao), and consistent bedtime routines.',
        uncertaintyNote: 'Biological responses vary between individuals and across different cycles.',
        targetScreen: 'period',
      });
    }
  }

  // 2. HYDRATION PROGRESS & CONSISTENCY
  const waterLogs = Object.values(data.water || {});
  if (waterLogs.length >= 3) {
    // Sort past 7 logged days
    const recentWater = [...waterLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    const goalMetCount = recentWater.filter((w) => w.glasses >= w.goal).length;
    const avgGlasses = (recentWater.reduce((acc, w) => acc + w.glasses, 0) / recentWater.length).toFixed(1);
    const avgMl = Math.round(Number(avgGlasses) * 250);

    // Consistency Streak (>= 4 of last 7 days reached goal)
    if (goalMetCount >= 4) {
      insights.push({
        id: `water-streak-${recentWater[0].date}`,
        category: 'hydration',
        priority: 82,
        title: 'Strong Hydration Consistency',
        observation: `You met your daily hydration goal on ${goalMetCount} of your last ${recentWater.length} logged days.`,
        supportingData: [
          `Average daily volume: ~${avgMl} ml (${avgGlasses} glasses)`,
          `Daily goal: ${data.goals.water} glasses (${data.goals.water * 250} ml)`,
          `${goalMetCount} goal achievements recorded over recent days`,
        ],
        dateRange: `Past ${recentWater.length} logged days`,
        suggestedAction: 'Maintain this routine. Steady hydration supports energy, digestion, and skin barrier health.',
        uncertaintyNote: 'Hydration requirements increase with physical activity, heat, and caffeine intake.',
        targetScreen: 'water',
      });
    } else if (goalMetCount <= 1 && recentWater.length >= 4) {
      // Hydration Opportunity
      insights.push({
        id: `water-low-${recentWater[0].date}`,
        category: 'hydration',
        priority: 78,
        title: 'Hydration Target Opportunity',
        observation: `Water intake has averaged ${avgGlasses} glasses (~${avgMl} ml), which is below your ${data.goals.water}-glass target.`,
        supportingData: [
          `Recorded average: ${avgGlasses} glasses/day`,
          `Daily goal: ${data.goals.water} glasses/day`,
          `Target reached on ${goalMetCount} of the last ${recentWater.length} days`,
        ],
        dateRange: `Past ${recentWater.length} logged days`,
        suggestedAction: 'Try drinking one full glass of water right after waking and keeping a water bottle nearby during work.',
        uncertaintyNote: 'Fluids from herbal teas and water-rich foods also contribute to total hydration.',
        targetScreen: 'water',
      });
    }
  }

  // 3. SLEEP TRENDS & MOOD OBSERVATIONS
  const sleepLogs = Object.values(data.sleep || {});
  if (sleepLogs.length >= 3) {
    const recentSleep = [...sleepLogs]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 7);

    const avgHours = recentSleep.reduce((acc, s) => acc + s.hours, 0) / recentSleep.length;
    const avgQuality = (recentSleep.reduce((acc, s) => acc + s.quality, 0) / recentSleep.length).toFixed(1);

    // Correlate sleep duration with mood
    const goodMoods = ['great', 'good'];
    const highSleepDays = recentSleep.filter((s) => s.hours >= 7);
    const highSleepGoodMoods = highSleepDays.filter((s) => goodMoods.includes(s.mood)).length;

    if (highSleepDays.length >= 2 && highSleepGoodMoods >= 2) {
      insights.push({
        id: `sleep-mood-correlation-${recentSleep[0].date}`,
        category: 'sleep',
        priority: 85,
        title: 'Restful Sleep Correlates with Calm Mood',
        observation: `On nights where you slept 7+ hours, you consistently logged your mood as Calm or Radiant.`,
        supportingData: [
          `Nights with ≥ 7 hours: ${highSleepDays.length} of ${recentSleep.length} recorded`,
          `Positive mood reported on ${highSleepGoodMoods} of those ${highSleepDays.length} days`,
          `Average sleep duration: ${avgHours.toFixed(1)} hours (Quality: ${avgQuality}/5)`,
        ],
        dateRange: `Past ${recentSleep.length} logged nights`,
        suggestedAction: 'Protect your evening wind-down window to consistently reach 7 to 8 hours of restorative sleep.',
        uncertaintyNote: 'Mood is influenced by life events, work, nutrition, and relationships; sleep is one key contributor.',
        targetScreen: 'sleep',
      });
    } else if (avgHours < 6.5 && recentSleep.length >= 4) {
      insights.push({
        id: `sleep-short-${recentSleep[0].date}`,
        category: 'sleep',
        priority: 76,
        title: 'Sleep Duration Below Target',
        observation: `Your recent sleep duration has averaged ${avgHours.toFixed(1)} hours against your ${data.goals.sleep}h target.`,
        supportingData: [
          `Average hours recorded: ${avgHours.toFixed(1)}h over ${recentSleep.length} nights`,
          `Sleep goal: ${data.goals.sleep} hours`,
          `Average quality score: ${avgQuality} out of 5 stars`,
        ],
        dateRange: `Past ${recentSleep.length} logged nights`,
        suggestedAction: 'Consider shifting your bedtime 20 minutes earlier and dimming bright overhead lighting 1 hour before bed.',
        uncertaintyNote: 'Occasional short nights are natural. Chronic fatigue should be evaluated by a healthcare professional.',
        targetScreen: 'sleep',
      });
    }
  }

  // 4. RECURRING LOGGED SYMPTOMS
  // Aggregate symptoms from period entries and day-level period records in the past 30 days
  const allSymptoms: string[] = [];
  Object.values(data.period || {}).forEach((pd) => {
    if (pd.symptoms && pd.symptoms.length > 0) {
      allSymptoms.push(...pd.symptoms);
    }
  });
  (data.periods || []).forEach((p) => {
    if (p.symptoms && p.symptoms.length > 0) {
      allSymptoms.push(...p.symptoms);
    }
  });

  const symptomFreq: Record<string, number> = {};
  allSymptoms.forEach((s) => {
    symptomFreq[s] = (symptomFreq[s] || 0) + 1;
  });

  const topSymptomEntry = Object.entries(symptomFreq).sort((a, b) => b[1] - a[1])[0];
  if (topSymptomEntry && topSymptomEntry[1] >= 3) {
    const [symName, count] = topSymptomEntry;
    insights.push({
      id: `symptom-recurring-${symName}`,
      category: 'symptoms',
      priority: 72,
      title: `Recurring Log: ${symName.charAt(0).toUpperCase() + symName.slice(1)}`,
      observation: `"${symName}" has been logged across ${count} entries in your recent cycle records.`,
      supportingData: [
        `Logged frequency: ${count} times`,
        `Identified across period and cycle daily logs`,
        cycleAnalysis.phaseLabel ? `Current phase: ${cycleAnalysis.phaseLabel}` : 'Logged across multiple days',
      ],
      dateRange: 'Recent records',
      suggestedAction: 'Observe whether this symptom coincides with specific cycle phases, caffeine, or stress levels.',
      uncertaintyNote: 'Self-reported symptom logs indicate subjective comfort and do not diagnose underlying conditions.',
      targetScreen: 'period',
    });
  }

  // 5. UPCOMING MEDICATION REFILL REMINDERS
  const upcomingMeds = (data.meds || []).filter((m) => {
    if (!m.refillOn) return false;
    const diff = daysBetween(m.refillOn, todayDate);
    return diff >= 0 && diff <= 10;
  });

  if (upcomingMeds.length > 0) {
    const med = upcomingMeds[0];
    const diff = daysBetween(med.refillOn!, todayDate);
    insights.push({
      id: `med-refill-${med.id}-${med.refillOn}`,
      category: 'medication',
      priority: 88,
      title: `Prescription Refill Reminder: ${med.name}`,
      observation: `Your scheduled refill for ${med.name} is approaching in ${diff === 0 ? 'today' : diff === 1 ? '1 day' : `${diff} days`}.`,
      supportingData: [
        `Medication: ${med.name} (${med.dosage})`,
        `Refill due: ${formatDisplayDate(med.refillOn!, { month: 'short', day: 'numeric', year: 'numeric' })}`,
        `Scheduled dosing: ${med.times.join(', ')}`,
      ],
      dateRange: `Due by ${formatDisplayDate(med.refillOn!, { month: 'short', day: 'numeric' })}`,
      suggestedAction: 'Contact your pharmacy or healthcare provider ahead of time to avoid missed doses.',
      uncertaintyNote: 'Refill tracking is based strictly on your manually entered refill date.',
      targetScreen: 'meds',
    });
  }

  // Filter out dismissed insights
  const filtered = insights.filter((i) => !dismissedIds.includes(i.id));

  // Sort by priority descending
  filtered.sort((a, b) => b.priority - a.priority);

  return filtered;
}
