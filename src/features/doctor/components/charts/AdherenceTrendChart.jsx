// AdherenceTrendChart - Line chart showing patient adherence trend over time
// Uses Recharts library

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">{payload[0].payload.date}</p>
        <p className="text-sm text-blue-600 font-semibold mt-1">
          Adherence: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

const AdherenceTrendChart = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Adherence Trend</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Adherence Trend</h3>
        </div>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">No data available</p>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Adherence Trend</h3>
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Last 7 Days</span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: '#6B7280' }}
            stroke="#D1D5DB"
          />
          <YAxis
            tick={{ fontSize: 12, fill: '#6B7280' }}
            stroke="#D1D5DB"
            domain={[0, 100]}
            label={{ value: 'Adherence %', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="adherence"
            stroke="#3B82F6"
            strokeWidth={3}
            dot={{ fill: '#3B82F6', r: 4 }}
            activeDot={{ r: 6 }}
            name="Adherence Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


export default AdherenceTrendChart;
