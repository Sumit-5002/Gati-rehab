// Authentication Service
// Handles all Firebase authentication operations

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  collection,
  query,
  where,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from '../../../lib/firebase/config';
import { logAction } from '../../../shared/services/auditLogger';

// Google Sign-In Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with email and password
 */
export const loginWithEmail = async (email, password, userType = 'patient') => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // SPECIAL: Auto-configure Admin if this specific UID logs in
    if (user.uid === 'uK7m9926Oua8JQAt3IpiZ4AWDyM2') {
      console.log('[AuthService] Detected Admin UID. Ensuring Firestore profile exists...');
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        name: 'System Admin',
        userType: 'admin',
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      }, { merge: true });
    }

    // Fetch user data from Firestore
    let userData = await getUserData(user.uid);

    // If user doesn't have Firestore document, auto-create it
    if (!userData) {
      console.log('[AuthService] User document missing, auto-creating...');
      await createUserDocument(user.uid, {
        email: user.email,
        name: user.displayName || 'User',
        userType: userType, // Use the role selected in UI
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      });

      // Re-fetch created data
      userData = await getUserData(user.uid);
    }

    // Safety check - should verify userType matches unless it was just created
    // But for "auto-fix" we assume the login is valid.

    console.log('[AuthService] Login successful:', userData);

    await logAction(user.uid, 'LOGIN', { method: 'email', email: user.email });

    return { user, userData };
  } catch (error) {
    console.error('[AuthService] Login error:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign up with email and password
 */
export const signupWithEmail = async (email, password, name, userType) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user document in Firestore
    await createUserDocument(user.uid, {
      email,
      name,
      userType, // 'patient' or 'doctor'
      createdAt: serverTimestamp(),
    });

    console.log('[AuthService] Signup successful:', user.uid);

    // Audit log
    await logAction(user.uid, 'SIGNUP', { method: 'email', email, userType });

    return { user };
  } catch (error) {
    console.error('[AuthService] Signup error:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign in with Google
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user exists in Firestore
    let userData = await getUserData(user.uid);

    // If new user, create document with patient as default (Google signup)
    // Note: Google login typically used by patients for quick signup
    if (!userData) {
      await createUserDocument(user.uid, {
        email: user.email,
        name: user.displayName || 'User',
        userType: 'patient', // New Google signups default to patient
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        signupMethod: 'google',
      });
      userData = await getUserData(user.uid);
      console.log('[AuthService] Created new patient account via Google');
    }

    console.log('[AuthService] Google login successful:', userData);

    // Audit log
    await logAction(user.uid, 'LOGIN', { method: 'google', email: user.email });

    return { user, userData };
  } catch (error) {
    console.error('[AuthService] Google login error:', error);
    throw handleAuthError(error);
  }
};

/**
 * Setup reCAPTCHA for phone authentication
 */
export const setupRecaptcha = (containerId) => {
  try {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        console.log('[AuthService] reCAPTCHA verified');
      },
      'expired-callback': () => {
        console.log('[AuthService] reCAPTCHA expired');
      },
    });
    return window.recaptchaVerifier;
  } catch (error) {
    console.error('[AuthService] reCAPTCHA setup error:', error);
    throw error;
  }
};

/**
 * Send OTP to phone number
 */
export const sendPhoneOTP = async (phoneNumber, recaptchaVerifier) => {
  try {
    const confirmationResult = await signInWithPhoneNumber(
      auth,
      phoneNumber,
      recaptchaVerifier
    );

    console.log('[AuthService] OTP sent to:', phoneNumber);
    return confirmationResult;
  } catch (error) {
    console.error('[AuthService] Send OTP error:', error);
    throw handleAuthError(error);
  }
};

/**
 * Verify OTP and sign in
 */
export const verifyPhoneOTP = async (confirmationResult, otp) => {
  try {
    const result = await confirmationResult.confirm(otp);
    const user = result.user;

    // Check if user exists in Firestore
    let userData = await getUserData(user.uid);

    // If new user, create document with patient as default (Phone signup)
    // Note: Phone login typically used by patients for quick signup
    if (!userData) {
      await createUserDocument(user.uid, {
        phoneNumber: user.phoneNumber,
        name: 'User', // Can be updated later via profile settings
        userType: 'patient', // New phone signups default to patient
        createdAt: serverTimestamp(),
        signupMethod: 'phone',
      });
      userData = await getUserData(user.uid);
      console.log('[AuthService] Created new patient account via Phone');
    }

    console.log('[AuthService] Phone login successful:', userData);

    // Audit log
    await logAction(user.uid, 'LOGIN', { method: 'phone', phoneNumber: user.phoneNumber });

    return { user, userData };
  } catch (error) {
    console.error('[AuthService] OTP verification error:', error);
    throw handleAuthError(error);
  }
};

/**
 * Send password reset email
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    console.log('[AuthService] Password reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('[AuthService] Password reset error:', error);
    throw handleAuthError(error);
  }
};

/**
 * Sign out current user
 */
export const logout = async () => {
  try {
    await signOut(auth);
    console.log('[AuthService] Logout successful');
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
    throw error;
  }
};

/**
 * Listen to auth state changes
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userData = await getUserData(user.uid);
      callback({ user, userData });
    } else {
      callback(null);
    }
  });
};

/**
 * Subscribe to user data in Firestore
 */
export const subscribeToUserData = (uid, callback) => {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ uid, ...docSnap.data() });
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('[AuthService] Subscribe to user data error:', error);
    callback(null);
  });
};

/**
 * Get user data from Firestore
 */
const getUserData = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { uid, ...userSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('[AuthService] Get user data error:', error);
    return null;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    // Don't allow updating userType via this method for security
    const { userType: _, ...updateData } = data;
    await updateDoc(userRef, {
      ...updateData,
      updatedAt: serverTimestamp()
    });
    console.log('[AuthService] User profile updated:', uid);

    // Audit log
    await logAction(uid, 'UPDATE_PROFILE', { fields: Object.keys(updateData) });

    return { success: true };
  } catch (error) {
    console.error('[AuthService] Update profile error:', error);
    throw error;
  }
};

/**
 * Create user document in Firestore
 */
const createUserDocument = async (uid, data) => {
  try {
    // Check if a placeholder document exists for this email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', data.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const placeholderDoc = querySnapshot.docs[0];
      const placeholderData = placeholderDoc.data();

      // If the placeholder ID is different from the UID, move the data
      if (placeholderDoc.id !== uid) {
        await setDoc(doc(db, 'users', uid), {
          ...placeholderData,
          ...data,
          updatedAt: serverTimestamp()
        });

        // Update doctor_patients link if doctorId exists
        if (placeholderData.doctorId) {
          try {
            await setDoc(doc(db, 'doctor_patients', placeholderData.doctorId, 'patients', uid), {
              assignedAt: placeholderData.createdAt || serverTimestamp(),
              active: true
            });
            await deleteDoc(doc(db, 'doctor_patients', placeholderData.doctorId, 'patients', placeholderDoc.id));
          } catch (err) {
            console.warn('[AuthService] Could not update doctor_patients link:', err);
          }
        }

        // Delete the placeholder
        try {
          await deleteDoc(doc(db, 'users', placeholderDoc.id));
        } catch (e) {
          console.warn('[AuthService] Could not delete placeholder doc:', e);
        }
      } else {
        await setDoc(doc(db, 'users', uid), data, { merge: true });
      }
    } else {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, data);
    }
    console.log('[AuthService] User document created/updated:', uid);
  } catch (error) {
    console.error('[AuthService] Create user document error:', error);
    throw error;
  }
};

/**
 * Handle authentication errors
 */
const handleAuthError = (error) => {
  const errorCode = error.code;
  let message = 'An error occurred. Please try again.';

  switch (errorCode) {
    case 'auth/email-already-in-use':
      message = 'This email is already registered.';
      break;
    case 'auth/invalid-email':
      message = 'Invalid email address.';
      break;
    case 'auth/user-not-found':
      message = 'No account found with this email.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password.';
      break;
    case 'auth/weak-password':
      message = 'Password should be at least 6 characters.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many attempts. Please try again later.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your connection.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Sign-in popup was closed.';
      break;
    case 'auth/invalid-verification-code':
      message = 'Invalid OTP code.';
      break;
    case 'auth/invalid-phone-number':
      message = 'Invalid phone number format.';
      break;
    default:
      message = error.message;
  }

  return new Error(message);
};

/**
 * Demo credentials for quick testing
 */
export const DEMO_CREDENTIALS = {
  doctor: {
    email: 'doctor@demo.com',
    password: 'Demo123!',
  },
  patient: {
    email: 'rajesh@demo.com',
    password: 'Demo123!',
  },
  admin: {
    email: 'admin@demo.com',
    password: 'Demo123!',
  },
};
