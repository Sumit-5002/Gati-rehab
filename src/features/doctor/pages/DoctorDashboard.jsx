
import { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  TrendingUp,
  AlertTriangle,
  Activity,
  Plus,
  LayoutGrid,
  List,
  Calendar,
  ChevronRight,
  Target
} from 'lucide-react';
import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { lazy, Suspense } from 'react';
import NavHeader from '../../../shared/components/NavHeader';
import Footer from '../../../shared/components/Footer';
import { useTheme } from '../../../contexts/ThemeContext';
import PatientCard from '../components/PatientCard';
const AdherenceTrendChart = lazy(() => import('../components/charts/AdherenceTrendChart'));
const FormQualityChart = lazy(() => import('../components/charts/FormQualityChart'));
const ROMTrendChart = lazy(() => import('../components/charts/ROMTrendChart'));
import SettingsModal from '../components/modals/SettingsModal';
import QuickActionsPanel from '../components/QuickActionsPanel';
import DoctorProfileCard from '../components/DoctorProfileCard';
import ReportsModal from '../components/modals/ReportsModal';
import AddPatientModal from '../components/modals/AddPatientModal';
import NeuralChatModal from '../components/modals/NeuralChatModal';
import SchedulerModal from '../components/modals/SchedulerModal'; // Use specialized Scheduler
import VideoConsultationModal from '../../../shared/components/modals/VideoConsultationModal';
import {
  subscribeToDoctorPatients,
  getAdherenceTrendData,
  getFormQualityTrendData,
  getROMTrendData,
} from '../services/doctorService';
import { generateDoctorInsights } from '../utils/insightGenerator';
import { useAuth } from '../../auth/context/AuthContext';
import { updateUserProfile } from '../../auth/services/authService';

const DoctorDashboard = () => {
  const { userData, user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleSettingsSave = async (data) => {
    try {
      await updateUserProfile(user.uid, data);
      console.log('[DoctorDashboard] Settings updated successfully');
    } catch (error) {
      console.error('[DoctorDashboard] Settings update failed:', error);
    }
  };

  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAdherence, setFilterAdherence] = useState('all');
  const [stats, setStats] = useState({
    totalPatients: 0,
    averageAdherence: 0,
    averageQuality: 0,
    needsAttention: 0,
  });

  const [chartData, setChartData] = useState({
    adherenceTrend: [],
    formQualityTrend: [],
    romTrend: [],
  });
  const [chartsLoading, setChartsLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addPatientOpen, setAddPatientOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [reportsOpen, setReportsOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [timeframe, setTimeframe] = useState('weekly');

  const handleActionClick = (id) => {
    if (id === 'add-patient') {
      setAddPatientOpen(true);
    } else if (id === 'neural-chat') {
      setChatOpen(true);
    } else if (id === 'schedule') {
      setAppointmentOpen(true);
    } else if (id === 'video-call') {
      setVideoOpen(true);
    } else if (id === 'reports') {
      setReportsOpen(true);
    } else {
      console.log(`Action ${id} not implemented yet`);
    }
  };

  // Subscription and Data Fetching
  useEffect(() => {
    if (!user || userData?.userType !== 'doctor') return;

    // 1. Listen for patient updates
    const unsubscribe = subscribeToDoctorPatients(user.uid, async (updatedPatients) => {
      setPatients(updatedPatients);

      // Generate AI insights asynchronously
      setInsightsLoading(true);
      try {
        const insights = await generateDoctorInsights(updatedPatients);
        setAiInsights(insights);
      } catch (err) {
        console.error('Error generating insights:', err);
        setAiInsights([{
          id: 'error',
          type: 'info',
          title: 'Analysis Pending',
          message: 'Neural insights will appear once patient data is processed.',
          color: 'blue'
        }]);
      } finally {
        setInsightsLoading(false);
      }
      setLoading(false);
    });

    // 3. Listen for appointments
    const qApps = query(
      collection(db, 'appointments'),
      where('doctorId', '==', user.uid)
    );

    const unsubApps = onSnapshot(qApps, (snapshot) => {
      const apps = [];
      snapshot.forEach((doc) => apps.push({ id: doc.id, ...doc.data() }));
      // Sort by date in memory instead of Firestore query
      apps.sort((a, b) => {
        const dateA = new Date(a.date || 0);
        const dateB = new Date(b.date || 0);
        return dateB - dateA;
      });
      setAppointments(apps);
    }, (error) => {
      console.error('[DoctorDashboard] Appointments listener error:', error);
      setAppointments([]);
    });

    return () => {
      unsubscribe();
      unsubApps();
    };
  }, [user, userData]);

  // Stats calculation with smart adherence fallback
  useEffect(() => {
    if (patients.length > 0) {
      const total = patients.length;

      const adherenceValues = patients.map(p => {
        // Use adherenceRate if explicitly set, otherwise calculate
        const completed = p.completedSessions || 0;
        const totalSessions = p.totalSessions || 5;
        const calculatedRate = Math.min(100, Math.round((completed / totalSessions) * 100));

        return Math.max(p.adherenceRate || 0, calculatedRate);
      });

      const avg = Math.round(adherenceValues.reduce((sum, val) => sum + val, 0) / total) || 0;

      // Calculate real average quality from patients' last session quality
      const qualityValues = patients.map(p => p.lastSessionQuality || 0).filter(q => q > 0);
      const avgQual = qualityValues.length > 0
        ? Math.round(qualityValues.reduce((sum, val) => sum + val, 0) / qualityValues.length)
        : 0;

      const urgent = patients.filter((p, i) => adherenceValues[i] < 60).length;

      setStats({
        totalPatients: total,
        averageAdherence: avg,
        averageQuality: avgQual,
        needsAttention: urgent
      });
    } else {
      setStats({ totalPatients: 0, averageAdherence: 0, needsAttention: 0 });
    }
  }, [patients]);

  // Separate effect for charts to handle timeframe changes
  useEffect(() => {
    const updateCharts = async () => {
      if (!user || patients.length === 0) {
        setChartsLoading(false);
        return;
      }

      try {
        setChartsLoading(true);
        const [adherence, quality, rom] = await Promise.all([
          getAdherenceTrendData(user.uid, patients, timeframe),
          getFormQualityTrendData(user.uid, patients, timeframe),
          getROMTrendData(user.uid, patients, timeframe),
        ]);
        setChartData({ adherenceTrend: adherence, formQualityTrend: quality, romTrend: rom });
      } catch (err) {
        console.error('Error fetching charts:', err);
      } finally {
        setChartsLoading(false);
      }
    };

    updateCharts();
  }, [user, patients, timeframe]);

  const filteredPatients = patients.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterAdherence === 'all' ||
      (filterAdherence === 'high' && p.adherenceRate >= 80) ||
      (filterAdherence === 'medium' && p.adherenceRate >= 60 && p.adherenceRate < 80) ||
      (filterAdherence === 'low' && p.adherenceRate < 60);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-teal-600 border-opacity-20 border-t-teal-600"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Accessing Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#F1F5F9]'}`}>
      <NavHeader
        userType="doctor"
        theme={isDarkMode ? 'dark' : 'light'}
        onThemeToggle={toggleTheme}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 safe-area-inset">
        {/* Modern Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Clinic <span className="text-blue-600">Overview</span>
            </h1>
          </div>

          <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-4 p-2 rounded-[2rem] shadow-xl border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-none' : 'bg-white border-white shadow-slate-200/50'}`}>
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search patients..."
                className={`pl-12 pr-6 py-4 border-none rounded-2xl text-base w-full sm:w-80 font-bold focus:ring-4 focus:ring-blue-100 transition-all ${isDarkMode ? 'bg-gray-700 text-white placeholder-slate-500' : 'bg-slate-50 text-slate-900'}`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setAddPatientOpen(true)}
              className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-800 transition-all transform active:scale-95 shadow-xl shadow-slate-300"
            >
              <Plus className="w-6 h-6" /> Add New Patient
            </button>
          </div>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <DetailStatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={<Users className="w-6 h-6" />}
            color="blue"
            trend="+2 this week"
            description="Active recovery plans"
            isDarkMode={isDarkMode}
          />
          <DetailStatCard
            title="Avg. Adherence"
            value={`${stats.averageAdherence}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="emerald"
            trend="Stable"
            description="Cross-patient average"
            isDarkMode={isDarkMode}
          />
          <DetailStatCard
            title="Avg. Quality"
            value={`${stats.averageQuality}%`}
            icon={<Activity className="w-6 h-6" />}
            color="indigo"
            trend={stats.averageQuality > 80 ? 'Optimal' : 'Checking'}
            description="Exercise execution"
            isDarkMode={isDarkMode}
          />
          <DetailStatCard
            title="High Risks"
            value={stats.needsAttention}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="rose"
            trend="Needs Review"
            isAlert={stats.needsAttention > 0}
            description="Below 60% adherence"
            isDarkMode={isDarkMode}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Charts Section */}
            <div className={`p-6 sm:p-8 rounded-[2rem] shadow-xl border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-none' : 'bg-white border-slate-50 shadow-slate-200/50'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className={`text-xl sm:text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Clinical Analytics</h3>
                </div>
                <div className={`flex p-1.5 rounded-2xl w-full sm:w-auto ${isDarkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
                  <button
                    onClick={() => setTimeframe('weekly')}
                    className={`px-4 py-2 text-sm font-black rounded-xl flex-1 sm:flex-none transition-all ${timeframe === 'weekly' ? (isDarkMode ? 'bg-gray-600 shadow-lg text-blue-400' : 'bg-white shadow-lg text-blue-600') : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setTimeframe('monthly')}
                    className={`px-4 py-2 text-sm font-black rounded-xl flex-1 sm:flex-none transition-all ${timeframe === 'monthly' ? (isDarkMode ? 'bg-gray-600 shadow-lg text-blue-400' : 'bg-white shadow-lg text-blue-600') : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Monthly
                  </button>
                </div>
              </div>
              <Suspense fallback={<div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse text-slate-400 font-bold uppercase text-xs tracking-widest">Loading Analytics...</div>}>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <AdherenceTrendChart data={chartData.adherenceTrend} loading={chartsLoading} timeframe={timeframe} isDarkMode={isDarkMode} />
                  </div>
                  <div className="space-y-4">
                    <FormQualityChart data={chartData.formQualityTrend} loading={chartsLoading} timeframe={timeframe} isDarkMode={isDarkMode} />
                  </div>
                </div>
              </Suspense>
            </div>

            <div className={`p-6 sm:p-8 rounded-[2rem] shadow-xl border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-none' : 'bg-white border-slate-50 shadow-slate-200/50'}`}>
              <Suspense fallback={<div className={`h-64 flex items-center justify-center rounded-2xl animate-pulse font-bold uppercase text-xs tracking-widest ${isDarkMode ? 'bg-gray-700 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>Loading Biometrics...</div>}>
                <ROMTrendChart data={chartData.romTrend} loading={chartsLoading} timeframe={timeframe} isDarkMode={isDarkMode} />
              </Suspense>
            </div>

            {/* Patient List Section */}
            <div className={`p-6 sm:p-8 rounded-[2rem] shadow-xl border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-none' : 'bg-white border-slate-50 shadow-slate-200/50'}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className={`text-xl sm:text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Patient Directory</h3>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <select
                    className={`border-none rounded-xl text-sm font-bold py-2.5 px-4 focus:ring-4 focus:ring-blue-100 w-full sm:w-auto transition-all ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-slate-50 text-slate-600'}`}
                    value={filterAdherence}
                    onChange={(e) => setFilterAdherence(e.target.value)}
                  >
                    <option value="all">Status: All Patients</option>
                    <option value="high">High (80%+)</option>
                    <option value="medium">Medium (60-80%)</option>
                    <option value="low">Low (60%-)</option>
                  </select>
                  <div className={`flex p-1.5 rounded-2xl w-full sm:w-auto ${isDarkMode ? 'bg-gray-700' : 'bg-slate-100'}`}>
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? (isDarkMode ? 'bg-gray-600 shadow-md text-blue-400' : 'bg-white shadow-md text-blue-600') : 'text-slate-400 hover:text-slate-200'} flex-1 sm:flex-none`}>
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? (isDarkMode ? 'bg-gray-600 shadow-md text-blue-400' : 'bg-white shadow-md text-blue-600') : 'text-slate-400 hover:text-slate-200'} flex-1 sm:flex-none`}>
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className={viewMode === 'grid' ? "grid grid-cols-1 gap-6" : "space-y-4"}>
                {filteredPatients.map(p => (
                  <PatientCard key={p.id} patient={p} viewMode={viewMode} />
                ))}
                {filteredPatients.length === 0 && (
                  <div className={`py-16 text-center rounded-[2rem] border-2 border-dashed transition-all ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-slate-50 border-slate-200'}`}>
                    <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-slate-200'}`} />
                    <p className={`text-lg font-black ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>No matching patients discovered.</p>
                    <p className="text-slate-400 mt-2 font-bold">Try adjusting your filters or search term.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Area - Stacks on mobile */}
          <div className="lg:col-span-4 space-y-8">
            <DoctorProfileCard
              doctorProfile={userData}
              onEditClick={() => setSettingsOpen(true)}
            />

            <QuickActionsPanel onActionClick={handleActionClick} />

            {/* AI Insights Sidebar */}
            <div className="bg-slate-900 text-white rounded-[2rem] p-6 sm:p-8 shadow-2xl shadow-slate-900/30 relative overflow-hidden group">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/20">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black">Neural Insights</h4>
                  </div>
                </div>
                <div className="space-y-4">
                  {insightsLoading ? (
                    <div className="flex flex-col items-center justify-center py-8 gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-400"></div>
                      <p className="text-slate-400 text-xs font-bold italic">Generating AI insights...</p>
                    </div>
                  ) : (
                    <>
                      {aiInsights.map((insight) => (
                        <div key={insight.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group/item">
                          <div className="flex items-center justify-between mb-2">
                            <p className={`text-[10px] ${insight.color === 'emerald' ? 'text-emerald-400' : insight.color === 'blue' ? 'text-blue-400' : 'text-indigo-400'} font-black uppercase tracking-widest`}>{insight.title}</p>
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover/item:translate-x-1 transition-transform" />
                          </div>
                          <p className="text-sm font-bold text-slate-200">{insight.message}</p>
                        </div>
                      ))}
                      {aiInsights.length === 0 && !insightsLoading && (
                        <p className="text-slate-500 text-xs font-bold italic text-center py-4">No insights available yet.</p>
                      )}
                    </>
                  )}
                </div>
                <button
                  onClick={() => setReportsOpen(true)}
                  className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition-all shadow-lg shadow-blue-600/20 transform active:scale-95"
                >
                  View Full Analysis
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-600/10 rounded-full blur-2xl -ml-8 -mb-8"></div>
            </div>

            {/* Upcoming Appointments */}
            <div className={`p-6 rounded-[2rem] shadow-xl border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-none' : 'bg-white border-slate-50 shadow-slate-200/50'}`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Next Sessions</h3>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-3">
                {appointments.slice(0, 3).map(app => (
                  <AppointmentRow
                    key={app.id}
                    name={app.patientName}
                    time={`${app.date} ${app.time}`}
                    type={app.type}
                    status={app.status}
                    isDarkMode={isDarkMode}
                    onJoin={app.status === 'confirmed' && app.type === 'Video Call' ? () => {
                      setSelectedRoom(`Gati_Session_${app.id}`);
                      setVideoOpen(true);
                    } : null}
                  />
                ))}
                {appointments.length === 0 && (
                  <p className="text-center py-4 text-slate-400 text-xs font-bold italic">No scheduled sessions</p>
                )}
              </div>
              <button
                onClick={() => setAppointmentOpen(true)}
                className={`w-full mt-6 py-3 transition-colors rounded-xl font-bold flex items-center justify-center gap-2 ${isDarkMode ? 'bg-gray-700 text-slate-400 hover:text-blue-400' : 'bg-slate-50 text-slate-400 hover:text-blue-600'}`}
              >
                Open Calendar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>


      </main>

      <Footer />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        doctorProfile={userData}
        onSave={handleSettingsSave}
      />

      <AddPatientModal
        isOpen={addPatientOpen}
        onClose={() => setAddPatientOpen(false)}
        doctorId={user?.uid}
      />

      <NeuralChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
      />

      <SchedulerModal
        isOpen={appointmentOpen}
        onClose={() => setAppointmentOpen(false)}
        doctorId={user?.uid}
        patients={patients}
        onJoinCall={(room) => {
          setSelectedRoom(room);
          setVideoOpen(true);
        }}
      />

      <VideoConsultationModal
        isOpen={videoOpen}
        onClose={() => setVideoOpen(false)}
        roomName={selectedRoom}
      />

      <ReportsModal
        isOpen={reportsOpen}
        onClose={() => setReportsOpen(false)}
        patients={patients}
      />
    </div>
  );
};

const AppointmentRow = ({ name, time, type, status, onJoin, isDarkMode }) => (
  <div className={`flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer group ${isDarkMode ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-slate-50 hover:bg-slate-100'}`}>
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <Users className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <p className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{name}</p>
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase">{type}</p>
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${status === 'confirmed' ? (isDarkMode ? 'bg-emerald-900/20 text-emerald-400 border-emerald-900/50' : 'bg-emerald-50 text-emerald-600 border-emerald-100') : (isDarkMode ? 'bg-gray-800 text-slate-500 border-gray-700' : 'bg-slate-100 text-slate-400')}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1">
      <span className="text-xs font-black text-blue-600">{time}</span>
      {onJoin && (
        <button
          onClick={(e) => { e.stopPropagation(); onJoin(); }}
          className="text-[8px] font-black text-white bg-blue-600 px-2 py-1 rounded-md hover:bg-blue-500 animate-pulse"
        >
          JOIN LIVE
        </button>
      )}
    </div>
  </div>
);

const DetailStatCard = ({ title, value, icon, color, trend, isAlert, description, isDarkMode }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700 shadow-blue-200',
    emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-200',
    rose: 'from-rose-600 to-rose-700 shadow-rose-200',
    indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-200'
  };

  const bgLight = {
    blue: isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600',
    emerald: isDarkMode ? 'bg-emerald-900/20 text-emerald-400' : 'bg-emerald-50 text-emerald-600',
    rose: isDarkMode ? 'bg-rose-900/20 text-rose-400' : 'bg-rose-50 text-rose-600',
    indigo: isDarkMode ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
  };

  return (
    <div className={`group relative overflow-hidden p-8 rounded-[3rem] border transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-none' : 'bg-white border-slate-50 shadow-xl shadow-slate-200/50 hover:shadow-2xl'} ${isAlert ? (isDarkMode ? 'ring-4 ring-rose-900/30' : 'ring-4 ring-rose-100') : ''}`}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className={`p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${bgLight[color]}`}>
            {icon}
          </div>
          <div className={`text-[10px] font-black px-3 py-1.5 rounded-full ${color === 'rose' ? (isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-100 text-rose-600') : (isDarkMode ? 'bg-gray-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
            {trend}
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h4 className={`text-4xl font-black leading-none mb-3 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h4>
          <p className="text-xs font-bold text-slate-400">{description}</p>
        </div>
      </div>

      {/* Visual background element */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 -mr-12 -mt-12 bg-gradient-to-br ${colorClasses[color]}`}></div>
    </div>
  );
};

export default DoctorDashboard;
