import { useState, useEffect, useMemo, memo, lazy, Suspense } from 'react';
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
  BellOff,
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
  Filter,
  UserCircle
} from 'lucide-react';
import NavHeader from '../../../shared/components/NavHeader';
import Footer from '../../../shared/components/Footer';
import { useTheme } from '../../../contexts/ThemeContext';
import SessionReport from '../components/SessionReport';
import PainTracker from '../components/PainTracker';

// Lazy load modals for performance
const PatientSettingsModal = lazy(() => import('../components/modals/PatientSettingsModal'));
const NeuralChatModal = lazy(() => import('../../doctor/components/modals/NeuralChatModal'));
const AppointmentModal = lazy(() => import('../../../shared/components/modals/AppointmentModal'));
const PlanOverviewModal = lazy(() => import('../components/modals/PlanOverviewModal'));
const TrendsModal = lazy(() => import('../components/modals/TrendsModal'));
const VideoConsultationModal = lazy(() => import('../../../shared/components/modals/VideoConsultationModal'));
const MedicationReminders = lazy(() => import('../components/MedicationReminders'));
const OnboardingGuide = lazy(() => import('../components/OnboardingGuide'));
const GatiAssistant = lazy(() => import('../components/GatiAssistant'));
import { useAuth } from '../../auth/context/AuthContext';
import { updateUserProfile } from '../../auth/services/authService';
import {
  getPatientStats,
  getTodayRoutine,
  getRecentSessions,
  subscribeToPatientData,
  subscribeToWeeklySessions,
  getPainHistory,
  saveDailyPlan
} from '../services/patientService';
import { requestPushPermission, showPushNotification } from '../../../shared/services/notificationService';
import { DEMO_CREDENTIALS, subscribeToUserData } from '../../auth/services/authService';
import { calculateDailyPlan } from '../engine/rehabEngine';
import { getAIExerciseRecommendations } from '../services/aiRecommendationService';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { AVAILABLE_EXERCISES } from '../../ai/utils/secondaryExercises';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

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
  const [upcomingAppts, setUpcomingAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [appointmentOpen, setAppointmentOpen] = useState(false);
  const [videoOpen, setVideoOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState('');
  const [planOpen, setPlanOpen] = useState(false);
  const [trendsOpen, setTrendsOpen] = useState(false);
  const [currentDoctor, setCurrentDoctor] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [gatiAssistantOpen, setGatiAssistantOpen] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(Notification.permission === 'granted');

  const handleSettingsUpdate = async (data) => {
    try {
      await updateUserProfile(user.uid, data);
      console.log('[PatientDashboard] Settings updated successfully');
    } catch (error) {
      console.error('[PatientDashboard] Settings update failed:', error);
    }
  };

  // Sync Doctor Profile in real-time if linked
  useEffect(() => {
    if (!userData?.doctorId) {
      setCurrentDoctor(null);
      return;
    }

    const unsubscribe = subscribeToUserData(userData.doctorId, (docData) => {
      setCurrentDoctor(docData);
    });

    return () => unsubscribe();
  }, [userData?.doctorId]);

  // Check if user needs onboarding
  useEffect(() => {
    if (userData && !userData.hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [userData]);

  const handleOnboardingComplete = async () => {
    if (user) {
      await updateUserProfile(user.uid, { hasCompletedOnboarding: true });
    }
  };

  // Notification Handling
  const handleRequestPermission = async () => {
    const granted = await requestPushPermission();
    setHasNotificationPermission(granted);
    if (granted) {
      showPushNotification("Gati Protocol Active", "You'll receive updates on your recovery roadmap.");
    }
  };

  useEffect(() => {
    if (hasNotificationPermission && todayRoutine.length > 0) {
      const pending = todayRoutine.filter(ex => !ex.completed).length;
      if (pending > 0) {
        // Send a gentle reminder on load if exercises are pending
        const timer = setTimeout(() => {
          showPushNotification(
            "Daily Roadmap Pending",
            `You have ${pending} exercises remaining for today. Maintain your ${stats.streak} day streak!`
          );
        }, 5000);
        return () => clearTimeout(timer);
      }
    }
  }, [hasNotificationPermission, todayRoutine.length, stats.streak]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const [statsData, todayData, sessionsData, painData] = await Promise.all([
          getPatientStats(user.uid),
          getTodayRoutine(user.uid),
          getRecentSessions(user.uid, 4),
          getPainHistory(user.uid, 5)
        ]);

        setStats(statsData);
        setRecentSessions(sessionsData);

        // Check if this is a new user (no sessions yet)
        const isNewUser = sessionsData.length === 0 && (!todayData || todayData.length === 0);

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

        // For new users, get AI recommendations
        if (isNewUser) {
          try {
            const aiRecommendations = await getAIExerciseRecommendations({
              injuryType: userData?.injuryType || 'General Recovery',
              rehabPhase: userData?.rehabPhase || 'Mid',
              currentPainLevel: painData[0]?.level || 5,
              fitnessLevel: userData?.fitnessLevel || 'Moderate',
              age: userData?.age,
              hasExercisedBefore: (sessionsData.length > 0),
              specialNotes: userData?.medicalNotes
            });

            // Convert AI recommended exercise IDs to full exercise objects
            const aiExercises = aiRecommendations.exercises.map(exId => ({
              id: exId,
              ...AVAILABLE_EXERCISES[exId],
              completed: false
            }));

            // Save AI plan to Firestore
            await saveDailyPlan(user.uid, aiExercises);
            setTodayRoutine(aiExercises);

            console.log('[PatientDashboard] AI recommendations applied:', aiRecommendations.source);
          } catch (error) {
            console.error('[PatientDashboard] AI recommendations failed, using fallback:', error);
            setTodayRoutine(generatedPlan.exercises);
          }
        } else if (todayData && todayData.length > 0) {
          // AI Modification: Apply intensity adjustment to the existing routine
          const adjustedRoutine = todayData.map(ex => {
            const exerciseInfo = AVAILABLE_EXERCISES[ex.exerciseId || ex.id];
            return {
              ...ex,
              name: ex.name || exerciseInfo?.name || String(ex.exerciseId || ex.id).replace(/-/g, ' '),
              sets: Math.max(1, Math.round((ex.sets || 3) * (generatedPlan.intensityAdjustment || 1))),
              reps: Math.max(5, Math.round((ex.reps || 10) * (generatedPlan.intensityAdjustment > 1 ? generatedPlan.intensityAdjustment : 1)))
            };
          });
          setTodayRoutine(adjustedRoutine);
        } else {
          // Use AI-generated plan as fallback
          setTodayRoutine(generatedPlan.exercises);
        }

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

    // Real-time appointments
    const apptsQuery = query(
      collection(db, 'appointments'),
      where('patientId', '==', user.uid),
      where('status', '==', 'scheduled')
    );
    const unsubAppts = onSnapshot(apptsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUpcomingAppts(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    });

    return () => {
      unsubPatient();
      unsubWeekly();
      unsubAppts();
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
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-[#F8FAFC]'}`}>
      <NavHeader
        userType="patient"
        theme={isDarkMode ? 'dark' : 'light'}
        onThemeToggle={toggleTheme}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <main role="main" className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
        <div className="mb-10 sm:mb-14">
          <div className="space-y-3">
            <h1 className={`text-4xl sm:text-6xl font-black tracking-tighter leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
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
              <button
                onClick={handleRequestPermission}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl ${hasNotificationPermission ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100 animate-pulse'}`}
              >
                {hasNotificationPermission ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                {hasNotificationPermission ? 'Alerts On' : 'Enable Alerts'}
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
                  <div className="absolute inset-0 bg-blue-500/5 rounded-full transition-all duration-700"></div>
                  <svg className="w-full h-full transform -rotate-90">
                    {/* Background Ring */}
                    <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="16" fill="transparent" className="text-white/5" />
                    {/* Glowing Progress Ring */}
                    <circle cx="50%" cy="50%" r="42%" stroke="currentColor" strokeWidth="16" fill="transparent"
                      strokeDasharray="264"
                      strokeDashoffset={264 - (264 * Math.min(1, (todayRoutine.filter(ex => ex.completed).length / (todayRoutine.length || 1))))}
                      strokeLinecap="round"
                      className="text-blue-500 transition-all duration-1000 ease-out" />
                    {/* Secondary inner ring for depth */}
                    <circle cx="50%" cy="50%" r="35%" stroke="currentColor" strokeWidth="1" fill="transparent" className="text-white/10" strokeDasharray="5,10" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-center">
                      <span className="block text-6xl sm:text-7xl font-black text-white tracking-tighter">
                        {Math.min(100, Math.round((todayRoutine.filter(ex => ex.completed).length / (todayRoutine.length || 1)) * 100))}%
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
                  <span className="px-5 py-2 bg-blue-600 text-white rounded-full text-xs font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-200">
                    {todayRoutine.filter(ex => ex.completed).length}/{todayRoutine.length} ROADMAP COMPLETE
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
                    // Optimized ID selection: Prefer exerciseId (if defined by doctor/AI), then fallback to slugified name
                    const exId = ex.exerciseId || (typeof ex.id === 'string' && !/^\d+$/.test(ex.id) ? ex.id : String(ex.name || '').toLowerCase().replace(/\s+/g, '-'));
                    navigate('/workout', { state: { exerciseId: exId } });
                  }}
                  className="flex items-center gap-5 p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform ${ex.completed ? 'bg-emerald-500 text-white' : 'bg-white text-blue-600 border border-blue-50 border-white'}`}>
                    {ex.completed ? <CheckCircle className="w-6 h-6" /> : <Play className="w-5 h-5 ml-0.5 fill-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-black text-slate-900 truncate">{ex.name}</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{ex.sets} Sets • {ex.reps} Reps</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
            {todayRoutine.length === 0 && (
              <div className="text-center py-10 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                <p className="text-slate-500 font-bold">Your routine is currently being updated by {userData?.doctorName || 'Dr. Gati'}.</p>
              </div>
            )}
          </div>

          {/* Performance High-Level Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              icon={<Activity className="w-6 h-6" />}
              title="ADHERENCE"
              value={`${Math.min(100, Math.round(stats.adherenceRate || (stats.completed / (stats.weeklyGoal || 5)) * 100))}%`}
              trend={(stats.completed / (stats.weeklyGoal || 5)) >= 1 ? "Target Achieved" : (stats.completed / (stats.weeklyGoal || 5)) > 0.8 ? "High Progress" : "On Track"}
              color="blue"
            />
            <StatCard
              icon={<Calendar className="w-6 h-6" />}
              title="ROADMAP PROGRESS"
              value={`${todayRoutine.filter(ex => ex.completed).length}/${todayRoutine.length}`}
              trend={todayRoutine.filter(ex => ex.completed).length === todayRoutine.length && todayRoutine.length > 0 ? "Daily Goal Met!" : "Exercises for today"}
              color="indigo"
            />
            <StatCard
              icon={<Star className="w-6 h-6" />}
              title="QUALITY"
              value={userData?.lastSessionQuality >= 90 ? "A+" : userData?.lastSessionQuality >= 80 ? "A" : userData?.lastSessionQuality >= 70 ? "B" : "C"}
              trend={`${userData?.lastSessionQuality || 0}% Score`}
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

          {/* Upcoming Sessions Card */}
          {upcomingAppts.length > 0 && (
            <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-xl shadow-slate-200/40 border border-slate-100 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center border border-indigo-100 shadow-sm shrink-0">
                    <Calendar className="w-10 h-10 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-1">Upcoming Session</p>
                    <h3 className="text-3xl font-black text-slate-900 leading-tight">
                      {upcomingAppts[0].type} with {currentDoctor?.name || userData?.doctorName || 'Specialist'}
                    </h3>
                    <p className="text-slate-500 font-bold">
                      {new Date(upcomingAppts[0].date).toLocaleDateString()} at {upcomingAppts[0].time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <a
                    href={upcomingAppts[0].meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 md:flex-none px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-100 no-underline"
                  >
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                    Join Consultation
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Your Specialist Section */}
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 shadow-xl shadow-slate-200/40 border border-slate-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
                  <UserCircle className="w-10 h-10 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">
                    {userData?.doctorId ? 'Your Specialist' : 'System Intelligence'}
                  </p>
                  <h3 className="text-3xl font-black text-slate-900 leading-tight">
                    {currentDoctor?.name || userData?.doctorName || 'Gati AI Digital Specialist'}
                  </h3>
                  <p className="text-slate-500 font-bold">
                    {userData?.doctorId ? (currentDoctor?.specialization || 'Professional Rehabilitation Specialist') : 'Autonomous Diagnostic Engine'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                <button
                  onClick={() => setChatOpen(true)}
                  className="flex-1 md:flex-none px-8 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-5 h-5 text-blue-400" /> Message
                </button>
                <button
                  onClick={() => setAppointmentOpen(true)}
                  className="flex-1 md:flex-none px-8 py-4 bg-blue-50 text-blue-600 rounded-2xl font-black hover:bg-blue-100 transition-all border border-blue-100 flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" /> Schedule
                </button>
              </div>
            </div>
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
                  {userData?.lastSessionQuality >= 80
                    ? `"Your motor precision in the last session was excellent. We recommend ${aiPlan?.status === 'Regressing' ? 'slowing down to maintain control' : 'maintaining this intensity'}."`
                    : userData?.lastSessionQuality > 0
                      ? `"We've detected some instability in your movement patterns. Focus on slower repetitions in your next session to improve motor control."`
                      : `"Welcome back. Start your session to receive real-time neural-motor analysis and personalized recovery insights."`
                  }
                </p>
                <button
                  onClick={() => setGatiAssistantOpen(true)}
                  className="w-full sm:w-auto px-10 py-5 bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white rounded-[2rem] font-black transition-all flex items-center justify-center gap-3 group active:scale-95 shadow-lg"
                >
                  <MessageSquare className="w-5 h-5" /> Chat with Gati AI <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
            {/* Background accent */}
            <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full"></div>
          </div>

        </div>
      </main>

      <Footer />

      <Suspense fallback={null}>
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
          onJoinCall={(room) => {
            setSelectedRoom(room);
            setVideoOpen(true);
          }}
        />

        <VideoConsultationModal
          isOpen={videoOpen}
          onClose={() => setVideoOpen(false)}
          roomName={selectedRoom || `GatiRehab_${user?.uid?.substring(0, 8)}`}
        />

        <TrendsModal
          isOpen={trendsOpen}
          onClose={() => setTrendsOpen(false)}
          patientId={user?.uid}
        />

        <OnboardingGuide
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          onComplete={handleOnboardingComplete}
        />

        <GatiAssistant
          isOpen={gatiAssistantOpen}
          onClose={() => setGatiAssistantOpen(false)}
          patientProfile={{
            injuryType: userData?.injuryType,
            rehabPhase: userData?.rehabPhase,
            currentPainLevel: userData?.currentPainLevel || 5
          }}
        />
      </Suspense>
    </div >
  );
};

const StatCard = memo(({ icon, title, value, trend, color }) => {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  return (
    <div className="group relative bg-white p-6 sm:p-10 rounded-[3.5rem] border border-slate-50 shadow-[0_10px_30px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_20px_60px_rgba(0,0,0,0.08)] hover:-translate-y-2 overflow-hidden">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-xl opacity-10 group-hover:opacity-20 transition-opacity ${color === 'emerald' ? 'bg-emerald-600' : 'bg-blue-600'}`}></div>
      <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[2rem] flex items-center justify-center mb-8 sm:mb-10 transition-all group-hover:scale-110 group-hover:rotate-6 ${colorStyles[color]} border shadow-inner`}>
        {icon}
      </div>
      <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">{title}</p>
      <div className="flex items-baseline gap-3">
        <p className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tighter leading-none">{value}</p>
        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg ${color === 'emerald' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'} text-xs font-black uppercase tracking-wider`}>
          <TrendingUp className="w-4 h-4" /> {trend}
        </div>
      </div>
    </div>
  );
});

const ActionTile = memo(({ icon, label, color, onClick }) => {
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
      <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-slate-700 text-center px-4 leading-tight group-hover:text-slate-900 transition-colors">{label}</span>

      {/* Decorative glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </button>
  );
});

export default PatientDashboard;
