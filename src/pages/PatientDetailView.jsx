// PatientDetailView - Detailed view of patient progress with charts
// Owner: Member 5

import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import NavHeader from '../components/NavHeader';
import SessionReport from '../components/SessionReport';

const PatientDetailView = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();

  // Mock patient data - will be replaced with Firestore data
  const patient = {
    id: patientId,
    name: 'Rajesh Kumar',
    condition: 'Post-Knee Surgery Rehab',
    adherenceRate: 87,
    completedSessions: 24,
    totalSessions: 30,
    lastActive: '2 hours ago',
    progressLevel: 'Good',
  };

  // Mock ROM (Range of Motion) trend data
  const romData = [
    { date: 'Week 1', knee: 45, hip: 60, ankle: 30 },
    { date: 'Week 2', knee: 65, hip: 75, ankle: 40 },
    { date: 'Week 3', knee: 85, hip: 85, ankle: 50 },
    { date: 'Week 4', knee: 105, hip: 95, ankle: 60 },
    { date: 'Week 5', knee: 120, hip: 100, ankle: 65 },
  ];

  // Mock Quality Score trend data
  const qualityData = [
    { date: 'Mon', score: 65 },
    { date: 'Tue', score: 72 },
    { date: 'Wed', score: 78 },
    { date: 'Thu', score: 85 },
    { date: 'Fri', score: 82 },
    { date: 'Sat', score: 88 },
    { date: 'Sun', score: 87 },
  ];

  // Mock recent sessions
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
      date: '1 day ago',
      reps: 20,
      quality: 82,
      rangeOfMotion: 95,
      duration: '8 min',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader userType="doctor" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate('/doctor-dashboard')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-medium">Back to Patients</span>
        </button>

        {/* Patient Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.name}
                </h1>
                <p className="text-gray-600 mt-1">{patient.condition}</p>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Last active: {patient.lastActive}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    <span>
                      Sessions: {patient.completedSessions}/{patient.totalSessions}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Adherence Badge */}
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {patient.adherenceRate}%
              </div>
              <p className="text-sm text-gray-600 mt-1">Adherence Rate</p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Range of Motion Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Range of Motion Progress
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={romData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Degrees', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="knee"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Knee"
                />
                <Line
                  type="monotone"
                  dataKey="hip"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Hip"
                />
                <Line
                  type="monotone"
                  dataKey="ankle"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  name="Ankle"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Quality Score Trend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Weekly Quality Score
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={qualityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: 'Score %', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                  name="Quality Score"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Sessions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentSessions.map((session, index) => (
              <SessionReport key={index} sessionData={session} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailView;
