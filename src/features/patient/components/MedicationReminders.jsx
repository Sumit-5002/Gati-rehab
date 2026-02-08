
import { useState, useEffect } from 'react';
import { Pill, Plus, X, Bell, Clock, CheckCircle2, Trash2 } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../auth/context/AuthContext';

const MedicationReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '' });

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'medications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meds = [];
      snapshot.forEach((doc) => meds.push({ id: doc.id, ...doc.data() }));
      setReminders(meds);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.time) return;

    try {
      await addDoc(collection(db, 'medications'), {
        userId: user.uid,
        ...newMed,
        takenToday: false,
        createdAt: serverTimestamp()
      });
      setNewMed({ name: '', dosage: '', time: '' });
      setIsAdding(false);
    } catch (err) {
      console.error('Error adding med:', err);
    }
  };

  const toggleTaken = async (id, current) => {
    try {
      await updateDoc(doc(db, 'medications', id), { takenToday: !current });
    } catch (err) {
      console.error('Error updating med:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'medications', id));
    } catch (err) {
      console.error('Error deleting med:', err);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
            <Pill className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-xl font-black text-slate-900">Medications</h3>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-6 p-4 bg-slate-50 rounded-2xl space-y-3 animate-in slide-in-from-top duration-300">
          <input
            type="text"
            placeholder="Medication Name"
            className="w-full px-4 py-2 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-rose-200"
            value={newMed.name}
            onChange={e => setNewMed({...newMed, name: e.target.value})}
          />
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Dosage"
              className="flex-1 px-4 py-2 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-rose-200"
              value={newMed.dosage}
              onChange={e => setNewMed({...newMed, dosage: e.target.value})}
            />
            <input
              type="time"
              className="flex-1 px-4 py-2 rounded-xl border-none text-sm font-bold focus:ring-2 focus:ring-rose-200"
              value={newMed.time}
              onChange={e => setNewMed({...newMed, time: e.target.value})}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 py-2 bg-rose-500 text-white rounded-xl font-bold text-xs">Save</button>
            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 bg-slate-200 text-slate-600 rounded-xl font-bold text-xs">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {reminders.map((med) => (
          <div key={med.id} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-white hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleTaken(med.id, med.takenToday)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${med.takenToday ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-300 border border-slate-100'}`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <div>
                <p className={`text-sm font-black transition-all ${med.takenToday ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{med.name}</p>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                  <Clock className="w-3 h-3" /> {med.time} • {med.dosage}
                </div>
              </div>
            </div>
            <button
              onClick={() => handleDelete(med.id)}
              className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {reminders.length === 0 && !loading && (
          <div className="py-6 text-center text-slate-400 font-bold text-sm italic">
            No active medications
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationReminders;
