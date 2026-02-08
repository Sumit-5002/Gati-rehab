
import { X, FileText, CheckCircle, Clock, ShieldCheck, Activity, Target } from 'lucide-react';

const PlanOverviewModal = ({ isOpen, onClose, routine }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-3xl max-h-[90vh] rounded-[3rem] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in duration-300">

                {/* Header */}
                <div className="p-8 bg-slate-900 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                            <FileText className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black leading-none mb-1">Treatment Plan</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Clinical Recovery Strategy</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-95"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 sm:p-12 space-y-10 no-scrollbar">
                    {/* Status Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <StatusCard
                            icon={<Activity className="w-5 h-5 text-blue-500" />}
                            label="Phase"
                            value={routine?.phase || "Recovery Initiation"}
                        />
                        <StatusCard
                            icon={<Target className="w-5 h-5 text-emerald-500" />}
                            label="Target"
                            value={routine?.target || "Mobility Restore"}
                        />
                        <StatusCard
                            icon={<Clock className="w-5 h-5 text-orange-500" />}
                            label="Duration"
                            value={routine?.duration || "8 Weeks"}
                        />
                    </div>

                    {/* Routine Details */}
                    <div>
                        <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-blue-600" /> Current Session Structure
                        </h3>
                        <div className="space-y-4">
                            {routine?.exercises && routine.exercises.length > 0 ? (
                                routine.exercises.map((ex, idx) => (
                                    <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-400 font-black shadow-sm">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-900 text-lg leading-none mb-2">{ex.name}</p>
                                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    <span>{ex.sets} Sets</span>
                                                    <span>•</span>
                                                    <span>{ex.reps} Reps</span>
                                                    {ex.notes && (
                                                        <>
                                                            <span>•</span>
                                                            <span className="normal-case">{ex.notes}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-slate-400 font-bold text-center py-10 bg-slate-50 rounded-[2rem]">No routine details available.</p>
                            )}
                        </div>
                    </div>

                    {/* Doctor's Notes */}
                    <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-2">
                                <ShieldCheck className="w-5 h-5" /> Specialist Observations
                            </h3>
                            <p className="text-blue-700/80 font-bold leading-relaxed">
                                "{routine?.observations || "Consistency is key to a successful recovery. Follow the instructions provided for each exercise."}"
                            </p>
                        </div>
                        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl"></div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-white border-t border-slate-100 shrink-0 flex items-center justify-between">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Last updated: {routine?.lastUpdated?.toDate ? routine.lastUpdated.toDate().toLocaleDateString() : 'Recently'}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all active:scale-95 shadow-xl"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};

const StatusCard = ({ icon, label, value }) => (
    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center flex flex-col items-center">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4">
            {icon}
        </div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="text-sm font-black text-slate-800 leading-none">{value}</p>
    </div>
);

export default PlanOverviewModal;
