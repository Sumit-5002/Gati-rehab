
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Award
} from 'lucide-react';
import AIEngine from '../../ai/components/AIEngine';
import NavHeader from '../../../shared/components/NavHeader';
import { useAuth } from '../../auth/context/AuthContext';
import { saveSession } from '../services/sessionService';
import { calculateFormQualityScore, trackRangeOfMotion } from '../utils/enhancedScoring';
import { getVisualFeedbackStyle } from '../../ai/utils/realTimeFeedback';

const WorkoutSession = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessionActive, setSessionActive] = useState(false);
  const [currentExercise] = useState('Knee Bends');
  const [repCount, setRepCount] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [feedback, setFeedback] = useState('Position yourself in front of the camera');
  const [formQuality, setFormQuality] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [frameData, setFrameData] = useState([]);
  const [realTimeFeedback, setRealTimeFeedback] = useState(null);

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
    const kneeAngle = Math.min(angles.leftKnee || 180, angles.rightKnee || 180);

    // Logic for Knee Bends: Flexion (< 100) -> Extension (> 150)
    if (kneeAngle < 100 && previousPhaseRef.current !== 'flexed') {
      previousPhaseRef.current = 'flexed';
    } else if (kneeAngle > 155 && previousPhaseRef.current === 'flexed') {
      setRepCount(prev => prev + 1);
      previousPhaseRef.current = 'extended';
      // Recalculate form quality every rep
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
      <NavHeader userType="patient" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header with Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <button
            onClick={() => navigate('/patient-dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-fit"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-bold">Back to Dashboard</span>
          </button>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex flex-col items-center">
              <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Time</span>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-700">
                <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-blue-400" />
                <span className="text-base sm:text-xl font-mono font-bold">{formatTime(elapsedTime)}</span>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[8px] sm:text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Score</span>
              <div className="flex items-center gap-2 bg-slate-800/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-700">
                <Award className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-base sm:text-xl font-bold">{formQuality}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Viewport */}
          <div className="lg:col-span-3 space-y-6">
            <div className="relative rounded-[2rem] sm:rounded-3xl overflow-hidden border-[6px] sm:border-8 border-slate-800 shadow-2xl bg-black aspect-[4/3] sm:aspect-video flex items-center justify-center">
              {/* Visual Feedback Overlay Border */}
              <div
                className="absolute inset-0 pointer-events-none z-20 transition-all duration-300"
                style={{
                  boxShadow: realTimeFeedback?.severity === 'error' ? 'inset 0 0 100px rgba(239, 68, 68, 0.4)' :
                    realTimeFeedback?.severity === 'warning' ? 'inset 0 0 100px rgba(245, 158, 11, 0.3)' :
                      'none',
                  border: realTimeFeedback?.severity === 'error' ? '8px solid rgba(239, 68, 68, 0.5)' : 'none'
                }}
              ></div>

              <AIEngine
                onPoseDetected={handlePoseDetected}
                exerciseType={currentExercise}
              />

              {/* Floating Feedback Glassmorphism */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-lg px-6">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-1">Current Instruction</p>
                    <h2 className="text-xl font-bold leading-tight">
                      {feedback}
                    </h2>
                  </div>
                  <div className="flex flex-col items-center px-4 border-l border-white/10">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reps</span>
                    <span className="text-4xl font-black text-blue-500">{repCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4">
              {!sessionActive ? (
                <button
                  onClick={handleStartSession}
                  className="group relative flex items-center gap-3 px-10 py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl text-xl shadow-xl shadow-blue-900/40 transition-all transform active:scale-95 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Play className="w-6 h-6 fill-current" />
                  {elapsedTime > 0 ? 'Resume Training' : 'Start Training'}
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseSession}
                    className="flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-lg shadow-lg transition-all transform active:scale-95"
                  >
                    <Pause className="w-5 h-5 fill-current" />
                    Pause
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="flex items-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-lg shadow-xl shadow-red-900/40 transition-all transform active:scale-95"
                  >
                    <StopCircle className="w-5 h-5 fill-current" />
                    Finish Session
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold">Real-time Metrics</h3>
              </div>

              <div className="space-y-8">
                <MetricBox
                  label="Joint Angle"
                  value={`${currentAngle}°`}
                  subvalue="Knee Flexion"
                  progress={currentAngle / 1.8}
                />
                <MetricBox
                  label="Form Quality"
                  value={`${formQuality}%`}
                  subvalue="Overall Accuracy"
                  progress={formQuality}
                  color="blue"
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 rounded-3xl border border-indigo-500/20 p-6">
              <h4 className="font-bold text-indigo-300 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4" /> Training Tips
              </h4>
              <ul className="space-y-3 text-sm text-indigo-100/70">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  Keep your movements slow and controlled.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  Ensure full range of motion for best results.
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                  Stay visible in the camera frame.
                </li>
              </ul>
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
