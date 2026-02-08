// FormQualityChart - Area chart showing average form quality trend
// Uses Recharts library

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">{payload[0].payload.date}</p>
        <p className="text-sm text-green-600 font-semibold mt-1">
          Quality Score: {payload[0].value}/100
        </p>
      </div>
    );
  }
  return null;
};

const FormQualityChart = ({ data, loading = false }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Form Quality Trend</h3>
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
          <Activity className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Form Quality Trend</h3>
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
          <Activity className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Form Quality Trend</h3>
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wide">Last 7 Days</span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
            label={{ value: 'Quality Score', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#6B7280' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ fontSize: 12 }}
            iconType="rect"
          />
          <Area 
            type="monotone" 
            dataKey="quality" 
            stroke="#10B981" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorQuality)"
            name="Form Quality"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Custom tooltip
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-gray-900">{payload[0].payload.date}</p>
        <p className="text-sm text-green-600 font-semibold mt-1">
          Quality Score: {payload[0].value}/100
        </p>
      </div>
    );
  }
  return null;
};

export default FormQualityChart;
