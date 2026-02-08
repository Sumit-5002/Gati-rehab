import { useState, useRef, useEffect } from 'react';
import { X, Send, User, Bot, Sparkles, MessageSquare, ShieldCheck } from 'lucide-react';
import { getGeminiResponse } from '../../../../shared/services/geminiService';

const NeuralChatModal = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState([
        { id: 1, text: "Hello! Dr. Gati's Neural Assistant powered by Gemini is active. How can I help you analyze patient progress today?", sender: 'ai', time: '10:00 AM' }
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
        const userMsgHtml = { id: Date.now(), text: userMsgText, sender: 'doctor', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

        setMessages(prev => [...prev, userMsgHtml]);
        setInput('');
        setIsTyping(true);

        try {
            // Get history for context (excluding the first welcome message if preferred, or include all)
            const history = messages.slice(1);

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
                text: "I'm having trouble connecting to my neural network. " + (error.message.includes("API Key") ? "Please check if your Gemini API Key is configured." : "Please try again in a moment."),
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
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black leading-none mb-1">Neural Chat</h2>
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
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'doctor' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${msg.sender === 'doctor' ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                    {msg.sender === 'doctor' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-slate-500" />}
                                </div>
                                <div className={`p-4 rounded-[1.5rem] shadow-sm text-sm font-bold leading-relaxed ${msg.sender === 'doctor'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                    }`}>
                                    {msg.text}
                                    <p className={`text-[9px] mt-2 opacity-60 ${msg.sender === 'doctor' ? 'text-right' : ''}`}>
                                        {msg.time}
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
                            placeholder="Ask anything about your patients..."
                            className="w-full pl-6 pr-16 py-5 bg-slate-100 border-none rounded-[2rem] text-sm font-black focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="text-[10px] text-center text-slate-400 font-bold mt-4 uppercase tracking-widest">Gati AI may occasionally provide inaccurate clinical insights.</p>
                </div>
            </div>
        </div>
    );
};

export default NeuralChatModal;
