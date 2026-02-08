/**
 * GatiRehab Decision Engine
 * Personalizes, monitors, and adjusts physiotherapy programs in real time.
 */

import { AVAILABLE_EXERCISES } from '../../ai/utils/secondaryExercises';

/**
 * Calculates the daily rehab plan based on patient data
 * @param {Object} profile - Patient profile (injuryType, rehabPhase)
 * @param {Array} painLogs - Recent pain logs
 * @param {Array} sessionHistory - Recent session results
 * @returns {Object} - Daily plan with exercises and reasoning
 */
export const calculateDailyPlan = (profile, painLogs = [], sessionHistory = []) => {
  const { injuryType = 'General Recovery', rehabPhase = 'Mid' } = profile;

  // 1. Analyze Pain Trends
  const recentPain = painLogs.length > 0 ? painLogs[0].level : 5;
  const previousPain = painLogs.length > 1 ? painLogs[1].level : recentPain;
  const painIncreasing = recentPain > previousPain;

  // 2. Analyze Movement Quality Trends
  const recentSession = sessionHistory.length > 0 ? sessionHistory[0] : null;
  const previousSession = sessionHistory.length > 1 ? sessionHistory[1] : null;
  const qualityDecreasing = recentSession && previousSession && recentSession.quality < previousSession.quality;
  const highQuality = recentSession && recentSession.quality > 85;

  let intensityAdjustment = 1.0;
  let reasoning = "Maintaining current protocol based on stable progress.";
  let status = "Stable";

  // Decision Logic
  if (painIncreasing && qualityDecreasing) {
    intensityAdjustment = 0.7;
    status = "Regressing";
    reasoning = "Pain spike and quality decline detected. Reducing intensity to prevent re-injury and prioritize tissue healing.";
  } else if (recentPain > 7) {
    intensityAdjustment = 0.5;
    status = "Acute Caution";
    reasoning = "High pain levels reported. Recommending low-impact mobility only. Focus on breathing and gentle range of motion.";
  } else if (!painIncreasing && highQuality) {
    intensityAdjustment = 1.2;
    status = "Progressing";
    reasoning = "Excellent form and stable pain levels. Increasing challenge to drive neural adaptation and strength gains.";
  } else if (painLogs.length === 0) {
    reasoning = "Initial protocol generated. Please provide daily feedback for calibration.";
  }

  // Filter exercises based on injury type and phase
  const allExercises = Object.entries(AVAILABLE_EXERCISES).map(([id, data]) => ({ id, ...data }));

  let recommendedExercises = allExercises.filter(ex => {
    // Basic filtering: match phase or if phase not specified
    if (ex.phase && ex.phase !== rehabPhase) return false;
    // Filter by injury type if specified
    if (ex.suitableFor && !ex.suitableFor.includes(injuryType)) return false;
    return true;
  });

  // If no matches, fall back to easy exercises
  if (recommendedExercises.length === 0) {
    recommendedExercises = allExercises.filter(ex => ex.difficulty === 'Easy').slice(0, 3);
  }

  // Adjust reps/sets based on intensityAdjustment
  const finalPlan = recommendedExercises.map(ex => {
    const baseSets = ex.sets || 3;
    const baseReps = ex.repsPerSet || 10;

    return {
      ...ex,
      sets: Math.max(1, Math.round(baseSets * intensityAdjustment)),
      reps: Math.max(5, Math.round(baseReps * (intensityAdjustment > 1 ? intensityAdjustment : 1))), // Don't reduce reps too much, reduce sets instead
      completed: false
    };
  });

  return {
    date: new Date().toISOString(),
    status,
    reasoning,
    exercises: finalPlan,
    intensityAdjustment
  };
};
