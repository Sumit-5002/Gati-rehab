
import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, User, Bot, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../auth/context/AuthContext';
import { sendMessage, subscribeToMessages, getChatId } from '../../../chat/services/chatService';

const NeuralChatModal = ({ isOpen, onClose, chatPartnerId = null, chatPartnerName = 'Neural Assistant' }) => {
    const { user, userData } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const isAIChat = !chatPartnerId;

    const aiWelcomeMessage = useMemo(() => ({
        id: 'ai-welcome',
        text: `Hello ${userData?.name?.split(' ')[0] || 'Warrior'}, I'm Gati's Neural Assistant. How can I help you ${userData?.userType === 'doctor' ? 'analyze patient progress' : 'with your recovery'} today?`,
        sender: 'ai',
        timestamp: new Date()
    }), [userData]);

    useEffect(() => {
        if (!isOpen || isAIChat) return;

        const chatId = getChatId(user.uid, chatPartnerId);
        const unsubscribe = subscribeToMessages(chatId, (newMessages) => {
            setMessages(newMessages);
        });
        return () => unsubscribe();
    }, [isOpen, chatPartnerId, isAIChat, user.uid]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsgText = input;
        const userMsgHtml = { id: Date.now(), text: userMsgText, sender: 'doctor', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

        const currentInput = input;
        setInput('');
        setIsTyping(true);

        try {
            // Get history for context (excluding the first welcome message if preferred, or include all)
            const history = messages.slice(1);

            const aiResponseText = await getGeminiResponse(userMsgText, history);

        if (isAIChat) {
            const userMsg = {
                id: Date.now(),
                text: currentInput,
                sender: userData?.userType || 'user',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, userMsg]);

            // Simulate AI response
            setTimeout(() => {
                const aiMsg = {
                    id: Date.now() + 1,
                    text: userData?.userType === 'doctor'
                        ? "Analyzing clinical data... Your patients are showing a combined 8% improvement in Form Quality this week."
                        : "Great job on your knee bends! Your form was exceptional in the last session. Keep maintaining that range of motion.",
                    sender: 'ai',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMsg]);
            }, 1500);
        } else {
            const chatId = getChatId(user.uid, chatPartnerId);
            try {
                await sendMessage(chatId, user.uid, currentInput, userData?.name || 'User');
            } catch (error) {
                console.error('Failed to send message:', error);
            }
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    const isOwnMessage = (msg) => {
        return msg.senderId === user.uid || msg.sender === userData?.userType;
    };

    const displayMessages = isAIChat ? [aiWelcomeMessage, ...messages] : messages;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-end md:p-10">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Sidebar Chat Modal */}
            <div className="relative bg-white h-full md:h-[90vh] w-full md:w-[500px] md:rounded-[3rem] shadow-3xl overflow-hidden flex flex-col transform transition-all animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="p-8 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center border border-white/10 shadow-lg">
                            {isAIChat ? <Sparkles className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
                        </div>
                        <div>
                            <h2 className="text-xl font-black leading-none mb-1">{isAIChat ? 'Neural Chat' : chatPartnerName}</h2>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Encrypted Session
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white/10 rounded-2xl transition-colors">
                        <X className="w-6 h-6 text-slate-400" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50">
                    {displayMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[85%] ${isOwnMessage(msg) ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${isOwnMessage(msg) ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                    {isOwnMessage(msg) ? <User className="w-4 h-4 text-white" /> : (isAIChat ? <Bot className="w-4 h-4 text-slate-500" /> : <User className="w-4 h-4 text-slate-500" />)}
                                </div>
                                <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm font-bold leading-relaxed ${isOwnMessage(msg)
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                    }`}>
                                    {msg.text}
                                    <p className={`text-[9px] mt-2 opacity-60 ${isOwnMessage(msg) ? 'text-right' : ''}`}>
                                        {formatTime(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-8 bg-white border-t border-slate-100">
                    <form onSubmit={handleSend} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isAIChat ? "Ask about recovery..." : "Type a message..."}
                            className="w-full pl-6 pr-16 py-5 bg-slate-100 border-none rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-[10px] text-center text-slate-400 font-bold mt-4 uppercase tracking-widest">
                        {isAIChat ? 'Gati AI may occasionally provide inaccurate clinical insights.' : 'Direct messaging with clinical encryption.'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NeuralChatModal;
