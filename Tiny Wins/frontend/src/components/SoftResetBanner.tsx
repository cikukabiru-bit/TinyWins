import React from 'react';
import { RefreshCw } from 'lucide-react';

interface SoftResetBannerProps {
  habitName: string;
  onRestart?: () => void;
}

export const SoftResetBanner: React.FC<SoftResetBannerProps> = ({ habitName, onRestart }) => {
  const encouragements = [
    "Begin again, without punishment.",
    "A soft reset is still progress.",
    "You showed up in desire, and that is a start. Let's step softly today.",
    "You are not starting from nothing. You are starting with experience.",
    "No pressure, no shame. Today is a clean canvas."
  ];

  const randomNote = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div className="bg-peach-light border border-peach border-opacity-60 rounded-2xl p-4 flex items-start gap-3.5 fade-in shadow-soft-peach">
      <div className="bg-peach rounded-xl p-2 text-orange flex-shrink-0">
        <RefreshCw size={18} className="animate-spin-slow" style={{ animationDuration: '6s' }} />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-semibold text-warm-brown">A Gentle Pause for {habitName}</h4>
        <p className="text-xs text-warm-brown opacity-85 mt-1 leading-relaxed">
          {randomNote}
        </p>
        {onRestart && (
          <button 
            onClick={onRestart} 
            className="text-xs font-semibold text-orange hover:text-orange-dark underline mt-2 block active:scale-95 transition-all"
          >
            Restart gently now
          </button>
        )}
      </div>
    </div>
  );
};
