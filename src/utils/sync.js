// Sync Utility - Offline sync logic
// Owner: Member 6

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getPendingSync, clearPendingSync } from './localStorage';

/**
 * Check if device is online
 * @returns {boolean}
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Sync pending data to Firestore
 * @returns {Promise<Object>} - Sync result
 */
export const syncToFirestore = async () => {
  if (!isOnline()) {
    console.log('[sync] Device is offline, sync postponed');
    return {
      success: false,
      message: 'Device is offline',
      syncedCount: 0,
    };
  }

  try {
    const pendingData = getPendingSync();

    if (pendingData.length === 0) {
      console.log('[sync] No pending data to sync');
      return {
        success: true,
        message: 'No data to sync',
        syncedCount: 0,
      };
    }

    console.log(`[sync] Syncing ${pendingData.length} items to Firestore...`);

    // Sync each item to Firestore
    const syncPromises = pendingData.map(async (item) => {
      try {
        // Add to Firestore 'sessions' collection
        await addDoc(collection(db, 'sessions'), {
          ...item,
          syncedAt: serverTimestamp(),
        });
        return { success: true, item };
      } catch (error) {
        console.error('[sync] Error syncing item:', error);
        return { success: false, item, error };
      }
    });

    const results = await Promise.all(syncPromises);
    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.length - successCount;

    if (failureCount === 0) {
      // All synced successfully, clear pending data
      clearPendingSync();
      console.log(`[sync] Successfully synced all ${successCount} items`);
      return {
        success: true,
        message: `Synced ${successCount} items`,
        syncedCount: successCount,
      };
    } else {
      console.warn(
        `[sync] Synced ${successCount} items, ${failureCount} failed`
      );
      return {
        success: false,
        message: `Synced ${successCount} items, ${failureCount} failed`,
        syncedCount: successCount,
      };
    }
  } catch (error) {
    console.error('[sync] Sync error:', error);
    return {
      success: false,
      message: 'Sync failed',
      syncedCount: 0,
      error,
    };
  }
};

/**
 * Setup online/offline event listeners for auto-sync
 * @param {Function} onSyncComplete - Callback when sync completes
 */
export const setupAutoSync = (onSyncComplete) => {
  // Sync when coming back online
  const handleOnline = async () => {
    console.log('[sync] Device is back online, attempting sync...');
    const result = await syncToFirestore();
    if (onSyncComplete) {
      onSyncComplete(result);
    }
  };

  const handleOffline = () => {
    console.log('[sync] Device went offline');
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Initial sync if online
  if (isOnline()) {
    syncToFirestore().then((result) => {
      if (onSyncComplete) {
        onSyncComplete(result);
      }
    });
  }

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Force manual sync
 * @returns {Promise<Object>} - Sync result
 */
export const forceSync = async () => {
  console.log('[sync] Manual sync triggered');
  return await syncToFirestore();
};

/**
 * Get sync status
 * @returns {Object} - Sync status information
 */
export const getSyncStatus = () => {
  const pendingData = getPendingSync();
  const online = isOnline();

  return {
    isOnline: online,
    pendingCount: pendingData.length,
    hasPendingData: pendingData.length > 0,
    canSync: online && pendingData.length > 0,
  };
};
