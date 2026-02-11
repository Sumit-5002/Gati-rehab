import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2 } from 'lucide-react';
import { getGeminiResponse } from '../../../shared/services/geminiService';

/**
 * Gati AI Assistant - Chat with AI for health advice
 * Separate from doctor messaging
 */
const GatiAssistant = ({ isOpen, onClose, patientProfile }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: `Hi! I'm Gati, your AI rehabilitation assistant. 🤖\n\nI can help you with:\n• Exercise techniques and form\n• Pain management advice\n• Recovery progress questions\n• General physiotherapy guidance\n\nHow can I assist you today?`
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            // Build context for AI
            const context = `You are Gati, an expert AI physiotherapy assistant. You provide helpful, accurate, and encouraging advice about rehabilitation, exercises, and recovery.

Patient Context:
- Injury: ${patientProfile?.injuryType || 'General Recovery'}
- Rehab Phase: ${patientProfile?.rehabPhase || 'Mid'}
- Current Pain Level: ${patientProfile?.currentPainLevel || 'Moderate'}/10

IMPORTANT RULES:
1. Be warm, encouraging, and supportive
2. Provide specific, actionable advice
3. If asked about medical diagnosis or medication, advise consulting their doctor
4. Focus on exercise techniques, pain management, and recovery tips
5. Keep responses concise (2-3 paragraphs max)
6. Use emojis sparingly for friendliness

User Question: ${userMessage}`;

            // Filter out the initial welcome message (first message at index 0) 
            // and only include actual conversation exchanges
            // Gemini requires first message in history to be from user, not assistant
            const conversationHistory = messages
                .slice(1) // Skip the initial "Hi! I'm Gati..." welcome message
                .map(msg => ({
                    sender: msg.role === 'assistant' ? 'ai' : 'user',
                    text: msg.content
                }));

            const response = await getGeminiResponse(context, conversationHistory);

            // Add AI response
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response || "I'm having trouble connecting right now. Please try again in a moment!"
            }]);
        } catch (error) {
            console.error('[GatiAssistant] Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact your physiotherapist for immediate assistance."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-4">
            <div className="relative w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
                {/* Header */}
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                            <Bot className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black leading-none mb-1">Gati AI</h2>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Digital Assistant</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl transition-colors text-slate-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 no-scrollbar">
                    {messages.map((message, idx) => (
                        <div
                            key={idx}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] px-4 py-3 rounded-[1.5rem] text-sm font-bold shadow-sm ${message.role === 'user'
                                    ? 'bg-blue-600 text-white rounded-tr-none'
                                    : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap leading-relaxed">
                                    {message.content}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
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
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything..."
                            className="w-full pl-6 pr-14 py-4 bg-slate-100 border-none rounded-2xl text-sm font-black focus:ring-4 focus:ring-blue-100 transition-all outline-none"
                            disabled={isLoading}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || isLoading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-blue-200"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[9px] text-center text-slate-400 font-bold mt-4 uppercase tracking-widest leading-tight">
                        ⚠️ I am an AI assistant, not a doctor. Consult a professional for clinical advice.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default GatiAssistant;
