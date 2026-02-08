
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
  Bell,
  MoreVertical,
  Calendar,
  MessageSquare,
  ChevronRight,
  Target
} from 'lucide-react';
import { lazy, Suspense } from 'react';
import NavHeader from '../../../shared/components/NavHeader';
import PatientCard from '../components/PatientCard';
const AdherenceTrendChart = lazy(() => import('../components/charts/AdherenceTrendChart'));
const FormQualityChart = lazy(() => import('../components/charts/FormQualityChart'));
const ROMTrendChart = lazy(() => import('../components/charts/ROMTrendChart'));
import SettingsModal from '../components/modals/SettingsModal';
import QuickActionsPanel from '../components/QuickActionsPanel';
import DoctorProfileCard from '../components/DoctorProfileCard';
import AddPatientModal from '../components/modals/AddPatientModal';
import NeuralChatModal from '../components/modals/NeuralChatModal';
import AppointmentModal from '../../../shared/components/modals/AppointmentModal';
import VideoConsultationModal from '../../../shared/components/modals/VideoConsultationModal';
import {
  subscribeToDoctorPatients,
  getAdherenceTrendData,
  getFormQualityTrendData,
  getROMTrendData,
} from '../services/doctorService';
import { useAuth } from '../../auth/context/AuthContext';
import { updateUserProfile } from '../../auth/services/authService';

const DoctorDashboard = () => {
  const { userData, user } = useAuth();

  const handleSettingsSave = async (data) => {
    try {
      await updateUserProfile(user.uid, data);
      console.log('[DoctorDashboard] Settings updated successfully');
    } catch (error) {
      console.error('[DoctorDashboard] Settings update failed:', error);
    }
  };

  const [patients, setPatients] = useState([]);
  const [_, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAdherence, setFilterAdherence] = useState('all');
  const [stats, setStats] = useState({
    totalPatients: 0,
    averageAdherence: 0,
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
  const [viewMode, setViewMode] = useState('grid');

  const handleActionClick = (id) => {
    if (id === 'add-patient') {
      setAddPatientOpen(true);
    } else if (id === 'neural-chat') {
      setChatOpen(true);
    } else if (id === 'schedule') {
      setAppointmentOpen(true);
    } else if (id === 'video-call') {
      setVideoOpen(true);
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

      // 2. Pass the fresh data to charts immediately (Fixes Point 2 & 3)
      // This prevents re-fetching the patients inside the chart functions
      try {
        setChartsLoading(true);
        const [adherence, quality, rom] = await Promise.all([
          getAdherenceTrendData(user.uid, updatedPatients),
          getFormQualityTrendData(user.uid, updatedPatients),
          getROMTrendData(user.uid),
        ]);
        setChartData({ adherenceTrend: adherence, formQualityTrend: quality, romTrend: rom });
      } catch (err) {
        console.error('Error fetching charts:', err);
      } finally {
        setChartsLoading(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [user, userData]);

  // Stats calculation
  useEffect(() => {
    if (patients.length > 0) {
      const total = patients.length;
      const avg = Math.round(patients.reduce((sum, p) => sum + (p.adherenceRate || 0), 0) / total);
      const urgent = patients.filter((p) => (p.adherenceRate || 0) < 60).length;
      setStats({ totalPatients: total, averageAdherence: avg, needsAttention: urgent });
    }
  }, [patients]);

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
    <div className="min-h-screen bg-[#F1F5F9]">
      <NavHeader userType="doctor" onSettingsClick={() => setSettingsOpen(true)} />

      <main className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-10 safe-area-inset">
        {/* Modern Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-none">
              Clinic <span className="text-blue-600">Overview</span>
            </h1>
            <p className="text-slate-500 font-bold text-sm sm:text-lg flex items-center gap-2">
              <Users className="w-5 h-5" /> Monitoring {patients.length} active rehabilitation plans
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-white p-2 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
            <div className="relative group flex-1 sm:flex-none">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search patients..."
                className="pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-base w-full sm:w-80 font-bold focus:ring-4 focus:ring-blue-100 transition-all"
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
          />
          <DetailStatCard
            title="Avg. Adherence"
            value={`${stats.averageAdherence}%`}
            icon={<TrendingUp className="w-6 h-6" />}
            color="emerald"
            trend="Stable"
            description="Cross-patient average"
          />
          <DetailStatCard
            title="Avg. Quality"
            value="84%"
            icon={<Activity className="w-6 h-6" />}
            color="indigo"
            trend="+5%"
            description="Exercise execution"
          />
          <DetailStatCard
            title="High Risks"
            value={stats.needsAttention}
            icon={<AlertTriangle className="w-6 h-6" />}
            color="rose"
            trend="Needs Review"
            isAlert={stats.needsAttention > 0}
            description="Below 60% adherence"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            {/* Charts Section */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">Clinical Analytics</h3>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Health & Recovery Trends</p>
                </div>
                <div className="flex p-1.5 bg-slate-100 rounded-2xl w-full sm:w-auto">
                  <button className="px-4 py-2 text-sm font-black bg-white shadow-lg rounded-xl text-blue-600 flex-1 sm:flex-none">Weekly</button>
                  <button className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-slate-600 flex-1 sm:flex-none">Monthly</button>
                </div>
              </div>
              <Suspense fallback={<div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse text-slate-400 font-bold uppercase text-xs tracking-widest">Loading Analytics...</div>}>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4">
                    <AdherenceTrendChart data={chartData.adherenceTrend} loading={chartsLoading} />
                  </div>
                  <div className="space-y-4">
                    <FormQualityChart data={chartData.formQualityTrend} loading={chartsLoading} />
                  </div>
                </div>
              </Suspense>
            </div>

            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50">
              <Suspense fallback={<div className="h-64 flex items-center justify-center bg-slate-50 rounded-2xl animate-pulse text-slate-400 font-bold uppercase text-xs tracking-widest">Loading Biometrics...</div>}>
                <ROMTrendChart data={chartData.romTrend} loading={chartsLoading} />
              </Suspense>
            </div>

            {/* Patient List Section */}
            <div className="bg-white p-6 sm:p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">Patient Directory</h3>
                  <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Active Monitoring</p>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                  <select
                    className="bg-slate-50 border-none rounded-xl text-sm font-bold py-2.5 px-4 text-slate-600 focus:ring-4 focus:ring-blue-100 w-full sm:w-auto"
                    value={filterAdherence}
                    onChange={(e) => setFilterAdherence(e.target.value)}
                  >
                    <option value="all">Status: All Patients</option>
                    <option value="high">High (80%+)</option>
                    <option value="medium">Medium (60-80%)</option>
                    <option value="low">Low (60%-)</option>
                  </select>
                  <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
                    <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'} flex-1 sm:flex-none`}>
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'} flex-1 sm:flex-none`}>
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
                  <div className="py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                    <Users className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 text-lg font-black">No matching patients discovered.</p>
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
                    <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">Powered by Gati AI</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group/item">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Adherence Alert</p>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover/item:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm font-bold text-slate-200">3 patients haven't completed their routine today. Send a neural nudge?</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all cursor-pointer group/item">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Recovery Peak</p>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover/item:translate-x-1 transition-transform" />
                    </div>
                    <p className="text-sm font-bold text-slate-200">Rajesh Kumar achieved a <span className="text-emerald-400">5° increase</span> in knee ROM today! 🎉</p>
                  </div>
                </div>
                <button className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black transition-all shadow-lg shadow-blue-600/20 transform active:scale-95">
                  View Full Analysis
                </button>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-indigo-600/10 rounded-full blur-2xl -ml-8 -mb-8"></div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-slate-900">Next Sessions</h3>
                <Calendar className="w-5 h-5 text-slate-400" />
              </div>
              <div className="space-y-3">
                <AppointmentRow name="Priya Sharma" time="14:30 PM" type="Video Call" />
                <AppointmentRow name="Amit Patel" time="16:00 PM" type="In-person" />
                <AppointmentRow name="Rajesh Kumar" time="Tomorrow" type="Follow-up" />
              </div>
              <button
                onClick={() => setAppointmentOpen(true)}
                className="w-full mt-6 py-3 bg-slate-50 text-slate-400 hover:text-blue-600 transition-colors rounded-xl font-bold flex items-center justify-center gap-2"
              >
                Open Calendar <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">
            Measurements are approximate and intended for rehabilitation guidance only
          </p>
        </div>
      </main>

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

      <AppointmentModal
        isOpen={appointmentOpen}
        onClose={() => setAppointmentOpen(false)}
      />

      <VideoConsultationModal
        isOpen={videoOpen}
        onClose={() => setVideoOpen(false)}
        roomName={`GatiClinic_Doctor_${user?.uid?.substring(0, 8)}`}
      />
    </div>
  );
};

const AppointmentRow = ({ name, time, type }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-all cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
        <Users className="w-5 h-5 text-slate-400" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-800">{name}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{type}</p>
      </div>
    </div>
    <span className="text-xs font-black text-blue-600">{time}</span>
  </div>
);

const DetailStatCard = ({ title, value, icon, color, trend, isAlert, description }) => {
  const colorClasses = {
    blue: 'from-blue-600 to-blue-700 shadow-blue-200',
    emerald: 'from-emerald-600 to-emerald-700 shadow-emerald-200',
    rose: 'from-rose-600 to-rose-700 shadow-rose-200',
    indigo: 'from-indigo-600 to-indigo-700 shadow-indigo-200'
  };

  const bgLight = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    rose: 'bg-rose-50 text-rose-600',
    indigo: 'bg-indigo-50 text-indigo-600'
  };

  return (
    <div className={`group relative overflow-hidden bg-white p-8 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/50 transition-all hover:shadow-2xl hover:-translate-y-1 ${isAlert ? 'ring-4 ring-rose-100' : ''}`}>
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div className={`p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110 ${bgLight[color]}`}>
            {icon}
          </div>
          <div className={`text-[10px] font-black px-3 py-1.5 rounded-full ${color === 'rose' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {trend}
          </div>
        </div>

        <div className="mt-auto">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h4 className="text-4xl font-black text-slate-900 leading-none mb-3">{value}</h4>
          <p className="text-xs font-bold text-slate-400">{description}</p>
        </div>
      </div>

      {/* Visual background element */}
      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 -mr-12 -mt-12 bg-gradient-to-br ${colorClasses[color]}`}></div>
    </div>
  );
};

export default DoctorDashboard;
