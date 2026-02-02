// Patient Service
// Handles all patient-related Firestore operations

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get patient profile data
 */
export const getPatientProfile = async (patientId) => {
  try {
    const patientRef = doc(db, 'users', patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (patientSnap.exists()) {
      return { id: patientSnap.id, ...patientSnap.data() };
    }
    throw new Error('Patient not found');
  } catch (error) {
    console.error('[PatientService] Get profile error:', error);
    throw error;
  }
};

/**
 * Get patient statistics
 */
export const getPatientStats = async (patientId) => {
  try {
    const patientData = await getPatientProfile(patientId);
    
    // Get weekly stats
    const sessionsRef = collection(db, 'sessions');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyQuery = query(
      sessionsRef,
      where('patientId', '==', patientId),
      where('date', '>=', weekAgo),
      orderBy('date', 'desc')
    );
    
    const weeklySnap = await getDocs(weeklyQuery);
    const weeklyCompleted = weeklySnap.size;
    
    return {
      totalSessions: patientData.completedSessions || 0,
      weeklyGoal: 5, // Can be customized per patient
      completed: weeklyCompleted,
      streak: patientData.streak || 0,
      adherenceRate: patientData.adherenceRate || 0,
    };
  } catch (error) {
    console.error('[PatientService] Get stats error:', error);
    // Return default values on error
    return {
      totalSessions: 0,
      weeklyGoal: 5,
      completed: 0,
      streak: 0,
      adherenceRate: 0,
    };
  }
};

/**
 * Get patient's today routine
 */
export const getTodayRoutine = async (patientId) => {
  try {
    const routineRef = doc(db, 'routines', patientId);
    const routineSnap = await getDoc(routineRef);
    
    if (routineSnap.exists()) {
      const data = routineSnap.data();
      return data.exercises || [];
    }
    
    // Return default routine if none exists
    return [
      { id: 1, name: 'Knee Bends', sets: 3, reps: 10, completed: false },
      { id: 2, name: 'Leg Raises', sets: 2, reps: 10, completed: false },
      { id: 3, name: 'Hip Flexion', sets: 3, reps: 8, completed: false },
    ];
  } catch (error) {
    console.error('[PatientService] Get routine error:', error);
    return [];
  }
};

/**
 * Get recent sessions for patient
 */
export const getRecentSessions = async (patientId, limitCount = 10) => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('patientId', '==', patientId),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const sessions = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        exerciseName: data.exerciseName,
        date: formatDate(data.date),
        reps: data.reps,
        quality: data.quality,
        rangeOfMotion: data.rangeOfMotion,
        duration: data.duration,
      });
    });
    
    return sessions;
  } catch (error) {
    console.error('[PatientService] Get recent sessions error:', error);
    return [];
  }
};

/**
 * Subscribe to patient data changes (real-time)
 */
export const subscribeToPatientData = (patientId, callback) => {
  const patientRef = doc(db, 'users', patientId);
  
  return onSnapshot(patientRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    }
  }, (error) => {
    console.error('[PatientService] Subscribe error:', error);
  });
};

/**
 * Subscribe to recent sessions (real-time)
 */
export const subscribeToRecentSessions = (patientId, callback, limitCount = 10) => {
  const sessionsRef = collection(db, 'sessions');
  const q = query(
    sessionsRef,
    where('patientId', '==', patientId),
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const sessions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        exerciseName: data.exerciseName,
        date: formatDate(data.date),
        reps: data.reps,
        quality: data.quality,
        rangeOfMotion: data.rangeOfMotion,
        duration: data.duration,
      });
    });
    callback(sessions);
  }, (error) => {
    console.error('[PatientService] Subscribe sessions error:', error);
  });
};

/**
 * Get trend data for charts
 */
export const getTrendData = async (patientId) => {
  try {
    // Get ROM trend data
    const romRef = doc(db, 'trends', patientId, 'weekly', 'rom');
    const romSnap = await getDoc(romRef);
    
    // Get quality trend data
    const qualityRef = doc(db, 'trends', patientId, 'daily', 'quality');
    const qualitySnap = await getDoc(qualityRef);
    
    return {
      romData: romSnap.exists() ? romSnap.data().data : getDefaultROMData(),
      qualityData: qualitySnap.exists() ? qualitySnap.data().data : getDefaultQualityData(),
    };
  } catch (error) {
    console.error('[PatientService] Get trend data error:', error);
    return {
      romData: getDefaultROMData(),
      qualityData: getDefaultQualityData(),
    };
  }
};

/**
 * Helper: Format date for display
 */
const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
};

/**
 * Default ROM data for charts
 */
const getDefaultROMData = () => [
  { date: 'Week 1', knee: 45, hip: 60, ankle: 30 },
  { date: 'Week 2', knee: 65, hip: 75, ankle: 40 },
  { date: 'Week 3', knee: 85, hip: 85, ankle: 50 },
  { date: 'Week 4', knee: 105, hip: 95, ankle: 60 },
  { date: 'Week 5', knee: 120, hip: 100, ankle: 65 },
];

/**
 * Default quality data for charts
 */
const getDefaultQualityData = () => [
  { date: 'Mon', score: 65 },
  { date: 'Tue', score: 72 },
  { date: 'Wed', score: 78 },
  { date: 'Thu', score: 85 },
  { date: 'Fri', score: 82 },
  { date: 'Sat', score: 88 },
  { date: 'Sun', score: 87 },
];
