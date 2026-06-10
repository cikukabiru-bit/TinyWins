import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SunsetButton } from '../components/SunsetButton';
import { Sun, Heart, Sparkles, Compass } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-theme-bg p-6 fade-in">
      {/* Header Branding */}
      <header className="flex items-center gap-2 max-w-md mx-auto w-full pt-4">
        <div className="bg-peach rounded-xl p-2 text-orange">
          <Sun size={20} className="animate-spin-slow" style={{ animationDuration: '20s' }} />
        </div>
        <span className="text-base font-black tracking-wider text-theme-text uppercase">TinyWins</span>
      </header>

      {/* Hero Visual Block */}
      <main className="max-w-md mx-auto w-full flex-1 flex flex-col justify-center text-center my-10 space-y-8">
        
        {/* Glowing Sun circle graphic */}
        <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-peach to-yellow opacity-40 blur-xl animate-pulse-slow" />
          <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-orange to-coral flex items-center justify-center text-white shadow-soft-coral">
            <Sun size={48} className="animate-spin-slow" style={{ animationDuration: '16s' }} />
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-black tracking-tight text-theme-text leading-tight sm:text-4xl">
            Grow quietly, <br />
            consistently, and kindly
          </h1>
          <p className="text-sm text-theme-muted max-w-xs mx-auto leading-relaxed">
            TinyWins helps you build small daily habits with rhythm and grace. No pressure. No shame. One tiny win at a time.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 gap-3.5 pt-4">
          <div className="bg-theme-card p-4 rounded-2xl border border-theme-border flex flex-col items-center text-center">
            <span className="text-coral bg-peach bg-opacity-20 p-2 rounded-xl mb-2"><Heart size={16} /></span>
            <span className="text-xs font-bold text-theme-text">Grace resets</span>
          </div>
          <div className="bg-theme-card p-4 rounded-2xl border border-theme-border flex flex-col items-center text-center">
            <span className="text-orange bg-peach bg-opacity-25 p-2 rounded-xl mb-2"><Sparkles size={16} /></span>
            <span className="text-xs font-bold text-theme-text">Tiny Coach</span>
          </div>
        </div>
      </main>

      {/* Buttons Navigation Footer */}
      <footer className="max-w-md mx-auto w-full space-y-3.5 pb-6">
        <SunsetButton 
          variant="primary" 
          size="lg" 
          onClick={() => navigate('/register')} 
          className="w-full"
        >
          Begin Gently
        </SunsetButton>
        <SunsetButton 
          variant="secondary" 
          size="lg" 
          onClick={() => navigate('/login')} 
          className="w-full"
        >
          I have an account
        </SunsetButton>
        <p className="text-[10px] text-theme-muted text-center italic mt-2">
          Small steps. Gentle rhythm. Graceful growth.
        </p>
      </footer>
    </div>
  );
};
