import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme, SunsetTheme } from '../context/ThemeContext';
import { useAppLock } from '../context/AppLockContext';
import { SunsetButton } from '../components/SunsetButton';
import { SecurityToggle, PinInput } from '../components/SecurityToggle';
import { ConsentCard, PrivacyActionCard, DataExportButton, DeleteDataModal } from '../components/PrivacyComponents';
import { ArrowLeft, Sun, Palette, Lock, Shield, Eye, Trash2, LogOut, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, fetchWithAuth } = useAuth();
  const { theme, setTheme } = useTheme();
  const { pinEnabled, lockTimeout, refreshSettings } = useAppLock();

  // Profile states
  const [profile, setProfile] = useState<any>(null);
  const [coachTone, setCoachTone] = useState('Gentle');
  
  // Consents states
  const [aiPersonalization, setAiPersonalization] = useState(false);
  const [supportContent, setSupportContent] = useState(false);
  const [habitScore, setHabitScore] = useState(false);
  const [inspiration, setInspiration] = useState(false);

  // Security setup states
  const [isPinSetupOpen, setIsPinSetupOpen] = useState(false);
  const [pinCode, setPinCode] = useState('');
  const [confirmPinCode, setConfirmPinCode] = useState('');
  const [timeoutMinutes, setTimeoutMinutes] = useState(lockTimeout);

  // Deletion modals
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPurgingLogs, setIsPurgingLogs] = useState(false);
  const [isPurgingReflections, setIsPurgingReflections] = useState(false);
  const [isPurgingMessages, setIsPurgingMessages] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      // Profile
      const resProfile = await fetchWithAuth('/api/profile/me');
      if (resProfile.ok) {
        const data = await resProfile.json();
        setProfile(data);
        setCoachTone(data.coach_tone || 'Gentle');
      }

      // Consents
      const resConsents = await fetchWithAuth('/api/consents');
      if (resConsents.ok) {
        const data = await resConsents.json();
        setAiPersonalization(data.ai_personalization_consent);
        setSupportContent(data.support_content_consent);
        setHabitScore(data.habit_score_personalization_consent);
        setInspiration(data.inspiration_personalization_consent);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleUpdateProfile = async (updates: any) => {
    try {
      await fetchWithAuth('/api/profile/me', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      fetchSettings();
    } catch (err) { console.error(err); }
  };

  const handleUpdateConsents = async (updates: any) => {
    try {
      await fetchWithAuth('/api/consents', {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      fetchSettings();
    } catch (err) { console.error(err); }
  };

  const handlePinSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (pinCode.length !== 4 && pinCode.length !== 6) {
      setError("PIN must be exactly 4 or 6 digits.");
      return;
    }

    if (pinCode !== confirmPinCode) {
      setError("PIN codes do not match.");
      return;
    }

    try {
      const res = await fetchWithAuth('/api/security/pin/setup', {
        method: 'POST',
        body: JSON.stringify({ pin: pinCode })
      });

      if (res.ok) {
        setIsPinSetupOpen(false);
        setPinCode('');
        setConfirmPinCode('');
        confetti({ particleCount: 30, spread: 30 });
        refreshSettings();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to setup PIN.");
      }
    } catch (err) {
      setError("Connection error");
    }
  };

  const handleDisablePin = async () => {
    const password = window.prompt("Enter your account password to disable PIN lock protection:");
    if (!password) return;

    try {
      const res = await fetchWithAuth('/api/security/pin/disable', {
        method: 'POST',
        body: JSON.stringify({ password })
      });

      if (res.ok) {
        alert("PIN security lock disabled.");
        refreshSettings();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to disable PIN.");
      }
    } catch (err) { console.error(err); }
  };

  const handleTimeoutChange = async (minutes: number) => {
    setTimeoutMinutes(minutes);
    try {
      await fetchWithAuth('/api/security/settings', {
        method: 'PUT',
        body: JSON.stringify({ lock_timeout_minutes: minutes })
      });
      refreshSettings();
    } catch (err) { console.error(err); }
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    try {
      window.open(`/api/privacy/export?format=${format}`, '_blank');
    } catch (err) { console.error(err); }
  };

  const handlePurgeReflections = async () => {
    if (!window.confirm("This will permanently erase all journal reflections text and mood logs. Continue?")) return;
    setIsPurgingReflections(true);
    try {
      const res = await fetchWithAuth('/api/privacy/delete-reflections', { method: 'DELETE' });
      if (res.ok) alert("Personal reflections deleted.");
    } finally {
      setIsPurgingReflections(false);
    }
  };

  const handlePurgeLogs = async () => {
    if (!window.confirm("This will delete all completed habit logs and reset streaks. Continue?")) return;
    setIsPurgingLogs(true);
    try {
      const res = await fetchWithAuth('/api/privacy/delete-habit-logs', { method: 'DELETE' });
      if (res.ok) alert("Habit logs cleared and streaks reset.");
    } finally {
      setIsPurgingLogs(false);
    }
  };

  const handlePurgeMessages = async () => {
    if (!window.confirm("This will delete all Tiny Coach chat logs. Continue?")) return;
    setIsPurgingMessages(true);
    try {
      const res = await fetchWithAuth('/api/privacy/delete-coach-messages', { method: 'DELETE' });
      if (res.ok) alert("Coach history cleared.");
    } finally {
      setIsPurgingMessages(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const res = await fetchWithAuth('/api/privacy/delete-account', { method: 'DELETE' });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        logout();
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const themeList: { name: SunsetTheme; label: string; bg: string; text: string }[] = [
    { name: 'sunset', label: 'Coral Sunset', bg: 'bg-[#FDFBF7]', text: 'text-[#3A1C30]' },
    { name: 'peach', label: 'Soft Peach', bg: 'bg-[#FFEBD6]', text: 'text-[#4A2D1D]' },
    { name: 'plum', label: 'Deep Plum', bg: 'bg-[#3A1C30]', text: 'text-[#FDFBF7]' },
    { name: 'cream', label: 'Warm Cream', bg: 'bg-[#FAF8F5]', text: 'text-[#2C1F16]' }
  ];

  return (
    <div className="min-h-screen bg-theme-bg p-6 pb-24 fade-in">
      <header className="max-w-md mx-auto flex items-center justify-between py-4 border-b border-theme-border border-opacity-45">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/today')} 
            className="text-theme-muted hover:text-theme-text transition-colors p-1"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-extrabold text-theme-text">Settings</h1>
        </div>

        <button
          onClick={() => logout().then(() => navigate('/'))}
          className="text-theme-muted hover:text-rose p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-bold"
        >
          Logout <LogOut size={14} />
        </button>
      </header>

      <main className="max-w-md mx-auto mt-6 space-y-6">
        
        {/* Theme customization */}
        <div className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-coral bg-peach bg-opacity-25 p-2 rounded-xl"><Palette size={16} /></span>
            <span className="text-xs font-bold text-theme-text uppercase tracking-wider">Aesthetic Theme</span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {themeList.map(t => (
              <button
                key={t.name}
                onClick={() => setTheme(t.name)}
                className={`p-3.5 rounded-xl border text-left text-xs font-bold transition-all flex items-center justify-between
                  ${theme === t.name 
                    ? 'border-coral ring-1 ring-coral shadow-soft-peach' 
                    : 'border-theme-border'
                  } ${t.bg} ${t.text}`}
              >
                <span>{t.label}</span>
                {theme === t.name && <Check size={14} className="text-coral stroke-[3.5]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Coach Voice Selection */}
        <div className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-3">
          <span className="text-xs font-bold text-theme-text block">Tiny Coach Voice Tone</span>
          <select
            value={coachTone}
            onChange={e => {
              setCoachTone(e.target.value);
              handleUpdateProfile({ coachTone: e.target.value });
            }}
            className="w-full text-xs p-3.5 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
          >
            <option value="Gentle">Gentle</option>
            <option value="Motivational">Motivational</option>
            <option value="Spiritual">Spiritual / Faith-aligned</option>
            <option value="Practical">Practical</option>
            <option value="Calm">Calm</option>
          </select>
        </div>

        {/* Security / PIN locking configuration */}
        <div className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-coral bg-peach bg-opacity-25 p-2 rounded-xl"><Lock size={16} /></span>
            <span className="text-xs font-bold text-theme-text uppercase tracking-wider">Security App Lock</span>
          </div>

          <SecurityToggle
            label="Use PIN lock protection"
            checked={pinEnabled}
            onChange={(checked) => {
              if (checked) setIsPinSetupOpen(true);
              else handleDisablePin();
            }}
            description="Protect my personal notes with a passcode"
          />

          {pinEnabled && (
            <div className="space-y-4 pt-3 border-t border-theme-border border-opacity-40">
              {/* Timeout picker */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-theme-text">Lock when inactive for:</span>
                <select
                  value={timeoutMinutes}
                  onChange={e => handleTimeoutChange(parseInt(e.target.value))}
                  className="text-xs font-bold p-2 rounded-lg border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                >
                  <option value={0}>Immediately</option>
                  <option value={1}>1 minute</option>
                  <option value={5}>5 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                </select>
              </div>

              <SunsetButton
                variant="outline"
                size="sm"
                onClick={() => setIsPinSetupOpen(true)}
                className="w-full text-xs font-bold"
              >
                Change PIN Passcode
              </SunsetButton>
            </div>
          )}
        </div>

        {/* Dynamic PIN Setup form modal */}
        {isPinSetupOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum bg-opacity-40 backdrop-blur-sm">
            <form onSubmit={handlePinSetup} className="bg-theme-card border border-theme-border rounded-3xl w-full max-w-sm p-6 shadow-premium space-y-4">
              <span className="text-sm font-extrabold text-theme-text block border-b border-theme-border pb-2">Set PIN Lock</span>

              {error && <p className="text-xs text-rose font-bold text-center">{error}</p>}

              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Enter 4 or 6 digit PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1.5em] text-lg font-bold p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Confirm PIN</label>
                <input
                  type="password"
                  maxLength={6}
                  value={confirmPinCode}
                  onChange={e => setConfirmPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[1.5em] text-lg font-bold p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                />
              </div>

              <div className="flex gap-3">
                <SunsetButton type="button" variant="outline" className="flex-1" onClick={() => setIsPinSetupOpen(false)}>Cancel</SunsetButton>
                <SunsetButton type="submit" variant="primary" className="flex-1">Save PIN</SunsetButton>
              </div>
            </form>
          </div>
        )}

        {/* Privacy Consents section */}
        <div className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-coral bg-peach bg-opacity-25 p-2 rounded-xl"><Shield size={16} /></span>
            <span className="text-xs font-bold text-theme-text uppercase tracking-wider">Privacy Preferences</span>
          </div>

          <div className="space-y-3">
            <ConsentCard
              label="Personalize Tiny Coach suggestions"
              description="Uses habit statistics to offer behavior change patterns. reflections remain private."
              checked={aiPersonalization}
              onChange={(c) => {
                setAiPersonalization(c);
                handleUpdateConsents({ ai_personalization_consent: c });
              }}
            />

            <ConsentCard
              label="Allow support links suggestions"
              description="Aligns external YouTube/Spotify resources based on category clicks."
              checked={supportContent}
              onChange={(c) => {
                setSupportContent(c);
                handleUpdateConsents({ support_content_consent: c });
              }}
            />

            <ConsentCard
              label="Align quotes to my preferences"
              description="Respects religious or calm options selected in quote recommendations."
              checked={inspiration}
              onChange={(c) => {
                setInspiration(c);
                handleUpdateConsents({ inspiration_personalization_consent: c });
              }}
            />
          </div>
        </div>

        {/* Exporter Block */}
        <DataExportButton onExport={handleExportData} />

        {/* Purging & deleting actions */}
        <div className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-rose bg-rose bg-opacity-10 p-2 rounded-xl text-rose"><Trash2 size={16} /></span>
            <span className="text-xs font-bold text-theme-text uppercase tracking-wider">Erasing Personal Logs</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <PrivacyActionCard
              title="Delete Reflections Notes"
              description="Erases written logs diary notes and mood parameters but preserves streak numbers."
              actionLabel="Delete Notes"
              onAction={handlePurgeReflections}
              loading={isPurgingReflections}
            />

            <PrivacyActionCard
              title="Erase Habit Logs history"
              description="Clears all completion boxes completely. Streaks reset to 0."
              actionLabel="Reset History"
              onAction={handlePurgeLogs}
              loading={isPurgingLogs}
            />

            <PrivacyActionCard
              title="Delete Tiny Coach messages"
              description="Erases the history logs of AI advice in your chat directory."
              actionLabel="Delete Chat History"
              onAction={handlePurgeMessages}
              loading={isPurgingMessages}
            />
          </div>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full mt-4 py-3 border border-rose border-opacity-35 text-rose hover:bg-rose hover:text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
          >
            Delete Account Permanently
          </button>
        </div>

      </main>

      {/* Account Deletion warning popup */}
      <DeleteDataModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
        loading={isDeletingAccount}
      />
    </div>
  );
};
