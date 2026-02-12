
import { useState, useEffect, useRef } from 'react';
import { Pill, Plus, X, Bell, Clock, CheckCircle2, Trash2, BellOff, ShieldAlert } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import { requestPushPermission, showPushNotification } from '../../../shared/services/notificationService';

const MedicationReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newMed, setNewMed] = useState({ name: '', dosage: '', time: '' });
  const [hasPermission, setHasPermission] = useState(Notification.permission === 'granted');
  const notificationInterval = useRef(null);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'medications'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meds = [];
      const today = new Date();
      const todayStr = today.toLocaleDateString('en-CA');

      snapshot.forEach((doc) => {
        const data = doc.data();

        let isExpired = false;
        if (data.startDate && data.duration) {
          const start = data.startDate.toDate ? data.startDate.toDate() : new Date(data.startDate);
          const diffTime = today - start;
          const diffDays = diffTime / (1000 * 60 * 60 * 24);
          if (diffDays > data.duration) {
            isExpired = true;
          }
        }

        if (!isExpired) {
          // Auto-reset medication status at midnight
          const medData = { id: doc.id, ...data };

          // Check if we need to reset (new day)
          if (data.lastTakenDate && data.lastTakenDate !== todayStr) {
            // Reset taken status for new day
            updateDoc(doc.ref, {
              lastTakenDate: null,
              takenToday: false
            }).catch(err => console.error('Reset error:', err));
            medData.lastTakenDate = null;
            medData.takenToday = false;
          }

          meds.push(medData);
        }
      });
      setReminders(meds);
      setLoading(false);
    });

    // Background checker for medication times (while app is open)
    notificationInterval.current = setInterval(() => {
      checkAndNotify();
    }, 60000); // Check every minute

    // Midnight reset checker - runs every hour to catch midnight
    const midnightChecker = setInterval(() => {
      const now = new Date();
      if (now.getHours() === 0 && now.getMinutes() < 5) {
        // It's just past midnight, trigger a refresh
        console.log('[MedicationReminders] Midnight reset triggered');
      }
    }, 3600000); // Check every hour

    return () => {
      unsubscribe();
      if (notificationInterval.current) clearInterval(notificationInterval.current);
      if (midnightChecker) clearInterval(midnightChecker);
    };
  }, [user]);

  const checkAndNotify = () => {
    if (Notification.permission !== 'granted') return;

    const now = new Date();
    const currentH = now.getHours();
    const currentM = now.getMinutes();
    const currentTime = `${currentH.toString().padStart(2, '0')}:${currentM.toString().padStart(2, '0')}`;
    const currentTotalMinutes = currentH * 60 + currentM;

    reminders.forEach(med => {
      const [medH, medM] = med.time.split(':').map(Number);
      const medTotalMinutes = medH * 60 + medM;
      const diffMinutes = medTotalMinutes - currentTotalMinutes;

      const todayStr = new Date().toLocaleDateString('en-CA');
      const isTaken = med.lastTakenDate === todayStr;

      // Send notification 5 minutes before scheduled time
      if (diffMinutes === 5 && !isTaken && !med.preAlertSent) {
        showPushNotification(
          `⏰ Upcoming: ${med.name}`,
          `Your ${med.dosage || 'medication'} is due in 5 minutes. Get ready!`
        );
        // Mark pre-alert as sent (stored in memory, resets on page reload)
        med.preAlertSent = true;
      }

      // Send notification at exact scheduled time
      if (diffMinutes === 0 && !isTaken) {
        showPushNotification(
          `💊 Medication Due: ${med.name}`,
          `It's time for your ${med.dosage || 'dose'}. Tap to mark as taken.`
        );
        med.exactAlertSent = true;
      }

      // Resend if not taken 5 minutes after scheduled time
      if (diffMinutes === -5 && !isTaken && !med.retryAlertSent) {
        showPushNotification(
          `⚠️ Reminder: ${med.name}`,
          `You haven't taken your ${med.dosage || 'medication'} yet. Please take it now.`
        );
        med.retryAlertSent = true;
      }
    });
  };

  const handleEnableNotifications = async () => {
    const granted = await requestPushPermission();
    setHasPermission(granted);
    if (granted) {
      showPushNotification("Gati Notifications Enabled", "You will now receive alerts for exercises and medication.");
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newMed.name || !newMed.time) return;

    try {
      await addDoc(collection(db, 'medications'), {
        userId: user.uid,
        ...newMed,
        takenToday: false,
        lastTakenDate: null,
        startDate: new Date(),
        createdAt: serverTimestamp()
      });
      setNewMed({ name: '', dosage: '', time: '' });
      setIsAdding(false);
    } catch (err) {
      console.error('Error adding med:', err);
    }
  };

  const toggleTaken = async (id, lastTakenDate) => {
    try {
      const todayStr = new Date().toLocaleDateString('en-CA');
      const isTakenToday = lastTakenDate === todayStr;

      await updateDoc(doc(db, 'medications', id), {
        lastTakenDate: isTakenToday ? null : todayStr,
        takenToday: !isTakenToday
      });

      // Show confirmation notification when marked as taken
      if (!isTakenToday && hasPermission) {
        showPushNotification(
          '✅ Medication Logged',
          'Great job! Your medication has been marked as taken.'
        );
      }
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
            <Pill className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">Medications</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Daily Schedule</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!hasPermission && (
            <button
              onClick={handleEnableNotifications}
              className="p-2.5 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all flex items-center gap-2"
              title="Enable Push Notifications"
            >
              <BellOff className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Enable Alerts</span>
            </button>
          )}
          <button
            onClick={() => setIsAdding(true)}
            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!hasPermission && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-900 mb-1">Notifications are Disabled</p>
            <p className="text-[10px] font-bold text-amber-700 leading-normal">To get medication reminders on your device, please enable browser notifications.</p>
          </div>
        </div>
      )}

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-8 p-6 bg-slate-50 rounded-3xl space-y-4 animate-in slide-in-from-top-4 duration-300 border border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medication Name</label>
            <input
              type="text"
              placeholder="e.g. Ibuprofen"
              className="w-full px-5 py-3 rounded-2xl border-none text-sm font-bold focus:ring-4 focus:ring-rose-100 bg-white"
              value={newMed.name}
              onChange={e => setNewMed({ ...newMed, name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosage</label>
              <input
                type="text"
                placeholder="e.g. 400mg"
                className="w-full px-5 py-3 rounded-2xl border-none text-sm font-bold focus:ring-4 focus:ring-rose-100 bg-white"
                value={newMed.dosage}
                onChange={e => setNewMed({ ...newMed, dosage: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time</label>
              <input
                type="time"
                className="w-full px-5 py-3 rounded-2xl border-none text-sm font-bold focus:ring-4 focus:ring-rose-100 bg-white"
                value={newMed.time}
                onChange={e => setNewMed({ ...newMed, time: e.target.value })}
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-500 shadow-lg shadow-rose-200 transition-all">Add Medication</button>
            <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-300 transition-all">Cancel</button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {reminders.map((med) => {
          const todayStr = new Date().toLocaleDateString('en-CA');
          const isTaken = med.lastTakenDate === todayStr;

          return (
            <div key={med.id} className="group flex items-center justify-between p-5 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-2xl hover:shadow-slate-200/50 transition-all border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleTaken(med.id, med.lastTakenDate)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isTaken ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-white text-slate-300 border border-slate-100 group-hover:border-emerald-200'}`}
                >
                  <CheckCircle2 className="w-6 h-6" />
                </button>
                <div>
                  <p className={`text-base font-black transition-all ${isTaken ? 'text-slate-300 line-through' : 'text-slate-900'}`}>{med.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-200/50 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      <Clock className="w-2.5 h-2.5" /> {med.time}
                    </div>
                    {med.dosage && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-rose-50 rounded-lg text-[9px] font-black text-rose-500 uppercase tracking-widest border border-rose-100">
                        <Pill className="w-2.5 h-2.5" /> {med.dosage}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleDelete(med.id)}
                className="p-2.5 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
        {reminders.length === 0 && !loading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-300 space-y-3">
            <Bell className="w-8 h-8 opacity-20" />
            <p className="text-sm font-black uppercase tracking-widest opacity-40">No reminders set</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationReminders;
