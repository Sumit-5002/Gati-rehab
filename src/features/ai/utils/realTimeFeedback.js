// Real-Time Feedback Engine
// Compares current angles with ideal ranges and triggers audio/visual corrections
// Owner: Member 3

/**
 * Ideal angle ranges for different exercises
 * Format: { min: number, max: number, optimal: number }
 */
export const IDEAL_ANGLES = {
  'standing-march': {
    hip: { min: 60, max: 120, optimal: 90 },
    knee: { min: 80, max: 120, optimal: 100 },
  },
  'lateral-leg-raises': {
    hip: { min: 20, max: 60, optimal: 45 },
    shoulder: { min: 160, max: 180, optimal: 170 },
  },
  'arm-circles': {
    shoulder: { min: 45, max: 175, optimal: 110 },
    elbow: { min: 150, max: 180, optimal: 170 },
  },
  'knee-bends': {
    knee: { min: 90, max: 170, optimal: 135 },
    hip: { min: 140, max: 180, optimal: 160 },
  },
  'leg-raises': {
    hip: { min: 120, max: 175, optimal: 145 },
    knee: { min: 160, max: 180, optimal: 175 },
  },
  'hip-flexion': {
    hip: { min: 80, max: 160, optimal: 110 },
    knee: { min: 140, max: 180, optimal: 170 },
  },
  'shoulder-raises': {
    shoulder: { min: 10, max: 100, optimal: 90 },
    elbow: { min: 150, max: 180, optimal: 170 },
  },
  'elbow-flexion': {
    elbow: { min: 30, max: 150, optimal: 45 },
    shoulder: { min: 0, max: 20, optimal: 5 },
  },
  'squats': {
    knee: { min: 80, max: 130, optimal: 100 },
    hip: { min: 80, max: 140, optimal: 110 },
    shoulder: { min: 140, max: 180, optimal: 170 },
  },
  'calf-raises': {
    ankle: { min: 90, max: 165, optimal: 110 },
    knee: { min: 160, max: 180, optimal: 170 },
  },
};

/**
 * Exercise to Joint Mapping for Visibility Checks
 */
export const EXERCISE_VISIBILITY_REQUIREMENTS = {
  'knee-bends': ['LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE'],
  'leg-raises': ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE'],
  'hip-flexion': ['LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE'],
  'shoulder-raises': ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_ELBOW', 'RIGHT_ELBOW'],
  'elbow-flexion': ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_ELBOW', 'RIGHT_ELBOW', 'LEFT_WRIST', 'RIGHT_WRIST'],
  'standing-march': ['LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE'],
  'squats': ['LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE', 'LEFT_SHOULDER', 'RIGHT_SHOULDER'],
  'lateral-leg-raises': ['LEFT_HIP', 'RIGHT_HIP', 'LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE'],
  'arm-circles': ['LEFT_SHOULDER', 'RIGHT_SHOULDER', 'LEFT_ELBOW', 'RIGHT_ELBOW'],
  'calf-raises': ['LEFT_KNEE', 'RIGHT_KNEE', 'LEFT_ANKLE', 'RIGHT_ANKLE'],
};

/**
 * Check if required joints are visible in frame
 * @param {Array} keypoints - MediaPipe keypoints
 * @param {string} exerciseType - Current exercise
 * @returns {Object|null} - Null if all good, otherwise error object
 */
export const checkPoseVisibility = (keypoints, exerciseType) => {
  if (!keypoints || keypoints.length < 33) return { message: 'Camera Initializing...', severity: 'warning' };

  const requirements = EXERCISE_VISIBILITY_REQUIREMENTS[exerciseType] || [];
  const missingJoints = [];

  // Define mapping for easier reading
  const indexMap = {
    LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
    LEFT_WRIST: 15, RIGHT_WRIST: 16,
    LEFT_HIP: 23, RIGHT_HIP: 24,
    LEFT_KNEE: 25, RIGHT_KNEE: 26,
    LEFT_ANKLE: 27, RIGHT_ANKLE: 28
  };

  requirements.forEach(joint => {
    const idx = indexMap[joint];
    if (keypoints[idx] && keypoints[idx].visibility < 0.6) {
      missingJoints.push(joint.toLowerCase().replace('_', ' '));
    }
  });

  if (missingJoints.length > 3) {
    return { message: 'Full body not visible! Step back.', severity: 'error' };
  }

  if (missingJoints.length > 0) {
    return { message: `Move so your ${missingJoints[0]} is visible`, severity: 'error' };
  }

  return null;
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
  goodForm: 'Perfect form! Keep it up.',
  keepSteady: 'Stay steady and controlled',
  visibilityError: 'I can\'t see you clearly! Please adjust.',
  encouragement: ['Great depth!', 'Perfect rhythm!', 'Keep going!', 'You\'re doing amazing!', 'Excellent control!'],
};

/**
 * Get a random encouragement phrase
 */
const getEncouragement = () => {
  const phrases = FEEDBACK_MESSAGES.encouragement;
  return phrases[Math.floor(Math.random() * phrases.length)];
};

/**
 * Calculate real-time feedback based on current vs ideal angles
 * @param {Object} currentAngles - Current angles from pose detection
 * @param {string} exerciseType - Type of exercise
 * @param {Array} keypoints - Raw pose keypoints for visibility check
 * @returns {Object} - Feedback object with visual and audio cues
 */
export const generateRealTimeFeedback = (
  currentAngles,
  exerciseType,
  keypoints = null
) => {
  // 1. Mandatory Visibility Check First
  if (keypoints) {
    const visibilityError = checkPoseVisibility(keypoints, exerciseType);
    if (visibilityError) {
      return {
        ...visibilityError,
        audioCue: 'warning',
        visualCue: 'red',
        corrections: []
      };
    }
  }

  if (!currentAngles || !IDEAL_ANGLES[exerciseType]) {
    return {
      message: 'Show your body to begin!',
      severity: 'warning',
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
    // 1 in 5 chance of extra encouragement
    message = Math.random() > 0.8 ? getEncouragement() : FEEDBACK_MESSAGES.goodForm;
    severity = 'success';
    audioCue = 'success';
    visualCue = 'green';
  } else if (corrections.length === 1) {
    message = corrections[0];
    audioCue = severity === 'error' ? 'warning' : 'info';
    visualCue = severity === 'error' ? 'red' : 'yellow';
  } else {
    // Be more specific about multiple issues
    const primary = corrections[0];
    message = `${primary} (and ${corrections.length - 1} more)`;
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
  const tolerance = 10;
  const jointLabel = joint.charAt(0).toUpperCase() + joint.slice(1);

  if (currentAngle < min - tolerance) {
    return {
      correction: `${jointLabel}: Try to straighten up more`,
      severity: 'error',
      direction: 'extend',
    };
  }

  if (currentAngle > max + tolerance) {
    return {
      correction: `${jointLabel}: Bend a bit further`,
      severity: 'error',
      direction: 'flex',
    };
  }

  // Check if angle is close to optimal
  if (Math.abs(currentAngle - optimal) > tolerance) {
    const hint = currentAngle < optimal ? 'straighten' : 'bend';
    return {
      correction: `Almost perfect! Just ${hint} your ${jointLabel.toLowerCase()} slightly.`,
      severity: 'warning',
      direction: currentAngle < optimal ? 'extend' : 'flex',
    };
  }

  return {
    correction: null,
    severity: 'success',
    direction: 'maintain',
  };
};

// Single shared AudioContext to prevent "too many AudioContexts" errors
let sharedAudioContext = null;

/**
 * Generate audio cue based on feedback type
 * @param {string} cueType - Type of cue ('success', 'warning', 'error', 'info')
 * @returns {Promise<void>}
 */
export const playAudioCue = async (cueType) => {
  try {
    // Create audio context for generating tones if it doesn't exist
    if (!sharedAudioContext) {
      sharedAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    // Resume if suspended (common in browsers until user interaction)
    if (sharedAudioContext.state === 'suspended') {
      await sharedAudioContext.resume();
    }

    const oscillator = sharedAudioContext.createOscillator();
    const gainNode = sharedAudioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(sharedAudioContext.destination);

    // Define audio parameters based on cue type
    const audioParams = {
      success: { frequency: 800, duration: 0.2 },
      warning: { frequency: 600, duration: 0.3 },
      error: { frequency: 400, duration: 0.4 },
      info: { frequency: 700, duration: 0.25 },
    };

    const params = audioParams[cueType] || audioParams.info;

    oscillator.frequency.value = params.frequency;
    gainNode.gain.setValueAtTime(0.3, sharedAudioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      sharedAudioContext.currentTime + params.duration
    );

    oscillator.start(sharedAudioContext.currentTime);
    oscillator.stop(sharedAudioContext.currentTime + params.duration);
  } catch (error) {
    console.error('[realTimeFeedback] Error playing audio cue:', error);
  }
};

/**
 * Provide voice feedback using Web Speech API
 * @param {string} text - The message to speak
 */
export const speakFeedback = (text) => {
  if (!('speechSynthesis' in window)) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1;
  utterance.pitch = 1.0;
  utterance.volume = 0.8;

  // Find a clear female voice if possible
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(v =>
    v.name.includes('Female') || v.name.includes('Google UK English Female')
  ) || voices[0];

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  window.speechSynthesis.speak(utterance);
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
  const realTimeFeedback = generateRealTimeFeedback(angles, exerciseType);
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
