
import { User, Mail, Phone, Briefcase, MapPin, Calendar, Award, Star, ExternalLink, Users } from 'lucide-react';

const DoctorProfileCard = ({ doctorProfile, onEditClick }) => {
  if (!doctorProfile) {
    return (
      <div className="bg-slate-900 rounded-[3rem] p-10 animate-pulse">
        <div className="h-20 bg-white/10 rounded-2xl w-full mb-4"></div>
        <div className="h-8 bg-white/10 rounded-xl w-2/3"></div>
      </div>
    );
  }

  const joinDate = doctorProfile.createdAt
    ? new Date(doctorProfile.createdAt?.toDate?.() || doctorProfile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'Recently';

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white rounded-[3rem] shadow-3xl shadow-slate-900/30">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>

      <div className="relative z-10 p-10">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-[2rem] overflow-hidden border-4 border-white/10 shadow-2xl transition-transform hover:scale-105 duration-500">
              {doctorProfile.photoURL ? (
                <img
                  src={doctorProfile.photoURL}
                  alt={doctorProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-600 flex items-center justify-center">
                  <User className="w-14 h-14 text-white" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2 rounded-xl shadow-lg border-4 border-slate-900">
              <Star className="w-4 h-4 text-white fill-current" />
            </div>
          </div>

          <h2 className="text-3xl font-black tracking-tight mb-2 leading-none">{doctorProfile.name}</h2>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-300">{doctorProfile.specialization || 'Physiotherapist'}</span>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          <InfoItem icon={<Mail className="w-4 h-4 text-blue-400" />} label="Email" value={doctorProfile.email} />
          <InfoItem icon={<MapPin className="w-4 h-4 text-blue-400" />} label="Clinic" value={doctorProfile.clinic || 'Main Rehabilitation Center'} />
          <InfoItem icon={<Calendar className="w-4 h-4 text-blue-400" />} label="Active Since" value={joinDate} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center transition-colors hover:bg-white/10 group">
            <Users className="w-5 h-5 mx-auto mb-3 text-slate-500 group-hover:text-blue-400 transition-colors" />
            <p className="text-2xl font-black text-white leading-none mb-1">{doctorProfile.totalPatients || '12'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Patients</p>
          </div>
          <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 text-center transition-colors hover:bg-white/10 group">
            <Award className="w-5 h-5 mx-auto mb-3 text-slate-500 group-hover:text-amber-400 transition-colors" />
            <p className="text-2xl font-black text-white leading-none mb-1">{doctorProfile.yearsExperience || '8+'}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Exp. Years</p>
          </div>
        </div>

        <button
          onClick={onEditClick}
          className="w-full mt-10 py-5 bg-white text-slate-900 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-blue-50 transition-all shadow-xl active:scale-95"
        >
          Edit Full Profile <ExternalLink className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors duration-300">
    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0 border border-white/5">
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 leading-none mb-1">{label}</p>
      <p className="text-sm font-bold text-slate-200 truncate">{value}</p>
    </div>
  </div>
);

export default DoctorProfileCard;
