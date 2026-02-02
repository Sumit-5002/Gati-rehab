// WorkoutSession - Exercise session with AI tracking
// Owner: Sumit Prasad, Member 2, 3

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, StopCircle } from 'lucide-react';
import AIEngine from '../components/AIEngine';
import NavHeader from '../components/NavHeader';

const WorkoutSession = () => {
  const navigate = useNavigate();
  const [sessionActive, setSessionActive] = useState(false);
  const [currentExercise] = useState('Knee Bends');
  const [repCount, setRepCount] = useState(0);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [feedback, setFeedback] = useState('Position yourself in front of the camera');

  // Handle pose detection from AIEngine
  const handlePoseDetected = (landmarks) => {
    // TODO: Process landmarks and calculate angles
    // This will use utils/angleCalculations.js (Member 2)
    // and utils/scoring.js (Member 3)
    
    console.log('[WorkoutSession] Pose detected:', landmarks);
    
    // Example processing (to be implemented):
    // const angles = calculateAngles(landmarks);
    // const quality = calculateFormQuality(angles, currentExercise);
    // const rom = trackRangeOfMotion(angles);
    
    // Update UI with feedback
    // setCurrentAngle(angles.knee);
    // setFeedback(quality.feedback);
    // if (quality.repCompleted) {
    //   setRepCount(prev => prev + 1);
    // }
  };

  const handleStartSession = () => {
    setSessionActive(true);
    setRepCount(0);
    setFeedback('Great! Start your exercise');
  };

  const handlePauseSession = () => {
    setSessionActive(false);
    setFeedback('Session paused');
  };

  const handleEndSession = () => {
    // TODO: Save session data to localStorage (offline)
    // and sync to Firestore when online
    const sessionData = {
      exerciseName: currentExercise,
      date: new Date().toISOString(),
      reps: repCount,
      quality: 85, // Placeholder
      rangeOfMotion: currentAngle,
      duration: '12 min', // Calculate actual duration
    };

    console.log('[WorkoutSession] Session ended:', sessionData);
    
    // Navigate back to dashboard
    navigate('/patient-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader userType="patient" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/patient-dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Session Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {currentExercise}
              </h1>
              <p className="text-gray-600 mt-1">3 sets × 10 reps</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Reps Completed</p>
              <p className="text-4xl font-bold text-blue-600">{repCount}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Camera View */}
          <div className="lg:col-span-2">
            <AIEngine
              onPoseDetected={handlePoseDetected}
              exerciseType={currentExercise}
            />

            {/* Session Controls */}
            <div className="mt-6 flex items-center justify-center gap-4">
              {!sessionActive ? (
                <button
                  onClick={handleStartSession}
                  className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-lg shadow-lg transition-transform transform active:scale-95"
                >
                  <Play className="w-5 h-5" />
                  Start Exercise
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePauseSession}
                    className="flex items-center gap-2 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg shadow-lg transition-transform transform active:scale-95"
                  >
                    <Pause className="w-5 h-5" />
                    Pause
                  </button>
                  <button
                    onClick={handleEndSession}
                    className="flex items-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-transform transform active:scale-95"
                  >
                    <StopCircle className="w-5 h-5" />
                    End Session
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Real-time Feedback Panel */}
          <div className="space-y-4">
            {/* Feedback Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Live Feedback
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Form Quality</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all"
                        style={{ width: '85%' }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      85%
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Current Angle</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {currentAngle}°
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-2">Instructions</p>
                  <p className="text-base text-gray-900">{feedback}</p>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Tips</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Keep your back straight</li>
                <li>• Move slowly and controlled</li>
                <li>• Breathe steadily</li>
                <li>• Stop if you feel pain</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSession;
