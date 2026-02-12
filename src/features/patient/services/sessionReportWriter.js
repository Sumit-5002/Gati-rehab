// Enhanced LocalStorage Writer for Session Reports
// Saves final session reports as JSON locally on the phone
// Owner: Member 4/6


const STORAGE_KEYS = {
  SESSION_REPORTS: 'gati_session_reports',
  SESSION_HISTORY: 'gati_session_history',
  PENDING_UPLOAD: 'gati_pending_upload',
  OFFLINE_QUEUE: 'gati_offline_queue',
};

/**
 * Save complete session report to localStorage
 * @param {Object} sessionReport - Complete session report object
 * @returns {Object} - Save result with status and report ID
 */
export const saveSessionReport = (sessionReport) => {
  try {
    // Generate unique report ID
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Enhance report with metadata
    const enhancedReport = {
      id: reportId,
      ...sessionReport,
      savedAt: new Date().toISOString(),
      version: '1.0',
      synced: false,
      syncAttempts: 0,
    };

    // Get existing reports
    const existingReports = getSessionReports();
    const updatedReports = [...existingReports, enhancedReport];

    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.SESSION_REPORTS, JSON.stringify(updatedReports));

    // Add to history for quick access
    addToSessionHistory(enhancedReport);

    // Add to pending upload queue if offline
    if (!navigator.onLine) {
      addToPendingUpload(reportId, enhancedReport);
    }

    console.log('[sessionReportWriter] Session report saved:', reportId);

    return {
      success: true,
      reportId,
      message: 'Session report saved successfully',
      timestamp: Date.now(),
    };
  } catch (error) {
    console.error('[sessionReportWriter] Error saving session report:', error);
    return {
      success: false,
      error: error.message,
      timestamp: Date.now(),
    };
  }
};

/**
 * Get all session reports from localStorage
 * @returns {Array} - Array of session reports
 */
export const getSessionReports = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_REPORTS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[sessionReportWriter] Error reading session reports:', error);
    return [];
  }
};

/**
 * Get a specific session report by ID
 * @param {string} reportId - Report ID
 * @returns {Object|null} - Session report or null
 */
export const getSessionReportById = (reportId) => {
  try {
    const reports = getSessionReports();
    return reports.find(report => report.id === reportId) || null;
  } catch (error) {
    console.error('[sessionReportWriter] Error retrieving report:', error);
    return null;
  }
};

/**
 * Get session reports for a specific date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} - Filtered session reports
 */
export const getSessionReportsByDateRange = (startDate, endDate) => {
  try {
    const reports = getSessionReports();
    return reports.filter(report => {
      const reportDate = new Date(report.date);
      return reportDate >= startDate && reportDate <= endDate;
    });
  } catch (error) {
    console.error('[sessionReportWriter] Error filtering reports:', error);
    return [];
  }
};

/**
 * Get session reports for a specific exercise
 * @param {string} exerciseType - Exercise type
 * @returns {Array} - Filtered session reports
 */
export const getSessionReportsByExercise = (exerciseType) => {
  try {
    const reports = getSessionReports();
    return reports.filter(
      report => String(report.exerciseType || '').toLowerCase() === String(exerciseType || '').toLowerCase()
    );
  } catch (error) {
    console.error('[sessionReportWriter] Error filtering by exercise:', error);
    return [];
  }
};

/**
 * Add report to session history (recent sessions)
 * @param {Object} report - Session report
 */
const addToSessionHistory = (report) => {
  try {
    const history = getSessionHistory();
    const updatedHistory = [report, ...history].slice(0, 50); // Keep last 50

    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('[sessionReportWriter] Error updating history:', error);
  }
};

/**
 * Get recent session history
 * @returns {Array} - Recent session reports
 */
export const getSessionHistory = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION_HISTORY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[sessionReportWriter] Error reading history:', error);
    return [];
  }
};

/**
 * Add report to pending upload queue
 * @param {string} reportId - Report ID
 * @param {Object} report - Session report
 */
const addToPendingUpload = (reportId, report) => {
  try {
    const pending = getPendingUploads();
    pending.push({
      reportId,
      report,
      addedAt: Date.now(),
      attempts: 0,
    });

    localStorage.setItem(STORAGE_KEYS.PENDING_UPLOAD, JSON.stringify(pending));
    console.log('[sessionReportWriter] Added to pending uploads:', reportId);
  } catch (error) {
    console.error('[sessionReportWriter] Error adding to pending:', error);
  }
};

/**
 * Get pending uploads
 * @returns {Array} - Pending upload queue
 */
export const getPendingUploads = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.PENDING_UPLOAD);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('[sessionReportWriter] Error reading pending uploads:', error);
    return [];
  }
};

/**
 * Mark report as synced
 * @param {string} reportId - Report ID
 * @returns {boolean} - Success status
 */
export const markReportAsSynced = (reportId) => {
  try {
    const reports = getSessionReports();
    const updatedReports = reports.map(report => {
      if (report.id === reportId) {
        return {
          ...report,
          synced: true,
          syncedAt: new Date().toISOString(),
        };
      }
      return report;
    });

    localStorage.setItem(STORAGE_KEYS.SESSION_REPORTS, JSON.stringify(updatedReports));

    // Remove from pending uploads
    removePendingUpload(reportId);

    console.log('[sessionReportWriter] Report marked as synced:', reportId);
    return true;
  } catch (error) {
    console.error('[sessionReportWriter] Error marking as synced:', error);
    return false;
  }
};

/**
 * Remove report from pending uploads
 * @param {string} reportId - Report ID
 */
const removePendingUpload = (reportId) => {
  try {
    const pending = getPendingUploads();
    const updated = pending.filter(item => item.reportId !== reportId);
    localStorage.setItem(STORAGE_KEYS.PENDING_UPLOAD, JSON.stringify(updated));
  } catch (error) {
    console.error('[sessionReportWriter] Error removing pending upload:', error);
  }
};

/**
 * Export session report as JSON file
 * @param {string} reportId - Report ID
 * @returns {Blob} - JSON blob for download
 */
export const exportSessionReportAsJSON = (reportId) => {
  try {
    const report = getSessionReportById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    console.log('[sessionReportWriter] Report exported as JSON:', reportId);
    return blob;
  } catch (error) {
    console.error('[sessionReportWriter] Error exporting report:', error);
    return null;
  }
};

/**
 * Export all session reports as JSON
 * @returns {Blob} - JSON blob for download
 */
export const exportAllSessionReportsAsJSON = () => {
  try {
    const reports = getSessionReports();
    const jsonString = JSON.stringify(reports, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    console.log('[sessionReportWriter] All reports exported as JSON');
    return blob;
  } catch (error) {
    console.error('[sessionReportWriter] Error exporting all reports:', error);
    return null;
  }
};

/**
 * Download session report as JSON file
 * @param {string} reportId - Report ID
 * @param {string} filename - Optional filename
 */
export const downloadSessionReport = (reportId, filename = null) => {
  try {
    const report = getSessionReportById(reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    const blob = exportSessionReportAsJSON(reportId);
    if (!blob) return false;

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `session_report_${reportId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[sessionReportWriter] Report downloaded:', reportId);
    return true;
  } catch (error) {
    console.error('[sessionReportWriter] Error downloading report:', error);
    return false;
  }
};

/**
 * Delete session report
 * @param {string} reportId - Report ID
 * @returns {boolean} - Success status
 */
export const deleteSessionReport = (reportId) => {
  try {
    const reports = getSessionReports();
    const updatedReports = reports.filter(report => report.id !== reportId);

    localStorage.setItem(STORAGE_KEYS.SESSION_REPORTS, JSON.stringify(updatedReports));

    // Also remove from history
    const history = getSessionHistory();
    const updatedHistory = history.filter(report => report.id !== reportId);
    localStorage.setItem(STORAGE_KEYS.SESSION_HISTORY, JSON.stringify(updatedHistory));

    console.log('[sessionReportWriter] Report deleted:', reportId);
    return true;
  } catch (error) {
    console.error('[sessionReportWriter] Error deleting report:', error);
    return false;
  }
};

/**
 * Get storage statistics
 * @returns {Object} - Storage usage info
 */
export const getStorageStatistics = () => {
  try {
    const reports = getSessionReports();
    const pending = getPendingUploads();
    const history = getSessionHistory();

    // Calculate storage size (rough estimate)
    const reportsSize = JSON.stringify(reports).length;
    const pendingSize = JSON.stringify(pending).length;
    const historySize = JSON.stringify(history).length;
    const totalSize = reportsSize + pendingSize + historySize;

    return {
      totalReports: reports.length,
      pendingUploads: pending.length,
      recentSessions: history.length,
      estimatedStorageSize: `${(totalSize / 1024).toFixed(2)} KB`,
      isOffline: !navigator.onLine,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[sessionReportWriter] Error getting storage stats:', error);
    return {
      totalReports: 0,
      pendingUploads: 0,
      recentSessions: 0,
      estimatedStorageSize: '0 KB',
      isOffline: !navigator.onLine,
    };
  }
};

/**
 * Clear all session reports (use with caution)
 * @returns {boolean} - Success status
 */
export const clearAllSessionReports = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION_REPORTS);
    localStorage.removeItem(STORAGE_KEYS.SESSION_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.PENDING_UPLOAD);

    console.log('[sessionReportWriter] All session reports cleared');
    return true;
  } catch (error) {
    console.error('[sessionReportWriter] Error clearing reports:', error);
    return false;
  }
};

/**
 * Generate comprehensive session report object
 * @param {Object} sessionData - Session data from workout
 * @returns {Object} - Complete session report
 */
export const generateCompleteSessionReport = (sessionData) => {
  return {
    exerciseType: sessionData.exerciseType,
    date: new Date().toISOString(),
    duration: sessionData.duration,
    repCount: sessionData.repCount,
    formQuality: sessionData.formQuality,
    rangeOfMotion: sessionData.rangeOfMotion,
    feedback: sessionData.feedback,
    notes: sessionData.notes || '',
    userId: sessionData.userId,
    deviceInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
    },
    metrics: {
      averageQualityScore: sessionData.formQuality?.overallScore || 0,
      grade: sessionData.formQuality?.grade || 'N/A',
      totalFrames: sessionData.frameCount || 0,
    },
  };
};
