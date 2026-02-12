import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  StopCircle,
  Activity,
  Timer,
  Award,
  Terminal,
  FlaskConical,
  Info,
  Maximize2,
  Minimize2,
  Monitor
} from 'lucide-react';
import AIEngine from '../../ai/components/AIEngine';
import NavHeader from '../../../shared/components/NavHeader';
import ExerciseDemo from '../components/ExerciseDemo';
import { useAuth } from '../../auth/context/AuthContext';
import { saveSession } from '../services/sessionService';
import { markExerciseCompleted } from '../services/patientService';
import { calculateFormQualityScore } from '../utils/enhancedScoring';
import { AVAILABLE_EXERCISES } from '../../ai/utils/secondaryExercises';
import { getPrimaryAngle } from '../../ai/utils/angleCalculations';
import { logAction } from '../../../shared/utils/auditLogger';

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const WorkoutSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();

  const [sessionActive, setSessionActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(location.state?.exerciseId || 'knee-bends');
  const [repCount, setRepCount] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [feedback, setFeedback] = useState('Position yourself in front of the camera');
  const [formQuality, setFormQuality] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const frameDataRef = useRef([]);
  const [realTimeFeedback, setRealTimeFeedback] = useState(null);
  const [isDevMode, setIsDevMode] = useState(location.state?.devMode || false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showDemoOverlay, setShowDemoOverlay] = useState(true);
  const lastUiUpdateRef = useRef(0);

  const availableExercises = useMemo(() => Object.entries(AVAILABLE_EXERCISES).map(([id, data]) => ({
    id,
    name: data.name
  })), []);

  const timerRef = useRef(null);
  const previousPhaseRef = useRef('start');

  const aiSettings = useMemo(() => ({
    audioCues: userData?.audioCues,
    motionFeedback: userData?.motionFeedback
  }), [userData?.audioCues, userData?.motionFeedback]);

  const updateQualityScore = useCallback(() => {
    if (frameDataRef.current.length > 0) {
      const quality = calculateFormQualityScore(frameDataRef.current, currentExercise);
      setFormQuality(quality.overallScore);
    }
  }, [currentExercise]);

  const detectRepCompletion = useCallback((angles) => {
    const primaryAngle = getPrimaryAngle(angles, currentExercise);

    // Define exercise-specific logic
    let isIncreasing = false;
    let peakThreshold = 0;
    let returnThreshold = 0;

    switch (currentExercise) {
      case 'shoulder-raises':
      case 'arm-raise':
        isIncreasing = true;
        peakThreshold = 80;   // Degrees (Start at ~10, lift to 90)
        returnThreshold = 30; // Return below 30
        break;

      case 'knee-bends':
      case 'squats':
      case 'squat':
        isIncreasing = false;
        peakThreshold = 140;   // Start 180, bend to < 140
        returnThreshold = 165; // Return to > 165
        break;

      case 'leg-raises':
      case 'leg-raise':
      case 'hip-flexion':
      case 'standing-march':
        isIncreasing = false;
        peakThreshold = 135;   // Hip flexion decreases angle from 180
        returnThreshold = 160;
        break;

      case 'elbow-flexion':
      case 'elbow-flex':
        isIncreasing = false;
        peakThreshold = 70;    // Bend arm to < 70
        returnThreshold = 140; // Straighten arm > 140
        break;

      case 'lateral-leg-raises':
        isIncreasing = false;
        peakThreshold = 145;   // Side lift: angle decreases from 180 to ~140
        returnThreshold = 165;
        break;

      case 'calf-raises':
        isIncreasing = true;
        peakThreshold = 135;   // Ankle extension increases angle from ~100 to 140+
        returnThreshold = 115;
        break;

      case 'arm-circles':
        isIncreasing = true;
        peakThreshold = 120;   // Abduction increases angle from 0 to ~90+
        returnThreshold = 60;
        break;

      default:
        isIncreasing = false;
        peakThreshold = 140;
        returnThreshold = 160;
    }

    if (isIncreasing) {
      if (primaryAngle > peakThreshold && previousPhaseRef.current !== 'peak') {
        previousPhaseRef.current = 'peak';
      } else if (primaryAngle < returnThreshold && previousPhaseRef.current === 'peak') {
        setRepCount(prev => prev + 1);
        previousPhaseRef.current = 'return';
        updateQualityScore();
      }
    } else {
      if (primaryAngle < peakThreshold && previousPhaseRef.current !== 'peak') {
        previousPhaseRef.current = 'peak';
      } else if (primaryAngle > returnThreshold && previousPhaseRef.current === 'peak') {
        setRepCount(prev => prev + 1);
        previousPhaseRef.current = 'return';
        updateQualityScore();
      }
    }
  }, [currentExercise, updateQualityScore]);

  const handlePoseDetected = useCallback((poseData) => {
    if (!sessionActive) return;
    const { angles, feedback: rtFeedback, timestamp } = poseData;

    // Optimization: Mutate ref array instead of spread+slice to reduce GC pressure (O(1) vs O(N))
    frameDataRef.current.push({ angles, timestamp, feedback: rtFeedback });
    if (frameDataRef.current.length > 1000) {
      frameDataRef.current.shift();
    }

    const primaryAngle = getPrimaryAngle(angles, currentExercise);

    // Performance Boost: Throttle UI state updates to ~15 FPS (66ms)
    // Users don't need 60FPS updates for text/angles, and this significantly reduces reconciliation overhead
    const now = Date.now();
    if (now - lastUiUpdateRef.current > 66) {
      if (primaryAngle !== undefined) {
        setCurrentAngle(Math.round(primaryAngle));
      }
      if (rtFeedback) {
        setFeedback(rtFeedback.message);
        setRealTimeFeedback(rtFeedback);
      }
      lastUiUpdateRef.current = now;
    }

    // Rep detection must run every frame to ensure no peak/return transitions are missed
    detectRepCompletion(angles);
  }, [sessionActive, detectRepCompletion, currentExercise]);

  useEffect(() => {
    if (sessionActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [sessionActive]);

  const handleStartSession = async () => {
    setSessionActive(true);
    if (!sessionStartTime) setSessionStartTime(Date.now());
    setFeedback('Great! Start your first rep');
    if (user) await logAction(user.uid, 'WORKOUT_START', { exercise: currentExercise });
  };

  const handlePauseSession = () => {
    setSessionActive(false);
    setFeedback('Session paused');
  };

  const handleEndSession = async () => {
    setSessionActive(false);
    const finalQuality = calculateFormQualityScore(frameDataRef.current, currentExercise);
    const finalROM = trackRangeOfMotion(frameDataRef.current, currentExercise);
    const sessionData = {
      exerciseName: AVAILABLE_EXERCISES[currentExercise]?.name || String(currentExercise).replace(/-/g, ' '),
      reps: repCount,
      quality: finalQuality.overallScore,
      rangeOfMotion: finalROM?.rangeOfMotion || 0,
      duration: formatTime(elapsedTime),
      durationSeconds: elapsedTime,
      grade: finalQuality.grade
    };
    try {
      if (user) {
        await saveSession(sessionData, user.uid);
        await markExerciseCompleted(user.uid, currentExercise);
      }
      navigate('/patient-dashboard', { state: { sessionCompleted: true } });
    } catch (error) {
      console.error('Failed to save session:', error);
      navigate('/patient-dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <NavHeader userType="patient" theme="dark" />

      <main role="main" className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Stats */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <button
            onClick={() => navigate('/patient-dashboard')}
            className="p-2.5 w-10 h-10 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-400 active:scale-90 transition-all font-bold"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
            <div className="bg-slate-900/40 border border-white/5 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 shrink-0">
              <Timer className="w-3.5 h-3.5 text-blue-400" />
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase leading-none mb-1">DURATION</span>
                <span className="text-xs sm:text-sm font-black tracking-tighter leading-none">{formatTime(elapsedTime)}</span>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-white/5 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 shrink-0">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase leading-none mb-1">FORM QUALITY</span>
                <span className="text-xs sm:text-sm font-black tracking-tighter leading-none">{formQuality}%</span>
              </div>
            </div>
            <div className="bg-slate-900/40 border border-white/5 px-3 sm:px-4 py-2 rounded-xl flex items-center gap-2 shrink-0">
              <Activity className="w-3.5 h-3.5 text-orange-400" />
              <div className="flex flex-col">
                <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase leading-none mb-1">RANGE OF MOTION</span>
                <span className="text-xs sm:text-sm font-black tracking-tighter leading-none">{currentAngle}°</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDemoOverlay(!showDemoOverlay)}
              className={`p-2.5 rounded-xl border transition-all active:scale-90 ${showDemoOverlay ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-500 border-slate-700/50'}`}
              title="Toggle Demo Overlay"
            >
              <Monitor className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-2.5 rounded-xl border transition-all active:scale-90 ${isFullscreen ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-slate-800/50 text-slate-500 border-slate-700/50'}`}
              title="Toggle Immersive View"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setIsDevMode(!isDevMode)}
              className={`hidden sm:inline-flex p-2.5 rounded-xl border transition-all active:scale-90 ${isDevMode ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-500 border-slate-700/50'}`}
            >
              <Terminal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {isDevMode && (
          <div className="mb-4 p-4 bg-slate-900/50 border border-white/5 rounded-[2rem]">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Override Exercise</p>
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {availableExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setCurrentExercise(ex.id);
                    setRepCount(0);
                    frameDataRef.current = [];
                    previousPhaseRef.current = 'start';
                  }}
                  className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${currentExercise === ex.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-slate-800 text-slate-500 hover:bg-slate-700'
                    }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 ${isFullscreen ? '' : 'lg:grid-cols-12'} gap-4 lg:gap-8 transition-all duration-500`}>
          {/* Main Viewport */}
          <div className={`${isFullscreen ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4 lg:space-y-6`}>
            <div className={`relative ${isFullscreen ? 'h-[75vh] lg:h-[750px] rounded-[2.5rem]' : 'h-[50vh] lg:h-[600px] rounded-[2.5rem]'} border border-white/5 bg-slate-950 shadow-2xl overflow-hidden transition-all duration-500`}>
              <AIEngine
                onPoseDetected={handlePoseDetected}
                exerciseType={currentExercise}
                repCount={repCount}
                settings={aiSettings}
              />

              {/* Demo Overlay (Premium PiP) */}
              {showDemoOverlay && (
                <div className="absolute top-4 left-4 z-30 w-32 sm:w-56 aspect-[4/5] rounded-[2rem] overflow-hidden border border-white/10 bg-slate-950/80 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in duration-500">
                  <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>

                  {/* PiP Header */}
                  <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between px-4 z-40">
                    <span className="text-[7px] font-black text-blue-400 uppercase tracking-[0.2em]">Neural Guide</span>
                    <button
                      onClick={() => setShowDemoOverlay(false)}
                      className="w-6 h-6 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-xs font-bold text-white transition-all active:scale-90"
                    >
                      ×
                    </button>
                  </div>

                  <ExerciseDemo
                    exerciseId={currentExercise}
                    isCompact={true}
                  />

                  {/* Bottom Indicator */}
                  <div className="absolute bottom-3 inset-x-0 flex justify-center pointer-events-none">
                    <div className="px-2 py-0.5 rounded-full bg-blue-600/20 border border-blue-500/30 backdrop-blur-md">
                      <p className="text-[6px] font-black text-blue-300 uppercase tracking-tighter">Live Kinematics</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Shrunken Feedback Overlay */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-fit">
                <div className={`px-5 py-3 rounded-2xl backdrop-blur-xl border flex items-center gap-3 shadow-2xl transition-all duration-300 ${realTimeFeedback?.severity === 'error' ? 'bg-rose-500/20 border-rose-500/30' :
                  'bg-black/80 border-white/10'
                  }`}>
                  <Activity className={`w-4 h-4 ${realTimeFeedback?.severity === 'error' ? 'text-rose-500' : 'text-blue-400 animate-pulse'}`} />
                  <p className="text-[10px] font-black tracking-widest text-white uppercase">{feedback}</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-slate-900/40 backdrop-blur-xl p-2.5 sm:p-3 rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 flex items-center gap-3 sm:gap-4">
              {!sessionActive ? (
                <button
                  onClick={handleStartSession}
                  className="w-full py-4 sm:py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[1.5rem] sm:rounded-[2rem] text-lg sm:text-xl shadow-2xl shadow-blue-900/40 transition-all transform active:scale-95 flex items-center justify-center gap-3 sm:gap-4 group"
                >
                  <Play className="w-6 h-6 sm:w-8 sm:h-8 fill-current group-hover:scale-110 transition-transform" />
                  <span>INITIALIZE SESSION</span>
                </button>
              ) : (
                <div className="flex w-full gap-3">
                  <button onClick={handlePauseSession} className="flex-1 py-4 sm:py-6 bg-slate-800 text-white font-black rounded-[1.5rem] sm:rounded-[2rem] text-sm sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:bg-slate-700 transition-all">
                    <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> PAUSE
                  </button>
                  <button onClick={handleEndSession} className="flex-1 py-4 sm:py-6 bg-rose-600 text-white font-black rounded-[1.5rem] sm:rounded-[2rem] text-sm sm:text-lg flex items-center justify-center gap-2 sm:gap-3 hover:bg-rose-500 transition-all shadow-xl shadow-rose-900/20">
                    <StopCircle className="w-5 h-5 sm:w-6 sm:h-6 fill-current" /> FINISH
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Exercise Guide (Hidden in Fullscreen) */}
          {!isFullscreen && (
            <div className="lg:col-span-4 space-y-6">
              <div className="hidden lg:block bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-[3rem] p-8 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest leading-none mb-1">Anatomical Lab</h3>
                    <p className="text-xl font-black text-white">{AVAILABLE_EXERCISES[currentExercise]?.name || String(currentExercise).replace(/-/g, ' ')}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-600/20 rounded-xl flex items-center justify-center">
                    <Info className="w-5 h-5 text-blue-400" />
                  </div>
                </div>

                <ExerciseDemo
                  exerciseId={currentExercise}
                  isCompact={true}
                />

                <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Angle</span>
                    <span className="text-xs font-bold text-white">45° - 180° Range</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Intensity</span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={`w-3 h-1 rounded-full ${i <= 2 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Neural Summary Grid */}
              <div className="bg-slate-900/50 rounded-3xl border border-white/5 p-6 text-center">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-2 italic">Neural engine optimizing scale and intensity...</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Neural Engine Syncing</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkoutSession;
