
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  StopCircle,
  AlertCircle,
  CheckCircle,
  Activity,
  Timer,
  BarChart3,
  Award,
  Terminal,
  FlaskConical,
  ChevronDown
} from 'lucide-react';
import AIEngine from '../../ai/components/AIEngine';
import NavHeader from '../../../shared/components/NavHeader';
import { useAuth } from '../../auth/context/AuthContext';
import { saveSession } from '../services/sessionService';
import { calculateFormQualityScore, trackRangeOfMotion } from '../utils/enhancedScoring';
import { AVAILABLE_EXERCISES } from '../../ai/utils/secondaryExercises';
import { getPrimaryAngle } from '../../ai/utils/angleCalculations';

const WorkoutSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [sessionActive, setSessionActive] = useState(false);
  const [currentExercise, setCurrentExercise] = useState('knee-bends');
  const [repCount, setRepCount] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [feedback, setFeedback] = useState('Position yourself in front of the camera');
  const [formQuality, setFormQuality] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const frameDataRef = useRef([]); // Use ref for high-frequency data to avoid re-renders
  const [realTimeFeedback, setRealTimeFeedback] = useState(null);
  const [isDevMode, setIsDevMode] = useState(location.state?.devMode || false);

  const availableExercises = Object.entries(AVAILABLE_EXERCISES).map(([id, data]) => ({
    id,
    name: data.name
  }));

  const timerRef = useRef(null);
  const previousPhaseRef = useRef('start');
  const angleHistoryRef = useRef([]);

  const updateQualityScore = useCallback(() => {
    if (frameDataRef.current.length > 0) {
      const quality = calculateFormQualityScore(frameDataRef.current, currentExercise);
      setFormQuality(quality.overallScore);
    }
  }, [currentExercise]);

  // Detect when a rep is completed
  const detectRepCompletion = useCallback((angles) => {
    // Resolve primary angle using utility
    const primaryAngle = getPrimaryAngle(angles, currentExercise);

    // Default thresholds for most flexion exercises (Knee, Hip, Elbow)
    let thresholdLow = 100;
    let thresholdHigh = 155;
    let isFlexionExercise = true; // Angle decreases during flexion (most exercises)

    if (currentExercise.includes('shoulder')) {
      thresholdLow = 90; // Flexion target
      thresholdHigh = 30; // Return target
      isFlexionExercise = false; // Angle increases during flexion
    } else if (currentExercise.includes('hip') || currentExercise.includes('march') || currentExercise.includes('leg')) {
      thresholdLow = 110;
      thresholdHigh = 160;
    } else if (currentExercise.includes('elbow')) {
      thresholdLow = 90;
      thresholdHigh = 150;
    }

    // Generic phase detection
    if (isFlexionExercise) {
      // Flexion -> Extension toggle (e.g. Knee Bends: 180 -> 90 -> 180)
      if (primaryAngle < thresholdLow && previousPhaseRef.current !== 'low') {
        previousPhaseRef.current = 'low';
      } else if (primaryAngle > thresholdHigh && previousPhaseRef.current === 'low') {
        setRepCount(prev => prev + 1);
        previousPhaseRef.current = 'high';
        updateQualityScore();
      }
    } else {
      // Extension -> Flexion toggle (e.g. Shoulder Raises: 0 -> 90 -> 0)
      if (primaryAngle > thresholdLow && previousPhaseRef.current !== 'low') {
        previousPhaseRef.current = 'low';
      } else if (primaryAngle < thresholdHigh && previousPhaseRef.current === 'low') {
        setRepCount(prev => prev + 1);
        previousPhaseRef.current = 'high';
        updateQualityScore();
      }
    }
  }, [currentExercise, updateQualityScore]);

  // Handle pose detection from AIEngine
  const handlePoseDetected = useCallback((poseData) => {
    if (!sessionActive) return;

    const { angles, feedback: rtFeedback, timestamp } = poseData;

    // Store frame data in ref to avoid re-renders on every frame (up to 60fps)
    frameDataRef.current.push({ angles, timestamp, feedback: rtFeedback });
    if (frameDataRef.current.length > 1000) {
      frameDataRef.current.shift();
    }

    // Update current angle (dynamic based on exercise)
    const primaryAngle = getPrimaryAngle(angles, currentExercise);
    setCurrentAngle(Math.round(primaryAngle));
    angleHistoryRef.current.push(primaryAngle);

    // Update feedback display
    if (rtFeedback) {
      setFeedback(rtFeedback.message);
      setRealTimeFeedback(rtFeedback);
    }

    // Detect rep completion
    detectRepCompletion(angles);
  }, [sessionActive, detectRepCompletion, currentExercise]);

  // Timer effect
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

  const handleStartSession = () => {
    setSessionActive(true);
    if (!sessionStartTime) setSessionStartTime(Date.now());
    setFeedback('Great! Start your first rep');
  };

  const handlePauseSession = () => {
    setSessionActive(false);
    setFeedback('Session paused');
  };

  const handleEndSession = async () => {
    setSessionActive(false);

    const finalQuality = calculateFormQualityScore(frameDataRef.current, currentExercise);
    const rom = trackRangeOfMotion(frameDataRef.current, currentExercise);

    const sessionData = {
      exerciseName: currentExercise,
      reps: repCount,
      quality: finalQuality.overallScore,
      rangeOfMotion: Math.round(rom.maxROM || 0),
      duration: formatTime(elapsedTime),
      durationSeconds: elapsedTime,
      grade: finalQuality.grade
    };

    try {
      if (user) {
        await saveSession(sessionData, user.uid);
      }
      navigate('/patient-dashboard', { state: { sessionCompleted: true } });
    } catch (error) {
      console.error('Failed to save session:', error);
      navigate('/patient-dashboard');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pb-28">
      <NavHeader userType="patient" theme="dark" />

      <main role="main" className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Stats */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <button
            onClick={() => navigate('/patient-dashboard')}
            className="p-2.5 w-10 h-10 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-400 active:scale-90 transition-all"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex items-center gap-2 flex-wrap">
            <div className="bg-slate-900/80 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Timer className="w-3 h-3 text-blue-400" />
              <span className="text-sm font-mono font-bold tracking-tight">{formatTime(elapsedTime)}</span>
            </div>
            <div className="bg-slate-900/80 border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Award className="w-3 h-3 text-amber-400" />
              <span className="text-sm font-bold tracking-tight">{formQuality}%</span>
            </div>
          </div>

          <button
            onClick={() => setIsDevMode(!isDevMode)}
            className={`hidden sm:inline-flex p-2.5 rounded-xl border transition-all active:scale-90 self-start sm:self-auto ${isDevMode ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-500 border-slate-700/50'}`}
            aria-label="Toggle developer mode"
          >
            <Terminal className="w-5 h-5" />
          </button>
        </div>

        {isDevMode && (
          <div className="hidden sm:block mb-4 p-3 bg-slate-900/50 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-500/20 rounded-lg shrink-0">
                <FlaskConical className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest">Models</span>
              </div>
              {availableExercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => {
                    setCurrentExercise(ex.id);
                    setRepCount(0);
                    frameDataRef.current = [];
                  }}
                  className={`whitespace-nowrap px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${currentExercise === ex.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-500'
                    }`}
                >
                  {ex.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Viewport */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative rounded-[2rem] sm:rounded-[2.5rem] border border-white/5 bg-slate-950 shadow-inner group">
              {/* Visual Feedback Overlay Border */}
              <div
                className="absolute inset-0 pointer-events-none z-20 transition-all duration-300"
                style={{
                  boxShadow: realTimeFeedback?.severity === 'error' ? 'inset 0 0 40px rgba(239, 68, 68, 0.3)' :
                    realTimeFeedback?.severity === 'warning' ? 'inset 0 0 40px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              ></div>

              <div className="w-full h-full scale-100 md:scale-[1.01] lg:scale-[1.02]">
                <AIEngine
                  onPoseDetected={handlePoseDetected}
                  exerciseType={currentExercise}
                  repCount={repCount}
                />
              </div>

            </div>

            {/* Feedback Card */}
            <div className="mt-3 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${realTimeFeedback?.severity === 'error' ? 'bg-rose-500/20 text-rose-500' : 'bg-blue-500/20 text-blue-400'}`}>
                <Activity className="w-4 h-4 animate-pulse" />
              </div>
              <p className="text-[13px] font-bold text-white leading-tight">
                {feedback}
              </p>
            </div>

            {/* Controls */}
            <div className="pt-2">
              {!sessionActive ? (
                <button
                  onClick={handleStartSession}
                  className="w-full py-5 bg-blue-600 active:bg-blue-700 text-white font-black rounded-2xl text-lg shadow-xl shadow-blue-900/40 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>START TRAINING</span>
                </button>
              ) : (
                <div className="flex gap-4">
                  <button
                    onClick={handlePauseSession}
                    className="flex-1 py-4 bg-slate-800 text-white font-black rounded-2xl text-base active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Pause className="w-5 h-5 fill-current" />
                    PAUSE
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl text-base active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20"
                  >
                    <StopCircle className="w-5 h-5 fill-current" />
                    FINISH
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Metrics - More compact for mobile */}
          <div className="hidden lg:grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Live Feed</p>
                  <p className="text-xs font-bold text-slate-300">Joint Angle</p>
                </div>
                <span className="text-2xl font-black text-blue-400">{currentAngle}°</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${currentAngle / 1.8}%` }}></div>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Neural AI</p>
                  <p className="text-xs font-bold text-slate-300">Form Quality</p>
                </div>
                <span className="text-2xl font-black text-emerald-400">{formQuality}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${formQuality}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const MetricBox = ({ label, value, subvalue, progress, color = 'emerald' }) => (
  <div className="relative">
    <div className="flex justify-between items-end mb-2">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-slate-300">{subvalue}</p>
      </div>
      <span className="text-2xl font-black">{value}</span>
    </div>
    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div
        className={`h-full transition-all duration-300 ${color === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`}
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  </div>
);

export default WorkoutSession;
