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
    repsPerSet: 10,
    demoType: 'animation', // 'animation' for stick figure, 'gif' for actual demo
    instructions: [
      'Stand with feet shoulder-width apart',
      'Slowly bend your knees to 45-90 degrees',
      'Keep your back straight and core engaged',
      'Return to starting position slowly',
      'Breathe out as you bend, in as you straighten'
    ],
    commonMistakes: [
      'Bending knees past toes',
      'Leaning forward too much',
      'Moving too quickly'
    ]
  },
  'leg-raises': {
    name: 'Leg Raises',
    description: 'Lift your leg while standing',
    difficulty: 'Medium',
    intensity: 0.5,
    suitableFor: ['Hip Replacement', 'ACL Recovery'],
    phase: 'Mid',
    sets: 3,
    repsPerSet: 12,
    demoType: 'animation',
    instructions: [
      'Stand straight, hold onto a chair for support',
      'Lift one leg forward, keeping it straight',
      'Raise to comfortable height (30-45 degrees)',
      'Hold for 2 seconds, then lower slowly',
      'Alternate legs between sets'
    ],
    commonMistakes: [
      'Swinging the leg',
      'Leaning backward',
      'Lifting too high too soon'
    ]
  },
  'standing-march': {
    name: 'Standing March',
    description: 'Lift knees alternately while standing',
    difficulty: 'Easy',
    intensity: 0.4,
    suitableFor: ['Stroke Recovery', 'General Mobility'],
    phase: 'Acute',
    sets: 3,
    repsPerSet: 20,
    demoType: 'animation',
    instructions: [
      'Stand upright with good posture',
      'Lift one knee to hip height',
      'Lower it back down with control',
      'Alternate legs in a marching motion',
      'Maintain steady rhythm'
    ],
    commonMistakes: [
      'Leaning backward',
      'Not lifting knee high enough',
      'Moving too fast'
    ]
  },
  'hip-flexion': {
    name: 'Hip Flexion',
    description: 'Flex your hip joint',
    difficulty: 'Easy',
    intensity: 0.3,
    suitableFor: ['Hip OA', 'Post-Fracture'],
    phase: 'Acute',
    sets: 3,
    repsPerSet: 10,
    demoType: 'animation',
    instructions: [
      'Lie on your back or stand with support',
      'Slowly lift one leg, bending at the hip',
      'Bring knee toward chest',
      'Hold for 2-3 seconds',
      'Lower slowly and repeat'
    ],
    commonMistakes: [
      'Arching the back',
      'Moving too quickly',
      'Not engaging core'
    ]
  },
  'shoulder-raises': {
    name: 'Shoulder Raises',
    description: 'Raise your arms to shoulder height',
    difficulty: 'Easy',
    intensity: 0.4,
    suitableFor: ['Shoulder Impingement', 'Stroke Recovery'],
    phase: 'Mid',
    sets: 3,
    repsPerSet: 12,
    demoType: 'animation',
    instructions: [
      'Stand with arms at your sides',
      'Slowly raise both arms forward or to the side',
      'Lift to shoulder height (90 degrees)',
      'Hold for 1-2 seconds',
      'Lower slowly with control'
    ],
    commonMistakes: [
      'Shrugging shoulders',
      'Raising arms too high',
      'Using momentum instead of control'
    ]
  },
  'elbow-flexion': {
    name: 'Elbow Flexion',
    description: 'Bend and straighten your elbow',
    difficulty: 'Easy',
    intensity: 0.2,
    suitableFor: ['Stroke Recovery', 'General Mobility'],
    phase: 'Acute',
    sets: 2,
    repsPerSet: 15,
    demoType: 'animation',
    instructions: [
      'Sit or stand with arm at your side',
      'Slowly bend elbow, bringing hand toward shoulder',
      'Keep upper arm still',
      'Straighten arm back to starting position',
      'Maintain smooth, controlled movement'
    ],
    commonMistakes: [
      'Moving the shoulder',
      'Swinging the arm',
      'Not completing full range of motion'
    ]
  },
  'squats': {
    name: 'Squats',
    description: 'Full body lower limb engagement',
    difficulty: 'Medium',
    intensity: 0.7,
    suitableFor: ['ACL Recovery', 'Knee OA'],
    phase: 'Advanced',
    sets: 3,
    repsPerSet: 10,
    demoType: 'animation',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Lower your body by bending knees and hips',
      'Keep chest up and back straight',
      'Go down until thighs are parallel to ground',
      'Push through heels to return to standing'
    ],
    commonMistakes: [
      'Knees caving inward',
      'Heels lifting off ground',
      'Leaning too far forward',
      'Not going deep enough'
    ]
  },
  'lateral-leg-raises': {
    name: 'Lateral Leg Raises',
    description: 'Lift your leg out to the side',
    difficulty: 'Medium',
    intensity: 0.5,
    suitableFor: ['Hip Stability', 'ACL Recovery'],
    phase: 'Mid',
    sets: 3,
    repsPerSet: 12,
    demoType: 'animation',
    instructions: [
      'Stand straight with support',
      'Lift one leg out to the side (30-45 degrees)',
      'Keep your toes pointing forward',
      'Lower slowly with control',
      'Keep your torso upright'
    ],
    commonMistakes: [
      'Leaning to the opposite side',
      'Rotating your foot outward',
      'Moving too fast'
    ]
  },
  'arm-circles': {
    name: 'Arm Circles',
    description: 'Rotate your arms in controlled circles',
    difficulty: 'Easy',
    intensity: 0.3,
    suitableFor: ['Shoulder Mobility', 'Post-Op Rehab'],
    phase: 'Acute',
    sets: 3,
    repsPerSet: 15,
    demoType: 'animation',
    instructions: [
      'Stand with arms out at shoulder height',
      'Make small, controlled circular motions',
      'Keep your shoulders relaxed (don\'t shrug)',
      'Reverse direction halfway through',
      'Maintain steady breathing'
    ],
    commonMistakes: [
      'Circles are too large/uncontrolled',
      'Shrugging shoulders',
      'Bending elbows'
    ]
  },
  'calf-raises': {
    name: 'Calf Raises',
    description: 'Lift your heels off the ground',
    difficulty: 'Easy',
    intensity: 0.4,
    suitableFor: ['Ankle Stability', 'Achilles Rehab'],
    phase: 'Acute',
    sets: 3,
    repsPerSet: 15,
    demoType: 'animation',
    instructions: [
      'Stand with feet shoulder-width apart',
      'Slowly lift your heels as high as possible',
      'Hold the peak for 1 second',
      'Lower back down slowly',
      'Use a wall or chair for balance'
    ],
    commonMistakes: [
      'Rushing the movement',
      'Not going through full range of motion',
      'Leaning forward'
    ]
  },
};
