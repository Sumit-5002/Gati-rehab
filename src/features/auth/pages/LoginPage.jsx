import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowLeft, Activity, Stethoscope, Eye, EyeOff } from 'lucide-react';
import {
  loginWithEmail,
  loginWithGoogle,
  setupRecaptcha,
  sendPhoneOTP,
  verifyPhoneOTP,
  resetPassword,
  DEMO_CREDENTIALS,
} from '../services/authService';

// Updated Input to handle disabled state styling
const Input = ({ icon, type, placeholder, value, onChange, id, name, className = '', ringColor, textColor, suffix, ...props }) => (
  <div className="relative group">
    {icon && (
      <div className={`absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors ${textColor === 'text-blue-600' ? 'group-focus-within:text-blue-600' : 'group-focus-within:text-teal-600'}`}>
        {icon}
      </div>
    )}
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full ${icon ? 'pl-11' : 'px-4'} ${suffix ? 'pr-12' : 'pr-4'} py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-opacity-20 focus:border-transparent outline-none transition-all font-medium text-slate-800 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-100 ${ringColor} ${className}`}
      {...props}
      required
    />
    {suffix && (
      <div className="absolute right-4 top-1/2 -translate-y-1/2">
        {suffix}
      </div>
    )}
  </div>
);

const PrimaryButton = ({ loading, text, bgColor, bgHoverColor }) => (
  <button
    type="submit"
    disabled={loading}
    className={`w-full py-3.5 ${bgColor} ${bgHoverColor} disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-gray-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
  >
    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : text}
  </button>
);

const LoginPage = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState('patient'); // 'patient' or 'doctor'
  const [authMode, setAuthMode] = useState('email'); // 'email', 'phone', 'forgot'

  // Dynamic Theme Colors based on userType
  const bgColor = userType === 'patient' ? 'bg-blue-600' : 'bg-teal-600';
  const bgHoverColor = userType === 'patient' ? 'hover:bg-blue-700' : 'hover:bg-teal-700';
  const textColor = userType === 'patient' ? 'text-blue-600' : 'text-teal-600';
  const ringColor = userType === 'patient' ? 'focus:ring-blue-500' : 'focus:ring-teal-500';
  const gradient = userType === 'patient'
    ? 'from-blue-50 via-indigo-50 to-white'
    : 'from-teal-50 via-emerald-50 to-white';

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // Control states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [resetSent, setResetSent] = useState(false);

  // Clear errors when switching modes
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [userType, authMode]);

  // Navigation Logic
  const handleAuthRedirect = (userData) => {
    if (userData?.userType === 'doctor') navigate('/doctor-dashboard');
    else navigate('/patient-dashboard');
  };

  // Handlers
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      const { userData } = await loginWithEmail(email, password);
      handleAuthRedirect(userData);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleGoogleLogin = async () => {
    if (loading) return;
    setError(''); setLoading(true);
    try {
      const { userData } = await loginWithGoogle();
      handleAuthRedirect(userData);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      const recaptchaVerifier = setupRecaptcha('recaptcha-container');
      const result = await sendPhoneOTP(phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setSuccess('OTP sent successfully!');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      const { userData } = await verifyPhoneOTP(confirmationResult, otp);
      handleAuthRedirect(userData);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      await resetPassword(resetEmail);
      setResetSent(true);
      setSuccess('Reset link sent to your email.');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const fillDemoCredentials = () => {
    if (loading) return;
    const creds = userType === 'doctor' ? DEMO_CREDENTIALS.doctor : DEMO_CREDENTIALS.patient;
    setEmail(creds.email);
    setPassword(creds.password);
    setSuccess('Demo credentials applied.');
  };

  const resetToEmail = () => {
    if (loading) return;
    setAuthMode('email'); setError(''); setSuccess('');
    setOtpSent(false); setResetSent(false);
  };

  return (
    <main className={`min-h-screen bg-gradient-to-br ${gradient} flex items-center justify-center p-4 sm:p-6 font-sans transition-colors duration-500`}>
      <div className="bg-white rounded-[2rem] shadow-2xl max-w-[28rem] w-full overflow-hidden border border-slate-100">

        {/* Header Section with Dynamic Branding */}
        <div className="pt-8 pb-6 px-8 text-center bg-white relative">
          <button
            onClick={() => navigate('/')}
            className="absolute left-6 top-6 p-2 rounded-xl text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-6">
            <div className={`p-3 rounded-2xl ${userType === 'patient' ? 'bg-blue-50' : 'bg-teal-50'} transition-colors duration-300`}>
              <img src="/logo.png" alt="Gati Logo" className="w-16 h-16 object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">
            GATI<span className={`${textColor} transition-colors duration-300`}>REHAB</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
            {userType === 'patient' ? 'Patient Recovery Portal' : 'Professional Clinical Suite'}
          </p>
        </div>

        {/* User Type Toggles - Distinct Visuals */}
        <div className="px-8 mb-6">
          <div className="flex bg-slate-100 p-1 rounded-xl relative">
            {/* Sliding Background */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white shadow-sm transition-all duration-300 ease-in-out ${userType === 'patient' ? 'left-1' : 'translate-x-full left-1'}`}
            ></div>

            <button
              onClick={() => setUserType('patient')}
              disabled={loading}
              className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors duration-300 ${userType === 'patient' ? 'text-blue-700' : 'text-slate-600 hover:text-slate-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-pressed={userType === 'patient'}
              aria-label="Select Patient login"
            >
              <User className="w-4 h-4" />
              Patient
            </button>
            <button
              onClick={() => setUserType('doctor')}
              disabled={loading}
              className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-colors duration-300 ${userType === 'doctor' ? 'text-teal-700' : 'text-slate-600 hover:text-slate-800'} disabled:opacity-50 disabled:cursor-not-allowed`}
              aria-pressed={userType === 'doctor'}
              aria-label="Select Doctor login"
            >
              <Stethoscope className="w-4 h-4" />
              Doctor
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="px-8 pb-10">
          {authMode === 'email' && (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

              <form onSubmit={handleEmailLogin} className="space-y-4">
                <Input
                  icon={<Mail className="w-5 h-5" />}
                  type="email"
                  id="login-email"
                  name="email"
                  placeholder={userType === 'patient' ? "patient@example.com" : "doctor@hospital.com"}
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                  ringColor={ringColor}
                  textColor={textColor}
                  disabled={loading}
                />

                <div>
                  <Input
                    icon={<Lock className="w-5 h-5" />}
                    type={showPassword ? 'text' : 'password'}
                    id="login-password"
                    name="password"
                    placeholder="Password"
                    value={password}
                    onChange={setPassword}
                    autoComplete="current-password"
                    ringColor={ringColor}
                    textColor={textColor}
                    disabled={loading}
                    suffix={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    }
                  />
                  <div className="text-right mt-1.5">
                    <button
                      type="button"
                      onClick={() => setAuthMode('forgot')}
                      disabled={loading}
                      className={`text-xs font-bold ${textColor} hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-sm text-red-600 font-medium animate-shake">
                    <Activity className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <PrimaryButton loading={loading} text={userType === 'patient' ? 'Start Recovery' : 'Access Dashboard'} bgColor={bgColor} bgHoverColor={bgHoverColor} />
              </form>

              {/* Enhanced Divider */}
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Social Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="flex items-center justify-center gap-2.5 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100"
                  aria-label="Sign in with Google"
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="" />
                  <span className="text-sm">Google</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('phone')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2.5 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:active:scale-100"
                >
                  <Activity className="w-5 h-5 text-slate-400" />
                  <span className="text-sm">Phone</span>
                </button>
              </div>
            </div>
          )}

          {/* Other modes: Phone & Forgot (kept simple but matching theme) */}
          {(authMode === 'phone' || authMode === 'forgot') && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <button
                type="button"
                onClick={resetToEmail}
                disabled={loading}
                className={`flex items-center gap-2 text-sm font-bold ${textColor} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>

              {authMode === 'phone' && (
                !otpSent ? (
                  <form onSubmit={handleSendOTP} className="space-y-4">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-slate-800">Mobile Sign In</h3>
                      <p className="text-slate-500 text-sm">We'll send a verification code to your phone.</p>
                    </div>
                    <Input
                      type="tel"
                      id="phone-number"
                      name="phone"
                      placeholder="+91 9999999999"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                      className="text-center text-lg tracking-wide"
                      autoComplete="tel"
                      ringColor={ringColor}
                      textColor={textColor}
                      disabled={loading}
                    />
                    <div id="recaptcha-container" className="flex justify-center"></div>
                    {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
                    <PrimaryButton loading={loading} text="Send One-Time Password" bgColor={bgColor} bgHoverColor={bgHoverColor} />
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-slate-800">Verify Number</h3>
                      <p className="text-slate-500 text-sm">Enter the code sent to {phoneNumber}</p>
                    </div>
                    <Input
                      type="text"
                      id="otp-code"
                      name="otp"
                      placeholder="123456"
                      value={otp}
                      onChange={setOtp}
                      className="text-center text-2xl tracking-[0.5em] font-mono"
                      maxLength="6"
                      autoComplete="one-time-code"
                      ringColor={ringColor}
                      textColor={textColor}
                      disabled={loading}
                    />
                    {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
                    <PrimaryButton loading={loading} text="Verify & Login" bgColor={bgColor} bgHoverColor={bgHoverColor} />
                  </form>
                )
              )}

              {authMode === 'forgot' && (
                !resetSent ? (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="text-center mb-2">
                      <h3 className="text-lg font-bold text-slate-800">Reset Password</h3>
                      <p className="text-slate-500 text-sm">Enter your email to receive recovery instructions.</p>
                    </div>
                    <Input
                      icon={<Mail className="w-5 h-5" />}
                      type="email"
                      id="reset-email"
                      name="resetEmail"
                      placeholder="Recovery Email"
                      value={resetEmail}
                      onChange={setResetEmail}
                      autoComplete="email"
                      ringColor={ringColor}
                      textColor={textColor}
                      disabled={loading}
                    />
                    {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
                    <PrimaryButton loading={loading} text="Send Recovery Link" bgColor={bgColor} bgHoverColor={bgHoverColor} />
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Check your inbox</h3>
                    <p className="text-slate-500 text-sm mb-6">{success}</p>
                    <button onClick={resetToEmail} disabled={loading} className={`w-full py-3 rounded-xl font-bold text-white ${bgColor} ${bgHoverColor} disabled:opacity-50 disabled:cursor-not-allowed`}>Return to Login</button>
                  </div>
                )
              )}
            </div>
          )}

          {/* Quick Demo Link */}
          <div className="mt-8 text-center">
            <button onClick={fillDemoCredentials} disabled={loading} className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Fill form with demo credentials for testing">
              Activate Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;