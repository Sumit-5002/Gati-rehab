import { useNavigate } from 'react-router-dom';
import { Video, ArrowLeft } from 'lucide-react';
import NavHeader from '../../../shared/components/NavHeader';

export default function PhysioLink() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F1F5F9]">
      <NavHeader userType="patient" />
      <main className="max-w-[1700px] mx-auto px-4 sm:px-6 py-10">
        <button
          onClick={() => navigate('/patient-dashboard')}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
        <div className="bg-white rounded-[2rem] p-10 shadow-xl border border-slate-50 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Video className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 mb-2">Physio Link</h1>
          <p className="text-slate-500 font-bold">Video call with your physiotherapist. This feature will be available soon.</p>
        </div>
      </main>
    </div>
  );
}
