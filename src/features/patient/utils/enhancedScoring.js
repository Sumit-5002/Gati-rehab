// Enhanced Scoring System
// Form Quality Score calculation and Range of Motion tracking
// Owner: Member 3

import { IDEAL_ANGLES } from '../../ai/utils/realTimeFeedback';

/**
 * Calculate comprehensive Form Quality Score (0-100)
 * Factors: angle accuracy, consistency, speed, symmetry
 * @param {Array} frameData - Array of frame data with angles and timestamps
 * @param {string} exerciseType - Type of exercise
 * @returns {Object} - Detailed quality score breakdown
 */
export const calculateFormQualityScore = (frameData, exerciseType) => {
  if (!frameData || frameData.length === 0) {
    return {
      overallScore: 0,
      angleAccuracy: 0,
      consistency: 0,
      symmetry: 0,
      speed: 0,
      breakdown: {},
    };
  }

  const angleAccuracy = calculateAngleAccuracy(frameData, exerciseType);
  const consistency = calculateConsistency(frameData);
  const symmetry = calculateSymmetry(frameData);
  const speed = calculateSpeedScore(frameData);

  // Weighted average: angle accuracy (40%), consistency (30%), symmetry (20%), speed (10%)
  const overallScore = Math.round(
    angleAccuracy * 0.4 +
    consistency * 0.3 +
    symmetry * 0.2 +
    speed * 0.1
  );

  return {
    overallScore: Math.max(0, Math.min(100, overallScore)),
    angleAccuracy: Math.round(angleAccuracy),
    consistency: Math.round(consistency),
    symmetry: Math.round(symmetry),
    speed: Math.round(speed),
    breakdown: {
      angleAccuracy: `${Math.round(angleAccuracy)}%`,
      consistency: `${Math.round(consistency)}%`,
      symmetry: `${Math.round(symmetry)}%`,
      speed: `${Math.round(speed)}%`,
    },
    frameCount: frameData.length,
    timestamp: Date.now(),
  };
};

/**
 * Calculate how close angles are to ideal ranges
 * @param {Array} frameData - Frame data array
 * @param {string} exerciseType - Exercise type
 * @returns {number} - Accuracy score 0-100
 */
const calculateAngleAccuracy = (frameData, exerciseType) => {
  const idealRanges = IDEAL_ANGLES[exerciseType];
  if (!idealRanges) return 0;

  let totalAccuracy = 0;
  let jointCount = 0;

  for (const [joint, range] of Object.entries(idealRanges)) {
    const angles = frameData
      .map(frame => {
        let angle = frame.angles?.[`${joint}Angle`] || frame.angles?.[joint];
        if (angle === undefined || angle === 0) {
          const capitalizedJoint = joint.charAt(0).toUpperCase() + joint.slice(1);
          const left = frame.angles?.[`left${capitalizedJoint}`];
          const right = frame.angles?.[`right${capitalizedJoint}`];
          if (left !== undefined || right !== undefined) {
            const restValue = joint === 'shoulder' ? 0 : 180;
            const l = left !== undefined ? left : restValue;
            const r = right !== undefined ? right : restValue;
            angle = Math.abs(l - restValue) > Math.abs(r - restValue) ? l : r;
          }
        }
        return angle;
      })
      .filter(angle => angle !== undefined && (angle !== 0 || joint === 'shoulder'));

    if (angles.length === 0) continue;

    // Calculate how many frames are within acceptable range
    const accurateFrames = angles.filter(
      angle => angle >= range.min - 10 && angle <= range.max + 10
    ).length;

    const jointAccuracy = (accurateFrames / angles.length) * 100;
    totalAccuracy += jointAccuracy;
    jointCount++;
  }

  return jointCount > 0 ? totalAccuracy / jointCount : 0;
};

/**
 * Calculate consistency of movement (low variance = high consistency)
 * @param {Array} frameData - Frame data array
 * @returns {number} - Consistency score 0-100
 */
const calculateConsistency = (frameData) => {
  if (frameData.length < 2) return 100;

  let totalVariance = 0;
  let jointCount = 0;

  // Get all angle keys from first frame
  const firstFrame = frameData[0].angles || {};
  const angleKeys = Object.keys(firstFrame);

  for (const key of angleKeys) {
    const angles = frameData
      .map(frame => frame.angles?.[key])
      .filter(angle => angle !== undefined && angle !== 0);

    if (angles.length < 2) continue;

    // Calculate variance
    const mean = angles.reduce((a, b) => a + b, 0) / angles.length;
    const variance = angles.reduce((sum, angle) => {
      return sum + Math.pow(angle - mean, 2);
    }, 0) / angles.length;

    // Convert variance to consistency score (lower variance = higher score)
    // Normalize to 0-100 scale
    const consistencyScore = Math.max(0, 100 - variance / 2);
    totalVariance += consistencyScore;
    jointCount++;
  }

  return jointCount > 0 ? totalVariance / jointCount : 100;
};

/**
 * Calculate symmetry between left and right sides
 * @param {Array} frameData - Frame data array
 * @returns {number} - Symmetry score 0-100
 */
const calculateSymmetry = (frameData) => {
  if (frameData.length === 0) return 100;

  const symmetryPairs = [
    ['leftKnee', 'rightKnee'],
    ['leftHip', 'rightHip'],
    ['leftElbow', 'rightElbow'],
    ['leftShoulder', 'rightShoulder'],
    ['leftAnkle', 'rightAnkle'],
  ];

  let totalSymmetry = 0;
  let pairCount = 0;

  for (const [leftKey, rightKey] of symmetryPairs) {
    const leftAngles = frameData
      .map(frame => frame.angles?.[leftKey])
      .filter(angle => angle !== undefined && angle !== 0);

    const rightAngles = frameData
      .map(frame => frame.angles?.[rightKey])
      .filter(angle => angle !== undefined && angle !== 0);

    if (leftAngles.length === 0 || rightAngles.length === 0) continue;

    // Calculate average difference between left and right
    const avgLeftAngle = leftAngles.reduce((a, b) => a + b, 0) / leftAngles.length;
    const avgRightAngle = rightAngles.reduce((a, b) => a + b, 0) / rightAngles.length;
    const difference = Math.abs(avgLeftAngle - avgRightAngle);

    // Convert difference to symmetry score (smaller difference = higher score)
    const symmetryScore = Math.max(0, 100 - difference * 2);
    totalSymmetry += symmetryScore;
    pairCount++;
  }

  return pairCount > 0 ? totalSymmetry / pairCount : 100;
};

/**
 * Calculate speed consistency score
 * @param {Array} frameData - Frame data array
 * @returns {number} - Speed score 0-100
 */
const calculateSpeedScore = (frameData) => {
  if (frameData.length < 2) return 100;

  // Calculate time deltas between frames
  const timeDeltas = [];
  for (let i = 1; i < frameData.length; i++) {
    const delta = (frameData[i].timestamp || 0) - (frameData[i - 1].timestamp || 0);
    if (delta > 0) timeDeltas.push(delta);
  }

  if (timeDeltas.length === 0) return 100;

  const avgDelta = timeDeltas.reduce((a, b) => a + b, 0) / timeDeltas.length;

  // Calculate variance in frame timing
  const variance = timeDeltas.reduce((sum, delta) => {
    return sum + Math.pow(delta - avgDelta, 2);
  }, 0) / timeDeltas.length;

  // Convert to score (lower variance = higher score)
  const speedScore = Math.max(0, 100 - variance / 10);
  return speedScore;
};

/**
 * Track Range of Motion (ROM) for a session
 * @param {Array} frameData - Frame data array
 * @param {string} exerciseType - Exercise type
 * @returns {Object} - ROM statistics
 */
export const trackRangeOfMotion = (frameData, exerciseType) => {
  if (!frameData || frameData.length === 0) {
    return {
      primaryJoint: null,
      minAngle: 0,
      maxAngle: 0,
      rangeOfMotion: 0,
      averageAngle: 0,
      peakROM: 0,
      consistency: 0,
    };
  }

  const idealRanges = IDEAL_ANGLES[exerciseType];
  if (!idealRanges) return null;

  // Get primary joint (usually the first one in ideal ranges)
  const primaryJoint = Object.keys(idealRanges)[0];
  const angleKey = `${primaryJoint}Angle`;

  // Extract all angles for primary joint
  const angles = frameData
    .map(frame => {
      let angle = frame.angles?.[angleKey] || frame.angles?.[primaryJoint];
      if (angle === undefined || angle === 0) {
        const capitalizedJoint = primaryJoint.charAt(0).toUpperCase() + primaryJoint.slice(1);
        const left = frame.angles?.[`left${capitalizedJoint}`];
        const right = frame.angles?.[`right${capitalizedJoint}`];
        if (left !== undefined || right !== undefined) {
          const restValue = primaryJoint === 'shoulder' ? 0 : 180;
          const l = left !== undefined ? left : restValue;
          const r = right !== undefined ? right : restValue;
          angle = Math.abs(l - restValue) > Math.abs(r - restValue) ? l : r;
        }
      }
      return angle;
    })
    .filter(angle => angle !== undefined && (angle !== 0 || primaryJoint === 'shoulder'));

  if (angles.length === 0) {
    return {
      primaryJoint,
      minAngle: 0,
      maxAngle: 0,
      rangeOfMotion: 0,
      averageAngle: 0,
      peakROM: 0,
      consistency: 0,
    };
  }

  const minAngle = Math.min(...angles);
  const maxAngle = Math.max(...angles);
  const rangeOfMotion = maxAngle - minAngle;
  const averageAngle = Math.round(
    angles.reduce((a, b) => a + b, 0) / angles.length
  );

  // Calculate consistency of ROM (how stable the range is)
  const romConsistency = calculateROMConsistency(frameData, primaryJoint);

  return {
    primaryJoint,
    minAngle: Math.round(minAngle),
    maxAngle: Math.round(maxAngle),
    rangeOfMotion: Math.round(rangeOfMotion),
    averageAngle,
    peakROM: Math.round(maxAngle),
    consistency: Math.round(romConsistency),
    frameCount: angles.length,
    timestamp: Date.now(),
  };
};

/**
 * Calculate ROM consistency (how stable the range is across reps)
 * @param {Array} frameData - Frame data array
 * @param {string} joint - Joint name
 * @returns {number} - Consistency score 0-100
 */
const calculateROMConsistency = (frameData, joint) => {
  const angleKey = `${joint}Angle`;

  // Group frames into potential reps (based on angle peaks)
  const angles = frameData
    .map(frame => frame.angles?.[angleKey] || frame.angles?.[joint])
    .filter(angle => angle !== undefined && angle !== 0);

  if (angles.length < 10) return 100;

  // Calculate ROM for sliding windows (potential reps)
  const windowSize = Math.floor(angles.length / 3);
  const roms = [];

  for (let i = 0; i <= angles.length - windowSize; i++) {
    const window = angles.slice(i, i + windowSize);
    const rom = Math.max(...window) - Math.min(...window);
    roms.push(rom);
  }

  if (roms.length === 0) return 100;

  // Calculate variance in ROMs
  const avgROM = roms.reduce((a, b) => a + b, 0) / roms.length;
  const variance = roms.reduce((sum, rom) => {
    return sum + Math.pow(rom - avgROM, 2);
  }, 0) / roms.length;

  // Convert to consistency score
  const consistency = Math.max(0, 100 - variance / 2);
  return consistency;
};

/**
 * Generate ROM improvement recommendations
 * @param {Object} currentROM - Current ROM data
 * @param {Object} previousROM - Previous session ROM data
 * @returns {Array} - Array of recommendations
 */
export const generateROMRecommendations = (currentROM, previousROM = null) => {
  const recommendations = [];

  if (!currentROM) return recommendations;

  // Check if ROM is below expected range
  if (currentROM.rangeOfMotion < 20) {
    recommendations.push({
      type: 'warning',
      message: 'Limited range of motion detected. Try to move through a fuller range.',
      priority: 'high',
    });
  }

  // Check consistency
  if (currentROM.consistency < 60) {
    recommendations.push({
      type: 'warning',
      message: 'ROM is inconsistent. Try to maintain a steady range throughout.',
      priority: 'medium',
    });
  }

  // Compare with previous session
  if (previousROM) {
    const romImprovement = currentROM.rangeOfMotion - previousROM.rangeOfMotion;

    if (romImprovement > 5) {
      recommendations.push({
        type: 'success',
        message: `Great! Your ROM improved by ${Math.round(romImprovement)}°`,
        priority: 'low',
      });
    } else if (romImprovement < -5) {
      recommendations.push({
        type: 'warning',
        message: `ROM decreased by ${Math.round(Math.abs(romImprovement))}°. Take it easy today.`,
        priority: 'medium',
      });
    }
  }

  return recommendations;
};

/**
 * Calculate rep completion based on ROM
 * @param {Array} angleHistory - History of angles for primary joint
 * @param {Object} idealRange - Ideal range for the joint
 * @returns {Object} - Rep completion data
 */
export const calculateRepCompletion = (angleHistory, idealRange) => {
  if (!angleHistory || angleHistory.length === 0) {
    return {
      isComplete: false,
      progress: 0,
      phase: 'start',
    };
  }

  const currentAngle = angleHistory[angleHistory.length - 1];
  const minAngle = Math.min(...angleHistory);
  const maxAngle = Math.max(...angleHistory);

  // Determine phase based on angle progression
  let phase = 'start';
  let progress = 0;

  if (minAngle < idealRange.min + 5) {
    phase = 'flexion';
    progress = 50;
  }

  if (maxAngle > idealRange.max - 5) {
    phase = 'extension';
    progress = 100;
  }

  // Rep is complete if we've achieved both flexion and extension
  const isComplete = minAngle < idealRange.min + 10 && maxAngle > idealRange.max - 10;

  return {
    isComplete,
    progress: Math.min(100, progress),
    phase,
    minAngle: Math.round(minAngle),
    maxAngle: Math.round(maxAngle),
    currentAngle: Math.round(currentAngle),
  };
};

/**
 * Generate session summary with all metrics
 * @param {Array} frameData - All frame data from session
 * @param {string} exerciseType - Exercise type
 * @param {number} repCount - Number of reps completed
 * @returns {Object} - Complete session summary
 */
export const generateSessionSummary = (frameData, exerciseType, repCount) => {
  const formQuality = calculateFormQualityScore(frameData, exerciseType);
  const rom = trackRangeOfMotion(frameData, exerciseType);
  const duration = frameData.length > 0
    ? (frameData[frameData.length - 1].timestamp - frameData[0].timestamp) / 1000
    : 0;

  return {
    exerciseType,
    duration: Math.round(duration),
    repCount,
    formQuality,
    rangeOfMotion: rom,
    averageQualityScore: formQuality.overallScore,
    grade: getGradeFromScore(formQuality.overallScore),
    timestamp: Date.now(),
  };
};

/**
 * Convert quality score to letter grade
 * @param {number} score - Quality score 0-100
 * @returns {string} - Letter grade A-F
 */
export const getGradeFromScore = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};
