
import { useState } from 'react';
import { X, Activity, Smile, Meh, Frown, Loader2, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';
import { useAuth } from '../../../auth/context/AuthContext';

const PainLoggerModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [painLevel, setPainLevel] = useState(3);
    const [location, setLocation] = useState('Knee');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEscape);
        }
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await addDoc(collection(db, 'pain_logs'), {
                userId: user.uid,
                painLevel,
                location,
                description,
                timestamp: serverTimestamp()
            });
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                onClose();
                setPainLevel(3);
                setDescription('');
            }, 2000);
        } catch (error) {
            console.error('[PainLogger] Error saving log:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const painIcons = [
        { level: 1, icon: <Smile className="w-8 h-8" />, label: 'Mild', color: 'text-emerald-500' },
        { level: 3, icon: <Meh className="w-8 h-8" />, label: 'Moderate', color: 'text-amber-500' },
        { level: 5, icon: <Frown className="w-8 h-8" />, label: 'Severe', color: 'text-rose-500' },
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-white rounded-[3rem] shadow-3xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                <div className="p-10">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 leading-none mb-2">Log <span className="text-rose-500">Symptoms</span></h2>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pain & Mobility Tracking</p>
                        </div>
                        <button onClick={onClose} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors text-slate-400">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {success ? (
                        <div className="py-12 text-center">
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Symptom Logged!</h3>
                            <p className="text-slate-500 font-bold">Your doctor has been notified about your current status.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Pain Intensity</label>
                                <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2.5rem]">
                                    {painIcons.map((p) => (
                                        <button
                                            key={p.level}
                                            type="button"
                                            onClick={() => setPainLevel(p.level)}
                                            className={`flex flex-col items-center gap-2 transition-all ${painLevel === p.level ? 'scale-125' : 'opacity-40 grayscale'}`}
                                        >
                                            <div className={p.color}>{p.icon}</div>
                                            <span className={`text-[10px] font-black uppercase ${p.color}`}>{p.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Area of Discomfort</label>
                                <select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                                >
                                    <option>Left Knee</option>
                                    <option>Right Knee</option>
                                    <option>Hip</option>
                                    <option>Ankle</option>
                                    <option>General</option>
                                </select>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Description</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows="3"
                                    placeholder="Stiffness after waking up, sharp pain during extension..."
                                    className="w-full px-6 py-5 bg-slate-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6" />}
                                    Log Status
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PainLoggerModal;
