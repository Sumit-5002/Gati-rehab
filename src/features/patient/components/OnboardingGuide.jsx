import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Play, TrendingUp, Calendar, MessageSquare } from 'lucide-react';

/**
 * Interactive Onboarding Guide for new patients
 * Shows key features and how to use the dashboard
 */
const OnboardingGuide = ({ isOpen, onClose, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: 'Welcome to Gati Rehab! 🎉',
            description: 'Your AI-powered physiotherapy companion',
            content: 'Gati uses advanced AI and computer vision to guide your rehabilitation journey. Let\'s take a quick tour of the key features.',
            icon: <Check className="w-12 h-12 text-emerald-500" />,
            highlight: null
        },
        {
            title: 'Today\'s Roadmap',
            description: 'Your personalized daily exercises',
            content: 'Every day, you\'ll see a customized exercise plan based on your condition, progress, and pain levels. The AI adjusts intensity automatically to ensure safe recovery.',
            icon: <Calendar className="w-12 h-12 text-blue-500" />,
            highlight: 'roadmap',
            tips: [
                'Check your roadmap every morning',
                'Complete exercises in the suggested order',
                'Exercises reset at midnight (00:00) daily'
            ]
        },
        {
            title: 'Starting a Session',
            description: 'Real-time AI coaching',
            content: 'Click "Resume Session" or any exercise to start. The AI will track your movements in real-time using your camera and provide instant feedback on your form.',
            icon: <Play className="w-12 h-12 text-indigo-500" />,
            highlight: 'session',
            tips: [
                'Ensure good lighting for best tracking',
                'Position yourself fully in frame',
                'Click "How to Perform" to see exercise demos',
                'AI provides corrections when form drops below 70%'
            ]
        },
        {
            title: 'Track Your Progress',
            description: 'Monitor your recovery journey',
            content: 'View your performance history, quality scores, and range of motion improvements. The system tracks everything automatically.',
            icon: <TrendingUp className="w-12 h-12 text-emerald-500" />,
            highlight: 'progress',
            tips: [
                'Check "Recovery Trends" for detailed analytics',
                'Log pain levels daily for better AI recommendations',
                'Review session reports after each workout'
            ]
        },
        {
            title: 'Get Support',
            description: 'Connect with your specialist',
            content: 'Message your physiotherapist, schedule video consultations, and get AI-powered advice 24/7 through the Gati Assistant.',
            icon: <MessageSquare className="w-12 h-12 text-blue-500" />,
            highlight: 'support',
            tips: [
                'Use the chat for quick questions',
                'Schedule regular check-ins with your specialist',
                'The AI assistant is available anytime'
            ]
        },
        {
            title: 'You\'re All Set! 🚀',
            description: 'Ready to start your recovery',
            content: 'Remember: consistency is key! Complete your daily exercises, log your pain levels, and the AI will optimize your recovery plan automatically.',
            icon: <Check className="w-12 h-12 text-emerald-500" />,
            highlight: null,
            tips: [
                'Start with today\'s exercises',
                'Focus on form quality over speed',
                'Rest when you need to',
                'Celebrate small wins!'
            ]
        }
    ];

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    const handleNext = () => {
        if (isLastStep) {
            onComplete?.();
            onClose();
        } else {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (!isFirstStep) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSkip = () => {
        onComplete?.();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                {/* Progress bar */}
                <div className="h-2 bg-slate-100">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-2xl flex items-center justify-center">
                                {currentStepData.icon}
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                                    {currentStepData.title}
                                </h2>
                                <p className="text-sm text-slate-500 font-bold mt-1">
                                    {currentStepData.description}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSkip}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label="Skip tutorial"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="flex items-center gap-2">
                        {steps.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all ${idx === currentStep
                                        ? 'w-8 bg-blue-600'
                                        : idx < currentStep
                                            ? 'w-1.5 bg-emerald-500'
                                            : 'w-1.5 bg-slate-200'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    <p className="text-lg text-slate-700 font-medium leading-relaxed mb-6">
                        {currentStepData.content}
                    </p>

                    {currentStepData.tips && (
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <h4 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-3">
                                💡 Key Tips
                            </h4>
                            <ul className="space-y-2">
                                {currentStepData.tips.map((tip, idx) => (
                                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
                                        <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 text-white" />
                                        </div>
                                        <span className="font-medium">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                        onClick={handlePrev}
                        disabled={isFirstStep}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${isFirstStep
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-700 hover:bg-white hover:shadow-md active:scale-95'
                            }`}
                    >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                    </button>

                    <div className="text-sm font-bold text-slate-500">
                        Step {currentStep + 1} of {steps.length}
                    </div>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-emerald-600 text-white rounded-xl font-black hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                    >
                        {isLastStep ? 'Get Started' : 'Next'}
                        {!isLastStep && <ChevronRight className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OnboardingGuide;
