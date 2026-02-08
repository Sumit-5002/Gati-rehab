// PatientDetailView - Detailed view of patient progress with charts
// Owner: Member 5

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ArrowLeft, User, Calendar, Activity, Mail, Phone, TrendingUp, ClipboardList } from 'lucide-react';
const PatientROMProgressChart = lazy(() => import('../components/charts/PatientROMProgressChart'));
const PatientQualityTrendChart = lazy(() => import('../components/charts/PatientQualityTrendChart'));
import NavHeader from '../../../shared/components/NavHeader';
import SessionReport from '../../patient/components/SessionReport';
import ManagePlanModal from '../components/modals/ManagePlanModal';
import ChatWindow from '../../shared/components/ChatWindow';
import { onAuthChange } from '../../auth/services/authService';
import { getPatientDetails, getPatientSessions } from '../services/doctorService';
import { exportToCSV } from '../../../shared/utils/csvExport';
import { logAction } from '../../../shared/utils/auditLogger';

const PatientDetailView = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  // State management
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [patient, setPatient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [chartData, setChartData] = useState({ rom: [], quality: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [managePlanOpen, setManagePlanOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  // Auth listener - Get doctor profile
  useEffect(() => {
    const unsubscribe = onAuthChange((authData) => {
      if (authData && authData.userData) {
        if (authData.userData.userType === 'doctor') {
          setDoctorProfile({
            id: authData.user.uid,
            name: authData.userData.name || 'Doctor',
            email: authData.userData.email,
            specialization: authData.userData.specialization || 'Physiotherapist',
            photoURL: authData.userData.photoURL || null,
          });
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch patient data & Sessions
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        // 1. Fetch Patient Profile
        const patientData = await getPatientDetails(patientId);
        setPatient(patientData);

        // 2. Fetch Patient Sessions
        const sessionsData = await getPatientSessions(patientId);
        setSessions(sessionsData);

        // 3. Process Data for Charts
        // Sort sessions by date (oldest to newest) for charts
        const sortedSessions = [...sessionsData].sort((a, b) => {
          const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
          const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
          return dateA - dateB;
        });

        // Map to chart format
        const romTrend = sortedSessions.map(s => ({
          date: s.date?.toDate ? s.date.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          rom: s.rangeOfMotion || 0,
          exercise: s.exerciseName || 'General'
        }));

        const qualityTrend = sortedSessions.map(s => ({
          date: s.date?.toDate ? s.date.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A',
          score: s.quality || 0
        }));

        setChartData({ rom: romTrend, quality: qualityTrend });
        setLoading(false);
      } catch (error) {
        console.error('[PatientDetailView] Error fetching patient:', error);
        setError('Could not load patient details.');
        setLoading(false);
      }
    };

    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  const handleExportData = async () => {
    if (!sessions || sessions.length === 0) return;

    const exportData = sessions.map(s => ({
      Exercise: s.exerciseName,
      Date: s.date?.toDate ? s.date.toDate().toLocaleString() : s.date,
      Reps: s.reps,
      'Quality Score %': s.quality,
      'Range of Motion (Deg)': s.rangeOfMotion,
      'Duration (Sec)': s.duration
    }));

    if (doctorProfile) {
      await logAction(doctorProfile.id, 'EXPORT_DATA', { patientId, patientName: patient?.name });
    }

    exportToCSV(exportData, `Clinical_Report_${patient?.name?.replace(/\s+/g, '_')}_${new Date().toLocaleDateString()}.csv`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavHeader userType="doctor" doctorProfile={doctorProfile} />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium">Loading patient details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="min-h-screen bg-gray-50">
        <NavHeader userType="doctor" doctorProfile={doctorProfile} />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/doctor-dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Patients</span>
          </button>
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-red-500 font-medium">{error || 'Patient not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader userType="doctor" doctorProfile={doctorProfile} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Actions Row */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/doctor-dashboard')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="font-medium">Back to Patients</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportData}
              disabled={sessions.length === 0}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export Clinical Report
            </button>
            <button
              onClick={() => setChatOpen(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <MessageSquare className="w-4 h-4" />
              Message Patient
            </button>
            <button
              onClick={() => setManagePlanOpen(true)}
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              <ClipboardList className="w-4 h-4" />
              Manage Care Plan
            </button>
          </div>
        </div>

        {/* Patient Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
                <User className="w-10 h-10 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-black text-gray-900 leading-tight">
                  {patient.name}
                </h1>
                <p className="text-lg font-medium text-gray-500 mt-1">{patient.condition}</p>
                
                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {patient.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{patient.email}</span>
                    </div>
                  )}
                  {patient.phoneNumber && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{patient.phoneNumber}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Last active: {patient.lastActive}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    <span>
                      Sessions: {patient.completedSessions}/{patient.totalSessions}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adherence Badge */}
            <div className="text-center bg-green-50 border border-green-100 rounded-2xl p-6 min-w-[160px]">
              <div className="text-4xl font-black text-green-600">
                {patient.adherenceRate}%
              </div>
              <p className="text-sm text-gray-600 mt-1 font-bold">Adherence Rate</p>
              <div className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                <TrendingUp className="w-3 h-3" />
                {patient.progressLevel}
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {sessions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Range of Motion Trend */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Range of Motion Progress
              </h2>
              <Suspense fallback={<div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl animate-pulse">Loading ROM...</div>}>
                <PatientROMProgressChart data={chartData.rom} />
              </Suspense>
            </div>

            {/* Quality Score Trend */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Session Quality Trend
              </h2>
              <Suspense fallback={<div className="h-[300px] flex items-center justify-center bg-slate-50 rounded-xl animate-pulse">Loading Quality...</div>}>
                <PatientQualityTrendChart data={chartData.quality} />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center mb-6">
            <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-gray-900">No Session Data Yet</h3>
            <p className="text-gray-500">This patient hasn't completed any exercise sessions.</p>
          </div>
        )}

        {/* Recent Sessions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Sessions
          </h2>
          {sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.map((session, index) => (
                <SessionReport key={session.id || index} sessionData={{
                  ...session,
                  date: session.date?.toDate ? session.date.toDate().toLocaleDateString() : session.date,
                  duration: session.duration ? `${Math.round(session.duration / 60)} min` : 'N/A'
                }} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent activity to display.</p>
          )}
        </div>
      </div>

      <ManagePlanModal 
        isOpen={managePlanOpen}
        onClose={() => setManagePlanOpen(false)}
        patientId={patientId}
        patientName={patient?.name || 'Patient'}
      />

      {chatOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setChatOpen(false)} />
          <div className="relative w-full max-w-lg">
            <button
              onClick={() => setChatOpen(false)}
              className="absolute -top-12 right-0 text-white hover:text-blue-200 transition-colors flex items-center gap-2 font-bold"
            >
              <X className="w-6 h-6" /> Close Chat
            </button>
            <ChatWindow
              currentUser={{ uid: doctorProfile.id }}
              otherUser={{ uid: patientId, name: patient.name }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientDetailView;
