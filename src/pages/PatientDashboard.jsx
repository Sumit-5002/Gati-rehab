// PatientDashboard - Patient's main dashboard
// Owner: Member 4

import { useNavigate } from 'react-router-dom';
import { Play, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import NavHeader from '../components/NavHeader';
import SessionReport from '../components/SessionReport';

const PatientDashboard = () => {
  const navigate = useNavigate();

  // Mock data - will be replaced with real data from Firestore
  const patientName = 'Rajesh Kumar';
  const todayRoutine = [
    { id: 1, name: 'Knee Bends', sets: 3, reps: 10, completed: false },
    { id: 2, name: 'Leg Raises', sets: 2, reps: 10, completed: false },
    { id: 3, name: 'Hip Flexion', sets: 3, reps: 8, completed: false },
  ];

  const recentSessions = [
    {
      exerciseName: 'Knee Bends',
      date: '2 hours ago',
      reps: 30,
      quality: 85,
      rangeOfMotion: 120,
      duration: '12 min',
    },
    {
      exerciseName: 'Leg Raises',
      date: 'Yesterday',
      reps: 20,
      quality: 72,
      rangeOfMotion: 95,
      duration: '8 min',
    },
  ];

  const stats = {
    totalSessions: 24,
    weeklyGoal: 5,
    completed: 3,
    streak: 7,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader userType="patient" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Development Mode Indicator */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            🚧 <strong>Demo Mode:</strong> Using mock data. Configure Firebase in <code className="bg-yellow-100 px-1 rounded">.env</code> file to see real user data.
          </p>
        </div>

        {/* Welcome Section */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {patientName}
          </h1>
          <p className="text-gray-600 mt-1">
            Your recovery journey continues today
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sessions</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.completed}/{stats.weeklyGoal}
                </p>
              </div>
              <Clock className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Day Streak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.streak}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-4 text-white">
            <p className="text-sm opacity-90">Adherence Rate</p>
            <p className="text-3xl font-bold">87%</p>
            <p className="text-xs mt-1 opacity-75">Keep it up! 🎉</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Routine */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Today's Routine
            </h2>
            <div className="space-y-3">
              {todayRoutine.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {exercise.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {exercise.sets} sets × {exercise.reps} reps
                    </p>
                  </div>
                  {exercise.completed ? (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate('/workout')}
              className="w-full mt-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Session
            </button>

            <p className="mt-3 text-center text-xs text-gray-500">
              * AI functionality works offline
            </p>
          </div>

          {/* Recent Sessions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Recent Sessions
            </h2>
            <div className="space-y-4">
              {recentSessions.map((session, index) => (
                <SessionReport key={index} sessionData={session} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
