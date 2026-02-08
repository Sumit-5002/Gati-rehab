
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';

const ProtectedRoute = ({ children, allowedRole }) => {
    const { user, userData, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium">Loading session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRole && userData?.userType !== allowedRole) {
        // Redirect to correct dashboard if role doesn't match
        let targetDashboard = '/patient-dashboard';
        if (userData?.userType === 'doctor') targetDashboard = '/doctor-dashboard';
        if (userData?.userType === 'admin') targetDashboard = '/admin-dashboard';

        return <Navigate to={targetDashboard} replace />;
    }

    return children;
};

export default ProtectedRoute;
