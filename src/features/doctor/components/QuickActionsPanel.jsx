
import { UserPlus, Calendar, FileText, MessageSquare, Video, ChevronRight, Sparkles } from 'lucide-react';

const QuickActionsPanel = ({ onActionClick }) => {
  const actions = [
    {
      id: 'add-patient',
      label: 'Add Patient',
      icon: UserPlus,
      color: 'blue',
      description: 'Onboard new recovery',
    },
    {
      id: 'schedule',
      label: 'Scheduler',
      icon: Calendar,
      color: 'indigo',
      description: 'Manage appointments',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      color: 'emerald',
      description: 'Generate clinical docs',
    },
    {
      id: 'neural-chat',
      label: 'Neural Engine',
      icon: Sparkles,
      color: 'orange',
      description: 'Encrypted patient chat',
    },
    {
      id: 'video-call',
      label: 'Video Link',
      icon: Video,
      color: 'rose',
      description: 'Start telehealth session',
    }
  ];

  const getColorStyles = (color) => {
    const styles = {
      blue: 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:shadow-blue-200',
      indigo: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-indigo-200',
      emerald: 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-emerald-200',
      orange: 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white hover:shadow-orange-200',
      rose: 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white hover:shadow-rose-200',
    };
    return styles[color] || styles.blue;
  };

  const handleActionClick = (actionId) => {
    if (onActionClick) {
      onActionClick(actionId);
    } else {
      // Default placeholder logic
      console.log(`Action: ${actionId} triggered`);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-50 p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-slate-900 leading-none">Quick Actions</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Efficiency Tools</p>
        </div>
        <Sparkles className="w-5 h-5 text-blue-400" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action.id)}
              className={`flex items-center gap-4 p-5 rounded-[2rem] transition-all group ${getColorStyles(action.color)} shadow-sm hover:shadow-lg hover:-translate-y-0.5`}
            >
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center transition-transform group-hover:scale-110">
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <span className="block text-base font-black tracking-tight">{action.label}</span>
                <span className="block text-[10px] font-bold uppercase tracking-widest opacity-60 mt-0.5 leading-none">
                  {action.description}
                </span>
              </div>
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuickActionsPanel;
