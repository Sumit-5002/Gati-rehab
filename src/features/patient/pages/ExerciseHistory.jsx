
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Activity, Calendar, Clock, Award, FileText, Download, Filter, Search } from 'lucide-react';
import NavHeader from '../../../shared/components/NavHeader';
import SessionReport from '../components/SessionReport';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { getRecentSessions } from '../services/patientService';
import { downloadCSV } from '../../../utils/exportUtils';

const ExerciseHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [painLogs, setPainLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleExport = () => {
    const exportData = sessions.map(s => ({
      Exercise: s.exerciseName,
      Date: s.date,
      Reps: s.reps,
      Quality: s.quality,
      ROM: s.rangeOfMotion,
      Duration: s.duration
    }));
    downloadCSV(exportData, `Gati_Rehab_History_${new Date().toISOString().split('T')[0]}.csv`);
  };

  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      try {
        // Fetch sessions
        const data = await getRecentSessions(user.uid, 50);
        setSessions(data);

        // Fetch pain logs
        const painRef = collection(db, 'pain_logs');
        const painQuery = query(painRef, where('userId', '==', user.uid), orderBy('timestamp', 'asc'), limit(20));
        const painSnap = await getDocs(painQuery);
        const logs = [];
        painSnap.forEach(doc => {
          const d = doc.data();
          logs.push({
            date: d.timestamp?.toDate()?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'N/A',
            pain: d.painLevel
          });
        });
        setPainLogs(logs);

        setLoading(false);
      } catch (error) {
        console.error('[ExerciseHistory] Error fetching sessions:', error);
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  const filteredSessions = sessions.filter(session =>
    session.exerciseName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 border-opacity-20 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      <NavHeader userType="patient" />

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <button
              onClick={() => navigate('/patient-dashboard')}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">
              Exercise <span className="text-blue-600">History</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2">View all your past rehabilitation sessions</p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search exercises..."
                className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-100 outline-none transition-all w-full md:w-64"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {filteredSessions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-[2rem] p-2 shadow-xl shadow-slate-200/50 border border-white hover:scale-[1.02] transition-all duration-300">
                <SessionReport sessionData={session} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-sm">
            <Activity className="w-20 h-20 text-slate-100 mb-6" />
            <h3 className="text-xl font-black text-slate-900">No sessions found</h3>
            <p className="text-slate-400 font-bold mt-2">Start your recovery journey today!</p>
            <button
              onClick={() => navigate('/workout')}
              className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-blue-500 transition-all shadow-xl shadow-blue-200"
            >
              Start First Workout
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

const PainTrendChart = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-white mb-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900">Chronic Pain Trend</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Symptom Intensity Over Time</p>
        </div>
        <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100">
          Last {data.length} Logs
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="date" tick={{fontSize: 10, fontWeight: 700, fill: '#94A3B8'}} axisLine={false} tickLine={false} />
            <YAxis domain={[0, 5]} hide />
            <Tooltip
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
            />
            <Area
              type="monotone"
              dataKey="pain"
              stroke="#F43F5E"
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorPain)"
              name="Pain Level"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ExerciseHistory;
