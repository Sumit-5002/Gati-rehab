
import { useState } from 'react';
import { X, FileText, Download, User, Activity, CheckCircle, Sparkles } from 'lucide-react';
import { generatePatientReport } from '../../../../shared/services/geminiService';
import { exportToCSV } from '../../../../shared/utils/csvExport';

const ReportsModal = ({ isOpen, onClose, patients }) => {
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [reportType, setReportType] = useState('summary');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedReport, setGeneratedReport] = useState(null);

    const reportTypes = [
        { id: 'summary', label: 'Clinical Summary', icon: FileText, desc: 'AI-generated health status' },
        { id: 'adherence', label: 'Adherence Audit', icon: Activity, desc: 'Detailed completion logs' },
        { id: 'progress', label: 'Progress Roadmap', icon: CheckCircle, desc: 'Future recovery path' },
        { id: 'raw', label: 'Raw Data (CSV)', icon: Download, desc: 'Export session history' },
    ];

    const handleGenerate = async () => {
        if (!selectedPatientId) return;

        const patient = patients.find(p => p.id === selectedPatientId);
        if (!patient) return;

        setIsGenerating(true);
        setGeneratedReport(null);

        try {
            if (reportType === 'raw') {
                // Handle CSV export logic (assuming we have session data or similar)
                // For now, demo export
                const data = [
                    { name: patient.name, adherence: patient.adherenceRate, sessions: patient.completedSessions }
                ];
                exportToCSV(data, `${patient.name}_Report.csv`);
                setGeneratedReport("CSV Report Exported Successfully.");
            } else {
                const typeLabel = reportTypes.find(t => t.id === reportType).label;
                const reportText = await generatePatientReport(patient, typeLabel);
                setGeneratedReport(reportText);
            }
        } catch (error) {
            console.error("Report Generation Error:", error);
            setGeneratedReport("Error generating report. Please check your Gemini API key.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-[3rem] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 bg-emerald-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black leading-none mb-1">Clinical Reports</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Gati Reporting Engine v2.0</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col md:flex-row gap-8">
                    {/* Controls */}
                    <div className="w-full md:w-80 space-y-6">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Select Patient</label>
                            <select
                                value={selectedPatientId}
                                onChange={(e) => setSelectedPatientId(e.target.value)}
                                className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-900 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 outline-none transition-all"
                            >
                                <option value="">Choose a patient...</option>
                                {patients.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block ml-1">Report Format</label>
                            <div className="space-y-3">
                                {reportTypes.map((type) => {
                                    const Icon = type.icon;
                                    const active = reportType === type.id;
                                    return (
                                        <button
                                            key={type.id}
                                            onClick={() => setReportType(type.id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${active
                                                ? 'bg-emerald-50 border-emerald-600 text-emerald-900'
                                                : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? 'bg-emerald-600 text-white' : 'bg-slate-100 group-hover:bg-emerald-100'}`}>
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-sm leading-none mb-1">{type.label}</p>
                                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">{type.desc}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            onClick={handleGenerate}
                            disabled={!selectedPatientId || isGenerating}
                            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-emerald-700 transition-all shadow-xl shadow-slate-200 disabled:opacity-50 active:scale-95"
                        >
                            {isGenerating ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Document
                                </>
                            )}
                        </button>
                    </div>

                    {/* Preview */}
                    <div className="flex-1 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 p-8 overflow-y-auto">
                        {!generatedReport && !isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border-2 border-slate-100 mb-6 shadow-sm">
                                    <FileText className="w-10 h-10 text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">No Report Selected</h3>
                                <p className="text-sm font-bold text-slate-400 max-w-[200px]">Configure the parameters on the left to start generation.</p>
                            </div>
                        ) : isGenerating ? (
                            <div className="h-full flex flex-col items-center justify-center text-center">
                                <div className="relative mb-8">
                                    <div className="w-24 h-24 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin"></div>
                                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-emerald-600 animate-pulse" />
                                </div>
                                <h3 className="text-xl font-black text-slate-900 mb-2">Gemini is Thinking...</h3>
                                <p className="text-sm font-bold text-slate-400">Synthesizing clinical data and formatting documents.</p>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-700 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-emerald-600" />
                                        <span className="font-black text-slate-900 uppercase text-xs tracking-widest">Clinical Audit Document</span>
                                    </div>
                                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                                {generatedReport}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportsModal;
