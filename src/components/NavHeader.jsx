// NavHeader Component - Navigation header for the app
// Owner: Member 4/5

import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Activity, LayoutDashboard, LogOut, User } from 'lucide-react';

const NavHeader = ({ userType = 'patient' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    // TODO: Implement Firebase logout
    // signOut(auth);
    navigate('/login');
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">Gati Rehab</h1>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-4">
            {userType === 'patient' ? (
              <>
                <button
                  onClick={() => navigate('/')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/') || isActive('/patient-dashboard')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span className="text-sm font-medium">Dashboard</span>
                </button>
                <button
                  onClick={() => navigate('/workout')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/workout')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span className="text-sm font-medium">Session</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/doctor-dashboard')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/doctor-dashboard')
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="text-sm font-medium">Patients</span>
                </button>
              </>
            )}

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
              <div className="flex items-center gap-2 px-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {userType === 'patient' ? 'Patient' : 'Doctor'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default NavHeader;
