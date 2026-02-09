
import { useState, useEffect } from 'react';
import { X, Calendar, Clock, User, Video, MapPin, CheckCircle, Save } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';
import { useAuth } from '../../../features/auth/context/AuthContext';

const AppointmentModal = ({ isOpen, onClose, patientId = null, doctorId = null, patientName = '', doctorName = '', onJoinCall }) => {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [appointments, setAppointments] = useState([]);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    type: 'Video Call',
    meetingLink: 'https://meet.google.com/ayd-uthv-yvd',
    notes: ''
  });

  // Accessibility: Handle Escape key
  useEscapeKey(onClose, isOpen);

  useEffect(() => {
    if (!isOpen || !user) return;

    // Use userType from either userData or if we're in doctor scope
    const userRole = userData?.userType || (doctorId === user.uid ? 'doctor' : 'patient');

    const q = query(
      collection(db, 'appointments'),
      where(userRole === 'doctor' ? 'doctorId' : 'patientId', '==', user.uid)
      // orderBy removed to prevent index errors
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const apps = [];
      snapshot.forEach((doc) => {
        apps.push({ id: doc.id, ...doc.data() });
      });

      // Client-side sort
      apps.sort((a, b) => {
        const tA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(`${a.date} ${a.time}`).getTime();
        const tB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(`${b.date} ${b.time}`).getTime();
        return tB - tA;
      });

      setAppointments(apps);
    });

    return () => unsubscribe();
  }, [isOpen, user, userData, doctorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const finalPatientId = patientId || (userData?.userType === 'patient' ? user.uid : '');
      const finalDoctorId = doctorId || (userData?.userType === 'doctor' ? user.uid : userData?.doctorId);

      if (!finalDoctorId) {
        throw new Error('No doctor assigned. Please contact support.');
      }

      await addDoc(collection(db, 'appointments'), {
        patientId: finalPatientId,
        doctorId: finalDoctorId,
        patientName: patientName || (userData?.userType === 'patient' ? userData?.name : 'Patient'),
        doctorName: doctorName || (userData?.userType === 'doctor' ? userData?.name : 'Dr. Gati'),
        date: formData.date,
        time: formData.time,
        type: formData.type,
        meetingLink: formData.meetingLink,
        notes: formData.notes,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFormData({ date: '', time: '', type: 'Video Call', meetingLink: 'https://meet.google.com/ayd-uthv-yvd', notes: '' });
      }, 3000);
    } catch (error) {
      console.error('[AppointmentModal] Error booking appointment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black leading-none mb-1">Schedule Session</h2>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Rehabilitation Planning</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-white/10 rounded-2xl transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Date</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 transition-all"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Session Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    required
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 transition-all"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Consultation Type</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'Video Call' })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-black transition-all border ${formData.type === 'Video Call' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                >
                  <Video className="w-4 h-4" /> Video Call
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'In-person' })}
                  className={`flex items-center justify-center gap-2 p-4 rounded-2xl font-black transition-all border ${formData.type === 'In-person' ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100'}`}
                >
                  <MapPin className="w-4 h-4" /> In-person
                </button>
              </div>
            </div>

            {formData.type === 'Video Call' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-500">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Video Link (Default)</label>
                <div className="relative">
                  <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="url"
                    readOnly
                    className="w-full pl-12 pr-4 py-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-500 cursor-not-allowed select-all"
                    value={formData.meetingLink}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-600 px-2 py-1 rounded-full border border-emerald-200">Auto-Generated</span>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Notes</label>
              <textarea
                rows="3"
                className="w-full p-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Specific symptoms or topics to discuss..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : success ? (
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Appointment Booked!</span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Confirm Appointment
                </>
              )}
            </button>
          </form>

          {/* Upcoming Appointments List */}
          {appointments.length > 0 && (
            <div className="mt-10">
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Upcoming Sessions</h3>
              <div className="space-y-3">
                {appointments.slice(0, 3).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${app.type === 'Video Call' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                        {app.type === 'Video Call' ? <Video className="w-5 h-5" /> : <MapPin className="w-5 h-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900">{app.date} at {app.time}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{userData?.userType === 'doctor' ? app.patientName : app.doctorName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {(app.status === 'confirmed' || app.status === 'scheduled') && (
                        <div className="flex flex-col items-center gap-2">
                          {app.meetingLink ? (
                            <a
                              href={app.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] active:scale-95 flex items-center gap-2 no-underline"
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              Join Meet
                            </a>
                          ) : (
                            <button
                              onClick={() => {
                                onJoinCall?.(`Gati_Session_${app.id}`);
                                onClose();
                              }}
                              className="px-6 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500 transition-all shadow-[0_0_15px_rgba(37,99,235,0.4)] active:scale-95 flex items-center gap-2"
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                              Join Now
                            </button>
                          )}
                        </div>
                      )}
                      <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${app.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-white text-slate-500 border-slate-100'}`}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentModal;
