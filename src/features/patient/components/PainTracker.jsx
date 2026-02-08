
import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertCircle,
  History,
  Plus
} from 'lucide-react';
import { logPainLevel, getPainHistory } from '../services/patientService';
import { useAuth } from '../../auth/context/AuthContext';

const PainTracker = () => {
  const { user } = useAuth();
  const [painLevel, setPainLevel] = useState(5);
  const [fatigue, setFatigue] = useState(3);
  const [stiffness, setStiffness] = useState(2);
  const [note, setNote] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    if (user) {
      const data = await getPainHistory(user.uid);
      setHistory(data);
    }
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleLogPain = async () => {
    setIsLogging(true);
    try {
      await logPainLevel(user.uid, {
        level: painLevel,
        fatigue,
        stiffness,
        note
      });
      setNote('');
      await fetchHistory();
    } catch (error) {
      console.error('Failed to log pain:', error);
    } finally {
      setIsLogging(false);
    }
  };

  const getPainColor = (level) => {
    if (level <= 3) return 'bg-emerald-500';
    if (level <= 7) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-50">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-900 leading-none mb-2">Pain Tracker</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monitor your comfort levels</p>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="p-2 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-all"
        >
          <History className="w-5 h-5" />
        </button>
      </div>

      {!showHistory ? (
        <div className="space-y-8">
          {/* Pain Level */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Pain Intensity</span>
              <span className={`px-4 py-1 rounded-full text-white text-xs font-black ${getPainColor(painLevel)} shadow-lg transition-colors`}>
                Level {painLevel}
              </span>
            </div>

            <div className="relative pt-2">
              <input
                type="range"
                min="0"
                max="10"
                value={painLevel}
                onChange={(e) => setPainLevel(parseInt(e.target.value))}
                className="w-full h-3 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          </div>

          {/* Fatigue & Stiffness Grid */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fatigue</span>
                <span className="text-[10px] font-black text-blue-600">{fatigue}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={fatigue}
                onChange={(e) => setFatigue(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-500"
              />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Stiffness</span>
                <span className="text-[10px] font-black text-indigo-600">{stiffness}/10</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={stiffness}
                onChange={(e) => setStiffness(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Quick Note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="E.g. Mild stiffness after morning walk"
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-700 text-sm focus:border-blue-500 focus:outline-none transition-all min-h-[100px] resize-none"
            />
          </div>

          <button
            onClick={handleLogPain}
            disabled={isLogging}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 group active:scale-95"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            {isLogging ? 'Logging...' : 'Log Symptom'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {history.length > 0 ? (
            history.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-black shadow-sm ${getPainColor(log.level)}`}>
                  {log.level}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{log.note || 'No notes added'}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleDateString() : 'Just now'}
                  </p>
                </div>
                {log.level > 7 && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-bold">No history available</p>
            </div>
          )}
          <button
            onClick={() => setShowHistory(false)}
            className="w-full py-3 text-xs font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 rounded-xl transition-all"
          >
            Back to Logger
          </button>
        </div>
      )}
    </div>
  );
};

export default PainTracker;
