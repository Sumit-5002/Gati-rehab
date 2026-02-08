
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../../shared/components/ProtectedRoute';
import { useAuth } from '../../features/auth/context/AuthContext';

// Lazy load pages for performance
const LandingPage = lazy(() => import('../../features/auth/pages/LandingPage'));
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage'));
const PatientDashboard = lazy(() => import('../../features/patient/pages/PatientDashboard'));
const PatientProfile = lazy(() => import('../../features/patient/pages/PatientProfile'));
const ExerciseHistory = lazy(() => import('../../features/patient/pages/ExerciseHistory'));
const WorkoutSession = lazy(() => import('../../features/patient/pages/WorkoutSession'));
const DoctorDashboard = lazy(() => import('../../features/doctor/pages/DoctorDashboard'));
const PatientDetailView = lazy(() => import('../../features/doctor/pages/PatientDetailView'));
const AdminDashboard = lazy(() => import('../../features/admin/pages/AdminDashboard'));

// Loading component for Suspense
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">Initializing...</p>
    </div>
  </div>
);

function AppRoutes() {
  const { user, userData, loading } = useAuth();

  if (loading) return null; // Let ProtectedRoute handle initial load spin

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            user ? (
            <Navigate to={
              userData?.userType === 'admin' ? '/admin-dashboard' :
              userData?.userType === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'
            } replace />
            ) : (
              <LandingPage />
            )
          }
        />

        <Route
          path="/login"
          element={
            user ? (
            <Navigate to={
              userData?.userType === 'admin' ? '/admin-dashboard' :
              userData?.userType === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'
            } replace />
            ) : (
              <LoginPage />
            )
          }
        />

        {/* Patient Routes */}
        <Route
          path="/patient-dashboard"
          element={
            <ProtectedRoute allowedRole="patient">
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRole="patient">
              <PatientProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute allowedRole="patient">
              <ExerciseHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workout"
          element={
            <ProtectedRoute allowedRole="patient">
              <WorkoutSession />
            </ProtectedRoute>
          }
        />

        {/* Doctor Routes */}
        <Route
          path="/doctor-dashboard"
          element={
            <ProtectedRoute allowedRole="doctor">
              <DoctorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/patient/:patientId"
          element={
            <ProtectedRoute allowedRole="doctor">
              <PatientDetailView />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
