// Angle Calculations Utility
// Core function for calculating angles between pose landmarks
// Owner: Member 2

/**
 * Calculate the angle between three points (p1, p2, p3)
 * where p2 is the vertex
 * @param {Object} p1 - First point {x, y, z}
 * @param {Object} p2 - Vertex point {x, y, z}
 * @param {Object} p3 - Third point {x, y, z}
 * @returns {number} - Angle in degrees
 */
export const getAngle = (p1, p2, p3) => {
  // Calculate vectors
  const vector1 = {
    x: p1.x - p2.x,
    y: p1.y - p2.y,
    z: p1.z - p2.z,
  };

  const vector2 = {
    x: p3.x - p2.x,
    y: p3.y - p2.y,
    z: p3.z - p2.z,
  };

  // Calculate dot product
  const dotProduct =
    vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;

  // Calculate magnitudes
  const magnitude1 = Math.sqrt(
    vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2
  );
  const magnitude2 = Math.sqrt(
    vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2
  );

  // Calculate angle in radians
  const angleRad = Math.acos(dotProduct / (magnitude1 * magnitude2));

  // Convert to degrees
  const angleDeg = (angleRad * 180) / Math.PI;

  return Math.round(angleDeg);
};

/**
 * MediaPipe Pose Landmark indices
 * Reference: https://developers.google.com/mediapipe/solutions/vision/pose_landmarker
 */
export const POSE_LANDMARKS = {
  // Face
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,

  // Upper Body
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,

  // Hands
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,

  // Lower Body
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,

  // Feet
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32,
};

/**
 * Calculate all relevant angles for rehabilitation exercises
 * @param {Array} keypoints - Array of 33 pose landmarks from MediaPipe
 * @returns {Object} - Object containing calculated angles
 */
export const calculateAngles = (keypoints) => {
  if (!keypoints || keypoints.length !== 33) {
    console.error('[angleCalculations] Invalid keypoints array');
    return null;
  }

  const angles = {};

  try {
    // Left Knee Angle (hip-knee-ankle)
    angles.leftKnee = getAngle(
      keypoints[POSE_LANDMARKS.LEFT_HIP],
      keypoints[POSE_LANDMARKS.LEFT_KNEE],
      keypoints[POSE_LANDMARKS.LEFT_ANKLE]
    );

    // Right Knee Angle (hip-knee-ankle)
    angles.rightKnee = getAngle(
      keypoints[POSE_LANDMARKS.RIGHT_HIP],
      keypoints[POSE_LANDMARKS.RIGHT_KNEE],
      keypoints[POSE_LANDMARKS.RIGHT_ANKLE]
    );

    // Left Hip Angle (shoulder-hip-knee)
    angles.leftHip = getAngle(
      keypoints[POSE_LANDMARKS.LEFT_SHOULDER],
      keypoints[POSE_LANDMARKS.LEFT_HIP],
      keypoints[POSE_LANDMARKS.LEFT_KNEE]
    );

    // Right Hip Angle (shoulder-hip-knee)
    angles.rightHip = getAngle(
      keypoints[POSE_LANDMARKS.RIGHT_SHOULDER],
      keypoints[POSE_LANDMARKS.RIGHT_HIP],
      keypoints[POSE_LANDMARKS.RIGHT_KNEE]
    );

    // Left Elbow Angle (shoulder-elbow-wrist)
    angles.leftElbow = getAngle(
      keypoints[POSE_LANDMARKS.LEFT_SHOULDER],
      keypoints[POSE_LANDMARKS.LEFT_ELBOW],
      keypoints[POSE_LANDMARKS.LEFT_WRIST]
    );

    // Right Elbow Angle (shoulder-elbow-wrist)
    angles.rightElbow = getAngle(
      keypoints[POSE_LANDMARKS.RIGHT_SHOULDER],
      keypoints[POSE_LANDMARKS.RIGHT_ELBOW],
      keypoints[POSE_LANDMARKS.RIGHT_WRIST]
    );

    // Left Shoulder Angle (elbow-shoulder-hip)
    angles.leftShoulder = getAngle(
      keypoints[POSE_LANDMARKS.LEFT_ELBOW],
      keypoints[POSE_LANDMARKS.LEFT_SHOULDER],
      keypoints[POSE_LANDMARKS.LEFT_HIP]
    );

    // Right Shoulder Angle (elbow-shoulder-hip)
    angles.rightShoulder = getAngle(
      keypoints[POSE_LANDMARKS.RIGHT_ELBOW],
      keypoints[POSE_LANDMARKS.RIGHT_SHOULDER],
      keypoints[POSE_LANDMARKS.RIGHT_HIP]
    );

    // Left Ankle Angle (knee-ankle-foot)
    angles.leftAnkle = getAngle(
      keypoints[POSE_LANDMARKS.LEFT_KNEE],
      keypoints[POSE_LANDMARKS.LEFT_ANKLE],
      keypoints[POSE_LANDMARKS.LEFT_FOOT_INDEX]
    );

    // Right Ankle Angle (knee-ankle-foot)
    angles.rightAnkle = getAngle(
      keypoints[POSE_LANDMARKS.RIGHT_KNEE],
      keypoints[POSE_LANDMARKS.RIGHT_ANKLE],
      keypoints[POSE_LANDMARKS.RIGHT_FOOT_INDEX]
    );

    console.log('[angleCalculations] Calculated angles:', angles);
    return angles;
  } catch (error) {
    console.error('[angleCalculations] Error calculating angles:', error);
    return null;
  }
};

/**
 * Get specific angle based on exercise type
 * @param {Object} angles - Calculated angles object
 * @param {string} exerciseType - Type of exercise (e.g., 'knee-bends', 'leg-raises')
 * @returns {number} - Primary angle for the exercise
 */
export const getPrimaryAngle = (angles, exerciseType) => {
  if (!angles) return 0;

  // Helper to get the angle that has moved furthest from rest position
  const getActiveAngle = (left, right, restValue = 180) => {
    const l = left !== undefined ? left : restValue;
    const r = right !== undefined ? right : restValue;
    return Math.abs(l - restValue) > Math.abs(r - restValue) ? l : r;
  };

  const exerciseAngleMap = {
    'knee-bends': getActiveAngle(angles.leftKnee, angles.rightKnee, 180),
    'leg-raises': getActiveAngle(angles.leftHip, angles.rightHip, 180),
    'hip-flexion': getActiveAngle(angles.leftHip, angles.rightHip, 180),
    'shoulder-raises': getActiveAngle(angles.leftShoulder, angles.rightShoulder, 0),
    'elbow-flexion': getActiveAngle(angles.leftElbow, angles.rightElbow, 180),
    'standing-march': getActiveAngle(angles.leftHip, angles.rightHip, 180),
    // Support legacy names
    'knee-bend': getActiveAngle(angles.leftKnee, angles.rightKnee, 180),
    'leg-raise': getActiveAngle(angles.leftHip, angles.rightHip, 180),
    'arm-raise': getActiveAngle(angles.leftShoulder, angles.rightShoulder, 0),
    'elbow-flex': getActiveAngle(angles.leftElbow, angles.rightElbow, 180),
  };

  return exerciseAngleMap[exerciseType] || 0;
};
