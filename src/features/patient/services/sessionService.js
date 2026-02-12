// Session Service
// Handles workout session data operations with offline sync

import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { saveToLocalStorage, getFromLocalStorage, clearFromLocalStorage } from '../../../utils/localStorage';
import { sendNotification } from '../../../shared/services/notificationService';

const PENDING_SESSIONS_KEY = 'pendingSessions';

/**
 * Save session data (with offline support)
 */
export const saveSession = async (sessionData, userId) => {
  const session = {
    ...sessionData,
    patientId: userId,
    date: serverTimestamp(),
    synced: false,
  };

  try {
    // Try to save to Firestore
    const sessionsRef = collection(db, 'sessions');
    const docRef = await addDoc(sessionsRef, {
      ...session,
      synced: true,
    });

    console.log('[SessionService] Session saved to Firestore:', docRef.id);

    // Update patient stats
    await updatePatientStats(userId, sessionData);

    return { id: docRef.id, ...session };
  } catch (error) {
    console.error('[SessionService] Firestore save failed, storing offline:', error);

    // Save to localStorage if online save fails
    const pendingSessions = getFromLocalStorage(PENDING_SESSIONS_KEY) || [];
    const offlineSession = {
      ...session,
      id: `offline_${Date.now()}`,
      timestamp: Date.now(),
    };

    pendingSessions.push(offlineSession);
    saveToLocalStorage(PENDING_SESSIONS_KEY, pendingSessions);

    console.log('[SessionService] Session saved offline');
    return offlineSession;
  }
};

/**
 * Sync pending sessions from localStorage to Firestore
 */
export const syncPendingSessions = async (userId) => {
  try {
    const pendingSessions = getFromLocalStorage(PENDING_SESSIONS_KEY) || [];

    if (pendingSessions.length === 0) {
      console.log('[SessionService] No pending sessions to sync');
      return { synced: 0, failed: 0 };
    }

    console.log(`[SessionService] Syncing ${pendingSessions.length} pending sessions`);

    let synced = 0;
    let failed = 0;
    const failedSessions = [];

    for (const session of pendingSessions) {
      try {
        const sessionsRef = collection(db, 'sessions');
        await addDoc(sessionsRef, {
          ...session,
          patientId: userId,
          date: serverTimestamp(),
          synced: true,
        });

        synced++;
      } catch (error) {
        console.error('[SessionService] Failed to sync session:', error);
        failedSessions.push(session);
        failed++;
      }
    }

    // Keep failed sessions in localStorage
    if (failedSessions.length > 0) {
      saveToLocalStorage(PENDING_SESSIONS_KEY, failedSessions);
    } else {
      clearFromLocalStorage(PENDING_SESSIONS_KEY);
    }

    console.log(`[SessionService] Sync complete: ${synced} synced, ${failed} failed`);
    return { synced, failed };
  } catch (error) {
    console.error('[SessionService] Sync error:', error);
    return { synced: 0, failed: 0 };
  }
};

/**
 * Get pending sessions count
 */
export const getPendingSessionsCount = () => {
  const pendingSessions = getFromLocalStorage(PENDING_SESSIONS_KEY) || [];
  return pendingSessions.length;
};

/**
 * Update patient statistics after session
 */
const updatePatientStats = async (userId, sessionData) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) return;

    const userData = userSnap.data();
    const lastActive = userData.lastActive?.toDate() || null;
    const now = new Date();

    let newStreak = userData.streak || 0;

    if (!lastActive) {
      newStreak = 1;
    } else {
      const diffTime = now - lastActive;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Active yesterday, increment streak
        newStreak += 1;
      } else if (diffDays > 1) {
        // Missed a day or more, reset streak
        newStreak = 1;
      }
      // If diffDays === 0, already active today, keep current streak
    }

    // Increment completed sessions and update streak
    const currentCompleted = userData.completedSessions || 0;
    const newCompletedSessions = currentCompleted + 1;
    const weeklyGoal = userData.weeklyGoal || 5;
    const newAdherenceRate = Math.min(100, Math.round((newCompletedSessions / weeklyGoal) * 100));

    await updateDoc(userRef, {
      completedSessions: increment(1),
      lastActive: serverTimestamp(),
      streak: newStreak,
      lastSessionQuality: sessionData.quality || 0,
      adherenceRate: newAdherenceRate
    });

    // Notify doctor
    if (userData.doctorId) {
      await sendNotification(userData.doctorId, {
        title: 'Session Completed',
        message: `${userData.name || 'Your patient'} finished a ${sessionData.exerciseName} session with ${sessionData.quality}% quality.`,
        type: 'success',
        patientId: userId
      });
    }

    console.log(`[SessionService] Patient stats updated. New streak: ${newStreak}`);
  } catch (error) {
    console.error('[SessionService] Stats update error:', error);
  }
};

/**
 * Calculate session duration
 */
export const calculateDuration = (startTime, endTime) => {
  const diffMs = endTime - startTime;
  const diffMins = Math.floor(diffMs / 60000);
  const diffSecs = Math.floor((diffMs % 60000) / 1000);

  if (diffMins > 0) {
    return `${diffMins} min ${diffSecs} sec`;
  }
  return `${diffSecs} sec`;
};

/**
 * Calculate quality score from angles
 */
export const calculateQualityScore = (angles, targetAngles) => {
  // TODO: Implement actual quality calculation
  // This is a placeholder implementation

  if (!angles || !targetAngles) return 70;

  const deviations = angles.map((angle, i) => {
    return Math.abs(angle - (targetAngles[i] || angle));
  });

  const avgDeviation = deviations.reduce((sum, d) => sum + d, 0) / deviations.length;
  const score = Math.max(0, Math.min(100, 100 - avgDeviation));

  return Math.round(score);
};

/**
 * Get feedback message based on quality score
 */
export const getFeedbackMessage = (quality) => {
  if (quality >= 90) return 'Excellent form! Keep it up!';
  if (quality >= 80) return 'Great job! Minor adjustments needed.';
  if (quality >= 70) return 'Good effort. Try to maintain proper form.';
  if (quality >= 60) return 'Fair form. Focus on your posture.';
  return 'Needs improvement. Review the exercise guide.';
};
