
// NavHeader Component - Navigation header with Auth integration and Dark Mode
import { memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, LayoutDashboard, LogOut, User, Settings, Zap, Compass, Sparkles, UserCircle, MessageSquare, FileText, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';
import NotificationBell from './NotificationBell';

const NavHeader = memo(({ userType = 'patient', doctorProfile = null, onSettingsClick = null, theme = 'light', onThemeToggle = null }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userData } = useAuth();

  const isDark = theme === 'dark';

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      console.log('[NavHeader] Logout initiated');
      await logout();
      console.log('[NavHeader] Logout successful, navigating to login');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('[NavHeader] Logout failed:', error);
      alert('Logout failed. Please try again.');
    }
  };

  return (
    <header className={`${isDark ? 'bg-[#0F172A]/80 border-white/5' : 'bg-white/70 border-slate-100/50'} backdrop-blur-xl sticky top-0 z-[100] border-b`}>
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
            </div>
          </div>

          {/* Navigation Links */}
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
                    active={isActive('/messages')}
                    onClick={() => navigate('/messages')}
                    icon={<MessageSquare className="w-4 h-4" />}
                    label="Messages"
                  />
                  <NavButton
                    active={isActive('/patient/reports')}
                    onClick={() => navigate('/patient/reports')}
                    icon={<FileText className="w-4 h-4" />}
                    label="Reports"
                  />
                </>
              ) : userType === 'admin' ? (
                <NavButton
                  active={isActive('/admin-dashboard')}
                  onClick={() => navigate('/admin-dashboard')}
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  label="System Panel"
                />
              ) : (
                <NavButton
                  active={isActive('/doctor-dashboard')}
                  onClick={() => navigate('/doctor-dashboard')}
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  label="Command Center"
                />
              )}
            </div>

            {/* Logout & Settings */}
            <div className={`flex items-center gap-1.5 sm:gap-4 pl-2 sm:pl-6 border-l ${isDark ? 'border-white/10' : 'border-slate-200/60'}`}>
              {onSettingsClick && (
                <button
                  onClick={onSettingsClick}
                  className={`${isDark ? 'bg-white/5 text-slate-400 border-white/10 hover:text-white' : 'bg-slate-50 text-slate-400 border-slate-100 hover:text-slate-900'} p-2.5 sm:p-3 border rounded-xl sm:rounded-2xl transition-all active:scale-90`}
                  aria-label="Open settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}


              {/* Dark Mode Toggle */}
              {onThemeToggle && (
                <button
                  onClick={onThemeToggle}
                  className={`${isDark ? 'bg-white/5 text-yellow-400 border-white/10 hover:text-yellow-300' : 'bg-slate-50 text-slate-600 border-slate-100 hover:text-slate-900'} p-2.5 sm:p-3 border rounded-xl sm:rounded-2xl transition-all active:scale-90 group`}
                  aria-label="Toggle dark mode"
                >
                  {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:rotate-12" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-rotate-12" />}
                </button>
              )}

              <NotificationBell />

              <button
                onClick={handleLogout}
                className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all transform active:scale-90 group shadow-sm hover:shadow-rose-100"
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
});

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
