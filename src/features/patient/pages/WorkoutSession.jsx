
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
import { getVisualFeedbackStyle } from '../../ai/utils/realTimeFeedback';

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
  const [frameData, setFrameData] = useState([]);
  const [realTimeFeedback, setRealTimeFeedback] = useState(null);
  const [isDevMode, setIsDevMode] = useState(location.state?.devMode || false);

  const availableExercises = [
    { id: 'knee-bends', name: 'Knee Bends' },
    { id: 'leg-raises', name: 'Leg Raises' },
    { id: 'hip-flexion', name: 'Hip Flexion' },
    { id: 'shoulder-raises', name: 'Shoulder Raises' },
    { id: 'elbow-flexion', name: 'Elbow Flexion' },
    { id: 'standing-march', name: 'Standing March' }
  ];

  const timerRef = useRef(null);
  const previousPhaseRef = useRef('start');
  const angleHistoryRef = useRef([]);

  // Handle pose detection from AIEngine
  const handlePoseDetected = useCallback((poseData) => {
    if (!sessionActive) return;

    const { angles, feedback: rtFeedback, timestamp } = poseData;

    // Store frame data for later analysis (limited to prevent memory issues)
    setFrameData(prev => {
      const newData = [...prev, { angles, timestamp, feedback: rtFeedback }];
      return newData.slice(-1000); // Keep last 1000 frames for scoring
    });

    // Update current angle (knee angle for knee-bends)
    const primaryAngle = angles.leftKnee || angles.rightKnee || 0;
    setCurrentAngle(Math.round(primaryAngle));
    angleHistoryRef.current.push(primaryAngle);

    // Update feedback display
    if (rtFeedback) {
      setFeedback(rtFeedback.message);
      setRealTimeFeedback(rtFeedback);
    }

    // Detect rep completion
    detectRepCompletion(angles);
  }, [sessionActive]);

  // Detect when a rep is completed
  const detectRepCompletion = (angles) => {
    // Dynamic joint selection based on exercise
    let primaryAngle = 180;
    let thresholdLow = 100;
    let thresholdHigh = 155;

    if (currentExercise.includes('knee')) {
      primaryAngle = Math.min(angles.leftKnee || 180, angles.rightKnee || 180);
    } else if (currentExercise.includes('hip') || currentExercise.includes('march') || currentExercise.includes('leg')) {
      primaryAngle = Math.min(angles.leftHip || 180, angles.rightHip || 180);
      thresholdLow = 110;
      thresholdHigh = 160;
    } else if (currentExercise.includes('shoulder')) {
      primaryAngle = Math.max(angles.leftShoulder || 0, angles.rightShoulder || 0);
      thresholdLow = 140; // Extension for status
      thresholdHigh = 60; // Return
    }

    // Generic phase detection (Flexion -> Extension toggle)
    if (primaryAngle < thresholdLow && previousPhaseRef.current !== 'low') {
      previousPhaseRef.current = 'low';
    } else if (primaryAngle > thresholdHigh && previousPhaseRef.current === 'low') {
      setRepCount(prev => prev + 1);
      previousPhaseRef.current = 'high';
      updateQualityScore();
    }
  };

  const updateQualityScore = () => {
    if (frameData.length > 0) {
      const quality = calculateFormQualityScore(frameData, currentExercise);
      setFormQuality(quality.overallScore);
    }
  };

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

    const finalQuality = calculateFormQualityScore(frameData, currentExercise);
    const rom = trackRangeOfMotion(frameData, currentExercise);

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

  const feedbackStyle = realTimeFeedback ? getVisualFeedbackStyle(realTimeFeedback.visualCue) : {};

  return (
    <div className="min-h-screen bg-[#0F172A] text-white">
      <NavHeader userType="patient" theme="dark" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Stats */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/patient-dashboard')}
            className="p-2.5 bg-slate-800/50 rounded-xl border border-slate-700/50 text-slate-400 active:scale-90 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
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
            className={`p-2.5 rounded-xl border transition-all active:scale-90 ${isDevMode ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-500 border-slate-700/50'}`}
          >
            <Terminal className="w-5 h-5" />
          </button>
        </div>

        {isDevMode && (
          <div className="mb-4 p-3 bg-slate-900/50 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2">
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
                    setFrameData([]);
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
            <div className="relative rounded-[2.5rem] overflow-hidden border border-white/5 bg-slate-950 aspect-[4/5] sm:aspect-video flex items-center justify-center shadow-inner group">
              {/* Visual Feedback Overlay Border */}
              <div
                className="absolute inset-0 pointer-events-none z-20 transition-all duration-300"
                style={{
                  boxShadow: realTimeFeedback?.severity === 'error' ? 'inset 0 0 40px rgba(239, 68, 68, 0.3)' :
                    realTimeFeedback?.severity === 'warning' ? 'inset 0 0 40px rgba(245, 158, 11, 0.2)' : 'none'
                }}
              ></div>

              <div className="w-full h-full scale-[1.02]">
                <AIEngine onPoseDetected={handlePoseDetected} exerciseType={currentExercise} />
              </div>

              {/* Status Info Overlays */}
              <div className="absolute top-4 left-4 z-20">
                <div className="bg-blue-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full shadow-lg border border-white/10">
                  {currentExercise.replace('-', ' ')}
                </div>
              </div>

              {/* Rep Count Overlay - Minimalist */}
              <div className="absolute top-4 right-4 z-20 flex flex-col items-center">
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-3 flex flex-col items-center min-w-[65px] shadow-2xl">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Reps</span>
                  <span className="text-3xl font-black text-blue-500 leading-none">{repCount}</span>
                </div>
              </div>

              {/* Feedback Overlay - Bottom Center Floating */}
              <div className="absolute bottom-6 left-4 right-4 z-20 flex justify-center">
                <div className="bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 shadow-2xl flex items-center gap-3 w-full max-w-[320px] transition-all transform animate-in fade-in slide-in-from-bottom-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${realTimeFeedback?.severity === 'error' ? 'bg-rose-500/20 text-rose-500' : 'bg-blue-500/20 text-blue-400'}`}>
                    <Activity className="w-4 h-4 animate-pulse" />
                  </div>
                  <p className="text-[13px] font-bold text-white leading-tight">
                    {feedback}
                  </p>
                </div>
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4 flex flex-col justify-center">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Live Feed</p>
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
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Neural AI</p>
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
      </div>
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
