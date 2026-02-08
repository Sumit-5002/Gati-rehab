
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase/config';

/**
 * Log a sensitive action to Firestore
 * @param {string} userId - ID of the user performing the action
 * @param {string} action - Description of the action (e.g., 'LOGIN', 'UPDATE_PROFILE')
 * @param {Object} metadata - Additional info about the action
 */
export const logAction = async (userId, action, metadata = {}) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      action,
      metadata,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent,
      platform: navigator.platform
    });
  } catch (error) {
    console.error('[AuditLogger] Error logging action:', error);
  }
};
