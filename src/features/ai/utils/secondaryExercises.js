// Secondary Exercise Module - Standing March
// Demonstrates exercise expansion capability
// Owner: Member 2

import { IDEAL_ANGLES } from './realTimeFeedback';

/**
 * Standing March Exercise Configuration
 * Targets: Hip flexors, core stability
 */
export const STANDING_MARCH_CONFIG = {
  name: 'Standing March',
  description: 'Lift knees alternately while standing',
  targetMuscles: ['Hip Flexors', 'Core', 'Quadriceps'],
  difficulty: 'Easy',
  duration: '2-3 minutes',
  repsPerSet: 20,
  sets: 3,
  restBetweenSets: 60, // seconds
  keyPoints: [
    'Keep your back straight',
    'Lift knees to hip height',
    'Maintain steady rhythm',
    'Engage your core',
  ],
};

/**
 * Assess Standing March form
 * @param {Object} angles - Current angles from pose detection
 * @param {Object} previousState - Previous state for tracking
 * @returns {Object} - Form assessment
 */
export const assessStandingMarch = (angles, previousState = {}) => {
  const hipAngle = Math.min(angles.leftHip, angles.rightHip);
  const kneeAngle = Math.min(angles.leftKnee, angles.rightKnee);
  const shoulderAngle = Math.min(angles.leftShoulder, angles.rightShoulder);

  let score = 100;
  let feedback = 'Good form!';
  let repCompleted = false;
  let phase = previousState.phase || 'start';

  // Check hip flexion (should be 60-120 degrees for lifted knee)
  if (hipAngle < 60) {
    score -= 20;
    feedback = 'Lift your knee higher';
  } else if (hipAngle > 130) {
    score -= 10;
    feedback = 'Lower your knee slightly';
  }

  // Check knee flexion (should be 80-120 degrees)
  if (kneeAngle < 70) {
    score -= 15;
    feedback = 'Bend your knee more';
  } else if (kneeAngle > 140) {
    score -= 10;
    feedback = 'Straighten your leg a bit';
  }

  // Check posture (shoulders should stay level)
  if (shoulderAngle < 150) {
    score -= 15;
    feedback = 'Keep your shoulders level';
  }

  // Track rep phases
  if (hipAngle < 90 && phase === 'start') {
    phase = 'lifted';
  } else if (hipAngle > 150 && phase === 'lifted') {
    repCompleted = true;
    feedback = 'Great! One more';
    phase = 'lowered';
  }

  return {
    score: Math.max(0, score),
    feedback,
    repCompleted,
    phase,
    metrics: {
      hipAngle,
      kneeAngle,
      shoulderAngle,
    },
  };
};

/**
 * Get exercise-specific tips
 * @returns {Array} - Array of tips
 */
export const getStandingMarchTips = () => {
  return [
    'Maintain an upright posture throughout',
    'Lift knees to approximately hip height',
    'Keep a steady, controlled rhythm',
    'Engage your core muscles',
    'Breathe steadily - exhale as you lift',
    'Avoid leaning backward',
    'Keep your arms relaxed at your sides',
  ];
};

/**
 * Validate if user is in correct starting position
 * @param {Object} angles - Current angles
 * @returns {Object} - Validation result
 */
export const validateStartingPosition = (angles) => {
  const hipAngle = Math.min(angles.leftHip, angles.rightHip);
  const kneeAngle = Math.min(angles.leftKnee, angles.rightKnee);
  const shoulderAngle = Math.min(angles.leftShoulder, angles.rightShoulder);

  const isValid = {
    hips: hipAngle > 160, // Hips should be extended
    knees: kneeAngle > 160, // Knees should be extended
    shoulders: shoulderAngle > 150, // Shoulders should be level
  };

  const allValid = Object.values(isValid).every(v => v);

  return {
    isValid: allValid,
    details: isValid,
    message: allValid
      ? 'Perfect starting position! Ready to begin.'
      : 'Adjust your position: ' + Object.entries(isValid)
        .filter(([, v]) => !v)
        .map(([k]) => k)
        .join(', '),
  };
};

/**
 * Calculate Standing March specific metrics
 * @param {Array} frameData - Frame data from session
 * @returns {Object} - Exercise-specific metrics
 */
export const calculateStandingMarchMetrics = (frameData) => {
  if (!frameData || frameData.length === 0) {
    return {
      averageHipAngle: 0,
      averageKneeAngle: 0,
      symmetry: 0,
      consistency: 0,
    };
  }

  const hipAngles = frameData
    .map(f => Math.min(f.angles?.leftHip || 0, f.angles?.rightHip || 0))
    .filter(a => a > 0);

  const kneeAngles = frameData
    .map(f => Math.min(f.angles?.leftKnee || 0, f.angles?.rightKnee || 0))
    .filter(a => a > 0);

  const leftHipAngles = frameData
    .map(f => f.angles?.leftHip || 0)
    .filter(a => a > 0);

  const rightHipAngles = frameData
    .map(f => f.angles?.rightHip || 0)
    .filter(a => a > 0);

  // Calculate averages
  const avgHipAngle = hipAngles.length > 0
    ? hipAngles.reduce((a, b) => a + b, 0) / hipAngles.length
    : 0;

  const avgKneeAngle = kneeAngles.length > 0
    ? kneeAngles.reduce((a, b) => a + b, 0) / kneeAngles.length
    : 0;

  // Calculate symmetry (left vs right)
  const avgLeftHip = leftHipAngles.length > 0
    ? leftHipAngles.reduce((a, b) => a + b, 0) / leftHipAngles.length
    : 0;

  const avgRightHip = rightHipAngles.length > 0
    ? rightHipAngles.reduce((a, b) => a + b, 0) / rightHipAngles.length
    : 0;

  const symmetry = Math.max(0, 100 - Math.abs(avgLeftHip - avgRightHip) * 2);

  // Calculate consistency (variance)
  const hipVariance = hipAngles.length > 0
    ? hipAngles.reduce((sum, a) => sum + Math.pow(a - avgHipAngle, 2), 0) / hipAngles.length
    : 0;

  const consistency = Math.max(0, 100 - hipVariance / 2);

  return {
    averageHipAngle: Math.round(avgHipAngle),
    averageKneeAngle: Math.round(avgKneeAngle),
    symmetry: Math.round(symmetry),
    consistency: Math.round(consistency),
    frameCount: frameData.length,
  };
};

/**
 * Generate Standing March specific recommendations
 * @param {Object} metrics - Exercise metrics
 * @returns {Array} - Recommendations
 */
export const generateStandingMarchRecommendations = (metrics) => {
  const recommendations = [];

  if (metrics.averageHipAngle < 80) {
    recommendations.push({
      type: 'warning',
      message: 'Try lifting your knees higher for better hip flexion',
      priority: 'high',
    });
  }

  if (metrics.symmetry < 70) {
    recommendations.push({
      type: 'warning',
      message: 'Work on balancing your left and right leg lifts',
      priority: 'medium',
    });
  }

  if (metrics.consistency < 60) {
    recommendations.push({
      type: 'warning',
      message: 'Try to maintain a more consistent rhythm',
      priority: 'medium',
    });
  }

  if (metrics.averageHipAngle > 100 && metrics.symmetry > 80 && metrics.consistency > 80) {
    recommendations.push({
      type: 'success',
      message: 'Excellent form! You\'re performing this exercise very well.',
      priority: 'low',
    });
  }

  return recommendations;
};

/**
 * Export all available exercises
 */
export const AVAILABLE_EXERCISES = {
  'knee-bends': {
    name: 'Knee Bends',
    description: 'Bend and straighten your knees',
    difficulty: 'Easy',
    intensity: 0.3,
    suitableFor: ['ACL Recovery', 'Knee OA', 'Post-Fracture'],
    phase: 'Acute',
    sets: 3,
    repsPerSet: 10
  },
  'leg-raises': {
    name: 'Leg Raises',
    description: 'Lift your leg while standing',
    difficulty: 'Medium',
    intensity: 0.5,
    suitableFor: ['Hip Replacement', 'ACL Recovery'],
    phase: 'Mid',
    sets: 3,
    repsPerSet: 12
  },
  'standing-march': {
    name: 'Standing March',
    description: 'Lift knees alternately while standing',
    difficulty: 'Easy',
    intensity: 0.4,
    suitableFor: ['Stroke Recovery', 'General Mobility'],
    phase: 'Acute',
    sets: 3,
    repsPerSet: 20
  },
  'hip-flexion': {
    name: 'Hip Flexion',
    description: 'Flex your hip joint',
    difficulty: 'Easy',
    intensity: 0.3,
    suitableFor: ['Hip OA', 'Post-Fracture'],
    phase: 'Acute',
    sets: 3,
    repsPerSet: 10
  },
  'shoulder-raises': {
    name: 'Shoulder Raises',
    description: 'Raise your arms to shoulder height',
    difficulty: 'Easy',
    intensity: 0.4,
    suitableFor: ['Shoulder Impingement', 'Stroke Recovery'],
    phase: 'Mid',
    sets: 3,
    repsPerSet: 12
  },
  'elbow-flexion': {
    name: 'Elbow Flexion',
    description: 'Bend and straighten your elbow',
    difficulty: 'Easy',
    intensity: 0.2,
    suitableFor: ['Stroke Recovery', 'General Mobility'],
    phase: 'Acute',
    sets: 2,
    repsPerSet: 15
  },
  'squats': {
    name: 'Squats',
    description: 'Full body lower limb engagement',
    difficulty: 'Medium',
    intensity: 0.7,
    suitableFor: ['ACL Recovery', 'Knee OA'],
    phase: 'Advanced',
    sets: 3,
    repsPerSet: 10
  },
};
