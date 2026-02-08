// SessionReport Component - Display session summary with premium aesthetics
import { CheckCircle, XCircle, TrendingUp, Activity, Timer, Zap } from 'lucide-react';

const SessionReport = ({ sessionData }) => {
  const { exerciseName, date, reps, quality, rangeOfMotion, duration } = sessionData;

  const getGrade = (score) => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const getQualityIcon = (score) => {
    if (score >= 60) return <CheckCircle className="w-6 h-6 text-emerald-500" />;
    return <XCircle className="w-6 h-6 text-rose-500" />;
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 p-6 sm:p-8 hover:shadow-2xl transition-all group">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-black text-slate-900 tracking-tight capitalize">{exerciseName.replace(/-/g, ' ')}</h3>
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">
              Grade {getGrade(quality)}
            </span>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{date || 'Recent Session'}</p>
        </div>
        <div className="bg-slate-50 p-3 rounded-2xl group-hover:scale-110 transition-transform">
          {getQualityIcon(quality)}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <ReportStat
          icon={<Zap className="w-4 h-4" />}
          label="Repetitions"
          value={reps}
          color="blue"
        />
        <ReportStat
          icon={<TrendingUp className="w-4 h-4" />}
          label="Form Quality"
          value={`${quality}%`}
          color={quality >= 75 ? 'emerald' : 'amber'}
        />
        <ReportStat
          icon={<Activity className="w-4 h-4" />}
          label="Est. ROM"
          value={`${rangeOfMotion}°`}
          color="indigo"
        />
        <ReportStat
          icon={<Timer className="w-4 h-4" />}
          label="Duration"
          value={duration}
          color="orange"
        />
      </div>
    </div>
  );
};

const ReportStat = ({ icon, label, value, color }) => {
  const styles = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600',
  };

  return (
    <div className={`${styles[color]} rounded-2xl p-4 transition-transform hover:scale-[1.05]`}>
      <div className="flex items-center gap-2 mb-2 opacity-80">
        {icon}
        <p className="text-[9px] font-black uppercase tracking-widest">{label}</p>
      </div>
      <p className="text-xl sm:text-2xl font-black tracking-tight">{value}</p>
    </div>
  );
};

export default SessionReport;
