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
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Modal Window */}
        <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className="flex-none flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Main Body */}
          <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar */}
            <div className="flex-none w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 overflow-x-auto md:overflow-y-auto">
              <nav className="flex md:flex-col p-2 md:p-4 gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-none md:flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                    activeTab === 'profile' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span className="font-medium">Profile</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`flex-none md:flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                    activeTab === 'notifications' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  <span className="font-medium">Notifications</span>
                </button>
                
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`flex-none md:flex-1 flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors whitespace-nowrap ${
                    activeTab === 'preferences' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Sliders className="w-5 h-5" />
                  <span className="font-medium">Preferences</span>
                </button>
              </nav>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
              {activeTab === 'profile' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Doctor Profile</h3>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                      <div className="flex items-center gap-4">
                        {doctorProfile?.photoURL ? (
                          <img src={doctorProfile.photoURL} alt={formData.name} className="w-20 h-20 rounded-full object-cover border-2 border-gray-200" />
                        ) : (
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="w-10 h-10 text-blue-600" />
                          </div>
                        )}
                        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                          <Camera className="w-4 h-4" />
                          <span className="text-sm font-medium">Change Photo</span>
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input type="text" value={formData.name} onChange={(e) => handleInputChange('name', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label>
                        <input type="text" value={formData.specialization} onChange={(e) => handleInputChange('specialization', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input type="tel" value={formData.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Clinic/Hospital</label>
                        <input type="text" value={formData.clinic} onChange={(e) => handleInputChange('clinic', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
                      </div>
                    </div>
                  </div>
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
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Adherence Thresholds</h3>
                    <div className="space-y-6">
                      <ThresholdSlider label="High Adherence Threshold (%)" description="Patients above this threshold are considered to have high adherence" value={formData.highAdherenceThreshold} min={60} max={100} color="text-green-600" onChange={(v) => handleInputChange('highAdherenceThreshold', v)} />
                      <ThresholdSlider label="Medium Adherence Threshold (%)" description="Patients above this threshold but below high threshold need monitoring" value={formData.mediumAdherenceThreshold} min={40} max={80} color="text-yellow-600" onChange={(v) => handleInputChange('mediumAdherenceThreshold', v)} />
                      <ThresholdSlider label="Low Adherence Warning (%)" description="Patients below this threshold need urgent attention" value={formData.lowAdherenceThreshold} min={0} max={60} color="text-red-600" onChange={(v) => handleInputChange('lowAdherenceThreshold', v)} />
                      
                      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-3">Threshold Preview</p>
                        <div className="relative h-12 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-lg">
                          <div className="absolute h-full w-0.5 bg-white border-l-2 border-gray-800 z-10" style={{ left: `${formData.mediumAdherenceThreshold}%` }}>
                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap bg-white px-1 rounded shadow-sm">{formData.mediumAdherenceThreshold}%</span>
                          </div>
                          <div className="absolute h-full w-0.5 bg-white border-l-2 border-gray-800 z-10" style={{ left: `${formData.highAdherenceThreshold}%` }}>
                            <span className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-bold whitespace-nowrap bg-white px-1 rounded shadow-sm">{formData.highAdherenceThreshold}%</span>
                          </div>
                        </div>
                        <div className="flex justify-between mt-3 text-xs text-gray-600 font-medium">
                          <span>Low (&lt;{formData.mediumAdherenceThreshold}%)</span>
                          <span>Medium ({formData.mediumAdherenceThreshold}-{formData.highAdherenceThreshold}%)</span>
                          <span>High (≥{formData.highAdherenceThreshold}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex-none flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div>
              {saveSuccess && <p className="text-sm text-green-600 font-bold animate-pulse">✓ Settings saved successfully!</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200">
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToggleRow = ({ label, subLabel, checked, onChange }) => (
  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
    <div>
      <p className="font-medium text-gray-900">{label}</p>
      <p className="text-sm text-gray-600">{subLabel}</p>
    </div>
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
    </label>
  </div>
);

const ThresholdSlider = ({ label, description, value, min, max, color, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
    <div className="flex items-center gap-4">
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(parseInt(e.target.value))} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
      <span className={`text-lg font-bold w-12 text-right ${color}`}>{value}%</span>
    </div>
    <p className="text-xs text-gray-500 mt-1">{description}</p>
  </div>
);

export default SettingsModal;