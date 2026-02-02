// LandingPage - Public splash/marketing page
// This is the first page visitors see before logging in

import { useNavigate } from 'react-router-dom';
import { Activity, Smartphone, Wifi, Brain, Heart, TrendingUp, CheckCircle } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Tracking',
      description: 'Real-time pose detection using advanced MediaPipe technology',
    },
    {
      icon: Smartphone,
      title: 'Just Your Phone',
      description: 'No special equipment needed - use your smartphone camera',
    },
    {
      icon: Wifi,
      title: 'Works Offline',
      description: 'Continue your therapy sessions even without internet',
    },
    {
      icon: TrendingUp,
      title: 'Track Progress',
      description: 'Monitor your recovery with detailed charts and insights',
    },
  ];

  const benefits = [
    'Real-time form correction',
    'Personalized exercise routines',
    'Doctor-monitored progress',
    'Sync across all devices',
    'HIPAA compliant & secure',
    'Free to use',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Gati Rehab</h1>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Login / Sign Up
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Heart className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Physical Therapy</span>
          </div>
          
          <h2 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Your Virtual Rehab
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Assistant
            </span>
          </h2>
          
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Get real-time feedback on your physical therapy exercises using just your smartphone camera. 
            No equipment needed. Works offline.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg shadow-lg transition-transform transform hover:scale-105"
            >
              Get Started Free
            </button>
            <button
              onClick={() => {
                const featuresSection = document.getElementById('features');
                featuresSection?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-4 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl text-lg shadow-lg border-2 border-gray-200 transition-transform transform hover:scale-105"
            >
              Learn More
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
            <div>
              <p className="text-4xl font-bold text-blue-600">100%</p>
              <p className="text-sm text-gray-600 mt-1">Offline Capable</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">33</p>
              <p className="text-sm text-gray-600 mt-1">Body Keypoints</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-blue-600">Free</p>
              <p className="text-sm text-gray-600 mt-1">Forever</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Gati?
            </h3>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Advanced technology meets simple, effective rehabilitation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h3>
            <p className="text-lg text-gray-600">Simple steps to better recovery</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Sign Up</h4>
              <p className="text-gray-600">
                Create your account as a patient or doctor in seconds
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Start Session</h4>
              <p className="text-gray-600">
                Position your camera and begin your exercise routine
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">Get Feedback</h4>
              <p className="text-gray-600">
                Receive real-time corrections and track your progress
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Everything You Need for Successful Recovery
              </h3>
              <p className="text-lg text-gray-600 mb-8">
                Gati combines cutting-edge AI technology with proven physical therapy techniques 
                to help you recover faster and more effectively.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl p-8 lg:p-12">
              <div className="bg-white rounded-xl p-6 shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="w-8 h-8 text-blue-600" />
                  <h4 className="text-xl font-bold text-gray-900">Ready to Start?</h4>
                </div>
                <p className="text-gray-600 mb-6">
                  Join thousands of patients already improving their recovery with Gati
                </p>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  Sign Up Now - It's Free
                </button>
                <p className="text-xs text-gray-500 text-center mt-4">
                  No credit card required • Works on all devices
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-6 h-6" />
                <h5 className="text-xl font-bold">Gati Rehab</h5>
              </div>
              <p className="text-gray-400">
                AI-powered virtual rehabilitation assistant for better recovery outcomes
              </p>
            </div>

            <div>
              <h6 className="font-bold mb-4">Quick Links</h6>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">
                    Login
                  </button>
                </li>
                <li>
                  <button onClick={() => navigate('/login')} className="hover:text-white transition-colors">
                    Sign Up
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h6 className="font-bold mb-4">Technology</h6>
              <ul className="space-y-2 text-gray-400">
                <li>MediaPipe AI</li>
                <li>Firebase Backend</li>
                <li>PWA Enabled</li>
                <li>100% Offline</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2026 Gati Rehab. Built with ❤️ for better health outcomes.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
