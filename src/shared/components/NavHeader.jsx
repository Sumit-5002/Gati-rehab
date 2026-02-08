
// NavHeader Component - Navigation header with Auth integration
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, LayoutDashboard, LogOut, User, Settings, Zap, Compass, Sparkles, UserCircle, MessageSquare } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';

const NavHeader = ({ userType = 'patient', doctorProfile = null, onSettingsClick = null, theme = 'light' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userData } = useAuth();

  const isDark = theme === 'dark';

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Determine which profile to show
  const profile = userData || doctorProfile;

  return (
    <header className={`${isDark ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/70 border-slate-100/50'} backdrop-blur-2xl sticky top-0 z-[100] border-b`}>
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 lg:px-10 py-2 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div
            className="flex items-center gap-2 sm:gap-4 cursor-pointer group shrink-0"
            onClick={() => navigate('/')}
            role="link"
            tabIndex={0}
            aria-label="Go to home"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/'); } }}
          >
            <div className="relative scale-[0.8] sm:scale-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-200 border border-slate-100 p-1 group-hover:rotate-6 transition-transform">
                <img src="/logo.png" alt="Gati Logo" className="w-full h-full object-contain" />
              </div>
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                <Zap className="w-2 h-2 text-white fill-current" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className={`${isDark ? 'text-white' : 'text-slate-900'} text-xl sm:text-2xl font-black tracking-tighter leading-none`}>
                GATI<span className="text-blue-600">REHAB</span>
              </h1>
              <p className="text-[7px] sm:text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">Intelligence Lab</p>
            </div>
          </div>

          {/* Navigation Links - Hidden on Mobile, Bottom Nav handles it */}
          <nav className="flex items-center gap-2 sm:gap-6">
            <div className="hidden md:flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-2xl border border-slate-100/50">
              {userType === 'patient' ? (
                <>
                  <NavButton
                    active={isActive('/') || isActive('/patient-dashboard')}
                    onClick={() => navigate('/patient-dashboard')}
                    icon={<Compass className="w-4 h-4" />}
                    label="Nexus"
                  />
                  <NavButton
                    active={isActive('/workout')}
                    onClick={() => navigate('/workout')}
                    icon={<Activity className="w-4 h-4" />}
                    label="Recovery"
                  />
                  <NavButton
                    active={isActive('/profile')}
                    onClick={() => navigate('/profile')}
                    icon={<UserCircle className="w-4 h-4" />}
                    label="Profile"
                  />
                  <NavButton
                    active={isActive('/messages')}
                    onClick={() => navigate('/messages')}
                    icon={<MessageSquare className="w-4 h-4" />}
                    label="Messages"
                  />
                </>
              ) : (
                <>
                  <NavButton
                    active={isActive('/doctor-dashboard')}
                    onClick={() => navigate('/doctor-dashboard')}
                    icon={<LayoutDashboard className="w-4 h-4" />}
                    label="Command Center"
                  />
                  <NavButton
                    active={isActive('/analytics')}
                    onClick={() => navigate('/doctor-dashboard')}
                    icon={<Sparkles className="w-4 h-4" />}
                    label="AI Insights"
                  />
                </>
              )}
            </div>

            {/* Profile & Logout */}
            <div className={`flex items-center gap-2 sm:gap-4 pl-3 sm:pl-6 border-l ${isDark ? 'border-white/10' : 'border-slate-200/60'}`}>
              <div
                className={`${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-100'} flex items-center gap-3 p-1 rounded-xl sm:rounded-2xl border shadow-sm transition-all cursor-pointer hover:border-blue-500/30`}
                onClick={() => userType === 'patient' && navigate('/profile')}
              >
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'} flex items-center justify-center border ${isDark ? 'border-white/10' : 'border-slate-100'} overflow-hidden`}>
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
                  )}
                </div>
                <div className="hidden lg:block text-left mr-2">
                  <p className={`${isDark ? 'text-white' : 'text-slate-900'} text-xs sm:text-sm font-black leading-tight`}>
                    {profile?.name?.split(' ')[0] || (userType === 'patient' ? 'Patient' : 'Doctor')}
                  </p>
                  <p className="text-[8px] sm:text-[9px] text-blue-500 uppercase tracking-widest font-black">
                    {userType}
                  </p>
                </div>
              </button>

              {onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className={`${isDark ? 'bg-white/5 text-slate-400 border-white/10 hover:text-white' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-900'} p-2 sm:p-3 border rounded-xl transition-all`}
                  aria-label="Open settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform active:scale-95 group shadow-sm hover:shadow-rose-100"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </nav>
        </div>
      </div>

      </header>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${active
      ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
      : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
      }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

export default NavHeader;
