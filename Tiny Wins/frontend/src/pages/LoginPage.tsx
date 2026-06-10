import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SunsetButton } from '../components/SunsetButton';
import { Sun, Key, Mail, RefreshCw, AlertCircle } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrPhone, password, rememberDevice })
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        // Check if onboarding completed by querying profile
        const profileRes = await fetch('/api/profile/me', {
          headers: { 'Authorization': `Bearer ${data.token}` }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          if (profile && profile.onboarding_completed) {
            navigate('/today');
          } else {
            navigate('/onboarding');
          }
        } else {
          navigate('/onboarding');
        }
      } else {
        setError(data.error || "Failed to log in. Please check your credentials.");
      }
    } catch (err) {
      setError("Failed to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-theme-bg p-6 fade-in">
      <header className="flex items-center gap-2 max-w-md mx-auto w-full pt-4">
        <div 
          onClick={() => navigate('/')} 
          className="bg-peach rounded-xl p-2 text-orange cursor-pointer hover:scale-105 active:scale-95 transition-all"
        >
          <Sun size={18} />
        </div>
        <span className="text-sm font-black tracking-wider text-theme-text uppercase">Login</span>
      </header>

      <main className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center my-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-theme-text tracking-tight">Welcome Back</h2>
          <p className="text-xs text-theme-muted">Sign in gently to continue your journey.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose bg-opacity-10 border border-rose border-opacity-30 rounded-2xl flex items-start gap-2 text-rose text-xs font-semibold">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1.5">Email or phone number</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted">
                <Mail size={16} />
              </span>
              <input
                type="text"
                required
                value={emailOrPhone}
                onChange={e => setEmailOrPhone(e.target.value)}
                placeholder="name@example.com or phone number"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-theme-border bg-theme-card text-theme-text placeholder-theme-muted focus:border-peach focus:ring-1 focus:ring-peach focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1.5">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted">
                <Key size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-theme-border bg-theme-card text-theme-text placeholder-theme-muted focus:border-peach focus:ring-1 focus:ring-peach focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-1 select-none">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-theme-muted">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={e => setRememberDevice(e.target.checked)}
                className="rounded text-coral focus:ring-coral w-4 h-4 border-theme-border"
              />
              Remember this device
            </label>
            <button
              type="button"
              onClick={() => navigate('/password-reset')}
              className="text-xs font-semibold text-coral hover:text-coral-dark hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <SunsetButton type="submit" variant="primary" loading={loading} className="w-full py-3 mt-4">
            Sign In Gently
          </SunsetButton>
        </form>
      </main>

      <footer className="max-w-md mx-auto w-full text-center pb-6">
        <span className="text-xs text-theme-muted">
          New to TinyWins?{' '}
          <button 
            onClick={() => navigate('/register')} 
            className="font-bold text-coral hover:text-coral-dark hover:underline"
          >
            Create an account
          </button>
        </span>
      </footer>
    </div>
  );
};
