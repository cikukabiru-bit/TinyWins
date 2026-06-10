import React, { useState } from 'react';
import { SunsetButton } from './SunsetButton';
import { Smile, Meh, Frown, BatteryCharging, ShieldAlert, Heart, X } from 'lucide-react';

interface ReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { reflection: string; mood: string; effort_level: string }) => void;
  habitName: string;
}

export const ReflectionModal: React.FC<ReflectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  habitName
}) => {
  const [reflection, setReflection] = useState('');
  const [mood, setMood] = useState('calm');
  const [effortLevel, setEffortLevel] = useState('okay');

  if (!isOpen) return null;

  const moods = [
    { name: 'calm', label: '😌 Calm', color: 'bg-peach-light text-warm-brown' },
    { name: 'happy', label: '☀️ Happy', color: 'bg-yellow bg-opacity-25 text-warm-brown-dark' },
    { name: 'hopeful', label: '🌱 Hopeful', color: 'bg-coral bg-opacity-15 text-coral' },
    { name: 'tired', label: '💤 Tired', color: 'bg-theme-border text-theme-muted' },
    { name: 'overwhelmed', label: '🌊 Overwhelmed', color: 'bg-rose bg-opacity-15 text-rose' },
    { name: 'neutral', label: '😐 Neutral', color: 'bg-theme-bg text-theme-text' }
  ];

  const efforts = [
    { name: 'easy', label: 'Easy' },
    { name: 'okay', label: 'Okay' },
    { name: 'hard', label: 'Hard' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ reflection, mood, effort_level: effortLevel });
    setReflection('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum bg-opacity-40 backdrop-blur-sm fade-in">
      <div className="bg-theme-card border border-theme-border rounded-3xl w-full max-w-sm p-6 shadow-premium relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-theme-muted hover:text-theme-text transition-colors p-1"
        >
          <X size={18} />
        </button>

        <h3 className="text-base font-extrabold text-theme-text">Reflect on your Win</h3>
        <p className="text-xs text-theme-muted mt-0.5">Showing up for {habitName} is a victory.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Mood Check-in */}
          <div>
            <label className="text-xs font-semibold text-theme-text block mb-2">How did this feel?</label>
            <div className="grid grid-cols-3 gap-2">
              {moods.map(m => {
                const isSelected = mood === m.name;
                return (
                  <button
                    key={m.name}
                    type="button"
                    onClick={() => setMood(m.name)}
                    className={`py-2 px-1 text-xs font-medium rounded-xl text-center border transition-all duration-300
                      ${isSelected 
                        ? 'border-coral ring-1 ring-coral bg-peach bg-opacity-25' 
                        : 'border-theme-border hover:bg-theme-bg'
                      }`}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Effort Levels */}
          <div>
            <label className="text-xs font-semibold text-theme-text block mb-2">Effort level:</label>
            <div className="flex gap-2.5">
              {efforts.map(e => {
                const isSelected = effortLevel === e.name;
                return (
                  <button
                    key={e.name}
                    type="button"
                    onClick={() => setEffortLevel(e.name)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-all duration-300
                      ${isSelected 
                        ? 'bg-gradient-to-r from-orange to-coral border-transparent text-white shadow-soft-coral' 
                        : 'border-theme-border hover:bg-theme-bg text-theme-muted'
                      }`}
                  >
                    {e.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Written Journal Reflection */}
          <div>
            <label htmlFor="reflection" className="text-xs font-semibold text-theme-text block mb-2">
              What helped you show up today?
            </label>
            <textarea
              id="reflection"
              rows={3}
              value={reflection}
              onChange={e => setReflection(e.target.value)}
              placeholder="Felt tired but placed my shoes nearby... (optional)"
              className="w-full text-xs p-3 rounded-xl border border-theme-border focus:border-peach focus:ring-1 focus:ring-peach bg-theme-bg text-theme-text placeholder-theme-muted focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Button actions */}
          <div className="flex gap-3 pt-2">
            <SunsetButton 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Skip
            </SunsetButton>
            <SunsetButton 
              type="submit" 
              variant="primary"
              className="flex-1"
            >
              Save Win
            </SunsetButton>
          </div>

        </form>
      </div>
    </div>
  );
};
