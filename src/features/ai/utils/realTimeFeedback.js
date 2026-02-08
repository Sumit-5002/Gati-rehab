// Real-Time Feedback Engine
// Compares current angles with ideal ranges and triggers audio/visual corrections
// Owner: Member 3

/**
 * Ideal angle ranges for different exercises
 * Format: { min: number, max: number, optimal: number }
 */
export const IDEAL_ANGLES = {
  'knee-bends': {
    knee: { min: 70, max: 120, optimal: 90 },
    hip: { min: 160, max: 180, optimal: 170 },
    ankle: { min: 80, max: 100, optimal: 90 },
  },
  'leg-raises': {
    hip: { min: 60, max: 120, optimal: 90 },
    knee: { min: 160, max: 180, optimal: 170 },
    ankle: { min: 80, max: 100, optimal: 90 },
  },
  'hip-flexion': {
    hip: { min: 60, max: 120, optimal: 90 },
    knee: { min: 160, max: 180, optimal: 170 },
  },
  'shoulder-raises': {
    shoulder: { min: 60, max: 180, optimal: 120 },
    elbow: { min: 160, max: 180, optimal: 170 },
  },
  'elbow-flexion': {
    elbow: { min: 30, max: 150, optimal: 90 },
    shoulder: { min: 160, max: 180, optimal: 170 },
  },
  'standing-march': {
    hip: { min: 60, max: 120, optimal: 90 },
    knee: { min: 80, max: 120, optimal: 100 },
  },
};

/**
 * Feedback messages for different correction scenarios
 */
const FEEDBACK_MESSAGES = {
  tooFlexed: 'Extend more - angle too small',
  tooExtended: 'Flex more - angle too large',
  perfect: 'Perfect angle! Keep it up',
  almostThere: 'Getting closer to ideal angle',
  positioningError: 'Adjust your position',
  speedTooFast: 'Slow down your movement',
  speedTooSlow: 'Move a bit faster',
  goodForm: 'Excellent form!',
  keepSteady: 'Keep your movement steady',
};

/**
 * Calculate real-time feedback based on current vs ideal angles
 * @param {Object} currentAngles - Current angles from pose detection
 * @param {string} exerciseType - Type of exercise
 * @param {Object} previousState - Previous state for tracking changes
 * @returns {Object} - Feedback object with visual and audio cues
 */
export const generateRealTimeFeedback = (
  currentAngles,
  exerciseType
) => {
  if (!currentAngles || !IDEAL_ANGLES[exerciseType]) {
    return {
      message: 'Unable to detect pose',
      severity: 'error',
      audioCue: null,
      visualCue: null,
      corrections: [],
    };
  }

  const idealRanges = IDEAL_ANGLES[exerciseType];
  const corrections = [];
  let severity = 'success'; // 'success', 'warning', 'error'
  let message = FEEDBACK_MESSAGES.goodForm;
  let audioCue = null;
  let visualCue = null;

  // Analyze each relevant joint for this exercise
  for (const [joint, range] of Object.entries(idealRanges)) {
    // Resolve joint angle, handling left/right variants
    let currentAngle = currentAngles[`${joint}Angle`] || currentAngles[joint] || 0;

    if (currentAngle === 0) {
      // Try resolving from left/right variants
      const capitalizedJoint = joint.charAt(0).toUpperCase() + joint.slice(1);
      const leftAngle = currentAngles[`left${capitalizedJoint}`];
      const rightAngle = currentAngles[`right${capitalizedJoint}`];

      if (leftAngle !== undefined || rightAngle !== undefined) {
        // Use the angle that deviates most from rest position
        // Rest is 0 for shoulder, 180 for others
        const restValue = joint === 'shoulder' ? 0 : 180;
        const l = leftAngle !== undefined ? leftAngle : restValue;
        const r = rightAngle !== undefined ? rightAngle : restValue;
        currentAngle = Math.abs(l - restValue) > Math.abs(r - restValue) ? l : r;
      }
    }

    // Skip if still no angle found (except for shoulder where 0 is a valid rest angle)
    if (currentAngle === 0 && joint !== 'shoulder') continue;

    const feedback = analyzeJointAngle(currentAngle, range, joint);

    if (feedback.correction) {
      corrections.push(feedback.correction);
      if (feedback.severity === 'error') {
        severity = 'error';
      } else if (feedback.severity === 'warning' && severity !== 'error') {
        severity = 'warning';
      }
    }
  }

  // Determine overall feedback
  if (corrections.length === 0) {
    message = FEEDBACK_MESSAGES.goodForm;
    severity = 'success';
    audioCue = 'success';
    visualCue = 'green';
  } else if (corrections.length === 1) {
    message = corrections[0];
    audioCue = severity === 'error' ? 'warning' : 'info';
    visualCue = severity === 'error' ? 'red' : 'yellow';
  } else {
    message = `Multiple corrections needed: ${corrections.slice(0, 2).join(', ')}`;
    audioCue = 'warning';
    visualCue = 'red';
    severity = 'error';
  }

  return {
    message,
    severity,
    audioCue,
    visualCue,
    corrections,
    timestamp: Date.now(),
  };
};

/**
 * Analyze a single joint angle against ideal range
 * @param {number} currentAngle - Current angle in degrees
 * @param {Object} range - Ideal range { min, max, optimal }
 * @param {string} joint - Joint name
 * @returns {Object} - Analysis result with correction message
 */
const analyzeJointAngle = (currentAngle, range, joint) => {
  const { min, max, optimal } = range;
  const tolerance = 10; // ±10 degrees tolerance

  // Check if angle is within acceptable range
  if (currentAngle < min - tolerance) {
    return {
      correction: `${joint}: Extend more (${currentAngle}° → ${optimal}°)`,
      severity: 'error',
      direction: 'extend',
    };
  }

  if (currentAngle > max + tolerance) {
    return {
      correction: `${joint}: Flex more (${currentAngle}° → ${optimal}°)`,
      severity: 'error',
      direction: 'flex',
    };
  }

  // Check if angle is close to optimal
  if (Math.abs(currentAngle - optimal) > tolerance) {
    return {
      correction: `${joint}: Adjust to ${optimal}° (currently ${currentAngle}°)`,
      severity: 'warning',
      direction: currentAngle < optimal ? 'extend' : 'flex',
    };
  }

  // Angle is perfect
  return {
    correction: null,
    severity: 'success',
    direction: 'maintain',
  };
};

/**
 * Generate audio cue based on feedback type
 * @param {string} cueType - Type of cue ('success', 'warning', 'error', 'info')
 * @returns {Promise<void>}
 */
export const playAudioCue = async (cueType) => {
  try {
    // Create audio context for generating tones
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Define audio parameters based on cue type
    const audioParams = {
      success: { frequency: 800, duration: 0.2 },
      warning: { frequency: 600, duration: 0.3 },
      error: { frequency: 400, duration: 0.4 },
      info: { frequency: 700, duration: 0.25 },
    };

    const params = audioParams[cueType] || audioParams.info;

    oscillator.frequency.value = params.frequency;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + params.duration
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + params.duration);
  } catch (error) {
    console.error('[realTimeFeedback] Error playing audio cue:', error);
  }
};

/**
 * Generate visual feedback overlay
 * @param {string} visualCue - Type of visual cue ('green', 'yellow', 'red')
 * @returns {Object} - CSS styling for visual feedback
 */
export const getVisualFeedbackStyle = (visualCue) => {
  const styles = {
    green: {
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      textColor: '#059669',
    },
    yellow: {
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      textColor: '#d97706',
    },
    red: {
      borderColor: '#ef4444',
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      textColor: '#dc2626',
    },
  };

  return styles[visualCue] || styles.yellow;
};

/**
 * Track movement speed and provide feedback
 * @param {Array} angleHistory - Array of recent angle measurements
 * @param {number} timeWindow - Time window in milliseconds
 * @returns {Object} - Speed analysis
 */
export const analyzeMovementSpeed = (angleHistory, timeWindow = 1000) => {
  if (!angleHistory || angleHistory.length < 2) {
    return {
      speed: 0,
      feedback: 'Insufficient data',
      isOptimal: false,
    };
  }

  // Calculate angle change per millisecond
  const angleChange = Math.abs(
    angleHistory[angleHistory.length - 1] - angleHistory[0]
  );
  const speed = angleChange / (timeWindow / 1000); // degrees per second

  let feedback = '';
  let isOptimal = false;

  // Optimal speed is typically 30-60 degrees per second for rehab exercises
  if (speed < 20) {
    feedback = 'Move faster';
  } else if (speed > 80) {
    feedback = 'Slow down';
  } else {
    feedback = 'Good pace';
    isOptimal = true;
  }

  return {
    speed: Math.round(speed),
    feedback,
    isOptimal,
  };
};

/**
 * Detect and report form deviations
 * @param {Object} currentAngles - Current angles
 * @param {Object} previousAngles - Previous frame angles
 * @returns {Array} - Array of detected deviations
 */
export const detectFormDeviations = (currentAngles, previousAngles = {}) => {
  const deviations = [];
  const maxAngleChange = 15; // Maximum expected angle change between frames

  for (const [key, currentValue] of Object.entries(currentAngles)) {
    const previousValue = previousAngles[key] || currentValue;
    const change = Math.abs(currentValue - previousValue);

    if (change > maxAngleChange) {
      deviations.push({
        joint: key,
        change,
        message: `Jerky movement detected at ${key}`,
        severity: 'warning',
      });
    }
  }

  return deviations;
};

/**
 * Generate comprehensive feedback report
 * @param {Object} angles - Current angles
 * @param {string} exerciseType - Exercise type
 * @param {Object} state - Current session state
 * @returns {Object} - Complete feedback report
 */
export const generateFeedbackReport = (angles, exerciseType, state = {}) => {
  const realTimeFeedback = generateRealTimeFeedback(angles, exerciseType, state);
  const speedAnalysis = analyzeMovementSpeed(state.angleHistory || []);
  const deviations = detectFormDeviations(angles, state.previousAngles);

  return {
    realTime: realTimeFeedback,
    speed: speedAnalysis,
    deviations,
    overallQuality: calculateOverallQuality(realTimeFeedback, speedAnalysis, deviations),
    timestamp: Date.now(),
  };
};

/**
 * Calculate overall quality score from feedback components
 * @param {Object} realTimeFeedback - Real-time feedback
 * @param {Object} speedAnalysis - Speed analysis
 * @param {Array} deviations - Form deviations
 * @returns {number} - Quality score 0-100
 */
const calculateOverallQuality = (realTimeFeedback, speedAnalysis, deviations) => {
  let score = 100;

  // Deduct for form issues
  if (realTimeFeedback.severity === 'error') {
    score -= 30;
  } else if (realTimeFeedback.severity === 'warning') {
    score -= 15;
  }

  // Deduct for speed issues
  if (!speedAnalysis.isOptimal) {
    score -= 10;
  }

  // Deduct for deviations
  score -= deviations.length * 5;

  return Math.max(0, Math.min(100, score));
};
