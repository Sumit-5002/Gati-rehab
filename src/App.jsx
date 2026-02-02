// App.jsx - Main application with routing
// Owner: Sumit Prasad

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import PatientDashboard from './pages/PatientDashboard';
import WorkoutSession from './pages/WorkoutSession';
import DoctorDashboard from './pages/DoctorDashboard';
import PatientDetailView from './pages/PatientDetailView';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Patient Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient-dashboard" element={<PatientDashboard />} />
        <Route path="/workout" element={<WorkoutSession />} />
        
        {/* Doctor Routes */}
        <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
        <Route path="/patient/:patientId" element={<PatientDetailView />} />
        
        {/* Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
