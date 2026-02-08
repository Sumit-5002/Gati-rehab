
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Plus, Filter, Check, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../../../lib/firebase/config';

const SchedulerModal = ({ isOpen, onClose, doctorId, patients }) => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [newAppt, setNewAppt] = useState({
        patientId: '',
        date: '',
        time: '',
        type: 'Consultation'
    });

    useEffect(() => {
        if (isOpen && doctorId) {
            fetchAppointments();
        }
    }, [isOpen, doctorId]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, 'appointments'),
                where('doctorId', '==', doctorId)
            );
            const snap = await getDocs(q);
            const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setAppointments(data.sort((a, b) => new Date(a.date) - new Date(b.date)));
        } catch (error) {
            console.error("Fetch Appts Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAppointment = async (e) => {
        e.preventDefault();
        if (!newAppt.patientId || !newAppt.date || !newAppt.time) return;

        const patient = patients.find(p => p.id === newAppt.patientId);

        try {
            await addDoc(collection(db, 'appointments'), {
                ...newAppt,
                patientName: patient?.name || 'Unknown Patient',
                doctorId: doctorId,
                status: 'scheduled',
                createdAt: serverTimestamp()
            });
            setIsAdding(false);
            setNewAppt({ patientId: '', date: '', time: '', type: 'Consultation' });
            fetchAppointments();
        } catch (error) {
            console.error("Create Appt Error:", error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteDoc(doc(db, 'appointments', id));
            fetchAppointments();
        } catch (error) {
            console.error("Delete Appt Error:", error);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

            <div className="relative bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-3xl overflow-hidden flex flex-col animate-in zoom-in duration-300">
                {/* Header */}
                <div className="p-8 bg-indigo-600 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                            <Calendar className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black leading-none mb-1">Clinical Scheduler</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Synchronized Healthcare Planning</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                    {/* List Section */}
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-xl font-black text-slate-900">Upcoming Appointments</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setIsAdding(true)} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100">
                                    <Plus className="w-4 h-4" /> New Session
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="py-20 flex justify-center">
                                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : appointments.length === 0 ? (
                            <div className="py-20 text-center">
                                <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold">No appointments synchronized.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {appointments.map(appt => (
                                    <div key={appt.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-xl hover:shadow-slate-200/50 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black">
                                                {new Date(appt.date).getDate()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-900 mb-1">{appt.patientName}</p>
                                                <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(appt.date).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {appt.time}</span>
                                                    <span className="px-2 py-0.5 bg-slate-100 rounded-full text-slate-600">{appt.type}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-3 hover:bg-emerald-50 text-slate-300 hover:text-emerald-500 rounded-xl transition-all"><Check className="w-5 h-5" /></button>
                                            <button onClick={() => handleDelete(appt.id)} className="p-3 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Sidebar / Form */}
                    {isAdding && (
                        <div className="w-full md:w-96 bg-white border-l border-slate-100 p-8 animate-in slide-in-from-right duration-500 overflow-y-auto">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-900">Configure Session</h3>
                                <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleCreateAppointment} className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Patient</label>
                                    <select
                                        value={newAppt.patientId}
                                        onChange={(e) => setNewAppt({ ...newAppt, patientId: e.target.value })}
                                        className="w-full p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-900 focus:border-indigo-600 transition-all outline-none"
                                    >
                                        <option value="">Select Patient...</option>
                                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Date & Time</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="date"
                                            value={newAppt.date}
                                            onChange={(e) => setNewAppt({ ...newAppt, date: e.target.value })}
                                            className="p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-900 text-xs focus:border-indigo-600 outline-none"
                                        />
                                        <input
                                            type="time"
                                            value={newAppt.time}
                                            onChange={(e) => setNewAppt({ ...newAppt, time: e.target.value })}
                                            className="p-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-black text-slate-900 text-xs focus:border-indigo-600 outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block ml-1">Session Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {['Consultation', 'Regular', 'Post-Op', 'Assessment'].map(type => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setNewAppt({ ...newAppt, type })}
                                                className={`p-3 rounded-xl border-2 font-black text-[10px] transition-all ${newAppt.type === type ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 mt-8">
                                    Sync to Schedule
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SchedulerModal;
