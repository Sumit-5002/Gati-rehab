// Scoring Utility - Form quality and range of motion tracking
// Owner: Member 3

/**
 * Calculate form quality score based on angles and exercise type
 * @param {Object} angles - Calculated angles from angleCalculations.js
 * @param {string} exerciseType - Type of exercise being performed
 * @param {Object} previousState - Previous state for rep counting
 * @returns {Object} - Quality score, feedback, and rep completion status
 */
export const calculateFormQuality = (angles, exerciseType, previousState = {}) => {
  if (!angles) {
    return {
      score: 0,
      feedback: 'Unable to detect pose',
      repCompleted: false,
    };
  }

  let result = {
    score: 0,
    feedback: '',
    repCompleted: false,
    phase: previousState.phase || 'start', // 'start', 'flexion', 'extension'
  };

  // Exercise-specific quality assessment
  switch (exerciseType.toLowerCase()) {
    case 'knee bends':
    case 'knee-bend':
      result = assessKneeBend(angles, previousState);
      break;

    case 'leg raises':
    case 'leg-raise':
      result = assessLegRaise(angles, previousState);
      break;

    case 'hip flexion':
    case 'hip-flex':
      result = assessHipFlex(angles, previousState);
      break;

    default:
      result.feedback = 'Exercise type not recognized';
  }

  return result;
};

/**
 * Assess knee bend exercise form
 */
const assessKneeBend = (angles, previousState) => {
  const kneeAngle = Math.min(angles.leftKnee, angles.rightKnee);
  const hipAngle = Math.min(angles.leftHip, angles.rightHip);
  
  let score = 100;
  let feedback = 'Good form!';
  let repCompleted = false;
  let phase = previousState.phase || 'start';

  // Check if back is straight (hip angle should be > 160°)
  if (hipAngle < 150) {
    score -= 20;
    feedback = 'Keep your back straight';
  }

  // Check knee flexion depth
  if (kneeAngle < 90) {
    // Deep flexion - good!
    if (phase === 'start' || phase === 'extension') {
      phase = 'flexion';
    }
  } else if (kneeAngle > 160) {
    // Full extension
    if (phase === 'flexion') {
      repCompleted = true;
      feedback = 'Great rep! Keep going';
    }
    phase = 'extension';
  }

  // Encourage deeper bends if not reaching 90°
  if (kneeAngle > 120 && kneeAngle < 160) {
    score -= 10;
    feedback = 'Try bending deeper';
  }

  return { score: Math.max(0, score), feedback, repCompleted, phase };
};

/**
 * Assess leg raise exercise form
 */
const assessLegRaise = (angles, previousState) => {
  const hipAngle = Math.min(angles.leftHip, angles.rightHip);
  const kneeAngle = Math.min(angles.leftKnee, angles.rightKnee);
  
  let score = 100;
  let feedback = 'Good form!';
  let repCompleted = false;
  let phase = previousState.phase || 'start';

  // Check if knee is straight (should be > 160°)
  if (kneeAngle < 150) {
    score -= 25;
    feedback = 'Keep your leg straight';
  }

  // Check hip flexion
  if (hipAngle < 120) {
    // Leg raised high - good!
    if (phase === 'start' || phase === 'down') {
      phase = 'up';
    }
  } else if (hipAngle > 160) {
    // Leg lowered
    if (phase === 'up') {
      repCompleted = true;
      feedback = 'Excellent! One more';
    }
    phase = 'down';
  }

  // Encourage higher raises
  if (hipAngle > 140 && hipAngle < 160) {
    score -= 10;
    feedback = 'Raise your leg higher';
  }

  return { score: Math.max(0, score), feedback, repCompleted, phase };
};

/**
 * Assess hip flexion exercise form
 */
const assessHipFlex = (angles, previousState) => {
  const hipAngle = Math.min(angles.leftHip, angles.rightHip);
  
  let score = 100;
  let feedback = 'Maintain position';
  let repCompleted = false;
  let phase = previousState.phase || 'start';

  // Check hip flexion depth
  if (hipAngle < 100) {
    score = 100;
    feedback = 'Perfect! Hold this position';
    phase = 'flexed';
  } else if (hipAngle < 120) {
    score = 80;
    feedback = 'Good, try to flex a bit more';
    phase = 'flexed';
  } else if (hipAngle > 160) {
    if (phase === 'flexed') {
      repCompleted = true;
      feedback = 'Great rep!';
    }
    phase = 'extended';
  } else {
    score = 60;
    feedback = 'Flex your hip more';
  }

  return { score: Math.max(0, score), feedback, repCompleted, phase };
};

/**
 * Track range of motion over time
 * @param {Array} angleHistory - Array of angle measurements over time
 * @returns {Object} - ROM statistics (min, max, average)
 */
export const trackRangeOfMotion = (angleHistory) => {
  if (!angleHistory || angleHistory.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      range: 0,
    };
  }

  const min = Math.min(...angleHistory);
  const max = Math.max(...angleHistory);
  const average = angleHistory.reduce((sum, angle) => sum + angle, 0) / angleHistory.length;
  const range = max - min;

  return {
    min: Math.round(min),
    max: Math.round(max),
    average: Math.round(average),
    range: Math.round(range),
  };
};

/**
 * Calculate overall session score
 * @param {Array} repScores - Array of quality scores for each rep
 * @returns {Object} - Session statistics
 */
export const calculateSessionScore = (repScores) => {
  if (!repScores || repScores.length === 0) {
    return {
      totalReps: 0,
      averageScore: 0,
      grade: 'N/A',
    };
  }

  const totalReps = repScores.length;
  const averageScore = Math.round(
    repScores.reduce((sum, score) => sum + score, 0) / totalReps
  );

  let grade = 'F';
  if (averageScore >= 90) grade = 'A';
  else if (averageScore >= 80) grade = 'B';
  else if (averageScore >= 70) grade = 'C';
  else if (averageScore >= 60) grade = 'D';

  return {
    totalReps,
    averageScore,
    grade,
  };
};
