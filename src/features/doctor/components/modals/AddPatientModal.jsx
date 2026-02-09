
import { useState } from 'react';
import { X, User, Mail, Activity, Phone, Clipboard, Loader2, CheckCircle2, UserPlus } from 'lucide-react';
import { useEscapeKey } from '../../../../shared/hooks/useEscapeKey';
import { addPatientToDoctor } from '../../services/doctorService';

const AddPatientModal = ({ isOpen, onClose, doctorId }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        condition: '',
        phoneNumber: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [isExistingUser, setIsExistingUser] = useState(false);

    // Accessibility: Handle Escape key
    useEscapeKey(onClose, isOpen);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            setError('Name and Email are required.');
            return;
        }

        setLoading(true);
        try {
            const result = await addPatientToDoctor(doctorId, formData);
            // result = { id, success, isNewUser }
            setIsExistingUser(!result.isNewUser);

            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                setIsExistingUser(false);
                onClose();
                setFormData({ name: '', email: '', condition: '', phoneNumber: '', notes: '' });
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to add patient. Please try again.');
        } finally {
            setLoading(false);
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
            <div className="relative bg-white rounded-[3rem] shadow-3xl w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
                <div className="p-8 md:p-12">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 leading-none mb-2">Add New <span className="text-blue-600">Patient</span></h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Clinical Onboarding</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6 text-slate-400" />
                        </button>
                    </div>

                    {success ? (
                        <div className="py-12 text-center animate-in zoom-in duration-500">
                            <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
                                <CheckCircle2 className="w-12 h-12" />
                            </div>
                            {isExistingUser ? (
                                <>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Patient Found & Linked!</h3>
                                    <p className="text-slate-500 font-bold max-w-xs mx-auto">
                                        This user already has a Gati account. They have been successfully linked to your clinic and will see you in their dashboard.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-2xl font-black text-slate-900 mb-2">Invite Sent!</h3>
                                    <p className="text-slate-500 font-bold max-w-xs mx-auto">
                                        The patient has been linked. They must <span className="text-blue-600">Sign Up</span> using {formData.email} to access their dashboard.
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup
                                    icon={<User className="w-5 h-5" />}
                                    label="Full Name"
                                    name="name"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                                <InputGroup
                                    icon={<Mail className="w-5 h-5" />}
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup
                                    icon={<Activity className="w-5 h-5" />}
                                    label="Medical Condition"
                                    name="condition"
                                    placeholder="ACL Recovery"
                                    value={formData.condition}
                                    onChange={handleInputChange}
                                />
                                <InputGroup
                                    icon={<Phone className="w-5 h-5" />}
                                    label="Phone Number"
                                    name="phoneNumber"
                                    placeholder="+91 98765 43210"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Clinical Notes</label>
                                <div className="relative group">
                                    <Clipboard className="absolute left-5 top-5 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                    <textarea
                                        name="notes"
                                        rows="3"
                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all resize-none"
                                        placeholder="Any specific instructions..."
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                    ></textarea>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600">
                                    <X className="w-5 h-5" />
                                    <p className="text-xs font-bold uppercase tracking-wide">{error}</p>
                                </div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black hover:bg-slate-200 transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UserPlus className="w-6 h-6" />}
                                    Complete Onboarding
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ icon, label, ...props }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
        <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                {icon}
            </div>
            <input
                {...props}
                className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-blue-100 transition-all"
            />
        </div>
    </div>
);

export default AddPatientModal;
