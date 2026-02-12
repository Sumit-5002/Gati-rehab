// ROMTrendChart - Multi-line chart showing Range of Motion trends for different joints
// Uses Recharts library

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

// Custom tooltip
const CustomTooltip = ({ active, payload, isDarkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`border rounded-lg shadow-lg p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <p className="text-sm font-black mb-2">{payload[0].payload.date}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-[10px] font-bold" style={{ color: entry.color }}>
            {entry.name}: {entry.value}°
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ROMTrendChart = ({ data, loading = false, timeframe = 'weekly', isDarkMode = false }) => {
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
          <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Range of Motion Progress</h3>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {timeframe === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#E5E7EB'} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: isDarkMode ? '#94A3B8' : '#6B7280', fontWeight: 'bold' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: isDarkMode ? '#94A3B8' : '#6B7280', fontWeight: 'bold' }}
            axisLine={false}
            tickLine={false}
            domain={[0, 'auto']}
          />
          <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
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
