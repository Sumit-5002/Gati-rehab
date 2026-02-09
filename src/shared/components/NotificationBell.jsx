
import { useState, useEffect, useRef } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle, Circle } from 'lucide-react';
import { useAuth } from '../../features/auth/context/AuthContext';
import { subscribeToNotifications, markAsRead, markAllAsRead } from '../services/notificationService';

const NotificationBell = () => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = subscribeToNotifications(user.uid, (data) => {
            setNotifications(data);
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type) => {
        switch (type) {
            case 'alert': return <AlertTriangle className="w-4 h-4 text-rose-500" />;
            case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
            case 'info': return <Info className="w-4 h-4 text-blue-500" />;
            default: return <Bell className="w-4 h-4 text-slate-400" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white border border-slate-100 hover:border-blue-500/30 transition-all active:scale-90 shadow-sm"
                aria-label="Notifications"
            >
                <Bell className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-12' : ''} ${unreadCount > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-4 w-80 sm:w-96 bg-white rounded-[2rem] shadow-3xl border border-slate-100 overflow-hidden z-[200] animate-in slide-in-from-top-2 duration-300">
                    <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-black leading-none mb-1">Nexus Feed</h3>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">Intelligence Monitoring</p>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead(user.uid)}
                                className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all"
                            >
                                Mark All Read
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                        {notifications.length > 0 ? (
                            <div className="divide-y divide-slate-50">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-5 hover:bg-slate-50 transition-colors cursor-pointer group ${!n.read ? 'bg-blue-50/30' : ''}`}
                                        onClick={() => markAsRead(n.id)}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${!n.read ? 'bg-white' : 'bg-slate-50'}`}>
                                                {getIcon(n.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-1">
                                                    <p className={`text-sm font-black leading-tight text-slate-900 truncate`}>{n.title}</p>
                                                    {!n.read && <Circle className="w-2 h-2 fill-blue-500 text-blue-500 shrink-0 mt-1" />}
                                                </div>
                                                <p className="text-xs font-bold text-slate-500 leading-relaxed mb-2">{n.message}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{n.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center text-slate-400">
                                <Bell className="w-12 h-12 mx-auto mb-4 opacity-10" />
                                <p className="text-sm font-bold">No new transmissions</p>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100">
                        <button className="w-full py-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-blue-600 transition-colors">
                            View Communications Log
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
