// Doctor Service
// Handles all doctor-related Firestore operations

import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Get all patients assigned to a doctor
 */
export const getDoctorPatients = async (doctorId) => {
  try {
    // Get patient IDs from doctor_patients collection
    const doctorPatientsRef = collection(db, 'doctor_patients', doctorId, 'patients');
    const snapshot = await getDocs(doctorPatientsRef);
    
    const patientIds = [];
    snapshot.forEach((doc) => {
      patientIds.push(doc.id);
    });
    
    if (patientIds.length === 0) {
      return [];
    }
    
    // Fetch patient details
    const patients = [];
    for (const patientId of patientIds) {
      try {
        const patientRef = doc(db, 'users', patientId);
        const patientSnap = await getDoc(patientRef);
        
        if (patientSnap.exists()) {
          const data = patientSnap.data();
          patients.push({
            id: patientId,
            name: data.name || 'Unknown',
            condition: data.condition || 'N/A',
            adherenceRate: data.adherenceRate || 0,
            completedSessions: data.completedSessions || 0,
            totalSessions: data.totalSessions || 0,
            lastActive: formatLastActive(data.lastActive),
            progressLevel: getProgressLevel(data.adherenceRate),
          });
        }
      } catch (error) {
        console.error(`[DoctorService] Error fetching patient ${patientId}:`, error);
      }
    }
    
    return patients;
  } catch (error) {
    console.error('[DoctorService] Get patients error:', error);
    return [];
  }
};

/**
 * Get detailed patient information for doctor view
 */
export const getPatientDetails = async (patientId) => {
  try {
    const patientRef = doc(db, 'users', patientId);
    const patientSnap = await getDoc(patientRef);
    
    if (!patientSnap.exists()) {
      throw new Error('Patient not found');
    }
    
    const data = patientSnap.data();
    
    return {
      id: patientId,
      name: data.name || 'Unknown',
      condition: data.condition || 'N/A',
      adherenceRate: data.adherenceRate || 0,
      completedSessions: data.completedSessions || 0,
      totalSessions: data.totalSessions || 0,
      lastActive: formatLastActive(data.lastActive),
      progressLevel: getProgressLevel(data.adherenceRate),
      email: data.email || '',
      phoneNumber: data.phoneNumber || '',
      createdAt: data.createdAt,
    };
  } catch (error) {
    console.error('[DoctorService] Get patient details error:', error);
    throw error;
  }
};

/**
 * Get patient sessions for doctor review
 */
export const getPatientSessions = async (patientId, limitCount = 50) => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('patientId', '==', patientId),
      // orderBy('date', 'desc'), // Uncomment when index is created
      // limit(limitCount)
    );
    
    const snapshot = await getDocs(q);
    const sessions = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        exerciseName: data.exerciseName,
        date: data.date,
        reps: data.reps,
        quality: data.quality,
        rangeOfMotion: data.rangeOfMotion,
        duration: data.duration,
      });
    });
    
    // Sort by date in descending order (client-side)
    sessions.sort((a, b) => {
      const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
      const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
      return dateB - dateA;
    });
    
    return sessions.slice(0, limitCount);
  } catch (error) {
    console.error('[DoctorService] Get patient sessions error:', error);
    return [];
  }
};

/**
 * Get doctor's dashboard statistics
 */
export const getDoctorStats = async (doctorId) => {
  try {
    const patients = await getDoctorPatients(doctorId);
    
    if (patients.length === 0) {
      return {
        totalPatients: 0,
        averageAdherence: 0,
        needsAttention: 0,
      };
    }
    
    const totalPatients = patients.length;
    const averageAdherence = Math.round(
      patients.reduce((sum, p) => sum + p.adherenceRate, 0) / totalPatients
    );
    const needsAttention = patients.filter((p) => p.adherenceRate < 60).length;
    
    return {
      totalPatients,
      averageAdherence,
      needsAttention,
    };
  } catch (error) {
    console.error('[DoctorService] Get doctor stats error:', error);
    return {
      totalPatients: 0,
      averageAdherence: 0,
      needsAttention: 0,
    };
  }
};

/**
 * Subscribe to doctor's patients (real-time)
 */
export const subscribeToDoctorPatients = (doctorId, callback) => {
  const doctorPatientsRef = collection(db, 'doctor_patients', doctorId, 'patients');
  
  return onSnapshot(doctorPatientsRef, async (snapshot) => {
    const patientIds = [];
    snapshot.forEach((doc) => {
      patientIds.push(doc.id);
    });
    
    if (patientIds.length === 0) {
      callback([]);
      return;
    }
    
    // Fetch patient details
    const patients = [];
    for (const patientId of patientIds) {
      try {
        const patientRef = doc(db, 'users', patientId);
        const patientSnap = await getDoc(patientRef);
        
        if (patientSnap.exists()) {
          const data = patientSnap.data();
          patients.push({
            id: patientId,
            name: data.name || 'Unknown',
            condition: data.condition || 'N/A',
            adherenceRate: data.adherenceRate || 0,
            completedSessions: data.completedSessions || 0,
            totalSessions: data.totalSessions || 0,
            lastActive: formatLastActive(data.lastActive),
            progressLevel: getProgressLevel(data.adherenceRate),
          });
        }
      } catch (error) {
        console.error(`[DoctorService] Error fetching patient ${patientId}:`, error);
      }
    }
    
    callback(patients);
  }, (error) => {
    console.error('[DoctorService] Subscribe error:', error);
  });
};

/**
 * Helper: Format last active timestamp
 */
const formatLastActive = (timestamp) => {
  if (!timestamp) return 'Never';
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

/**
 * Helper: Get progress level based on adherence rate
 */
const getProgressLevel = (adherenceRate) => {
  if (adherenceRate >= 90) return 'Excellent';
  if (adherenceRate >= 80) return 'Good';
  if (adherenceRate >= 70) return 'Fair';
  if (adherenceRate >= 60) return 'Needs Improvement';
  return 'Needs Attention';
};
