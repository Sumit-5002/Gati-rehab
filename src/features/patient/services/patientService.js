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
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

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
    return null;
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
    const sessionsRef = collection(db, 'sessions');
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const weeklyQuery = query(
      sessionsRef,
      where('patientId', '==', patientId),
      where('date', '>=', weekAgo)
    );

    const weeklySnap = await getDocs(weeklyQuery);
    const weeklyCompleted = weeklySnap.size;

    // In a real app, these would come from the user document or a stats document
    const patientRef = doc(db, 'users', patientId);
    const patientSnap = await getDoc(patientRef);
    const patientData = patientSnap.exists() ? patientSnap.data() : {};

    return {
      totalSessions: patientData.completedSessions || 0,
      weeklyGoal: patientData.weeklyGoal || 5,
      completed: weeklyCompleted,
      streak: patientData.streak || 0,
      adherenceRate: patientData.adherenceRate || 0,
    };
  } catch (error) {
    console.error('[PatientService] Get stats error:', error);
    throw error;
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

    return [];
  } catch (error) {
    console.error('[PatientService] Get routine error:', error);
    throw error;
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
    throw error;
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
      romData: romSnap.exists() ? romSnap.data().data : [],
      qualityData: qualitySnap.exists() ? qualitySnap.data().data : [],
    };
  } catch (error) {
    console.error('[PatientService] Get trend data error:', error);
    return {
      romData: [],
      qualityData: [],
    };
  }
};

/**
 * Log comprehensive pain data
 */
export const logPain = async (patientId, painData) => {
  try {
    const painLogsRef = collection(db, 'pain_logs');
    const docRef = await addDoc(painLogsRef, {
      ...painData,
      patientId,
      timestamp: serverTimestamp(),
    });
    console.log('[PatientService] Pain log saved:', docRef.id);
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('[PatientService] Log pain error:', error);
    throw error;
  }
};

/**
 * Log simple pain level
 */
export const logPainLevel = async (patientId, level, note = '') => {
  try {
    const painLogsRef = collection(db, 'pain_logs');
    await addDoc(painLogsRef, {
      patientId,
      level: parseInt(level),
      note,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('[PatientService] Log pain level error:', error);
    throw error;
  }
};

/**
 * Get pain history
 */
export const getPainHistory = async (patientId, limitCount = 7) => {
  try {
    const painLogsRef = collection(db, 'pain_logs');
    const q = query(
      painLogsRef,
      where('patientId', '==', patientId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('[PatientService] Get pain history error:', error);
    throw error;
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
