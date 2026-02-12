// FormQualityChart - Area chart showing average form quality trend
// Uses Recharts library

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity } from 'lucide-react';

// Custom tooltip
const CustomTooltip = ({ active, payload, isDarkMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className={`border rounded-lg shadow-lg p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'}`}>
        <p className="text-sm font-black mb-1">{payload[0].payload.date}</p>
        <p className={`text-sm font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
          Quality Score: {payload[0].value}/100
        </p>
      </div>
    );
  }
  return null;
};

const FormQualityChart = ({ data, loading = false, timeframe = 'weekly', isDarkMode = false }) => {
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
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Activity className={`w-5 h-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
          <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Form Quality Trend</h3>
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          {timeframe === 'weekly' ? 'Last 7 Days' : 'Last 30 Days'}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorQuality" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            domain={[0, 100]}
          />
          <Tooltip content={<CustomTooltip isDarkMode={isDarkMode} />} />
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



export default FormQualityChart;
