import { useState, useEffect } from 'react';
import { ChevronLeft, MessageSquare, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import NavHeader from '../../../shared/components/NavHeader';
import ChatWindow from '../../shared/components/ChatWindow';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase/config';

const PatientMessagesPage = () => {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [assignedDoctor, setAssignedDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctor = async () => {
      if (!userData?.doctorId) {
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', userData.doctorId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const d = snap.data();
          setAssignedDoctor({ uid: snap.id, name: d.name });
        }
      } catch (error) {
        console.error('Error fetching doctor:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctor();
  }, [userData]);

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      <NavHeader userType="patient" />

      <main className="max-w-[1000px] mx-auto px-4 py-10">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold mb-4"
          >
            <ChevronLeft className="w-5 h-5" /> Back
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
            Your <span className="text-blue-600">Messages</span>
          </h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          </div>
        ) : assignedDoctor ? (
          <div className="max-w-2xl mx-auto">
            <ChatWindow currentUser={user} otherUser={assignedDoctor} />
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] p-12 text-center border border-slate-200">
            <MessageSquare className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-400">No Assigned Doctor</h2>
            <p className="text-slate-400 mt-2">You don't have an assigned doctor to message yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatientMessagesPage;
