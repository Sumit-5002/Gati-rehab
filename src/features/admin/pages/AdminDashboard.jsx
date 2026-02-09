import { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Database,
  Search,
  CheckCircle,
  XCircle,
  User as UserIcon,
  Stethoscope,
  Edit2,
  Save,
  X,
  Loader2,
  Trash2,
  UserPlus,
  AlertTriangle
} from 'lucide-react';
import NavHeader from '../../../shared/components/NavHeader';
import { useAuth } from '../../auth/context/AuthContext';
import { collection, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import AdminSettingsModal from '../components/modals/AdminSettingsModal';
import { db } from '../../../lib/firebase/config';

const AdminDashboard = () => {
  const { userData: _ } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    patients: 0,
    doctors: 0,
    activeSessions: 0,
    systemHealth: 'Optimal',
    dbSize: '24.5 MB'
  });
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Editing state
  const [editingUserId, setEditingUserId] = useState(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  // Add Doctor State
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', email: '', specialty: '' });
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      // Removed orderBy to prevent missing index errors
      const snapshot = await getDocs(usersRef);

      const userList = [];
      const doctorList = [];
      let patientCount = 0;
      let doctorCount = 0;

      snapshot.forEach(doc => {
        const data = doc.data();
        const userObj = { id: doc.id, ...data };
        userList.push(userObj);

        if (data.userType === 'doctor') {
          doctorCount++;
          doctorList.push(userObj);
        } else {
          patientCount++;
        }
      });

      // Get active sessions (approximate by recent timeframe not possible without complex query, simulating based on users)
      const activeCount = Math.floor(patientCount * 0.2);

      setUsers(userList);
      setDoctors(doctorList);
      setStats(prev => ({
        ...prev,
        totalUsers: userList.length,
        patients: patientCount,
        doctors: doctorCount,
        activeSessions: activeCount
      }));

      setLoading(false);
    } catch (err) {
      console.error('[AdminDashboard] Error fetching data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Settings state
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleAssignDoctor = async (userId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        doctorId: selectedDoctorId
      });
      setEditingUserId(null);
      fetchAdminData(); // Refresh the list
    } catch (err) {
      console.error('Error assigning doctor:', err);
      alert('Failed to assign doctor');
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'users', userId));
      fetchAdminData(); // Refresh list
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    }
  };

  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!newDoctor.name || !newDoctor.email) {
      alert('Name and Email are required');
      return;
    }

    setIsAddingDoctor(true);
    try {
      await addDoc(collection(db, 'users'), {
        name: newDoctor.name,
        email: newDoctor.email,
        specialty: newDoctor.specialty || 'General',
        userType: 'doctor',
        createdAt: serverTimestamp(),
        isInvite: true // Flag to indicate invite status
      });

      // Reset and close
      setNewDoctor({ name: '', email: '', specialty: '' });
      setShowAddDoctor(false);
      setIsAddingDoctor(false);
      fetchAdminData();
      alert(`Doctor invited! They must Sign Up with ${newDoctor.email} to access the portal.`);
    } catch (err) {
      console.error('Error adding doctor:', err);
      alert('Failed to add doctor');
      setIsAddingDoctor(false);
    }
  };

  const filteredUsers = users.filter(user =>
    (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.userType?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      <NavHeader userType="admin" onSettingsClick={() => setSettingsOpen(true)} />

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
            <button
              onClick={() => setShowAddDoctor(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-200 hover:bg-blue-500 transition-all active:scale-95 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Add Doctor
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 font-bold">
            Error loading data: {error}
          </div>
        )}

        {/* Global Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <AdminStatCard icon={<Users className="w-6 h-6" />} title="Total Users" value={stats.totalUsers} color="blue" />
          <AdminStatCard icon={<Stethoscope className="w-6 h-6" />} title="Doctors" value={stats.doctors} color="emerald" />
          <AdminStatCard icon={<UserIcon className="w-6 h-6" />} title="Patients" value={stats.patients} color="indigo" />
          <AdminStatCard icon={<Database className="w-6 h-6" />} title="Database Size" value={stats.dbSize} color="orange" />
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* User Management List */}
          <div className="space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-white">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900">User Directory</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${user.userType === 'doctor' ? 'bg-teal-50 text-teal-600' : 'bg-blue-50 text-blue-600'}`}>
                        {user.userType === 'doctor' ? <Stethoscope className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 flex items-center gap-2">
                          {user.name || 'Unnamed'}
                          {user.isInvite && <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-wider">Invite</span>}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{user.userType} • {user.email}</p>
                        {user.userType === 'patient' && (
                          <p className="text-[10px] text-blue-500 font-bold mt-1">
                            Assigned Doctor: {doctors.find(d => d.id === user.doctorId)?.name || 'None'}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {user.userType === 'patient' && (
                        editingUserId === user.id ? (
                          <div className="flex items-center gap-2 animate-in fade-in">
                            <select
                              className="text-xs p-2 rounded-lg border-2 border-slate-200 bg-white font-bold outline-none focus:border-blue-500 transition-colors"
                              value={selectedDoctorId}
                              onChange={(e) => setSelectedDoctorId(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <option value="">Select Doctor</option>
                              {doctors.map(d => (
                                <option key={d.id} value={d.id}>{d.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAssignDoctor(user.id);
                              }}
                              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-md shadow-emerald-200"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingUserId(null);
                              }}
                              className="p-2 bg-slate-200 text-slate-500 rounded-lg hover:bg-slate-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingUserId(user.id);
                              setSelectedDoctorId(user.doctorId || '');
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" /> Assign Doctor
                          </button>
                        )
                      )}

                      {user.userType !== 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteUser(user.id, user.name);
                          }}
                          className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="text-center py-8 text-slate-400 font-bold">No users found.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Add Doctor Modal Overlay */}
        {showAddDoctor && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddDoctor(false)} />
            <div className="relative bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900">Add New Doctor</h3>
                <button onClick={() => setShowAddDoctor(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddDoctorSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2">Full Name</label>
                  <input
                    type="text"
                    placeholder="Dr. Jane Doe"
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-100 outline-none"
                    value={newDoctor.name}
                    onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2">Email Address</label>
                  <input
                    type="email"
                    placeholder="doctor@hospital.com"
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-100 outline-none"
                    value={newDoctor.email}
                    onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-2">Specialty</label>
                  <input
                    type="text"
                    placeholder="Orthopedics"
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-slate-900 border-none focus:ring-2 focus:ring-blue-100 outline-none"
                    value={newDoctor.specialty}
                    onChange={e => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isAddingDoctor}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:bg-slate-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAddingDoctor ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                    Send Invite
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

      <AdminSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
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

export default AdminDashboard;
