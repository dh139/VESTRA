import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShieldCheck, LogIn, Sparkles, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '';

  const { login, register, googleLogin, user, error, loading } = useAuthStore();

  const [mode, setMode] = useState('login'); // 'login' or 'register'
  
  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register Form States
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  // Check if already logged in, redirect
  useEffect(() => {
    if (user) {
      if (redirectPath) {
        navigate(`/${redirectPath}`);
      } else {
        navigate(user.role === 'admin' ? '/admin' : '/profile');
      }
    }
  }, [user, redirectPath, navigate]);

  // Load Google Identity Services SDK dynamically
  useEffect(() => {
    const existingScript = document.getElementById('google-jssdk');
    if (existingScript) {
      if (window.google) {
        initializeGoogleSignIn();
      }
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-jssdk';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      initializeGoogleSignIn();
    };
    document.body.appendChild(script);

    return () => {
      // Keep script cached in body for subsequent loads
    };
  }, []);

  const initializeGoogleSignIn = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('VITE_GOOGLE_CLIENT_ID environment variable is missing.');
      return;
    }
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleCredentialResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn-container'),
        { 
          theme: 'outline', 
          size: 'large', 
          shape: 'pill', 
          width: '350', // centered button matching Vestra's visual theme
          text: 'signin_with',
          logo_alignment: 'left'
        }
      );
    }
  };

  const handleGoogleCredentialResponse = async (response) => {
    setLocalError('');
    const res = await googleLogin(response.credential);
    if (res && !res.success) {
      setLocalError(res.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (mode === 'login') {
      const res = await login(email, password);
      if (res && !res.success) {
        setLocalError(res.message);
      }
    } else {
      if (password !== confirmPassword) {
        setLocalError('Passwords do not match.');
        return;
      }
      const res = await register(name, email, password);
      if (res && !res.success) {
        setLocalError(res.message);
      }
    }
  };



  return (
    <div className="max-w-md mx-auto px-6 pt-32 pb-20 space-y-8 animate-[scale-up_0.3s_ease-out]">
      <div className="text-center space-y-2">
        <span className="font-display text-3xl font-extrabold tracking-tight text-pine block">VESTRA</span>
        <h1 className="font-display font-bold text-lg text-ink uppercase tracking-wider">
          {mode === 'login' ? 'Welcome Back' : 'Create Label Profile'}
        </h1>
        <p className="text-xs text-ink/50 leading-relaxed font-medium">
          Access your wishlist capsule, addresses, and track order histories.
        </p>
      </div>

      <div className="bg-bone border border-mist rounded-3xl p-6 md:p-8 space-y-6 shadow-soft">
        {/* Toggle Mode headers */}
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-bold uppercase tracking-wider border-b border-mist pb-0.5">
          <button 
            onClick={() => { setMode('login'); setLocalError(''); }} 
            className={`pb-3 border-b-2 px-1 ${mode === 'login' ? 'border-pine text-pine' : 'border-transparent text-ink/40'}`}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setMode('register'); setLocalError(''); }} 
            className={`pb-3 border-b-2 px-1 ${mode === 'register' ? 'border-pine text-pine' : 'border-transparent text-ink/40'}`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-ink/50">Full Name</label>
              <input 
                type="text" 
                required 
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" 
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-ink/50">Email Address</label>
            <input 
              type="email" 
              required 
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" 
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-ink/50">Password</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" 
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-ink/50">Confirm Password</label>
              <input 
                type="password" 
                required 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-mist/20 border border-mist rounded-full py-2.5 px-4 focus:outline-none" 
              />
            </div>
          )}

          {(localError || error) && (
            <div className="p-3 bg-signal/5 border border-signal/15 rounded-xl flex gap-2 text-signal">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localError || error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pine text-bone font-bold uppercase rounded-full hover:bg-pine/90 flex items-center justify-center gap-1.5 disabled:opacity-40"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Verifying...' : mode === 'login' ? 'Sign In' : 'Register Profile'}</span>
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-mist"></div>
          <span className="flex-shrink mx-4 text-[9px] font-bold text-ink/30 uppercase tracking-widest">Or Federated</span>
          <div className="flex-grow border-t border-mist"></div>
        </div>

        {/* Real Google OAuth Sign in Button */}
        <div className="flex justify-center w-full min-h-[44px]">
          <div id="google-signin-btn-container" className="w-full flex justify-center" />
        </div>

        <div className="text-center text-[10px] text-ink/50 leading-relaxed font-semibold">
          <p>By authentication, you agree to VESTRA label terms and shipping return policies.</p>
        </div>
      </div>
    </div>
  );
}
