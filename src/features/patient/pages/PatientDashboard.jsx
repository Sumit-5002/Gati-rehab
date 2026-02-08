
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
  History
} from 'lucide-react';
import NavHeader from '../../../shared/components/NavHeader';
import SessionReport from '../components/SessionReport';
import PainLoggerModal from '../components/modals/PainLoggerModal';
import PatientSettingsModal from '../components/modals/PatientSettingsModal';
import ScheduleModal from '../components/modals/ScheduleModal';
import PainTracker from '../components/PainTracker';
import { useAuth } from '../../auth/context/AuthContext';
import { updateUserProfile } from '../../auth/services/authService';
import {
  getPatientStats,
  getTodayRoutine,
  getRecentSessions,
  subscribeToPatientData
} from '../services/patientService';

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
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [painModalOpen, setPainModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [hasNotifications, setHasNotifications] = useState(true);

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
        const [statsData, routineData, sessionsData] = await Promise.all([
          getPatientStats(user.uid),
          getTodayRoutine(user.uid),
          getRecentSessions(user.uid, 4)
        ]);

        setStats(statsData);
        setTodayRoutine(routineData);
        setRecentSessions(sessionsData);
        setLoading(false);
      } catch (error) {
        console.error('[PatientDashboard] Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();

    const unsubscribe = subscribeToPatientData(user.uid, (data) => {
      if (data) {
        setStats(prev => ({
          ...prev,
          totalSessions: data.completedSessions || 0,
          streak: data.streak || 0,
          adherenceRate: data.adherenceRate || 0
        }));
      }
    });

    return () => unsubscribe();
  }, [user]);

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
    <div className="min-h-screen bg-[#F1F5F9] pb-28">
      <NavHeader
        userType="patient"
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <main role="main" className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 sm:mb-14">
          <div className="space-y-3">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter leading-tight lg:leading-[1.1]">
              Recovery <span className="text-blue-600">Hub</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white rounded-2xl shadow-sm border border-slate-100/50">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm shadow-emerald-200"></div>
                <p className="text-xs sm:text-sm font-black text-slate-600 font-mono tracking-tight uppercase">
                  Station: {userData?.name?.split(' ')[0] || 'Warrior'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => navigate('/workout', { state: { devMode: true } })}
              className="flex-1 lg:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-4 lg:py-3.5 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 group active:scale-95"
            >
              <Terminal className="w-4 h-4 text-blue-400" />
              <span className="text-xs uppercase tracking-widest">Neural Lab</span>
            </button>
            <button 
              className="bg-white p-4 rounded-2xl border border-slate-100 text-slate-400 hover:text-blue-600 transition-all shadow-lg active:scale-90 relative"
              aria-label="View notifications"
              onClick={() => setHasNotifications(false)}
            >
              <Bell className="w-5 h-5 transition-transform" />
              {hasNotifications && (
                <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm animate-pulse"></span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Main Content Column */}
          <div className="xl:col-span-8 space-y-10">
            {/* Massive Hero Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 lg:p-14 text-white shadow-3xl shadow-slate-900/20">
              <div className="relative z-10 flex flex-col md:flex-row items-center gap-10 md:gap-14">
                <div className="w-full flex-1 space-y-6 sm:space-y-8 text-center md:text-left">
                  <div className="inline-flex items-center justify-center md:justify-start gap-2.5 bg-blue-500/10 backdrop-blur-3xl px-4 py-2 rounded-full border border-blue-500/20 mx-auto md:mx-0">
                    <Flame className="w-4 h-4 text-orange-400 animate-pulse" />
                    <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">{stats.streak} DAY STREAK</span>
                  </div>

                  <h2 className="text-5xl sm:text-6xl lg:text-8xl font-black leading-[1.1] sm:leading-[1.05] md:leading-[1] tracking-tighter">
                    Ready for your <br className="hidden sm:block" />
                    <span className="text-blue-500">session?</span>
                  </h2>

                  <p className="text-slate-400 text-lg sm:text-xl lg:text-2xl font-bold max-w-sm mx-auto md:mx-0 leading-relaxed opacity-90">
                    Complete your morning routine to stay ahead.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 sm:pt-6">
                    <button
                      onClick={() => navigate('/workout')}
                      className="group bg-blue-600 text-white px-8 py-4.5 sm:px-10 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black flex items-center justify-center gap-4 hover:bg-blue-500 hover:scale-[1.02] transition-all transform active:scale-95 shadow-2xl shadow-blue-600/40"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-all">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
                      </div>
                      <span className="text-base sm:text-lg">Resume Program</span>
                    </button>
                    <button 
                      className="px-8 py-4.5 sm:py-5 rounded-2xl sm:rounded-[2rem] font-black bg-white/5 border border-white/10 hover:bg-white/10 transition-all backdrop-blur-xl text-sm sm:text-base"
                      aria-label="View treatment plan overview"
                    >
                      Plan Overview
                    </button>
                  </div>
                </div>

                {/* Progress Visualizer - Hidden on smaller screens inside hero for more vertical space, or scaled down */}
                <div className="flex md:block w-40 h-40 sm:w-56 sm:h-56 lg:w-72 lg:h-72 relative items-center justify-center shrink-0">
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse-slow"></div>
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/5" />
                    <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="8" fill="transparent"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * (stats.completed / (stats.weeklyGoal || 1)))}
                      strokeLinecap="round"
                      className="text-blue-500 transition-all duration-1000 shadow-xl" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl sm:text-6xl font-black leading-none">{Math.round((stats.completed / (stats.weeklyGoal || 1)) * 100)}%</span>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1 sm:mt-2">Capacity</span>
                  </div>
                </div>
              </div>

              {/* Decorative gradients */}
              <div className="absolute top-0 right-0 w-64 h-64 sm:w-[500px] sm:h-[500px] bg-blue-600/20 rounded-full blur-[100px] sm:blur-[160px] -mr-32 -mt-32 sm:-mr-64 sm:-mt-64"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 sm:w-80 h-80 bg-indigo-600/10 rounded-full blur-[60px] sm:blur-[100px] -ml-20 -mb-20 sm:-ml-40 sm:-mb-40"></div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 transition-all">
              <StatCard
                icon={<Zap className="w-5 h-5 sm:w-6 sm:h-6" />}
                title="Focus"
                value={`${stats.adherenceRate}%`}
                trend="+12%"
                color="blue"
              />
              <StatCard
                icon={<Target className="w-5 h-5 sm:w-6 sm:h-6" />}
                title="Progress"
                value={`${stats.completed}/${stats.weeklyGoal}`}
                trend="Goal"
                color="indigo"
              />
              <div className="col-span-2 lg:col-span-1">
                <StatCard
                  icon={<ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />}
                  title="Form Score"
                  value="A+"
                  trend="Stable"
                  color="emerald"
                />
              </div>
            </div>

            {/* Recent Activity Full Section */}
            <div className="bg-white rounded-[2rem] sm:rounded-[3.5rem] shadow-2xl shadow-slate-200/50 border border-slate-50 p-6 sm:p-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-2">Performance History</h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Your recovery path records</p>
                </div>
                <button
                  onClick={() => navigate('/history')}
                  className="flex items-center gap-2 text-blue-600 font-black text-xs group text-left"
                >
                  Full Analytics History <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {recentSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {recentSessions.map((session, index) => (
                    <div key={index} className="transform hover:scale-[1.02] transition-all duration-300">
                      <SessionReport sessionData={session} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 bg-slate-50 rounded-[2.5rem] border-4 border-dashed border-slate-200">
                  <Activity className="w-20 h-20 text-slate-200 mx-auto mb-8" />
                  <p className="text-xl font-black text-slate-900">No session metrics detected yet.</p>
                  <button
                    onClick={() => navigate('/workout')}
                    className="mt-8 bg-slate-900 text-white px-10 py-4 rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl"
                  >
                    Start First Workout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="xl:col-span-4 space-y-10">
            {/* Pain Tracker Integration */}
            <PainTracker />

            {/* Daily Roadmap */}
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl shadow-slate-200/50 border border-slate-50 overflow-hidden relative group">
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mb-6 sm:mb-8">Daily Roadmap</h3>
                <div className="space-y-6">
                  {todayRoutine.map((ex, idx) => (
                    <div key={idx} className="flex items-center gap-5 p-5 rounded-[2rem] bg-slate-50/50 border border-slate-100/50 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all group/item">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-all group-hover/item:scale-110 ${ex.completed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'}`}>
                        {ex.completed ? <CheckCircle className="w-7 h-7" /> : <Play className="w-5 h-5 ml-1" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-800 truncate leading-none mb-1.5">{ex.name}</p>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">{ex.sets} Sets • {ex.reps} Reps</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-slate-200 group-hover/item:text-blue-500 transition-colors" />
                    </div>
                  ))}
                  {todayRoutine.length === 0 && (
                    <div className="text-center py-10">
                      <Star className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-bold">Your routine is clear today!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 shadow-2xl shadow-slate-200/40 border border-slate-50">
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-none mb-2 text-center md:text-left">Clinical Tools</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">Quick Access Laboratory</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-4">
                <ActionTile
                  icon={<Video className="w-5 h-5" />}
                  label="Schedule Call"
                  color="blue"
                  onClick={() => setScheduleOpen(true)}
                />
                <ActionTile
                  icon={<Plus className="w-5 h-5" />}
                  label="Log Pain"
                  color="rose"
                  onClick={() => setPainModalOpen(true)}
                />
                <ActionTile
                  icon={<History className="w-5 h-5" />}
                  label="History"
                  color="indigo"
                  onClick={() => navigate('/history')}
                />
                <ActionTile icon={<TrendingUp className="w-5 h-5" />} label="Trends" color="emerald" />
              </div>
            </div>

            {/* Medication Reminders */}
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-8 shadow-2xl shadow-slate-200/50 border border-slate-50">
              <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-500" /> Reminders
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Pain Relief</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">After Breakfast</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-4 opacity-60">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">Multivitamin</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taken 8:00 AM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Neural Insights Integration */}
            <div className="bg-[#0F172A] text-white rounded-[3rem] p-10 shadow-3xl shadow-slate-900/40 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                    <Activity className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-xl font-black">Neural Insights</h4>
                    <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Powered by Gati Core</p>
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
                  <p className="text-slate-300 font-bold leading-relaxed italic text-lg">
                    "Your knee extension speed improved by <span className="text-blue-400 font-black">15%</span> yesterday. Maintain this velocity for better adherence."
                  </p>
                  <div className="pt-4 border-t border-white/10">
                    <button className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 group">
                      <MessageSquare className="w-4 h-4" /> Chat with AI Assistant <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-indigo-600/10 rounded-full blur-[60px] -ml-20 -mb-20"></div>
            </div>
          </div>
        </div>

        <div className="mt-16 mb-4 text-center">
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest opacity-60">
             Measurements are approximate and intended for rehabilitation guidance only
           </p>
        </div>
      </main>

      <PainLoggerModal
        isOpen={painModalOpen}
        onClose={() => setPainModalOpen(false)}
      />

      <PatientSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        patientProfile={userData}
        onSave={handleSettingsUpdate}
      />

      <ScheduleModal
        isOpen={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        user={{ uid: user?.uid, name: userData?.name }}
        doctorId={userData?.doctorId}
      />
    </div>
  );
};

const StatCard = ({ icon, title, value, trend, color }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <div className="group bg-white p-5 sm:p-8 rounded-[2rem] sm:rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/20 transition-all hover:shadow-2xl hover:-translate-y-1">
      <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-8 transition-all group-hover:scale-110 ${colorStyles[color]} border shadow-sm`}>
        {icon}
      </div>
      <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1 leading-none">{title}</p>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
        <span className={`text-[9px] font-black uppercase tracking-widest ${color === 'emerald' ? 'text-emerald-500' : 'text-blue-500'} opacity-70`}>{trend}</span>
      </div>
    </div>
  );
};

const ActionTile = ({ icon, label, color, onClick }) => {
  const styles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100/50 hover:bg-blue-600 hover:text-white hover:shadow-blue-200',
    rose: 'bg-rose-50 text-rose-600 border-rose-100/50 hover:bg-rose-600 hover:text-white hover:shadow-rose-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/50 hover:bg-indigo-600 hover:text-white hover:shadow-indigo-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 hover:bg-emerald-600 hover:text-white hover:shadow-emerald-200'
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] border transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 group ${styles[color]}`}
    >
      <div className="mb-2 sm:mb-4 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-center leading-tight">{label}</span>
    </button>
  );
};

export default PatientDashboard;
