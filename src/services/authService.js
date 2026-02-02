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
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

// Google Sign-In Provider
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with email and password
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Fetch user data from Firestore
    const userData = await getUserData(user.uid);
    
    console.log('[AuthService] Login successful:', userData);
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
    
    // If new user, create document
    if (!userData) {
      await createUserDocument(user.uid, {
        email: user.email,
        name: user.displayName || 'User',
        userType: 'patient', // Default to patient, can be changed later
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
      });
      userData = await getUserData(user.uid);
    }
    
    console.log('[AuthService] Google login successful:', userData);
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
    
    // If new user, create document
    if (!userData) {
      await createUserDocument(user.uid, {
        phoneNumber: user.phoneNumber,
        name: 'User', // Can be updated later
        userType: 'patient',
        createdAt: serverTimestamp(),
      });
      userData = await getUserData(user.uid);
    }
    
    console.log('[AuthService] Phone login successful:', userData);
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
 * Create user document in Firestore
 */
const createUserDocument = async (uid, data) => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, data);
    console.log('[AuthService] User document created:', uid);
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
};
