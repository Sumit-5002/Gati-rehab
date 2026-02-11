
import { User, TrendingUp, TrendingDown, AlertCircle, AlertTriangle, ChevronRight, Activity, Calendar, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { deletePatientFromDoctor } from '../services/doctorService';
import { useAuth } from '../../auth/context/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';

const PatientCard = ({ patient, viewMode = 'grid' }) => {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  // Calculate a reliable adherence rate in real-time
  const displayAdherence = Math.max(
    patient.adherenceRate || 0,
    Math.min(100, Math.round(((patient.completedSessions || 0) / (patient.totalSessions || 5)) * 100))
  );

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border-emerald-900/50' : 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (rate >= 60) return isDarkMode ? 'text-amber-400 bg-amber-900/20 border-amber-900/50' : 'text-amber-600 bg-amber-50 border-amber-100';
    return isDarkMode ? 'text-rose-400 bg-rose-900/20 border-rose-900/50' : 'text-rose-600 bg-rose-50 border-rose-100';
  };

  const isHighRisk = displayAdherence < 60;

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to disconnect ${patient.name}?`)) {
      try {
        await deletePatientFromDoctor(user.uid, patient.id);
      } catch (error) {
        console.error('Failed to delete patient:', error);
        alert('Failed to disconnect patient.');
      }
    }
  };

  if (viewMode === 'list') {
    return (
      <div
        onClick={() => navigate(`/patient/${patient.id}`)}
        className={`group flex flex-col sm:flex-row items-center gap-4 p-4 sm:p-6 rounded-xl sm:rounded-[2rem] border transition-all cursor-pointer touch-optimized ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:shadow-none' : 'bg-white border-slate-100 hover:shadow-xl hover:shadow-slate-200/50'}`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-gray-700 group-hover:bg-gray-600' : 'bg-slate-100 group-hover:bg-blue-50'}`}>
            <User className={`w-6 h-6 sm:w-7 sm:h-7 transition-colors ${isDarkMode ? 'text-slate-500 group-hover:text-blue-400' : 'text-slate-400 group-hover:text-blue-500'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`text-lg sm:text-xl font-black leading-tight mb-1 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{patient.name}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{patient.condition}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handleDelete}
            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
            title="Disconnect Patient"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Adherence</p>
            <div className={`px-3 py-1.5 rounded-full text-xs font-black border ${getAdherenceColor(displayAdherence)} min-w-[60px]`}>
              {displayAdherence}%
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Active</p>
            <p className={`text-sm font-black ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>{patient.lastActive}</p>
          </div>
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => navigate(`/patient/${patient.id}`)}
      className={`group rounded-xl sm:rounded-[2.5rem] p-6 sm:p-8 border transition-all cursor-pointer relative overflow-hidden flex flex-col touch-optimized ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:shadow-none' : 'bg-white border-slate-50 hover:shadow-xl hover:shadow-slate-200/50'} ${isHighRisk
        ? (isDarkMode ? 'border-rose-900/50 hover:border-rose-500/50' : 'border-rose-100 hover:border-rose-200')
        : (isDarkMode ? 'hover:border-blue-500/30' : 'hover:border-blue-100')
        }`}
    >
      {/* High Risk Flag Badge */}
      {isHighRisk && (
        <div className="absolute top-3 right-3 bg-rose-500 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 shadow-lg shadow-rose-200 uppercase tracking-widest animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          Critical
        </div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.75rem] flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${isHighRisk ? (isDarkMode ? 'bg-rose-900/20' : 'bg-rose-50') : (isDarkMode ? 'bg-gray-700' : 'bg-slate-50')}`}>
          <User className={`w-8 h-8 sm:w-10 sm:h-10 ${isHighRisk ? 'text-rose-400' : (isDarkMode ? 'text-slate-500' : 'text-slate-400')}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <h3 className={`text-xl sm:text-2xl font-black mb-1 leading-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{patient.name}</h3>
            <button
              onClick={handleDelete}
              className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
              title="Disconnect Patient"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-tighter">{patient.condition}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className={`p-3 sm:p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 group-hover:bg-gray-600/50' : 'bg-slate-50 border-slate-100 group-hover:bg-white group-hover:border-blue-100'}`}>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">Adherence</p>
          <div className="flex items-end gap-1">
            <span className={`text-xl sm:text-2xl font-black ${displayAdherence < 60 ? 'text-rose-500' : (isDarkMode ? 'text-white' : 'text-slate-900')}`}>{displayAdherence}%</span>
            {displayAdherence >= 80 ? <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 mb-1" /> : <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 mb-1" />}
          </div>
        </div>
        <div className={`p-3 sm:p-4 rounded-2xl border transition-colors ${isDarkMode ? 'bg-gray-700 border-gray-600 group-hover:bg-gray-600/50' : 'bg-slate-50 border-slate-100 group-hover:bg-white group-hover:border-blue-100'}`}>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 font-mono">Activity</p>
          <div className="flex items-end gap-1">
            <span className={`text-xl sm:text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{patient.completedSessions}</span>
            <span className="text-xs font-bold text-slate-400 mb-1">Sessions</span>
          </div>
        </div>
      </div>

      <div className={`mt-auto flex items-center justify-between pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-slate-50'}`}>
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-slate-300" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Status</span>
        </div>
        <button className="flex items-center gap-1 text-blue-600 font-black text-sm hover:underline">
          View Analytics <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Background Accent */}
      <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
    </div>
  );
};

export default PatientCard;
