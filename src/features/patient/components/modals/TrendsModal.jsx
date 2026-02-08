
import { useState, useEffect } from 'react';
import { X, TrendingUp, Activity, Target, Zap, ChevronRight } from 'lucide-react';
import { getTrendData } from '../../services/patientService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const TrendsModal = ({ isOpen, onClose, patientId }) => {
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState({ romData: [], qualityData: [] });

    useEffect(() => {
        if (isOpen && patientId) {
            fetchTrends();
        }
    }, [isOpen, patientId]);

    const fetchTrends = async () => {
        setLoading(true);
        try {
            const data = await getTrendData(patientId);
            // Fallback dummy data if nothing exists yet to show the UI
            const mockRom = [
                { day: 'Mon', value: 45 },
                { day: 'Tue', value: 52 },
                { day: 'Wed', value: 48 },
                { day: 'Thu', value: 61 },
                { day: 'Fri', value: 58 },
                { day: 'Sat', value: 65 },
                { day: 'Sun', value: 72 },
            ];
            const mockQuality = [
                { day: 'Mon', value: 80 },
                { day: 'Tue', value: 85 },
                { day: 'Wed', value: 82 },
                { day: 'Thu', value: 90 },
                { day: 'Fri', value: 88 },
                { day: 'Sat', value: 92 },
                { day: 'Sun', value: 95 },
            ];

            setTrends({
                romData: data.romData.length > 0 ? data.romData : mockRom,
                qualityData: data.qualityData.length > 0 ? data.qualityData : mockQuality
            });
        } catch (error) {
            console.error("Trends Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 bg-emerald-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black leading-none mb-1">Recovery Trends</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Neural Progress Analytics</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center">
                            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* ROM Trend */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Range of Motion</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Weekly Improvement (Degrees)</p>
                                </div>
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <Activity className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={trends.romData}>
                                        <defs>
                                            <linearGradient id="colorRom" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900 }}
                                            itemStyle={{ color: '#3b82f6' }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorRom)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Quality Trend */}
                        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-slate-800">Form Quality</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Precision Score (%)</p>
                                </div>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                                    <Zap className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={trends.qualityData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                                        <YAxis hide />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 900 }}
                                            itemStyle={{ color: '#10b981' }}
                                        />
                                        <Line type="stepAfter" dataKey="value" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Insight Stats */}
                        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-6">
                            <InsightCard label="Best Day" value="Sunday" icon={<Target className="text-blue-500" />} />
                            <InsightCard label="Avg. Quality" value="89%" icon={<Zap className="text-emerald-500" />} />
                            <InsightCard label="ROM Peak" value="72°" icon={<Activity className="text-indigo-500" />} />
                            <InsightCard label="Consistency" value="94%" icon={<TrendingUp className="text-orange-500" />} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const InsightCard = ({ label, value, icon }) => (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center">{icon}</div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
            <p className="text-lg font-black text-slate-900 leading-none">{value}</p>
        </div>
    </div>
);

export default TrendsModal;
