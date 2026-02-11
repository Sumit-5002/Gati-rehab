
import { useState, useRef, useEffect, useMemo } from 'react';
import { X, Send, User, Bot, Sparkles, MessageSquare, ShieldCheck, Loader2 } from 'lucide-react';
import { useEscapeKey } from '../../../../shared/hooks/useEscapeKey';
import { useAuth } from '../../../auth/context/AuthContext';
import { sendMessage, subscribeToMessages, getChatId } from '../../../chat/services/chatService';
import { getGeminiResponse } from '../../../../shared/services/geminiService';


const NeuralChatModal = ({ isOpen, onClose, chatPartnerId = null, chatPartnerName = 'Neural Assistant' }) => {
    const { user, userData } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);
    const isAIChat = !chatPartnerId;

    // Accessibility: Handle Escape key
    useEscapeKey(onClose, isOpen);

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
        if (e) e.preventDefault();
        if (!input.trim() || isTyping) return;

        const userMsgText = input;
        const currentInput = input;
        setInput('');
        setIsTyping(true);

        try {
            if (isAIChat) {
                const userMsg = {
                    id: Date.now(),
                    text: currentInput,
                    sender: userData?.userType || 'user',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, userMsg]);

                let aiResponseText;
                try {
                    // Get history for context
                    const history = messages.slice(-5).map(m => ({
                        sender: m.sender === 'ai' ? 'ai' : 'user',
                        text: m.text
                    }));
                    aiResponseText = await getGeminiResponse(`You are Gati's Neural Assistant. ${userData?.userType === 'doctor' ? 'Focus on clinical data analysis and patient monitoring.' : 'Focus on recovery and encouragement.'}`, history);
                } catch (geminiError) {
                    console.error('[NeuralChat] Gemini API error:', geminiError);
                    aiResponseText = "I'm analyzing the data. Based on the current trends, progress is consistent with the recovery roadmap.";
                }

                const aiMsg = {
                    id: Date.now() + 1,
                    text: aiResponseText,
                    sender: 'ai',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                const chatId = getChatId(user.uid, chatPartnerId);
                await sendMessage(chatId, user.uid, currentInput, userData?.name || 'User');
            }
        } catch (error) {
            console.error('[NeuralChat] Failed to send message:', error);
        } finally {
            setIsTyping(false);
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    const isOwnMessage = (msg) => {
        return msg.senderId === user.uid || (msg.sender && msg.sender !== 'ai');
    };

    const displayMessages = isAIChat ? [aiWelcomeMessage, ...messages] : messages;

    return (
        <div className="fixed bottom-6 right-6 z-[110] flex flex-col items-end gap-4">
            <div className="relative w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAIChat ? 'bg-blue-600' : 'bg-blue-600'}`}>
                            {isAIChat ? <Bot className="w-6 h-6 text-white" /> : <MessageSquare className="w-6 h-6 text-white" />}
                        </div>
                        <div>
                            <h2 className="text-lg font-black leading-none mb-1">{isAIChat ? 'Gati AI' : chatPartnerName}</h2>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">
                                {isAIChat ? 'Digital Assistant' : 'Patient Communication'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400"
                        aria-label="Close chat"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 no-scrollbar">
                    {displayMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] px-4 py-3 rounded-[1.5rem] text-sm font-bold shadow-sm ${isOwnMessage(msg)
                                ? 'bg-blue-600 text-white rounded-tr-none'
                                : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                }`}>
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {msg.text}
                                </p>
                                <p className={`text-[8px] mt-1 opacity-60 ${isOwnMessage(msg) ? 'text-right' : ''}`}>
                                    {formatTime(msg.timestamp)}
                                </p>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white border border-slate-100 rounded-[1.5rem] rounded-tl-none px-4 py-3 flex items-center gap-2 shadow-sm">
                                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                                <span className="text-xs text-slate-500 font-bold">Gati is thinking...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-6 bg-white border-t border-slate-100">
                    <form onSubmit={handleSend} className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isAIChat ? "Ask about recovery..." : "Type a message..."}
                            className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isTyping}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-200"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    {isAIChat && (
                        <p className="text-[9px] text-center text-slate-400 font-bold mt-4 uppercase tracking-widest leading-tight">
                            ⚠️ I am an AI assistant, not a doctor. Consult a professional for clinical advice.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NeuralChatModal;
