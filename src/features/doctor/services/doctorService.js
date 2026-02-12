import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase/config';
import { logAction } from '../../../shared/services/auditLogger';
import { sendNotification } from '../../../shared/services/notificationService';

/**
 * Get all patients assigned to a doctor
 * FIX: Uses Promise.all to fetch patient profiles in parallel (Fixes Point 4)
 */
export const getDoctorPatients = async (doctorId) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('doctorId', '==', doctorId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      const completed = data.completedSessions || 0;
      const total = data.totalSessions || 5;
      const calculatedRate = Math.min(100, Math.round((completed / total) * 100));

      // Use the higher of the two to ensure we show progress immediately
      const effectiveAdherence = Math.max(data.adherenceRate || 0, calculatedRate);

      return {
        id: doc.id,
        name: data.name || 'Unknown',
        condition: data.condition || 'N/A',
        adherenceRate: effectiveAdherence,
        completedSessions: completed,
        totalSessions: total,
        lastActive: formatLastActive(data.lastActive),
        progressLevel: getProgressLevel(effectiveAdherence),
        email: data.email,
        lastSessionQuality: data.lastSessionQuality || 0
      };
    });
  } catch (error) {
    console.error('[DoctorService] Get patients error:', error);
    return [];
  }
};

/**
 * Subscribe to doctor's patients (real-time list)
 * FIX: Optimizes the callback to fetch data in parallel (Fixes Point 3 & 4)
 */
export const subscribeToDoctorPatients = (doctorId, callback) => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('doctorId', '==', doctorId));

  return onSnapshot(q, (snapshot) => {
    const patients = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const completed = data.completedSessions || 0;
      const total = data.totalSessions || 5;
      const calculatedRate = Math.min(100, Math.round((completed / total) * 100));
      const effectiveAdherence = Math.max(data.adherenceRate || 0, calculatedRate);

      patients.push({
        id: doc.id,
        name: data.name || 'Unknown',
        condition: data.condition || 'N/A',
        adherenceRate: effectiveAdherence,
        completedSessions: completed,
        totalSessions: total,
        lastActive: formatLastActive(data.lastActive),
        progressLevel: getProgressLevel(effectiveAdherence),
        injuryType: data.injuryType || 'General',
        rehabPhase: data.rehabPhase || 'Assessment',
        lastSessionQuality: data.lastSessionQuality || 0
      });
    });

    // Sort by last active (most recent first)
    patients.sort((a, b) => { // Move active users to top
      if (a.lastActive.includes('min') && !b.lastActive.includes('min')) return -1;
      if (!a.lastActive.includes('min') && b.lastActive.includes('min')) return 1;
      return 0;
    });

    callback(patients);
  }, (error) => {
    console.error('[DoctorService] Subscribe error:', error);
    callback([]);
  });
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
 * Disconnect a patient from a doctor
 */
export const deletePatientFromDoctor = async (doctorId, patientId) => {
  try {
    // 1. Remove from doctor's patient list
    await deleteDoc(doc(db, 'doctor_patients', doctorId, 'patients', patientId));

    // 2. Remove doctorId from patient's user document
    await updateDoc(doc(db, 'users', patientId), {
      doctorId: null
    });

    // Audit log
    await logAction(doctorId, 'DELETE_PATIENT', { patientId });

    return { success: true };
  } catch (error) {
    console.error('[DoctorService] Delete patient error:', error);
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
      where('patientId', '==', patientId)
      // orderBy('date', 'desc'), 
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
      patients.reduce((sum, p) => {
        let rate = 0;
        if (p.adherenceRate && p.adherenceRate > 0) {
          rate = p.adherenceRate;
        } else {
          const completed = p.completedSessions || 0;
          const total = p.totalSessions || 5;
          rate = Math.min(100, (completed / total) * 100);
        }
        return sum + rate;
      }, 0) / totalPatients
    ) || 0;
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

// --- HELPERS ---

const formatLastActive = (timestamp) => {
  if (!timestamp) return 'Never';

  // Handle Firestore server timestamp objects and pending writes
  if (typeof timestamp === 'object' && !timestamp.toDate) {
    if (timestamp.seconds) { // It's a timestamp but not a full object yet
      const d = new Date(timestamp.seconds * 1000);
      return formatTimeAgo(d);
    }
    return 'Just now';
  }

  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  if (isNaN(date.getTime())) return 'Just now';

  return formatTimeAgo(date);
};

const formatTimeAgo = (date) => {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;

  return date.toLocaleDateString();
};

const getProgressLevel = (adherenceRate) => {
  const rate = parseInt(adherenceRate) || 0;
  if (rate >= 90) return 'Excellent';
  if (rate >= 80) return 'Good';
  if (rate >= 70) return 'Fair';
  if (rate >= 60) return 'Needs Improvement';
  return 'Needs Attention';
};

/**
 * Get aggregated data for all patients to feed into charts
 */
const getClinicSessionData = async (patients, days = 7) => {
  if (!patients || patients.length === 0) return [];

  try {
    const allSessions = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - days);

    // Fetch sessions for all patients in parallel
    const sessionPromises = patients.map(async (p) => {
      const q = query(
        collection(db, 'sessions'),
        where('patientId', '==', p.id),
        where('date', '>=', startDate)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ ...doc.data(), patientId: p.id }));
    });

    const results = await Promise.all(sessionPromises);
    results.forEach(patientSessions => allSessions.push(...patientSessions));

    console.log(`[DoctorService] Aggregated ${allSessions.length} total sessions for ${patients.length} patients over ${days} days`);
    return allSessions;
  } catch (error) {
    console.error('[DoctorService] Error fetching clinic session data:', error);
    return [];
  }
};

/**
 * Get adherence trend data for charts (last 7 days)
 */
export const getAdherenceTrendData = async (doctorId, patients = null, timeframe = 'weekly') => {
  try {
    if (!patients) patients = await getDoctorPatients(doctorId);
    if (patients.length === 0) return [];

    const daysCount = timeframe === 'monthly' ? 30 : 7;
    const sessions = await getClinicSessionData(patients, daysCount);

    const trendDays = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      trendDays.push(d);
    }

    return trendDays.map(date => {
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      // Real adherence: % of patients who did at least one session on this specific day
      const patientsWhoWorkedOut = new Set(
        sessions
          .filter(s => {
            const sDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
            return sDate.setHours(0, 0, 0, 0) === date.getTime();
          })
          .map(s => s.patientId)
      ).size;

      const adherence = Math.round((patientsWhoWorkedOut / patients.length) * 100);

      return {
        date: dateStr,
        adherence: adherence || 0 // No variation, just truth
      };
    });
  } catch (error) {
    console.error('[DoctorService] Get adherence trend error:', error);
    return [];
  }
};

/**
 * Get form quality trend data for charts (last 7 days)
 */
export const getFormQualityTrendData = async (doctorId, patients = null, timeframe = 'weekly') => {
  try {
    if (!patients) patients = await getDoctorPatients(doctorId);
    if (patients.length === 0) return [];

    const daysCount = timeframe === 'monthly' ? 30 : 7;
    const sessions = await getClinicSessionData(patients, daysCount);

    const trendDays = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      trendDays.push(d);
    }

    return trendDays.map(date => {
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dailySessions = sessions.filter(s => {
        const sDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        const sTime = new Date(sDate).setHours(0, 0, 0, 0);
        return sTime === date.getTime();
      });

      const avgQuality = dailySessions.length > 0
        ? Math.round(dailySessions.reduce((sum, s) => sum + (s.quality || 0), 0) / dailySessions.length)
        : 0;

      return {
        date: dateStr,
        quality: avgQuality
      };
    });
  } catch (error) {
    console.error('[DoctorService] Get form quality trend error:', error);
    return [];
  }
};

/**
 * Get ROM trend data for charts (last 4 weeks/days)
 */
export const getROMTrendData = async (doctorId, patients = null, timeframe = 'weekly') => {
  try {
    if (!patients) patients = await getDoctorPatients(doctorId);
    if (patients.length === 0) return [];

    const daysCount = timeframe === 'monthly' ? 30 : 7;
    const sessions = await getClinicSessionData(patients, daysCount);

    const trendDays = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      trendDays.push(d);
    }

    // Joint Mapping
    const jointMap = {
      'knee-bends': 'knee',
      'knee-bend': 'knee',
      'squat': 'knee',
      'squats': 'knee',
      'leg-raises': 'hip',
      'leg-raise': 'hip',
      'hip-flexion': 'hip',
      'standing-march': 'hip',
      'shoulder-raises': 'shoulder',
      'arm-raise': 'shoulder',
      'arm-circles': 'shoulder',
      'elbow-flexion': 'elbow',
      'calf-raises': 'ankle'
    };

    return trendDays.map(date => {
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dailySessions = sessions.filter(s => {
        const sDate = s.date?.toDate ? s.date.toDate() : new Date(s.date);
        const sTime = new Date(sDate).setHours(0, 0, 0, 0);
        return sTime === date.getTime();
      });

      const getAvgROM = (joint) => {
        const jointSessions = dailySessions.filter(s => jointMap[s.exerciseId || s.exerciseName?.toLowerCase()] === joint);
        return jointSessions.length > 0
          ? Math.round(jointSessions.reduce((sum, s) => sum + (s.rangeOfMotion || 0), 0) / jointSessions.length)
          : 0;
      };

      return {
        date: dateStr,
        knee: getAvgROM('knee'),
        hip: getAvgROM('hip'),
        shoulder: getAvgROM('shoulder'),
        ankle: getAvgROM('ankle')
      };
    });
  } catch (error) {
    console.error('[DoctorService] Get ROM trend error:', error);
    return [];
  }
};

/**
 * Assign a patient to a doctor
 */
export const addPatientToDoctor = async (doctorId, patientData) => {
  try {
    if (!patientData.email) throw new Error("Patient email is required");

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', patientData.email));
    const querySnapshot = await getDocs(q);

    let patientId;
    let isNewUser = false;

    if (!querySnapshot.empty) {
      // User exists, update them
      patientId = querySnapshot.docs[0].id;
      const existingData = querySnapshot.docs[0].data();

      // If already assigned to another doctor, we override (or could throw error)
      await updateDoc(doc(db, 'users', patientId), {
        doctorId: doctorId,
        // Update profile details if they were placeholders
        name: patientData.name || existingData.name,
        phoneNumber: patientData.phoneNumber || existingData.phoneNumber || '',
        condition: patientData.condition || existingData.condition || ''
      });
    } else {
      // Create new user shell (Invite flow)
      // We use addDoc to generate an auto-ID since we don't have their UID yet
      // When they sign up, the Auth UID will be different. Handled by linking or checking email on signup.
      // Ideally, we wait for them to sign up. But here we create a placeholder.
      // Actually, standard pattern: Create a doc. When they sign up, we match by email and merge.
      const newDocRef = await addDoc(collection(db, 'users'), {
        ...patientData,
        userType: 'patient',
        doctorId: doctorId,
        createdAt: serverTimestamp(),
        adherenceRate: 0,
        completedSessions: 0,
        totalSessions: 5,
        streak: 0,
        isInvite: true // Flag to indicate this is a placeholder
      });
      patientId = newDocRef.id;
      isNewUser = true;
    }

    // Legacy support: Add to doctor_patients subcollection
    // (We keep this for now to avoid breaking other parts, though main read is from users)
    await setDoc(doc(db, 'doctor_patients', doctorId, 'patients', patientId), {
      assignedAt: serverTimestamp(),
      active: true,
      patientEmail: patientData.email
    });

    await logAction(doctorId, 'ADD_PATIENT', { patientId, patientName: patientData.name, isNewUser });

    // Notify patient if they already exist
    if (!isNewUser) {
      await sendNotification(patientId, {
        title: 'New Specialist Assigned',
        message: 'A physical rehabilitation specialist has been assigned to your care plan.',
        type: 'info'
      });
    }

    console.log('[DoctorService] Add patient result:', { patientId, isNewUser });

    return { id: patientId, success: true, isNewUser };
  } catch (error) {
    console.error('[DoctorService] Add patient error:', error);
    throw error;
  }
};

export const getPatientRoutine = async (patientId) => {
  try {
    const routineRef = doc(db, 'routines', patientId);
    const snapshot = await getDoc(routineRef);
    if (snapshot.exists()) {
      return snapshot.data();
    }
    return null;
  } catch (error) {
    console.error('[DoctorService] Get routine error:', error);
    return null;
  }
};

export const updatePatientRoutine = async (patientId, routineData) => {
  try {
    const routineRef = doc(db, 'routines', patientId);
    // Merge true allows us to update without overwriting other fields if they exist
    await setDoc(routineRef, {
      ...routineData,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    // Audit log using the current authenticated user (doctor) as the actor
    const actorId = auth.currentUser?.uid || 'unknown';
    await logAction(actorId, 'UPDATE_ROUTINE', { patientId, updatedBy: 'doctor' });

    // Send notification to patient
    await sendNotification(patientId, {
      title: 'Treatment Plan Updated',
      message: 'Your specialist has updated your rehabilitation routine. Check your new schedule.',
      type: 'info'
    });

    return { success: true };
  } catch (error) {
    console.error('[DoctorService] Update routine error:', error);
    throw error;
  }
};

/**
 * Medications Management
 */
export const getPatientMedications = async (patientId) => {
  try {
    const q = query(collection(db, 'medications'), where('userId', '==', patientId));
    const snapshot = await getDocs(q);
    const meds = [];
    snapshot.forEach((doc) => meds.push({ id: doc.id, ...doc.data() }));
    return meds;
  } catch (error) {
    console.error('[DoctorService] Get medications error:', error);
    return [];
  }
};

export const addMedication = async (patientId, medData) => {
  try {
    const docRef = await addDoc(collection(db, 'medications'), {
      ...medData,
      userId: patientId,
      takenToday: false,
      createdAt: serverTimestamp()
    });

    // Send notification to patient
    await sendNotification(patientId, {
      title: 'New Medication Added',
      message: `Your doctor has added ${medData.name} to your daily protocol.`,
      type: 'info'
    });

    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('[DoctorService] Add medication error:', error);
    throw error;
  }
};

export const deleteMedication = async (medId) => {
  try {
    await deleteDoc(doc(db, 'medications', medId));
    return { success: true };
  } catch (error) {
    console.error('[DoctorService] Delete medication error:', error);
    throw error;
  }
};