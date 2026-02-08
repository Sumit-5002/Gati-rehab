
import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from '../../shared/components/ProtectedRoute';
import { useAuth } from '../../features/auth/context/AuthContext';
import Trends from '../../features/patient/pages/Trends';
import PhysioLink from '../../features/patient/pages/PhysioLink';
import Reports from '../../features/patient/pages/Reports';

function AppRoutes() {
  const { user, userData, loading } = useAuth();

  // Enable automatic session timeout (30 minutes)
  useSessionTimeout(30 * 60 * 1000);

  if (loading) return null; // Let ProtectedRoute handle initial load spin

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={userData?.userType === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'} replace />
            ) : (
              <LandingPage />
            )
          }
        />

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={userData?.userType === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard'} replace />
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
      <Route
        path="/workout"
        element={
          <ProtectedRoute allowedRole="patient">
            <WorkoutSession />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/physio-link"
        element={
          <ProtectedRoute allowedRole="patient">
            <PhysioLink />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/reports"
        element={
          <ProtectedRoute allowedRole="patient">
            <Reports />
          </ProtectedRoute>
        }
      />
      <Route
        path="/patient/trends"
        element={
          <ProtectedRoute allowedRole="patient">
            <Trends />
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
  );
}

export default AppRoutes;
