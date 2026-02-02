// LocalStorage Utility - Offline data storage handlers
// Owner: Member 4/6

const STORAGE_KEYS = {
  SESSION_DATA: 'gati_session_data',
  PENDING_SYNC: 'gati_pending_sync',
  USER_DATA: 'gati_user_data',
  OFFLINE_QUEUE: 'gati_offline_queue',
};

/**
 * Save session data to localStorage
 * @param {Object} sessionData - Session data to save
 */
export const saveSessionData = (sessionData) => {
  try {
    const existingData = getSessionData();
    const updatedData = [...existingData, { ...sessionData, timestamp: Date.now() }];
    
    localStorage.setItem(STORAGE_KEYS.SESSION_DATA, JSON.stringify(updatedData));
    console.log('[localStorage] Session data saved:', sessionData);
    
    // Add to pending sync queue if offline
    if (!navigator.onLine) {
      addToPendingSync(sessionData);
    }
    
    return true;
  } catch (error) {
    console.error('[localStorage] Error saving session data:', error);
    return false;
  }
};

/**
 * Get all session data from localStorage
 * @returns {Array} - Array of session data objects
 */
export const getSessionData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_DATA);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[localStorage] Error reading session data:', error);
    return [];
  }
};

/**
 * Add data to pending sync queue
 * @param {Object} data - Data to sync when online
 */
export const addToPendingSync = (data) => {
  try {
    const pendingData = getPendingSync();
    pendingData.push({ ...data, addedAt: Date.now() });
    
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(pendingData));
    console.log('[localStorage] Added to pending sync queue');
    return true;
  } catch (error) {
    console.error('[localStorage] Error adding to pending sync:', error);
    return false;
  }
};

/**
 * Get pending sync data
 * @returns {Array} - Array of data pending sync
 */
export const getPendingSync = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[localStorage] Error reading pending sync:', error);
    return [];
  }
};

/**
 * Clear pending sync data after successful sync
 */
export const clearPendingSync = () => {
  try {
    localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify([]));
    console.log('[localStorage] Pending sync cleared');
    return true;
  } catch (error) {
    console.error('[localStorage] Error clearing pending sync:', error);
    return false;
  }
};

/**
 * Save user data to localStorage
 * @param {Object} userData - User data to save
 */
export const saveUserData = (userData) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
    console.log('[localStorage] User data saved');
    return true;
  } catch (error) {
    console.error('[localStorage] Error saving user data:', error);
    return false;
  }
};

/**
 * Get user data from localStorage
 * @returns {Object|null} - User data or null
 */
export const getUserData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[localStorage] Error reading user data:', error);
    return null;
  }
};

/**
 * Clear all localStorage data
 */
export const clearAllData = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => {
      localStorage.removeItem(key);
    });
    console.log('[localStorage] All data cleared');
    return true;
  } catch (error) {
    console.error('[localStorage] Error clearing data:', error);
    return false;
  }
};

/**
 * Get storage usage statistics
 * @returns {Object} - Storage usage info
 */
export const getStorageInfo = () => {
  try {
    const sessionData = getSessionData();
    const pendingSync = getPendingSync();
    
    return {
      totalSessions: sessionData.length,
      pendingSyncCount: pendingSync.length,
      isOffline: !navigator.onLine,
    };
  } catch (error) {
    console.error('[localStorage] Error getting storage info:', error);
    return {
      totalSessions: 0,
      pendingSyncCount: 0,
      isOffline: false,
    };
  }
};
