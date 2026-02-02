// PatientCard Component - Display patient information card
// Owner: Member 5

import { User, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PatientCard = ({ patient }) => {
  const navigate = useNavigate();

  const getAdherenceColor = (rate) => {
    if (rate >= 80) return 'text-green-600 bg-green-50';
    if (rate >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAdherenceIcon = (rate) => {
    if (rate >= 80) return <TrendingUp className="w-4 h-4" />;
    if (rate >= 60) return <AlertCircle className="w-4 h-4" />;
    return <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div
      onClick={() => navigate(`/patient/${patient.id}`)}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start justify-between">
        {/* Patient Info */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{patient.name}</h3>
            <p className="text-sm text-gray-500">ID: {patient.id}</p>
            <p className="text-sm text-gray-600 mt-1">
              Condition: {patient.condition}
            </p>
          </div>
        </div>

        {/* Adherence Badge */}
        <div
          className={`flex items-center gap-1 px-3 py-1 rounded-full ${getAdherenceColor(
            patient.adherenceRate
          )}`}
        >
          {getAdherenceIcon(patient.adherenceRate)}
          <span className="text-sm font-medium">{patient.adherenceRate}%</span>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500">Sessions</p>
          <p className="text-lg font-semibold text-gray-900">
            {patient.completedSessions}/{patient.totalSessions}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Last Active</p>
          <p className="text-sm font-medium text-gray-900">
            {patient.lastActive}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Progress</p>
          <p className="text-sm font-medium text-gray-900">
            {patient.progressLevel}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PatientCard;
