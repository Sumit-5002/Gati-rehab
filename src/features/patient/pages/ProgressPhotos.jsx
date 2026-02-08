
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../../shared/components/Footer';
import { Camera, Calendar, Trash2, Maximize2, X, ChevronLeft, ChevronRight, Share2, Download, Filter, MessageSquare, Plus, Activity } from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../../../lib/firebase/config';
import { useAuth } from '../../auth/context/AuthContext';
import NavHeader from '../../../shared/components/NavHeader';

const ProgressPhotos = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'progress_photos'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const p = [];
      snapshot.forEach((doc) => p.push({ id: doc.id, ...doc.data() }));
      setPhotos(p.sort((a, b) => b.timestamp?.toDate() - a.timestamp?.toDate()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `progress_photos/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, 'progress_photos'), {
        userId: user.uid,
        url,
        path: storageRef.fullPath,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photo) => {
    if (!window.confirm('Remove this progress photo?')) return;
    try {
      const storageRef = ref(storage, photo.path);
      await deleteObject(storageRef);
      await deleteDoc(doc(db, 'progress_photos', photo.id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-20">
      <NavHeader userType="patient" />

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <button
              onClick={() => navigate('/patient-dashboard')}
              className="flex items-center gap-2 text-slate-500 hover:text-blue-600 font-bold mb-4 transition-colors"
            >
              <Activity className="w-4 h-4" /> Back to Dashboard
            </button>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none">
              Recovery <span className="text-blue-600">Visuals</span>
            </h1>
            <p className="text-slate-500 font-bold mt-2">Track your physical transformation over time</p>
          </div>

          <label className="relative cursor-pointer group">
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} disabled={uploading} />
            <div className={`flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.5rem] font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 ${uploading ? 'opacity-50' : ''}`}>
              {uploading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Camera className="w-5 h-5 text-blue-400" />
              )}
              {uploading ? 'Uploading...' : 'New Progress Photo'}
            </div>
          </label>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600"></div>
          </div>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {photos.map((photo) => (
              <div key={photo.id} className="group relative bg-white rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-200/50 border border-white">
                <div className="aspect-[4/3] overflow-hidden">
                  <img src={photo.url} alt="Progress" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </div>
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                    <Calendar className="w-4 h-4" />
                    {photo.timestamp?.toDate()?.toLocaleDateString() || 'Recently Uploaded'}
                  </div>
                  <button
                    onClick={() => handleDelete(photo)}
                    className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
            <MessageSquare className="w-20 h-20 text-slate-100 mb-6" />
            <h3 className="text-xl font-black text-slate-900">No visuals captured yet</h3>
            <p className="text-slate-400 font-bold mt-2">Visual progress is key to maintaining motivation.</p>
          </div>
        )}

        <div className="mt-16 p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-center gap-6">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm shrink-0">
            <Filter className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h4 className="font-black text-blue-900">Privacy Insured</h4>
            <p className="text-sm font-bold text-blue-600/70">Progress photos are stored in your private clinical cloud and are only visible to your assigned treatment team.</p>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default ProgressPhotos;
