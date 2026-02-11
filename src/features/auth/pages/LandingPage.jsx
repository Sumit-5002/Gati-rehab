// LandingPage - Premium Professional Marketing Page with Dark Mode
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import {
  Activity, Smartphone, Wifi, Brain, Heart, TrendingUp, CheckCircle, ArrowRight,
  Zap, Github, ExternalLink, Star, Users, Award, Shield, Moon, Sun, PlayCircle,
  BarChart3, Clock, Sparkles, Target, MessageSquare
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { isDarkMode: darkMode, toggleTheme: toggleDarkMode } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced MediaPipe technology tracks 33 body keypoints in real-time for comprehensive movement analysis',
      color: 'blue'
    },
    {
      icon: Sparkles,
      title: 'AI Recovery Guidance',
      description: 'Intelligent roadmap adjustments and recovery support powered by Google Gemini AI',
      color: 'purple'
    },
    {
      icon: Smartphone,
      title: 'Zero Equipment',
      description: 'Just your smartphone camera - no wearables, sensors, or special hardware needed',
      color: 'green'
    },
    {
      icon: Wifi,
      title: 'Works Offline',
      description: 'Continue therapy sessions anywhere, even without internet connectivity',
      color: 'orange'
    },
    {
      icon: BarChart3,
      title: 'Progress Analytics',
      description: 'Beautiful charts tracking ROM, quality scores, and recovery milestones',
      color: 'indigo'
    },
    {
      icon: Shield,
      title: 'HIPAA Compliant',
      description: 'Enterprise-grade security with end-to-end encrypted patient data',
      color: 'red'
    },
  ];

  const stats = [
    { value: '33', label: 'Body Keypoints', icon: Activity },
    { value: '100%', label: 'Exercise Offline Model', icon: Wifi },
    { value: 'Free', label: 'Forever', icon: Heart },
    { value: '8+', label: 'Verified Exercises', icon: Target },
  ];

  const colorMap = {
    blue: 'from-blue-500 to-blue-600 shadow-blue-500/50',
    purple: 'from-purple-500 to-purple-600 shadow-purple-500/50',
    green: 'from-green-500 to-green-600 shadow-green-500/50',
    orange: 'from-orange-500 to-orange-600 shadow-orange-500/50',
    indigo: 'from-indigo-500 to-indigo-600 shadow-indigo-500/50',
    red: 'from-red-500 to-red-600 shadow-red-500/50',
  };


  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-gray-900' : 'bg-white'}`}>
      {/* Premium Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
        ? darkMode
          ? 'bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 shadow-2xl'
          : 'bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-xl'
        : 'bg-transparent'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Premium Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
              <div className="relative">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-2xl p-1.5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                  }`}>
                  <img src="/logo.png" alt="Gati" className="w-full h-full object-contain" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full border-2 border-white dark:border-gray-900 shadow-lg animate-pulse">
                  <Zap className="w-2.5 h-2.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div>
                <h1 className={`text-2xl font-black tracking-tighter ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  GATI<span className="text-blue-600">REHAB</span>
                </h1>
                <p className={`text-[8px] font-bold uppercase tracking-[0.3em] ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  Intelligence Lab
                </p>
              </div>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className={`p-3 rounded-xl transition-all duration-300 ${darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-5xl mx-auto">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                AI-Powered Physical Therapy Platform
              </span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>

            {/* Hero Title */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black mb-6 leading-none">
              <span className={darkMode ? 'text-white' : 'text-gray-900'}>Your Virtual</span>
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Rehab Assistant
              </span>
            </h1>

            {/* Tagline */}
            <div className="mb-6">
              <span className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-blue-600">
                Repeat nahi, adapt karega rehab
              </span>
            </div>

            {/* Hero Subtitle */}
            <p className={`text-xl sm:text-2xl mb-10 max-w-3xl mx-auto ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Optimize your recovery with real-time pose analysis using just your smartphone.
              <span className="font-bold text-blue-600"> No equipment needed.</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                onClick={() => navigate('/login', { state: { mode: 'signup' } })}
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl text-lg shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => { window.location.href = 'https://drive.google.com/file/d/1LY1GB5bhbkSJJmyyQ7wMInTpYldUeTS-/view?usp=drivesdk'; }}
                className={`group px-8 py-4 font-bold rounded-xl text-lg border-2 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 ${darkMode
                  ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                  : 'bg-white hover:bg-gray-50 text-gray-900 border-gray-300 shadow-xl'
                  }`}
              >
                <PlayCircle className="w-5 h-5" />
                Watch Video
              </button>
            </div>

            {/* Premium Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {stats.map((stat, i) => (
                <div
                  key={i}
                  className={`group p-6 rounded-2xl transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-gray-800/50 hover:bg-gray-800' : 'bg-gray-50 hover:bg-white hover:shadow-xl'
                    }`}
                >
                  <stat.icon className="w-8 h-8 mx-auto mb-3 text-blue-600 group-hover:scale-110 transition-transform" />
                  <p className={`text-3xl font-black mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                  <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features Grid */}
      <section className={`py-20 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl sm:text-5xl font-black mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Why Clinicians Choose Gati
            </h2>
            <p className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Enterprise-grade technology meets clinical excellence
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group p-8 rounded-3xl transition-all duration-500 hover:-translate-y-2 ${darkMode
                  ? 'bg-gray-800 hover:bg-gray-750 border border-gray-700'
                  : 'bg-white hover:shadow-2xl border border-gray-100'
                  }`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 bg-gradient-to-br shadow-lg ${colorMap[feature.color]}`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className={`text-xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {feature.title}
                </h3>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Premium CTA Section */}
      <section className={`py-20 ${darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 to-purple-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-4xl sm:text-5xl font-black mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Ready to Transform Recovery?
          </h2>
          <p className={`text-xl mb-10 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Join thousands of patients and clinicians already using Gati
          </p>
          <button
            onClick={() => navigate('/login', { state: { mode: 'signup' } })}
            className="group px-10 py-5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl text-xl shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 transform hover:-translate-y-1 inline-flex items-center gap-3"
          >
            Get Started Free
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>
          <p className={`text-sm mt-6 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
            No credit card required • Free forever • Cancel anytime
          </p>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className={`py-12 ${darkMode ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-900 text-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5">
                  <img src="/logo.png" alt="Gati" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h5 className="text-xl font-black text-white">GATI<span className="text-blue-600">REHAB</span></h5>
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-wider">Intelligence Lab</p>
                </div>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                AI-powered virtual rehabilitation assistant helping thousands recover faster with real-time feedback.
              </p>
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-900/30 border border-emerald-700/30 rounded-lg w-fit">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Open Source</span>
              </div>
            </div>

            <div>
              <h6 className="font-bold mb-4 text-white">Platform</h6>
              <ul className="space-y-2 text-gray-400">
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Patient Portal</button></li>
                <li><button onClick={() => navigate('/login')} className="hover:text-white transition-colors">Doctor Dashboard</button></li>
                <li><a href="https://github.com/Heal-gorithms/Gati-rehab" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub
                </a></li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold mb-4 text-white">Technology</h6>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="https://developers.google.com/mediapipe" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">MediaPipe AI <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://deepmind.google/technologies/gemini/" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">Google Gemini <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://firebase.google.com/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">Firebase Backend <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1.5">PWA Enabled <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400 mb-2">© 2026 Gati Rehab. Built with ❤️ for better health outcomes.</p>
            <p className="text-sm text-gray-500">
              Made by <a href="https://github.com/Heal-gorithms" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">Heal-gorithms</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;