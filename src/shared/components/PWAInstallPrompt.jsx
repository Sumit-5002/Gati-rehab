
import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

const PWAInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            // Show the custom prompt if on mobile
            setShowPrompt(true);
        };

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (!isStandalone) {
            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-6 left-4 right-4 z-[200] animate-in slide-in-from-bottom-10 duration-500">
            <div className="bg-slate-900 border border-white/10 rounded-[2.5rem] p-6 shadow-3xl shadow-blue-900/40 relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-500/30 transition-colors duration-700"></div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-blue-500 rounded-3xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 border border-white/20">
                        <Smartphone className="w-8 h-8 text-white" />
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                            <h3 className="text-white font-black text-lg leading-tight">Install Gati Rehab</h3>
                            <Sparkles className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-slate-400 text-sm font-bold leading-relaxed">
                            Add Gati to your home screen for faster access and offline recovery sessions.
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={() => setShowPrompt(false)}
                            className="p-4 text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <button
                            onClick={handleInstallClick}
                            className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95 transition-all"
                        >
                            <Download className="w-5 h-5" />
                            Install Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallPrompt;
