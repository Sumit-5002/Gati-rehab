
import { useState, useEffect } from 'react';
import { X, User, Bell, Sliders, Save, Camera, Target, Shield, Smartphone } from 'lucide-react';
import { useEscapeKey } from '../../../../shared/hooks/useEscapeKey';

const PatientSettingsModal = ({ isOpen, onClose, patientProfile, onSave }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phoneNumber: '',
        condition: '',
        injuryType: 'ACL Recovery',
        rehabPhase: 'Mid',
        // Notification settings
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
        dailyReminder: true,
        reminderTime: '09:00',
        // Preferences
        motionFeedback: true,
        audioCues: true,
        highContrast: false,
        autoSave: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    // Accessibility: Handle Escape key
    useEscapeKey(onClose, isOpen);

    useEffect(() => {
        if (patientProfile) {
            setFormData((prev) => ({
                ...prev,
                name: patientProfile.name || '',
                email: patientProfile.email || '',
                phoneNumber: patientProfile.phoneNumber || '',
                condition: patientProfile.condition || '',
                injuryType: patientProfile.injuryType || 'ACL Recovery',
                rehabPhase: patientProfile.rehabPhase || 'Mid',
                emailNotifications: patientProfile.emailNotifications ?? true,
                pushNotifications: patientProfile.pushNotifications ?? true,
                smsNotifications: patientProfile.smsNotifications ?? false,
                dailyReminder: patientProfile.dailyReminder ?? true,
                reminderTime: patientProfile.reminderTime || '09:00',
                motionFeedback: patientProfile.motionFeedback ?? true,
                audioCues: patientProfile.audioCues ?? true,
                highContrast: patientProfile.highContrast ?? false,
                autoSave: patientProfile.autoSave ?? true
            }));
        }
    }, [patientProfile]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setSaveSuccess(false);
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveSuccess(false);

        try {
            if (onSave) {
                await onSave(formData);
            }

            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                onClose();
            }, 2000);
        } catch (error) {
            console.error('[PatientSettingsModal] Save error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-[3rem] shadow-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col transform transition-all animate-in zoom-in duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-8 md:p-10 border-b border-slate-50 bg-slate-900 text-white">
                    <div>
                        <h2 className="text-3xl font-black leading-none mb-2 underline decoration-blue-500 decoration-4">Nexus <span className="text-blue-400">Settings</span></h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Personalize your recovery environment</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/10 rounded-2xl transition-colors"
                        aria-label="Close settings"
                    >
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-24 md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2">
                        <TabButton
                            active={activeTab === 'profile'}
                            onClick={() => setActiveTab('profile')}
                            icon={<User className="w-5 h-5" />}
                            label="Profile"
                        />
                        <TabButton
                            active={activeTab === 'notifications'}
                            onClick={() => setActiveTab('notifications')}
                            icon={<Bell className="w-5 h-5" />}
                            label="Alerts"
                        />
                        <TabButton
                            active={activeTab === 'preferences'}
                            onClick={() => setActiveTab('preferences')}
                            icon={<Sliders className="w-5 h-5" />}
                            label="System"
                        />
                        <TabButton
                            active={activeTab === 'security'}
                            onClick={() => setActiveTab('security')}
                            icon={<Shield className="w-5 h-5" />}
                            label="Privacy"
                        />
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 p-10 overflow-y-auto bg-white">
                        {activeTab === 'profile' && (
                            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <section>
                                    <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-2">
                                        <User className="w-5 h-5 text-blue-500" /> Identity Information
                                    </h3>

                                    <div className="flex flex-col md:flex-row gap-10">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-100 border-4 border-slate-50 overflow-hidden relative group">
                                                {patientProfile?.photoURL ? (
                                                    <img src={patientProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <User className="w-16 h-16 text-slate-300" />
                                                    </div>
                                                )}
                                                <div
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                                    aria-label="Change profile picture"
                                                    role="button"
                                                    tabIndex="0"
                                                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } }}
                                                >
                                                    <Camera className="w-8 h-8 text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <InputField
                                                label="Full Name"
                                                value={formData.name}
                                                onChange={(val) => handleInputChange('name', val)}
                                                placeholder="Warrior Name"
                                            />
                                            <InputField
                                                label="Email"
                                                value={formData.email}
                                                onChange={(val) => handleInputChange('email', val)}
                                                placeholder="nexus@gati.ai"
                                                type="email"
                                            />
                                            <InputField
                                                label="Phone"
                                                value={formData.phoneNumber}
                                                onChange={(val) => handleInputChange('phoneNumber', val)}
                                                placeholder="+91 00000 00000"
                                            />
                                            <InputField
                                                label="Condition Note"
                                                value={formData.condition}
                                                onChange={(val) => handleInputChange('condition', val)}
                                                placeholder="E.g. ACL Recovery"
                                            />
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Injury Type</label>
                                                <select
                                                    value={formData.injuryType}
                                                    onChange={(e) => handleInputChange('injuryType', e.target.value)}
                                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                                                >
                                                    <option>ACL Recovery</option>
                                                    <option>Stroke Recovery</option>
                                                    <option>Knee OA</option>
                                                    <option>Hip Replacement</option>
                                                    <option>Post-Fracture</option>
                                                    <option>General Mobility</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Rehab Phase</label>
                                                <select
                                                    value={formData.rehabPhase}
                                                    onChange={(e) => handleInputChange('rehabPhase', e.target.value)}
                                                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all appearance-none"
                                                >
                                                    <option>Acute</option>
                                                    <option>Mid</option>
                                                    <option>Advanced</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Bell className="w-5 h-5 text-blue-500" /> Alert Systems
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <ToggleItem
                                        label="Email Reminders"
                                        description="Weekly progress summaries sent to your inbox"
                                        checked={formData.emailNotifications}
                                        onChange={(checked) => handleInputChange('emailNotifications', checked)}
                                    />
                                    <ToggleItem
                                        label="Neural Push"
                                        description="Real-time session reminders on this device"
                                        checked={formData.pushNotifications}
                                        onChange={(checked) => handleInputChange('pushNotifications', checked)}
                                    />
                                    <ToggleItem
                                        label="SMS Protocol"
                                        description="Emergency alerts via text message"
                                        checked={formData.smsNotifications}
                                        onChange={(checked) => handleInputChange('smsNotifications', checked)}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'preferences' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Sliders className="w-5 h-5 text-blue-500" /> Training Calibration
                                </h3>
                                <div className="grid grid-cols-1 gap-4">
                                    <ToggleItem
                                        label="Motion Feedback"
                                        description="Visual overlays during exercise sessions"
                                        checked={formData.motionFeedback}
                                        onChange={(checked) => handleInputChange('motionFeedback', checked)}
                                    />
                                    <ToggleItem
                                        label="Audio Cues"
                                        description="Voice guidance and rep counting"
                                        checked={formData.audioCues}
                                        onChange={(checked) => handleInputChange('audioCues', checked)}
                                    />
                                    <ToggleItem
                                        label="High Contrast Mode"
                                        description="Optimized visuals for better visibility"
                                        checked={formData.highContrast}
                                        onChange={(checked) => handleInputChange('highContrast', checked)}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="p-8 bg-blue-50/50 rounded-[2.5rem] border border-blue-100 flex flex-col items-center text-center">
                                    <Shield className="w-16 h-16 text-blue-500 mb-6 bg-white p-4 rounded-2xl shadow-sm" />
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Connect with Clinic</h3>
                                    <p className="text-slate-500 font-bold mb-8 max-w-sm">Enter your doctor's email address to securely link your recovery data.</p>

                                    <div className="w-full max-w-md space-y-4">
                                        <div className="relative group">
                                            <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                            <input
                                                type="email"
                                                placeholder="doctor@clinic.com"
                                                className="w-full pl-16 pr-6 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                                                id="doctor-email-input"
                                            />
                                        </div>
                                        <button
                                            onClick={async (e) => {
                                                const email = document.getElementById('doctor-email-input').value;
                                                const btn = e.currentTarget;
                                                const originalText = 'Send Connection Request';

                                                if (!email) return alert('Please enter an email');

                                                try {
                                                    btn.disabled = true;
                                                    btn.innerText = 'Linking...';
                                                    const { connectWithDoctor } = await import('../../services/patientService');
                                                    const result = await connectWithDoctor(patientProfile.id, email);

                                                    btn.innerText = 'Success!';
                                                    btn.classList.remove('bg-slate-900', 'hover:bg-slate-800');
                                                    btn.classList.add('bg-emerald-500', 'hover:bg-emerald-600');

                                                    setTimeout(() => {
                                                        btn.innerText = `Linked to ${result.doctorName}`;
                                                    }, 1500);
                                                } catch (err) {
                                                    alert(err.message);
                                                    btn.innerText = originalText;
                                                    btn.disabled = false;
                                                }
                                            }}
                                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            Send Connection Request
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Status</p>
                                    <p className="text-lg font-bold text-slate-700 mt-1">
                                        {patientProfile?.doctorName ? `Linked to ${patientProfile.doctorName}` : 'No Active Supervising Clinician'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex-1">
                        {saveSuccess && (
                            <div className="flex items-center gap-2 text-emerald-600 font-black animate-in fade-in zoom-in">
                                <Shield className="w-4 h-4" /> Nexus Refigured Successfully
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="px-8 py-4 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
                        >
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50"
                        >
                            {isSaving ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Save className="w-5 h-5" />
                            )}
                            Commit Changes
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button
        onClick={onClick}
        className={`relative group flex items-center justify-center md:justify-start gap-4 p-4 rounded-2xl transition-all duration-300 ${active
            ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
            : 'text-slate-400 hover:bg-white hover:text-slate-900'
            }`}
    >
        <div className={`shrink-0 transition-transform duration-500 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>
            {icon}
        </div>
        <span className="hidden md:block font-black uppercase text-[10px] tracking-widest">{label}</span>
        {active && <div className="absolute right-2 w-1.5 h-1.5 bg-blue-400 rounded-full md:hidden"></div>}
    </button>
);

const InputField = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all"
        />
    </div>
);

const ToggleItem = ({ label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-blue-100 hover:bg-white transition-all group">
        <div className="flex-1">
            <p className="font-black text-slate-800 leading-none mb-1.5">{label}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{description}</p>
        </div>
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`w-14 h-8 rounded-full transition-all relative flex items-center p-1 ${checked ? 'bg-blue-600' : 'bg-slate-200'}`}
        >
            <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
    </div>
);

export default PatientSettingsModal;
