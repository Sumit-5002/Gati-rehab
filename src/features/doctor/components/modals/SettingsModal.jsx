import { useState, useEffect } from 'react';
import { X, User, Bell, Sliders, Save, Camera } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, doctorProfile, onSave }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialization: '',
    phoneNumber: '',
    clinic: '',
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,
    weeklyReports: true,
    adherenceAlerts: true,
    highAdherenceThreshold: 80,
    mediumAdherenceThreshold: 60,
    lowAdherenceThreshold: 40,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // FIX 1: Lock Body Scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Prevent scrolling on the main website
      document.body.style.overflow = 'hidden';
    } else {
      // Re-enable scrolling when closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to ensure scroll is restored if component unmounts
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Load profile data
  useEffect(() => {
    if (doctorProfile) {
      setFormData((prev) => ({
        ...prev,
        name: doctorProfile.name || '',
        email: doctorProfile.email || '',
        specialization: doctorProfile.specialization || '',
        phoneNumber: doctorProfile.phoneNumber || '',
        clinic: doctorProfile.clinic || '',
      }));
    }
  }, [doctorProfile]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (onSave) await onSave(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('[SettingsModal] Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    /* FIX 2: Increased z-index to z-[100] to cover Navbar */
    <div className="fixed inset-0 z-[100] overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-screen md:min-h-full items-end md:items-center justify-center p-0 md:p-4">
        {/* Modal Window */}
        <div className="relative bg-slate-50 md:rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] w-full md:max-w-5xl h-[95vh] md:h-auto md:max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">

          {/* Header */}
          <div className="flex-none flex items-center justify-between p-6 md:p-10 bg-white border-b border-slate-100">
            <div>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-none mb-2">Settings</h2>
              <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" /> Professional Command Suite
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-4 hover:bg-slate-100 rounded-[1.5rem] transition-all active:scale-95 group"
            >
              <X className="w-6 h-6 text-slate-400 group-hover:text-slate-900 transition-colors" />
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden bg-white">
            {/* Sidebar / Tab Nav */}
            <div className="flex-none w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-8">
              <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto no-scrollbar pb-2 md:pb-0">
                <TabButton
                  isActive={activeTab === 'profile'}
                  onClick={() => setActiveTab('profile')}
                  icon={<User className="w-5 h-5" />}
                  label="Profile"
                  description="Identity & Clinic"
                />
                <TabButton
                  isActive={activeTab === 'notifications'}
                  onClick={() => setActiveTab('notifications')}
                  icon={<Bell className="w-5 h-5" />}
                  label="Notifications"
                  description="Real-time Alerts"
                />
                <TabButton
                  isActive={activeTab === 'preferences'}
                  onClick={() => setActiveTab('preferences')}
                  icon={<Sliders className="w-5 h-5" />}
                  label="Preferences"
                  description="Adherence Config"
                />
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-white no-scrollbar">
              {activeTab === 'profile' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                      <h3 className="text-2xl font-black text-slate-900">Personal Identity</h3>
                    </div>

                    <div className="mb-10 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row items-center gap-6 group transition-all hover:bg-slate-100">
                      <div className="relative">
                        {doctorProfile?.photoURL ? (
                          <img src={doctorProfile.photoURL} alt={formData.name} className="w-28 h-28 rounded-[2rem] object-cover border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-28 h-28 bg-blue-600 rounded-[2rem] flex items-center justify-center border-4 border-white shadow-xl group-hover:scale-105 transition-transform duration-500">
                            <User className="w-12 h-12 text-white" />
                          </div>
                        )}
                        <button className="absolute -bottom-2 -right-2 p-3 bg-white text-slate-900 rounded-2xl shadow-lg border border-slate-100 hover:bg-blue-600 hover:text-white transition-all active:scale-90">
                          <Camera className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-center sm:text-left">
                        <p className="text-lg font-black text-slate-900 mb-1">{formData.name || 'New Specialist'}</p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{formData.specialization || 'General Practitioner'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SettingsInput label="Full Name" value={formData.name} onChange={(v) => handleInputChange('name', v)} icon={<User className="w-4 h-4" />} />
                      <SettingsInput label="Email Address" type="email" value={formData.email} onChange={(v) => handleInputChange('email', v)} icon={<Bell className="w-4 h-4" />} />
                      <SettingsInput label="Clinical Specialization" value={formData.specialization} onChange={(v) => handleInputChange('specialization', v)} />
                      <SettingsInput label="Direct Phone" type="tel" value={formData.phoneNumber} onChange={(v) => handleInputChange('phoneNumber', v)} />
                      <div className="md:col-span-2">
                        <SettingsInput label="Main Clinic / Affiliation" value={formData.clinic} onChange={(v) => handleInputChange('clinic', v)} />
                      </div>
                    </div>
                  </section>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <ToggleRow label="Email Notifications" subLabel="Receive updates via email" checked={formData.emailNotifications} onChange={(v) => handleInputChange('emailNotifications', v)} />
                      <ToggleRow label="Push Notifications" subLabel="Browser push notifications" checked={formData.pushNotifications} onChange={(v) => handleInputChange('pushNotifications', v)} />
                      <ToggleRow label="SMS Notifications" subLabel="Receive text messages" checked={formData.smsNotifications} onChange={(v) => handleInputChange('smsNotifications', v)} />
                      <ToggleRow label="Weekly Reports" subLabel="Summary of patient progress" checked={formData.weeklyReports} onChange={(v) => handleInputChange('weeklyReports', v)} />
                      <ToggleRow label="Adherence Alerts" subLabel="Alert when patient adherence drops" checked={formData.adherenceAlerts} onChange={(v) => handleInputChange('adherenceAlerts', v)} />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
                  <section>
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
                      <h3 className="text-2xl font-black text-slate-900">Adherence Thresholds</h3>
                    </div>

                    <div className="space-y-10">
                      <ThresholdSlider label="High Performance" description="Patients above this threshold are flagged as Excellent" value={formData.highAdherenceThreshold} min={60} max={100} color="text-emerald-500" onChange={(v) => handleInputChange('highAdherenceThreshold', v)} />
                      <ThresholdSlider label="Monitoring Zone" description="Patients in this range need consistent review" value={formData.mediumAdherenceThreshold} min={40} max={80} color="text-amber-500" onChange={(v) => handleInputChange('mediumAdherenceThreshold', v)} />
                      <ThresholdSlider label="Critical Warning" description="Patients below this will trigger urgent action alerts" value={formData.lowAdherenceThreshold} min={0} max={60} color="text-rose-500" onChange={(v) => handleInputChange('lowAdherenceThreshold', v)} />

                      <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-6">Visual Matrix Preview</p>

                        <div className="relative h-4 bg-slate-800 rounded-full overflow-hidden flex">
                          <div className="h-full bg-rose-500" style={{ width: `${formData.lowAdherenceThreshold}%` }}></div>
                          <div className="h-full bg-amber-500" style={{ width: `${formData.mediumAdherenceThreshold - formData.lowAdherenceThreshold}%` }}></div>
                          <div className="h-full bg-blue-500" style={{ width: `${formData.highAdherenceThreshold - formData.mediumAdherenceThreshold}%` }}></div>
                          <div className="h-full bg-emerald-500 flex-1"></div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 mt-6 text-[9px] font-black uppercase tracking-wider">
                          <div className="text-rose-400">Critical</div>
                          <div className="text-amber-400">Poor</div>
                          <div className="text-blue-400">Good</div>
                          <div className="text-emerald-400">Optimal</div>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-none flex items-center justify-between p-6 md:px-12 md:py-8 border-t border-slate-100 bg-white">
            <div className="hidden sm:block">
              {saveSuccess && <p className="text-sm text-emerald-600 font-black animate-bounce flex items-center gap-2">✓ Config Synchronized</p>}
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                onClick={onClose}
                className="flex-1 sm:flex-none px-8 py-4 bg-slate-100 rounded-2xl font-black text-slate-500 hover:bg-slate-200 transition-all active:scale-95"
              >
                Close
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] sm:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all disabled:opacity-50 shadow-xl shadow-blue-200 active:scale-95 translate-y-0"
              >
                {isSaving ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Apply Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ isActive, onClick, icon, label, description }) => (
  <button
    onClick={onClick}
    className={`flex flex-col md:flex-row items-center md:items-start gap-1 md:gap-4 p-3 md:p-5 rounded-[1.5rem] md:rounded-2xl transition-all duration-300 min-w-[90px] md:min-w-0 md:w-full text-center md:text-left ${isActive
        ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 md:translate-x-2'
        : 'text-slate-400 hover:bg-white hover:text-slate-900 group'
      }`}
  >
    <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white/20' : 'bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
      {icon}
    </div>
    <div className="hidden md:block">
      <p className="font-black text-sm leading-tight mb-0.5">{label}</p>
      <p className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
        {description}
      </p>
    </div>
    <div className="md:hidden">
      <p className="font-black text-[10px] mt-1">{label}</p>
    </div>
  </button>
);

const SettingsInput = ({ label, value, onChange, type = "text", icon }) => (
  <div className="space-y-2 group">
    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative">
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full ${icon ? 'pl-12' : 'px-6'} py-4 bg-slate-50 border-2 border-slate-50 rounded-2xl font-bold text-slate-900 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100 outline-none transition-all placeholder:text-slate-300`}
      />
    </div>
  </div>
);

const ToggleRow = ({ label, subLabel, checked, onChange }) => (
  <div className="group flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-50 hover:border-blue-100 hover:bg-white transition-all duration-300">
    <div className="pr-4">
      <p className="font-black text-slate-900 mb-1">{label}</p>
      <p className="text-xs font-bold text-slate-400 leading-relaxed">{subLabel}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-14 h-8 bg-slate-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-100 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
    </label>
  </div>
);

const ThresholdSlider = ({ label, description, value, min, max, color, onChange }) => (
  <div className="group">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-sm font-black text-slate-900 mb-1">{label}</p>
        <p className="text-xs font-bold text-slate-400">{description}</p>
      </div>
      <span className={`text-2xl font-black ${color} tracking-tighter`}>{value}%</span>
    </div>
    <div className="relative h-2 bg-slate-100 rounded-full">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
      />
      <div
        className={`h-full rounded-full bg-blue-600 relative transition-all duration-300`}
        style={{ width: `${value}%` }}
      >
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-blue-600 rounded-full shadow-lg"></div>
      </div>
    </div>
  </div>
);

export default SettingsModal;