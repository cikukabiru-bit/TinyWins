import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SunsetButton } from '../components/SunsetButton';
import { ConsentCard } from '../components/PrivacyComponents';
import { Sun, User, Lock, Mail, AlertCircle } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Consents states
  const [dataStorage, setDataStorage] = useState(true);
  const [aiPersonalization, setAiPersonalization] = useState(false);
  const [supportContent, setSupportContent] = useState(false);
  const [habitScore, setHabitScore] = useState(false);
  const [inspiration, setInspiration] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    const isEmail = emailOrPhone.includes('@');
    const payload = {
      name,
      email: isEmail ? emailOrPhone : undefined,
      phone: !isEmail ? emailOrPhone : undefined,
      password,
      confirmPassword,
      dataStorageConsent: dataStorage,
      aiPersonalizationConsent: aiPersonalization,
      supportContentConsent: supportContent,
      habitScoreConsent: habitScore,
      inspirationConsent: inspiration
    };

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        login(data.token, data.user);
        navigate('/onboarding');
      } else {
        setError(data.error || "Failed to create account. Please check your inputs.");
      }
    } catch (err) {
      setError("Connection failure. Please check your network and try again.");
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
        <span className="text-sm font-black tracking-wider text-theme-text uppercase">Register</span>
      </header>

      <main className="max-w-md mx-auto w-full flex-1 my-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-theme-text tracking-tight">Begin Softly</h2>
          <p className="text-xs text-theme-muted">Create an account to start tracking small wins.</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose bg-opacity-10 border border-rose border-opacity-30 rounded-2xl flex items-start gap-2 text-rose text-xs font-semibold">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1.5">First name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-theme-border bg-theme-card text-theme-text placeholder-theme-muted focus:border-peach focus:ring-1 focus:ring-peach focus:outline-none transition-all"
              />
            </div>
          </div>

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
                placeholder="name@example.com or phone"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-theme-border bg-theme-card text-theme-text placeholder-theme-muted focus:border-peach focus:ring-1 focus:ring-peach focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1.5">Create password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-theme-border bg-theme-card text-theme-text placeholder-theme-muted focus:border-peach focus:ring-1 focus:ring-peach focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1.5">Confirm password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-theme-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full text-xs pl-10 pr-4 py-3 rounded-xl border border-theme-border bg-theme-card text-theme-text placeholder-theme-muted focus:border-peach focus:ring-1 focus:ring-peach focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Privacy Consents Section */}
          <div className="pt-4 border-t border-theme-border border-opacity-60 space-y-3">
            <span className="text-xs font-bold text-theme-text block mb-2">Privacy & Consent preferences</span>
            
            <ConsentCard
              label="I agree to create an account and store data"
              description="Required to securely hold and sync your personal habit logs."
              checked={dataStorage}
              onChange={setDataStorage}
              required={true}
            />

            <ConsentCard
              label="Personalize Tiny Coach suggestions (Optional)"
              description="Allows the AI coach to read habit completion patterns and tone preferences to generate gentle customized advice."
              checked={aiPersonalization}
              onChange={setAiPersonalization}
            />

            <ConsentCard
              label="Use categories for support recommendations (Optional)"
              description="Suggests helpful YouTube stretching videos or Spotify focus playlists matching active habits."
              checked={supportContent}
              onChange={setSupportContent}
            />

            <ConsentCard
              label="Personalize microhabits based on scores (Optional)"
              description="Converts weak/inconsistent assessed scores to custom low-friction starting points."
              checked={habitScore}
              onChange={setHabitScore}
            />

            <ConsentCard
              label="Include inspiration and quote preferences (Optional)"
              description="Filters quotes and reflections based on your calm/spiritual preferences."
              checked={inspiration}
              onChange={setInspiration}
            />
          </div>

          <SunsetButton type="submit" variant="primary" loading={loading} className="w-full py-3 mt-6">
            Begin My Growth
          </SunsetButton>
        </form>
      </main>

      <footer className="max-w-md mx-auto w-full text-center pb-6">
        <span className="text-xs text-theme-muted">
          Already have an account?{' '}
          <button 
            onClick={() => navigate('/login')} 
            className="font-bold text-coral hover:text-coral-dark hover:underline"
          >
            Sign in
          </button>
        </span>
      </footer>
    </div>
  );
};
