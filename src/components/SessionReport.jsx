// SessionReport Component - Display session summary
// Owner: Member 4

import { CheckCircle, XCircle, TrendingUp, Activity } from 'lucide-react';

const SessionReport = ({ sessionData }) => {
  const { exerciseName, date, reps, quality, rangeOfMotion, duration } =
    sessionData;

  const getQualityColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score) => {
    if (score >= 60) return <CheckCircle className="w-5 h-5 text-green-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{exerciseName}</h3>
          <p className="text-sm text-gray-500">{date}</p>
        </div>
        {getQualityIcon(quality)}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-blue-600" />
            <p className="text-xs text-blue-700 font-medium">Repetitions</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{reps}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <p className="text-xs text-purple-700 font-medium">Quality Score</p>
          </div>
          <p className={`text-2xl font-bold ${getQualityColor(quality)}`}>
            {quality}%
          </p>
        </div>

        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-green-600" />
            <p className="text-xs text-green-700 font-medium">Range of Motion</p>
          </div>
          <p className="text-2xl font-bold text-green-900">{rangeOfMotion}°</p>
        </div>

        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-orange-600" />
            <p className="text-xs text-orange-700 font-medium">Duration</p>
          </div>
          <p className="text-2xl font-bold text-orange-900">{duration}</p>
        </div>
      </div>
    </div>
  );
};

export default SessionReport;
