import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BottomNavigation } from '../components/BottomNavigation';
import { Sun, Compass, Quote, Music, Link } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-theme-bg p-6 pb-28 fade-in">
      <header className="max-w-md mx-auto flex items-center justify-between py-4 border-b border-theme-border border-opacity-45">
        <div className="flex items-center gap-2">
          <div className="bg-peach rounded-xl p-1.5 text-orange"><Sun size={18} /></div>
          <h1 className="text-base font-extrabold text-theme-text">Growth Library</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto mt-6 space-y-4">
        <div className="space-y-1 mb-4">
          <h2 className="text-sm font-bold text-theme-text">Gentle Support Tools</h2>
          <p className="text-xs text-theme-muted">Select resources to keep you grounded and supported.</p>
        </div>

        {/* Support Links Portal */}
        <div 
          onClick={() => navigate('/library/support-links')}
          className="p-5 bg-theme-card border border-theme-border rounded-3xl flex items-center justify-between hover:border-peach hover:shadow-soft-peach transition-all cursor-pointer shadow-premium"
        >
          <div className="flex items-center gap-4">
            <span className="text-coral bg-peach bg-opacity-25 p-3 rounded-2xl">
              <Compass size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-theme-text">Support Links</h3>
              <p className="text-xs text-theme-muted mt-0.5">Explore stretching videos, breathing guides, & playlists.</p>
            </div>
          </div>
        </div>

        {/* Quotes/Inspirations Portal */}
        <div 
          onClick={() => navigate('/library/inspiration')}
          className="p-5 bg-theme-card border border-theme-border rounded-3xl flex items-center justify-between hover:border-peach hover:shadow-soft-peach transition-all cursor-pointer shadow-premium"
        >
          <div className="flex items-center gap-4">
            <span className="text-orange bg-peach bg-opacity-35 p-3 rounded-2xl">
              <Quote size={22} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-theme-text">Quotes & Inspiration</h3>
              <p className="text-xs text-theme-muted mt-0.5">Review Bible verses, calm prompts, & custom thoughts.</p>
            </div>
          </div>
        </div>

        {/* Policy/Disclaimer Note */}
        <div className="p-4 bg-theme-bg border border-theme-border border-opacity-50 rounded-2xl text-[10px] text-theme-muted leading-relaxed italic text-center">
          “Support links open outside TinyWins. Choose what feels supportive for you.”
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};
