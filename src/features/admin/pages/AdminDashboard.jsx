
import { useState, useEffect } from 'react';
import {
  Users,
  Activity,
  Shield,
  Database,
  Server,
  AlertCircle,
  TrendingUp,
  Settings,
  Search,
  CheckCircle,
  XCircle
} from 'lucide-react';
import NavHeader from '../../../shared/components/NavHeader';
import { useAuth } from '../../auth/context/AuthContext';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

const AdminDashboard = () => {
  const { userData: _ } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSessions: 0,
    systemHealth: 'Optimal',
    dbSize: '1.2 GB'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminStats = async () => {
      try {
        await getDocs(query(collection(db, 'users'), limit(1)));
        // Simulate counting for free tier efficiency
        setStats({
          totalUsers: 142,
          activeSessions: 12,
          systemHealth: 'Optimal',
          dbSize: '24.5 MB'
        });
        setLoading(false);
      } catch (error) {
        console.error('[AdminDashboard] Error fetching stats:', error);
        setLoading(false);
      }
    };

    fetchAdminStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      <NavHeader userType="admin" />

      <main className="max-w-[1400px] mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <Shield className="w-3 h-3 text-blue-400" /> System Administrator
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
              Control <span className="text-blue-600">Panel</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2">Global system monitoring and user management</p>
          </div>

          <div className="flex gap-4">
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-all">
              System Logs
            </button>
            <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-slate-800 transition-all">
              Maintenance Mode
            </button>
          </div>
        </div>

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <AdminStatCard icon={<Users className="w-6 h-6" />} title="Total Users" value={stats.totalUsers} color="blue" />
          <AdminStatCard icon={<Activity className="w-6 h-6" />} title="Active Sessions" value={stats.activeSessions} color="emerald" />
          <AdminStatCard icon={<Server className="w-6 h-6" />} title="System Status" value={stats.systemHealth} color="indigo" />
          <AdminStatCard icon={<Database className="w-6 h-6" />} title="Database Size" value={stats.dbSize} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Management List */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-white">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900">Recent Users</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search UID..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <UserRow name="Rajesh Kumar" role="Patient" status="Active" />
                <UserRow name="Dr. Priya Sharma" role="Doctor" status="Active" />
                <UserRow name="Amit Patel" role="Patient" status="Inactive" />
                <UserRow name="Sunita Reddy" role="Patient" status="Active" />
              </div>

              <button className="w-full mt-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all">
                View All Directory
              </button>
            </div>
          </div>

          {/* System Health */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-900/40">
              <h3 className="text-lg font-black mb-6">Service Availability</h3>
              <div className="space-y-6">
                <ServiceStatus name="Authentication" status="up" />
                <ServiceStatus name="Firestore DB" status="up" />
                <ServiceStatus name="Cloud Storage" status="up" />
                <ServiceStatus name="MediaPipe Engine" status="up" />
                <ServiceStatus name="AI Analytics" status="degraded" />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-white">
              <h3 className="text-lg font-black text-slate-900 mb-4">Security Overview</h3>
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl mb-4">
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-xs font-black uppercase">Recent Alert</span>
                </div>
                <p className="text-xs font-bold text-slate-600 leading-relaxed">
                  3 failed login attempts from IP: 192.168.1.42 detected.
                </p>
              </div>
              <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-200 hover:bg-blue-500 transition-all">
                Audit Security Logs
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const AdminStatCard = ({ icon, title, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    indigo: 'bg-indigo-50 text-indigo-600',
    orange: 'bg-orange-50 text-orange-600'
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-3xl font-black text-slate-900">{value}</p>
    </div>
  );
};

const UserRow = ({ name, role, status }) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-pointer">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
        <User className="w-5 h-5 text-slate-300" />
      </div>
      <div>
        <p className="text-sm font-black text-slate-900">{name}</p>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{role}</p>
      </div>
    </div>
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
      <span className="text-[10px] font-black uppercase text-slate-500">{status}</span>
    </div>
  </div>
);

const ServiceStatus = ({ name, status }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-slate-300">{name}</span>
    <div className="flex items-center gap-2">
      {status === 'up' ? (
        <>
          <span className="text-[10px] font-black uppercase text-emerald-400">Stable</span>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </>
      ) : (
        <>
          <span className="text-[10px] font-black uppercase text-orange-400">Degraded</span>
          <XCircle className="w-4 h-4 text-orange-400" />
        </>
      )}
    </div>
  </div>
);

const User = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

export default AdminDashboard;
