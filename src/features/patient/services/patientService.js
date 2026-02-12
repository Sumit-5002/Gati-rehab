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
  setDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { sendNotification } from '../../../shared/services/notificationService';

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

    const completedSessions = patientData.completedSessions || 0;
    const weeklyGoal = patientData.weeklyGoal || 5;
    const calculatedRate = Math.min(100, Math.round((completedSessions / weeklyGoal) * 100));

    return {
      totalSessions: completedSessions,
      weeklyGoal: weeklyGoal,
      completed: weeklyCompleted,
      streak: patientData.streak || 0,
      adherenceRate: patientData.adherenceRate !== undefined ? patientData.adherenceRate : calculatedRate,
    };
  } catch (error) {
    console.error('[PatientService] Get stats error:', error);
    throw error;
  }
};

/**
 * Get patient's today routine with automatic daily reset
 */
export const getTodayRoutine = async (patientId) => {
  try {
    const routineRef = doc(db, 'routines', patientId);
    const routineSnap = await getDoc(routineRef);

    if (routineSnap.exists()) {
      const data = routineSnap.data();
      const lastUpdated = data.lastUpdated?.toDate ? data.lastUpdated.toDate() : new Date(data.lastUpdated || 0);
      const today = new Date();

      // Check if it's a new day (reset at midnight)
      const isNewDay = !isSameDay(lastUpdated, today);

      if (isNewDay) {
        // Reset completion status for new day
        const resetExercises = (data.exercises || []).map(ex => ({
          ...ex,
          completed: false
        }));

        // Update in Firestore
        await updateDoc(routineRef, {
          exercises: resetExercises,
          lastUpdated: serverTimestamp()
        });

        console.log('[PatientService] Daily exercises reset for new day');
        return resetExercises;
      }

      return data.exercises || [];
    }

    return [];
  } catch (error) {
    console.error('[PatientService] Get routine error:', error);
    throw error;
  }
};

/**
 * Save daily exercise plan (used by AI recommendations or doctor assignments)
 */
export const saveDailyPlan = async (patientId, exercises) => {
  try {
    const routineRef = doc(db, 'routines', patientId);
    await setDoc(routineRef, {
      exercises: exercises.map(ex => ({
        ...ex,
        completed: false
      })),
      lastUpdated: serverTimestamp(),
      createdAt: serverTimestamp()
    }, { merge: true });

    console.log('[PatientService] Daily plan saved successfully');
    return { success: true };
  } catch (error) {
    console.error('[PatientService] Save daily plan error:', error);
    throw error;
  }
};

/**
 * Mark exercise as completed
 */
export const markExerciseCompleted = async (patientId, exerciseId) => {
  try {
    const routineRef = doc(db, 'routines', patientId);
    const routineSnap = await getDoc(routineRef);

    if (routineSnap.exists()) {
      const data = routineSnap.data();
      const updatedExercises = (data.exercises || []).map(ex =>
        ex.id === exerciseId ? { ...ex, completed: true } : ex
      );

      await updateDoc(routineRef, {
        exercises: updatedExercises
      });

      return { success: true };
    }

    return { success: false, error: 'Routine not found' };
  } catch (error) {
    console.error('[PatientService] Mark exercise completed error:', error);
    throw error;
  }
};

/**
 * Helper: Check if two dates are the same day
 */
const isSameDay = (date1, date2) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate();
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
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    const sessions = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        ...data,
        date: formatDate(data.date),
      });
    });

    // Client-side sort: most recent first
    sessions.sort((a, b) => {
      const tA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const tB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return tB - tA;
    });

    return sessions;
  } catch (error) {
    console.error('[PatientService] Get recent sessions error:', error);
    throw error;
  }
};

/**
 * Subscribe to weekly sessions count (real-time) for progress bar
 */
export const subscribeToWeeklySessions = (patientId, callback) => {
  const sessionsRef = collection(db, 'sessions');
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyQuery = query(
    sessionsRef,
    where('patientId', '==', patientId),
    where('date', '>=', weekAgo)
  );

  return onSnapshot(weeklyQuery, (snapshot) => {
    callback(snapshot.size);
  }, (error) => {
    console.error('[PatientService] Subscribe weekly sessions error:', error);
  });
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
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const sessions = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        ...data,
        date: formatDate(data.date),
      });
    });

    // Client-side sort
    sessions.sort((a, b) => {
      const tA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const tB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return tB - tA;
    });

    callback(sessions);
  }, (error) => {
    console.error('[PatientService] Subscribe sessions error:', error);
  });
};

/**
 * Get trend data for charts
 * Aggregates data from recent sessions if pre-computed trends don't exist
 */
export const getTrendData = async (patientId) => {
  try {
    // 1. Try to get pre-computed ROM trend data
    const romRef = doc(db, 'trends', patientId, 'weekly', 'rom');
    const romSnap = await getDoc(romRef);

    // 2. Try to get pre-computed quality trend data
    const qualityRef = doc(db, 'trends', patientId, 'daily', 'quality');
    const qualitySnap = await getDoc(qualityRef);

    const result = {
      romData: romSnap.exists() ? romSnap.data().data : [],
      qualityData: qualitySnap.exists() ? qualitySnap.data().data : [],
    };

    // 3. Fallback: If no trend data exists, compute from last 7 sessions
    if (!result.romData || result.romData.length === 0 || !result.qualityData || result.qualityData.length === 0) {
      const sessionsRef = collection(db, 'sessions');
      // Fix: Removing orderBy to avoid composite index requirement
      // We will sort client-side instead
      const q = query(
        sessionsRef,
        where('patientId', '==', patientId),
        limit(20) // Get more to ensure we have enough after sorting
      );

      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        // Process and sort sessions client-side
        const processedSessions = snapshot.docs
          .map(doc => {
            const data = doc.data();
            const d = data.date?.toDate ? data.date.toDate() : new Date(data.date);
            return {
              day: d.toLocaleDateString('en-US', { weekday: 'short' }),
              rom: data.rangeOfMotion || 0,
              quality: data.quality || 0,
              timestamp: d.getTime()
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp) // Sort oldest to newest
          .slice(-7); // Take last 7 days

        if (!result.romData || result.romData.length === 0) {
          result.romData = processedSessions.map(s => ({ day: s.day, value: s.rom }));
        }
        if (!result.qualityData || result.qualityData.length === 0) {
          result.qualityData = processedSessions.map(s => ({ day: s.day, value: s.quality }));
        }
      }
    }

    return result;
  } catch (error) {
    console.error('[PatientService] Get trend data error:', error);
    // Return empty arrays on error so UI doesn't break
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
export const logPainLevel = async (patientId, painData) => {
  try {
    const painLogsRef = collection(db, 'pain_logs');

    // Support both old (level, note) and new (object) formats
    const data = typeof painData === 'object' ? {
      ...painData,
      level: parseInt(painData.level),
      fatigue: parseInt(painData.fatigue || 0),
      stiffness: parseInt(painData.stiffness || 0)
    } : {
      level: parseInt(painData)
    };

    await addDoc(painLogsRef, {
      patientId,
      ...data,
      timestamp: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('[PatientService] Log pain level error:', error);
    throw error;
  }
};

/**
 * Connect patient to a doctor by doctor's email
 */
/**
 * Connect patient to a doctor by doctor's email
 */
export const connectWithDoctor = async (patientId, doctorEmail) => {
  try {
    if (!doctorEmail) throw new Error('Doctor email is required');

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', doctorEmail), where('userType', '==', 'doctor'));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No doctor found with this email.');
    }

    const doctorDoc = snapshot.docs[0];
    const doctorId = doctorDoc.id;
    const doctorData = doctorDoc.data();

    // Update patient profile
    await updateDoc(doc(db, 'users', patientId), {
      doctorId: doctorId,
      doctorName: doctorData.name || 'Your Doctor'
    });

    // Add to doctor_patients (for legacy compatibility)
    // We fetch patient data first to ensure we have name/email
    const patientSnap = await getDoc(doc(db, 'users', patientId));
    const patientData = patientSnap.exists() ? patientSnap.data() : { name: 'Patient', email: '' };

    await setDoc(doc(db, 'doctor_patients', doctorId, 'patients', patientId), {
      assignedAt: serverTimestamp(),
      active: true,
      patientEmail: patientData.email,
      patientName: patientData.name
    }, { merge: true });

    // Notify doctor
    await sendNotification(doctorId, {
      title: 'New Patient Connected',
      message: `${patientData.name || 'A patient'} has linked their recovery dashboard to you.`,
      type: 'success',
      patientId: patientId
    });

    return { success: true, doctorName: doctorData.name };
  } catch (error) {
    console.error('[PatientService] Connect doctor error:', error);
    throw error;
  }
};
export const getPainHistory = async (patientId, limitCount = 7) => {
  try {
    const painLogsRef = collection(db, 'pain_logs');
    const q = query(
      painLogsRef,
      where('patientId', '==', patientId),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const logs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Client-side sort: most recent first
    logs.sort((a, b) => {
      const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
      const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
      return tB - tA;
    });

    return logs;
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
