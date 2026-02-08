// Session Service
// Handles workout session data operations with offline sync

import {
  collection,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { saveToLocalStorage, getFromLocalStorage, clearFromLocalStorage } from '../../../utils/localStorage';

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
// eslint-disable-next-line no-unused-vars
const updatePatientStats = async (userId, sessionData) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Increment completed sessions
    await updateDoc(userRef, {
      completedSessions: increment(1),
      lastActive: serverTimestamp(),
    });
    
    // TODO: Calculate and update adherence rate
    // This would require more complex logic based on scheduled vs completed sessions
    
    console.log('[SessionService] Patient stats updated');
  } catch (error) {
    console.error('[SessionService] Stats update error:', error);
    // Don't throw error - stats update is not critical
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
