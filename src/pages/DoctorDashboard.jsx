// DoctorDashboard - Patient list view for doctors
// Owner: Member 5

import { useState } from 'react';
import { Search, Filter, Users, TrendingUp } from 'lucide-react';
import NavHeader from '../components/NavHeader';
import PatientCard from '../components/PatientCard';

const DoctorDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAdherence, setFilterAdherence] = useState('all'); // 'all', 'high', 'medium', 'low'

  // Mock patients data - will be replaced with Firestore data
  const patients = [
    {
      id: 'P001',
      name: 'Rajesh Kumar',
      condition: 'Post-Knee Surgery Rehab',
      adherenceRate: 87,
      completedSessions: 24,
      totalSessions: 30,
      lastActive: '2 hours ago',
      progressLevel: 'Good',
    },
    {
      id: 'P002',
      name: 'Priya Sharma',
      condition: 'Hip Replacement Recovery',
      adherenceRate: 92,
      completedSessions: 18,
      totalSessions: 20,
      lastActive: '1 day ago',
      progressLevel: 'Excellent',
    },
    {
      id: 'P003',
      name: 'Amit Patel',
      condition: 'Shoulder Injury Rehab',
      adherenceRate: 65,
      completedSessions: 12,
      totalSessions: 25,
      lastActive: '3 days ago',
      progressLevel: 'Fair',
    },
    {
      id: 'P004',
      name: 'Sunita Reddy',
      condition: 'Ankle Sprain Recovery',
      adherenceRate: 78,
      completedSessions: 15,
      totalSessions: 20,
      lastActive: '5 hours ago',
      progressLevel: 'Good',
    },
    {
      id: 'P005',
      name: 'Vikram Singh',
      condition: 'Back Pain Management',
      adherenceRate: 45,
      completedSessions: 8,
      totalSessions: 30,
      lastActive: '1 week ago',
      progressLevel: 'Needs Attention',
    },
  ];

  // Filter patients based on search and adherence filter
  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAdherence =
      filterAdherence === 'all' ||
      (filterAdherence === 'high' && patient.adherenceRate >= 80) ||
      (filterAdherence === 'medium' &&
        patient.adherenceRate >= 60 &&
        patient.adherenceRate < 80) ||
      (filterAdherence === 'low' && patient.adherenceRate < 60);

    return matchesSearch && matchesAdherence;
  });

  // Calculate overview stats
  const stats = {
    totalPatients: patients.length,
    averageAdherence: Math.round(
      patients.reduce((sum, p) => sum + p.adherenceRate, 0) / patients.length
    ),
    needsAttention: patients.filter((p) => p.adherenceRate < 60).length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavHeader userType="doctor" />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Development Mode Indicator */}
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            🚧 <strong>Demo Mode:</strong> Showing sample patients. Configure Firebase to load real patient data.
          </p>
        </div>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Patient Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor and track patient rehabilitation progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900">
                  {stats.totalPatients}
                </p>
              </div>
              <Users className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Adherence</p>
                <p className="text-3xl font-bold text-green-600">
                  {stats.averageAdherence}%
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Attention</p>
                <p className="text-3xl font-bold text-red-600">
                  {stats.needsAttention}
                </p>
              </div>
              <Filter className="w-10 h-10 text-red-600" />
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or patient ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Adherence Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filterAdherence}
                onChange={(e) => setFilterAdherence(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Patients</option>
                <option value="high">High Adherence (≥80%)</option>
                <option value="medium">Medium Adherence (60-79%)</option>
                <option value="low">Low Adherence (&lt;60%)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <PatientCard key={patient.id} patient={patient} />
            ))
          ) : (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-500">No patients found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorDashboard;
