import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { CoachCard } from '../components/CoachCard';
import { WeeklyReviewCard } from '../components/HabitCards';
import { BottomNavigation } from '../components/BottomNavigation';
import { SunsetButton } from '../components/SunsetButton';
import { Sun, Sparkles, MessageCircle, BarChart3, HelpCircle, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CoachMessage {
  id: string;
  message: string;
  message_type: string;
  accepted: boolean;
  created_at: string;
}

export const CoachPage: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  
  const [history, setHistory] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Actions states
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState<any>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetchWithAuth('/api/coach/history');
      if (res.ok) {
        setHistory(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleRequestDaily = async () => {
    setIsGenerating(true);
    try {
      // Find a habit to link to if exists
      const habitsRes = await fetchWithAuth('/api/habits');
      let habitId = undefined;
      if (habitsRes.ok) {
        const habits = await habitsRes.json();
        if (habits.length > 0) habitId = habits[0].id;
      }

      const res = await fetchWithAuth('/api/coach/daily', {
        method: 'POST',
        body: JSON.stringify({ habitId })
      });

      if (res.ok) {
        await fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRequestSuggestion = async () => {
    setIsGenerating(true);
    try {
      const habitsRes = await fetchWithAuth('/api/habits');
      let habitId = undefined;
      if (habitsRes.ok) {
        const habits = await habitsRes.json();
        if (habits.length > 0) habitId = habits[0].id;
      }

      const res = await fetchWithAuth('/api/coach/habit-suggestion', {
        method: 'POST',
        body: JSON.stringify({ habitId })
      });

      if (res.ok) {
        await fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRequestWeekly = async () => {
    setIsGenerating(true);
    try {
      const habitsRes = await fetchWithAuth('/api/habits');
      let habitId = undefined;
      if (habitsRes.ok) {
        const habits = await habitsRes.json();
        if (habits.length > 0) habitId = habits[0].id;
      }

      const res = await fetchWithAuth('/api/coach/weekly-review', {
        method: 'POST',
        body: JSON.stringify({ habitId })
      });

      if (res.ok) {
        const reviewData = await res.json();
        setWeeklyReview(reviewData);
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.8 }
        });
        await fetchHistory();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptSuggestion = async (msgId: string) => {
    try {
      const res = await fetchWithAuth(`/api/coach/suggestion/${msgId}/accept`, { method: 'POST' });
      if (res.ok) {
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 }
        });
        await fetchHistory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg p-6 pb-28 fade-in">
      <header className="max-w-md mx-auto flex items-center justify-between py-4 border-b border-theme-border border-opacity-45">
        <div className="flex items-center gap-2">
          <div className="bg-peach rounded-xl p-1.5 text-orange"><Sun size={18} /></div>
          <h1 className="text-base font-extrabold text-theme-text">Tiny Coach AI</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto mt-6 space-y-6">
        
        {/* Quick Coach Advice actions */}
        <div className="p-4 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-3">
          <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider block">Ask for guidance</span>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={handleRequestDaily}
              disabled={isGenerating}
              className="py-2.5 px-1 bg-theme-bg border border-theme-border hover:border-peach text-[11px] font-bold text-theme-text rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              Daily Tip
            </button>
            <button
              onClick={handleRequestSuggestion}
              disabled={isGenerating}
              className="py-2.5 px-1 bg-theme-bg border border-theme-border hover:border-peach text-[11px] font-bold text-theme-text rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              Get Suggestion
            </button>
            <button
              onClick={handleRequestWeekly}
              disabled={isGenerating}
              className="py-2.5 px-1 bg-gradient-to-tr from-peach to-yellow hover:scale-[1.01] text-[11px] font-bold text-warm-brown rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              Weekly Review
            </button>
          </div>
          <span className="text-[9px] text-theme-muted italic text-center block mt-1">Tiny Coach practices data minimization. Reflections are private.</span>
        </div>

        {/* Weekly review modal overlay if active */}
        {weeklyReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-plum bg-opacity-40 backdrop-blur-sm">
            <WeeklyReviewCard
              wins={weeklyReview.wins_this_week}
              streak={weeklyReview.current_streak}
              coachNote={weeklyReview.message}
              onClose={() => setWeeklyReview(null)}
            />
          </div>
        )}

        {/* Coach interaction history */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider px-1">Coach Notes History</h4>
          
          {loading ? (
            <div className="text-center py-12 text-xs text-theme-muted">Loading history...</div>
          ) : history.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {history.map(msg => (
                <CoachCard
                  key={msg.id}
                  message={msg}
                  onAccept={() => handleAcceptSuggestion(msg.id)}
                />
              ))}
            </div>
          ) : (
            <div className="p-8 border border-theme-border bg-theme-card text-center rounded-2xl shadow-premium">
              <p className="text-xs text-theme-muted leading-relaxed">
                No advice logs saved yet. Click "Daily Tip" or complete onboard goals to trigger coach feedback.
              </p>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
};
