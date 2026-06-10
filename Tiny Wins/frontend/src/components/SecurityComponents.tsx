import React, { useState, useEffect } from 'react';
import { Lock, Fingerprint, Delete, AlertCircle } from 'lucide-react';
import { useAppLock } from '../context/AppLockContext';

// ==========================================
// SECURITY TOGGLE COMPONENT
// ==========================================
interface SecurityToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

export const SecurityToggle: React.FC<SecurityToggleProps> = ({
  label,
  checked,
  onChange,
  description
}) => {
  return (
    <div className="flex items-start justify-between py-3 border-b border-theme-border border-opacity-50 last:border-0">
      <div className="flex-1 pr-4">
        <label className="text-sm font-semibold text-theme-text">{label}</label>
        {description && <p className="text-xs text-theme-muted mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none
          ${checked ? 'bg-coral' : 'bg-theme-border'}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
};

// ==========================================
// PIN INPUT DOTS COMPONENT
// ==========================================
interface PinInputProps {
  length: number;
  value: string;
}

export const PinInput: React.FC<PinInputProps> = ({ length, value }) => {
  return (
    <div className="flex justify-center items-center gap-4 py-6">
      {Array.from({ length }).map((_, index) => {
        const isActive = index < value.length;
        return (
          <div
            key={index}
            className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200
              ${isActive 
                ? 'bg-coral border-coral scale-110 shadow-soft-coral' 
                : 'border-theme-muted border-opacity-40 bg-transparent'
              }`}
          />
        );
      })}
    </div>
  );
};

// ==========================================
// BIOMETRIC UNLOCK BUTTON
// ==========================================
interface BiometricUnlockButtonProps {
  onUnlock: () => void;
}

export const BiometricUnlockButton: React.FC<BiometricUnlockButtonProps> = ({ onUnlock }) => {
  return (
    <button
      onClick={onUnlock}
      className="flex flex-col items-center justify-center p-4 rounded-2xl border border-theme-border border-opacity-60 bg-theme-card hover:bg-peach-light hover:border-peach transition-all active:scale-95 gap-2"
    >
      <Fingerprint size={32} className="text-coral" />
      <span className="text-xs font-semibold text-theme-text">Touch ID / Face ID</span>
    </button>
  );
};

// ==========================================
// FULLSCREEN APP LOCK SCREEN OVERLAY
// ==========================================
export const AppLockScreen: React.FC = () => {
  const { isLocked, failedAttempts, lockedUntil, verifyPin, pinEnabled } = useAppLock();
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Lockout countdown timer
  useEffect(() => {
    if (!lockedUntil) {
      setRemainingTime(0);
      return;
    }

    const checkLock = () => {
      const diff = new Date(lockedUntil).getTime() - Date.now();
      if (diff <= 0) {
        setRemainingTime(0);
      } else {
        setRemainingTime(Math.ceil(diff / 1000));
      }
    };

    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  if (!isLocked || !pinEnabled) return null;

  const handleKeyPress = (num: string) => {
    if (remainingTime > 0 || isVerifying) return;
    if (pin.length < 6) {
      const newPin = pin + num;
      setPin(newPin);
      setError(null);

      // Verify automatically if 4 or 6 digit entered
      // Since we support either 4 or 6, let's verify on 4 digits if pin matches or let them press OK.
      // To keep it simple, we check if pin length matches typical choice. Let's let them enter up to 6, 
      // or check on length 4 if that was the config, or let them trigger on length 4 / 6.
      // Auto-triggering verify when length matches 4 or 6 is nice, but to support both, 
      // let's auto-verify at 4 if they have a 4-digit PIN, or at 6. Let's auto-verify on 4 or 6.
      if (newPin.length === 4 || newPin.length === 6) {
        triggerVerification(newPin);
      }
    }
  };

  const triggerVerification = async (enteredPin: string) => {
    setIsVerifying(true);
    const result = await verifyPin(enteredPin);
    setIsVerifying(false);
    
    if (!result.success) {
      setError(result.error || "Incorrect PIN");
      setPin('');
    } else {
      setPin('');
      setError(null);
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  return (
    <div className="fixed inset-0 bg-theme-bg z-50 flex flex-col items-center justify-center p-6 fade-in overflow-y-auto">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Header Branding */}
        <div className="bg-peach rounded-2xl p-4 text-orange shadow-soft-peach mb-6 animate-pulse-slow">
          <Lock size={32} />
        </div>
        
        <h2 className="text-xl font-bold text-theme-text">Protect your TinyWins</h2>
        <p className="text-sm text-theme-muted mt-1">Unlock with your security PIN</p>

        {/* Lockout Screen state */}
        {remainingTime > 0 ? (
          <div className="my-8 p-4 bg-rose bg-opacity-10 border border-rose border-opacity-35 rounded-2xl text-center max-w-xs">
            <AlertCircle className="text-rose mx-auto mb-2" size={24} />
            <h4 className="text-sm font-semibold text-rose">App Lockout Active</h4>
            <p className="text-xs text-theme-text opacity-90 mt-1 leading-relaxed">
              Too many failed passcode attempts. Locked for protection.
            </p>
            <span className="text-lg font-bold text-rose mt-3 block">
              {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        ) : (
          <>
            {/* PIN Dots Indicator */}
            <PinInput length={6} value={pin} />

            {/* Error notifications */}
            {error && (
              <div className="text-rose text-xs font-semibold text-center mt-1 mb-3 px-4 animate-bounce">
                {error}
              </div>
            )}

            {/* Keypad block */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-xs mt-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  onClick={() => handleKeyPress(num)}
                  disabled={isVerifying}
                  className="w-16 h-16 rounded-full border border-theme-border border-opacity-50 bg-theme-card hover:bg-peach-light hover:border-peach text-xl font-semibold text-theme-text flex items-center justify-center mx-auto transition-all active:scale-90"
                >
                  {num}
                </button>
              ))}
              
              {/* Backspace */}
              <button
                onClick={handleDelete}
                className="w-16 h-16 rounded-full text-theme-muted hover:text-theme-text flex items-center justify-center mx-auto active:scale-90"
              >
                <Delete size={20} />
              </button>

              {/* Zero */}
              <button
                onClick={() => handleKeyPress('0')}
                disabled={isVerifying}
                className="w-16 h-16 rounded-full border border-theme-border border-opacity-50 bg-theme-card hover:bg-peach-light hover:border-peach text-xl font-semibold text-theme-text flex items-center justify-center mx-auto transition-all active:scale-90"
              >
                0
              </button>

              {/* Clear Option */}
              <button
                onClick={() => setPin('')}
                className="text-xs font-semibold text-theme-muted hover:text-theme-text flex items-center justify-center mx-auto active:scale-95"
              >
                Clear
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
