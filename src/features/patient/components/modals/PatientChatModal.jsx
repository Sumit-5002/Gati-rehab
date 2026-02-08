
import { useState, useRef, useEffect } from 'react';
import { X, Send, User, Bot, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import { getGeminiResponse } from '../../../../shared/services/geminiService';

const PatientChatModal = ({ isOpen, onClose, patientName }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: `Hello ${patientName || 'Warrior'}! I'm Gati's Neural Assistant. I can help you with your recovery exercises, explain your progress, or answer health questions. How are you feeling today?`, sender: 'ai', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

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
        const userMsg = { id: Date.now(), text: userMsgText, sender: 'patient', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        try {
            // Get history for context
            const history = messages.map(msg => ({
                sender: msg.sender === 'patient' ? 'user' : 'model',
                text: msg.text
            }));

            const aiResponseText = await getGeminiResponse(userMsgText, history);

            const aiMsg = {
                id: Date.now() + 1,
                text: aiResponseText,
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg = {
                id: Date.now() + 2,
                text: "I'm having trouble connecting to my neural network. Please try again in a moment.",
                sender: 'ai',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white w-full max-w-2xl h-[95vh] sm:h-[85vh] sm:max-h-[800px] rounded-t-[3rem] sm:rounded-[3rem] shadow-3xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-10 duration-500">

                {/* Header */}
                <div className="p-6 sm:p-8 bg-blue-600 text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border border-white/20">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black leading-none mb-1">Gati Neural Assistant</h2>
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                                Powered by Gemini AI
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-3 hover:bg-white/10 rounded-2xl transition-all active:scale-95"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Secure Badge */}
                <div className="px-8 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-blue-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">End-to-end encrypted medical assistance</span>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-8 no-scrollbar bg-slate-50/30">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex items-start gap-4 ${msg.sender === 'patient' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.sender === 'ai' ? 'bg-blue-600 text-white' : 'bg-white text-slate-400 border border-slate-100'
                                }`}>
                                {msg.sender === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            </div>
                            <div className={`flex flex-col ${msg.sender === 'patient' ? 'items-end' : 'items-start'} max-w-[80%]`}>
                                <div className={`p-5 rounded-3xl text-sm font-bold leading-relaxed shadow-sm ${msg.sender === 'ai'
                                        ? 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                                        : 'bg-blue-600 text-white rounded-tr-none'
                                    }`}>
                                    {msg.text}
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase mt-2 px-1">{msg.time}</span>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex items-start gap-4 animate-pulse">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
                                <Bot className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="bg-white p-5 rounded-3xl rounded-tl-none border border-slate-100 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-100"></div>
                                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce delay-200"></div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-6 sm:p-10 bg-white border-t border-slate-100 shrink-0">
                    <form onSubmit={handleSend} className="relative group">
                        <div className="absolute inset-0 bg-blue-600/5 rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask anything about your recovery..."
                            className="relative w-full pl-6 pr-16 py-5 bg-slate-100 border-none rounded-[2rem] text-sm font-black focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-[9px] text-center text-slate-400 font-bold mt-4 uppercase tracking-[0.2em]">
                        Gati AI is assistant only and does not replace professional medical advice.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PatientChatModal;
