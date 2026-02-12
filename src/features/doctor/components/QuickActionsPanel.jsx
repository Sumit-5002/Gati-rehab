
import { UserPlus, Calendar, FileText, MessageSquare, ChevronRight, Sparkles } from 'lucide-react';
import { useTheme } from '../../../contexts/ThemeContext';

const QuickActionsPanel = ({ onActionClick }) => {
  const { isDarkMode } = useTheme();
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
      label: 'Neural Chat',
      icon: MessageSquare,
      color: 'orange',
      description: 'AI-assisted patient messaging',
    }
  ];

  const getColorStyles = (color) => {
    const styles = {
      blue: isDarkMode ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-600/40 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white shadow-blue-200',
      indigo: isDarkMode ? 'bg-indigo-900/20 text-indigo-400 hover:bg-indigo-600/40 hover:text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-indigo-200',
      emerald: isDarkMode ? 'bg-emerald-900/20 text-emerald-400 hover:bg-emerald-600/40 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white shadow-emerald-200',
      orange: isDarkMode ? 'bg-orange-900/20 text-orange-400 hover:bg-orange-600/40 hover:text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white shadow-orange-200',
      rose: isDarkMode ? 'bg-rose-900/20 text-rose-400 hover:bg-rose-600/40 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white shadow-rose-200',
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
    <div className={`rounded-[3rem] p-8 border transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700 shadow-none' : 'bg-white shadow-2xl shadow-slate-200/40 border-slate-50'}`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className={`text-xl font-black leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Quick Actions</h2>
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
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${isDarkMode ? 'bg-white/10' : 'bg-white/20'}`}>
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
