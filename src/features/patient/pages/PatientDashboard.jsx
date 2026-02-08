import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Award,
  ArrowRight,
  Activity,
  Flame,
  FileText,
  Video,
  ChevronRight,
  Bell,
  Plus,
  Target,
  Zap,
  Star,
  ShieldCheck,
  MessageSquare,
  Terminal,
  History,
  Image,
  HeartPulse,
  Sparkles,
  Camera,
  Trash2,
  Maximize2,
  X,
  ChevronLeft,
  Share2,
  Download,
  Filter
} from 'lucide-react';
import NavHeader from '../../../shared/components/NavHeader';
import Footer from '../../../shared/components/Footer';
import SessionReport from '../components/SessionReport';
import PainTracker from '../components/PainTracker';

// import PainLoggerModal from '../components/modals/PainLoggerModal'; // Removed as merged into widget
import PatientSettingsModal from '../components/modals/PatientSettingsModal';
import NeuralChatModal from '../../doctor/components/modals/NeuralChatModal';
import AppointmentModal from '../../../shared/components/modals/AppointmentModal';
import PlanOverviewModal from '../components/modals/PlanOverviewModal';
import TrendsModal from '../components/modals/TrendsModal';
import VideoConsultationModal from '../../../shared/components/modals/VideoConsultationModal';
import MedicationReminders from '../components/MedicationReminders';
import { useAuth } from '../../auth/context/AuthContext';
import { updateUserProfile } from '../../auth/services/authService';
import {
  getPatientStats,
  getTodayRoutine,
  getRecentSessions,
  subscribeToPatientData,
  subscribeToWeeklySessions,
  getPainHistory
} from '../services/patientService';
import { calculateDailyPlan } from '../engine/rehabEngine';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  const [stats, setStats] = useState({
    totalSessions: 0,
    weeklyGoal: 5,
    completed: 0,
    streak: 0,
    adherenceRate: 0
  });

  const [todayRoutine, setTodayRoutine] = useState([]);
  const [aiPlan, setAiPlan] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);

  const handleSettingsUpdate = async (data) => {
    try {
      await updateUserProfile(user.uid, data);
      console.log('[PatientDashboard] Settings updated successfully');
    } catch (error) {
      console.error('[PatientDashboard] Settings update failed:', error);
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [statsData, _, sessionsData, painData] = await Promise.all([
          getPatientStats(user.uid),
          getTodayRoutine(user.uid),
          getRecentSessions(user.uid, 4),
          getPainHistory(user.uid, 5)
        ]);

        setStats(statsData);
        setRecentSessions(sessionsData);

        // Run AI Decision Engine
        const generatedPlan = calculateDailyPlan(
          {
            injuryType: userData?.injuryType || 'General Recovery',
            rehabPhase: userData?.rehabPhase || 'Mid'
          },
          painData,
          sessionsData
        );

        setAiPlan(generatedPlan);
        setTodayRoutine(generatedPlan.exercises);

        setLoading(false);
      } catch (error) {
        console.error('[PatientDashboard] Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();

    const unsubPatient = subscribeToPatientData(user.uid, (data) => {
      if (data) {
        setStats(prev => ({
          ...prev,
          totalSessions: data.completedSessions || 0,
          streak: data.streak || 0,
          adherenceRate: data.adherenceRate || 0
        }));
      }
    });

    const unsubWeekly = subscribeToWeeklySessions(user.uid, (weeklyCount) => {
      setStats(prev => ({ ...prev, completed: weeklyCount }));
    });

    return () => {
      unsubPatient();
      unsubWeekly();
    };
  }, [user, userData?.injuryType, userData?.rehabPhase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-20 border-t-blue-600"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Syncing Recovery Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-28">
      <NavHeader
        userType="patient"
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <main role="main" className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="mb-10 sm:mb-14">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tighter leading-tight">
              Recovery <span className="text-blue-600">Hub</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200"></div>
                <p className="text-xs sm:text-sm font-black text-slate-600 font-mono tracking-tight uppercase">
                  ACTIVE: {userData?.name?.split(' ')[0] || 'WARRIOR'}
                </p>
              </div>
              <button
                onClick={() => navigate('/workout', { state: { devMode: true } })}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group"
              >
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                Neural Lab
              </button>
            </div>
          </div>
        </div>



        {/* Main Content - Single Column Layout */}
        <div className="space-y-10">
          {/* Massive Hero Section */}
          <div className="relative overflow-hidden bg-[#0A0F1D] rounded-[3.5rem] p-8 sm:p-14 lg:p-20 text-white shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5">
            {/* Animated Mesh Gradients */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-emerald-600/10 rounded-full blur-[100px]"></div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-2xl px-6 py-3 rounded-full border border-white/10 mb-8 shadow-inner">
                  <Flame className="w-5 h-5 text-orange-400 animate-bounce" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] font-mono">{stats.streak} DAY RECOVERY STREAK</span>
                </div>

                <h2 className="text-5xl sm:text-7xl lg:text-8xl font-black leading-none tracking-tighter mb-8 bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                  Ready for your <br />
                  <span className="text-blue-500">session?</span>
                </h2>

                <p className="text-slate-400 text-lg sm:text-xl font-bold max-w-lg mb-12 leading-relaxed opacity-90">
                  Your neural-motor patterns are optimizing. Complete today's program to maintain momentum.
                </p>

                <div className="flex flex-col sm:flex-row gap-6">
                  <button
                    onClick={() => navigate('/workout')}
                    className="group relative bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:bg-blue-500 hover:scale-[1.05] transition-all transform active:scale-95 shadow-[0_20px_40px_rgba(37,99,235,0.4)] overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all shadow-inner">
                      <Play className="w-6 h-6 fill-white" />
                    </div>
                    <span className="text-xl tracking-tight">Resume Session</span>
                  </button>
                  <button
                    onClick={() => setPlanOpen(true)}
                    className="px-10 py-6 rounded-[2.5rem] font-black bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-xl shadow-xl hover:border-white/20 active:scale-95"
                  >
                    Plan Strategy
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                {/* Circular Progress Indicator */}
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 group cursor-default">
                  <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-[40px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
                  <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                    {/* Background Ring */}
                    <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-white/5" />
                    {/* Glowing Progress Ring */}
                    <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="16" fill="transparent"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * (stats.completed / (stats.weeklyGoal || 1)))}
                      strokeLinecap="round"
                      className="text-blue-500 transition-all duration-1000 ease-out" />
                    {/* Secondary inner ring for depth */}
                    <circle cx="50%" cy="50%" r="35%" stroke="currentColor" strokeWidth="2" fill="transparent" className="text-white/10" strokeDasharray="5,10" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <span className="block text-6xl sm:text-7xl font-black text-white tracking-tighter">
                        {Math.round((stats.completed / (stats.weeklyGoal || 1)) * 100)}%
                      </span>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Compliance Optimized</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Roadmap */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Today's Roadmap</h3>
                  {aiPlan?.status && (
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${aiPlan.status === 'Progressing' ? 'bg-emerald-100 text-emerald-600' :
                        aiPlan.status === 'Regressing' ? 'bg-rose-100 text-rose-600' :
                          'bg-blue-100 text-blue-600'
                      }`}>
                      AI: {aiPlan.status}
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Personalized Decision-Support Protocol</p>
              </div>
              <div className="flex items-center gap-3">
                {todayRoutine.length > 0 && (
                  <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                    {todayRoutine.filter(ex => ex.completed).length}/{todayRoutine.length} Done
                  </span>
                )}
              </div>
            </div>

            {aiPlan?.reasoning && (
              <div className="mb-8 p-5 bg-blue-50/50 rounded-3xl border border-blue-100/50 flex gap-4 items-start">
                <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">AI Decision Logic</p>
                  <p className="text-sm font-bold text-slate-700 leading-relaxed">{aiPlan.reasoning}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {todayRoutine.map((ex, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const exId = ex.id || ex.name?.toLowerCase().replace(/\s+/g, '-');
                    navigate('/workout', { state: { exerciseId: exId } });
                  }}
                  className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${ex.completed ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600 border border-blue-50 border-white'}`}>
                    {ex.completed ? <CheckCircle className="w-6 h-6" /> : <Play className="w-5 h-5 ml-0.5 fill-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-900 truncate">{ex.name}</p>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{ex.sets} Sets • {ex.reps} Reps</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
            {todayRoutine.length === 0 && (
              <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-bold">Your routine is currently being updated by Dr. Gati.</p>
              </div>
            )}
          </div>

          {/* Performance High-Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              icon={<Activity className="w-6 h-6" />}
              title="ADHERENCE"
              value={`${stats.adherenceRate || 85}%`}
              trend="+5%"
              color="blue"
            />
            <StatCard
              icon={<Calendar className="w-6 h-6" />}
              title="GOAL PROGRESS"
              value={`${stats.completed}/${stats.weeklyGoal}`}
              trend="On track"
              color="indigo"
            />
            <StatCard
              icon={<Star className="w-6 h-6" />}
              title="QUALITY"
              value="A+"
              trend="Top 5%"
              color="emerald"
            />
          </div>

          {/* Performance History Section */}
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Biometric History</h3>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Neural-motor diagnostics</p>
              </div>
              <button
                onClick={() => navigate('/history')}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              >
                View Library
              </button>
            </div>

            <div className="relative min-h-[400px] bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-100 flex items-center justify-center overflow-hidden">
              {recentSessions.length > 0 ? (
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                  {recentSessions.map((session, idx) => (
                    <SessionReport key={idx} sessionData={session} />
                  ))}
                </div>
              ) : (
                <div className="text-center px-6">
                  <History className="w-16 h-16 text-slate-200 mx-auto mb-6" />
                  <p className="text-lg font-bold text-slate-800">Recording Data...</p>
                  <p className="text-sm text-slate-400 mt-2 max-w-xs mx-auto font-medium">Complete your first session to see your AI-motor analysis here.</p>
                </div>
              )}
            </div>
          </div>

          {/* Clinical Tools - REDESIGNED */}
          <div className="bg-white rounded-[3rem] p-10 sm:p-12 shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="mb-10 text-center sm:text-left">
              <h3 className="text-2xl font-extrabold text-slate-900 leading-none">Clinical Laboratory</h3>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">Specialist resources & data</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              <ActionTile icon={<Video className="w-6 h-6" />} label="Live Call" color="emerald" onClick={() => setAppointmentOpen(true)} />
              <ActionTile icon={<TrendingUp className="w-6 h-6" />} label="Recovery Trends" color="indigo" onClick={() => setTrendsOpen(true)} />
              <ActionTile icon={<Image className="w-6 h-6" />} label="Photo Gallery" color="blue" onClick={() => navigate('/visuals')} />
              <ActionTile icon={<FileText className="w-6 h-6" />} label="Raw Metrics" color="slate" onClick={() => navigate('/history')} />
            </div>
          </div>

          {/* Pain Tracker Integration */}
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-xl shadow-slate-200/40 border border-slate-100">
            <PainTracker />
          </div>

          <MedicationReminders />

          {/* Neural Insights Integration */}
          <div className="bg-[#0F172A] text-white rounded-[3rem] p-10 sm:p-14 shadow-2xl shadow-slate-900/40 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 bg-blue-500/10 rounded-3xl flex items-center justify-center border border-white/10 shrink-0">
                <Sparkles className="w-10 h-10 text-blue-400" />
              </div>
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-2xl font-black mb-1">Intelligence Feed</h4>
                  <p className="text-blue-400 text-xs font-black uppercase tracking-widest leading-none">Diagnostic Update</p>
                </div>
                <p className="text-slate-200 font-bold leading-relaxed italic text-lg sm:text-2xl">
                  "Your motor precision in the last session was <span className="text-blue-400">excellent</span>. We recommend increasing your flexion angle by 5° tomorrow."
                </p>
                <button
                  onClick={() => setChatOpen(true)}
                  className="w-full sm:w-auto px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] font-black transition-all flex items-center justify-center gap-3 group active:scale-95"
                >
                  <MessageSquare className="w-5 h-5" /> Consult Gati Assistant <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full"></div>
          </div>

          <Footer />
        </div>
      </main>

      <PlanOverviewModal
        isOpen={planOpen}
        onClose={() => setPlanOpen(false)}
        routine={aiPlan}
      />



      <PatientSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        patientProfile={userData}
        onSave={handleSettingsUpdate}
      />

      <NeuralChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        chatPartnerId={userData?.doctorId}
        chatPartnerName={userData?.doctorName || 'Your Doctor'}
      />

      <AppointmentModal
        isOpen={appointmentOpen}
        onClose={() => setAppointmentOpen(false)}
        patientId={user?.uid}
        patientName={userData?.name}
        doctorId={userData?.doctorId}
        doctorName={userData?.doctorName}
        onJoinCall={() => setVideoOpen(true)}
      />

      <VideoConsultationModal
        isOpen={videoOpen}
        onClose={() => setVideoOpen(false)}
        roomName={`GatiRehab_${user?.uid?.substring(0, 8)}`}
      />

      <TrendsModal
        isOpen={trendsOpen}
        onClose={() => setTrendsOpen(false)}
        patientId={user?.uid}
      />
    </div >
  );
};

const StatCard = ({ icon, title, value, trend, color }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <div className="group relative bg-white p-6 sm:p-10 rounded-[3.5rem] border border-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-2 overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity ${color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600'}`}></div>
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[2rem] flex items-center justify-center mb-8 sm:mb-10 transition-all group-hover:scale-110 group-hover:rotate-6 ${colorStyles[color]} border shadow-inner`}>
        {icon}
      </div>
      <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2 leading-none">{title}</p>
      <div className="flex items-baseline gap-3">
        <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} text-[10px] font-black uppercase tracking-wider`}>
          <TrendingUp className="w-3 h-3" /> {trend}
        </div>
      </div>
    </div>
  );
};

const ActionTile = ({ icon, label, color, onClick }) => {
  const styles = {
    blue: 'text-blue-600 border-blue-100 bg-blue-50/50 hover:border-blue-300 hover:shadow-blue-50',
    rose: 'text-rose-600 border-rose-100 bg-rose-50/50 hover:border-rose-300 hover:shadow-rose-50',
    indigo: 'text-indigo-600 border-indigo-100 bg-indigo-50/50 hover:border-indigo-300 hover:shadow-indigo-50',
    emerald: 'text-emerald-600 border-emerald-100 bg-emerald-50/50 hover:border-emerald-300 hover:shadow-emerald-50',
    slate: 'text-slate-600 border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:shadow-slate-50'
  };

  const iconColors = {
    blue: 'bg-blue-600',
    rose: 'bg-rose-600',
    indigo: 'bg-indigo-600',
    emerald: 'bg-emerald-600',
    slate: 'bg-slate-600'
  };

  return (
    <button
      onClick={onClick}
      className={`group relative flex flex-col items-center justify-center gap-3 w-full h-32 sm:h-44 rounded-[2.5rem] border-2 transition-all hover:-translate-y-2 overflow-hidden shadow-sm hover:shadow-2xl active:scale-95 ${styles[color]}`}
    >
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all ${iconColors[color]} text-white`}>
        {icon}
      </div>
      <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-widest text-slate-700 text-center px-4 leading-tight group-hover:text-slate-900 transition-colors">{label}</span>

      {/* Decorative glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </button>
  );
};

export default PatientDashboard;
