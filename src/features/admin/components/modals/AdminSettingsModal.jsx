import { useState, useEffect } from 'react';
import { X, User, Bell, Sliders, Save, Shield } from 'lucide-react';
import { useEscapeKey } from '../../../../shared/hooks/useEscapeKey';

const AdminSettingsModal = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState('profile');
    const [formData, setFormData] = useState({
        name: 'System Admin',
        email: 'admin@demo.com',
        notifications: true,
        auditLogging: true
    });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEscapeKey(onClose, isOpen);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        // Simulate save
        setTimeout(() => {
            setIsSaving(false);
            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                onClose();
            }, 1500);
        }, 1000);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-[2rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-8 border-b border-slate-100">
                    <h2 className="text-2xl font-black text-slate-900">Admin Settings</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-slate-50 p-6 space-y-2">
                        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-4 h-4" />} label="Profile" />
                        <TabButton active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<Shield className="w-4 h-4" />} label="Security" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8 overflow-y-auto">
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-900">Profile Details</h3>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Name</label>
                                        <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-100" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                                        <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 border-none outline-none focus:ring-2 focus:ring-blue-100" />
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-slate-900">System Security</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                                        <div>
                                            <p className="font-bold text-slate-900">Audit Logging</p>
                                            <p className="text-xs text-slate-500">Track all admin actions</p>
                                        </div>
                                        <input type="checkbox" checked={formData.auditLogging} onChange={e => setFormData({ ...formData, auditLogging: e.target.checked })} className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 flex justify-end gap-4">
                    <button onClick={onClose} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-xl font-bold hover:bg-slate-200">Cancel</button>
                    <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
                        {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-all ${active ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}>
        {icon} {label}
    </button>
);

export default AdminSettingsModal;
