// ROMTrendChart - Multi-line chart showing Range of Motion trends for different joints
// Uses Recharts library

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900 mb-2">{payload[0].payload.date}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {entry.value}°
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ROMTrendChart = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Range of Motion Progress</h3>
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
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Range of Motion Progress</h3>
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
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Range of Motion Progress</h3>
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Last 4 Weeks</span>
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
            domain={[0, 'auto']}
            label={{ value: 'ROM (degrees)', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12 }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="knee"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ fill: '#8B5CF6', r: 3 }}
            name="Knee"
          />
          <Line
            type="monotone"
            dataKey="hip"
            stroke="#EC4899"
            strokeWidth={2}
            dot={{ fill: '#EC4899', r: 3 }}
            name="Hip"
          />
          <Line
            type="monotone"
            dataKey="shoulder"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ fill: '#F59E0B', r: 3 }}
            name="Shoulder"
          />
          <Line
            type="monotone"
            dataKey="ankle"
            stroke="#06B6D4"
            strokeWidth={2}
            dot={{ fill: '#06B6D4', r: 3 }}
            name="Ankle"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};


export default ROMTrendChart;
