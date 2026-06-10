import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SunsetButton } from '../components/SunsetButton';
import { RecommendationCard } from '../components/HabitCards';
import { Sun, CheckCircle, ArrowRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Recommendation {
  name: string;
  category: string;
  tiny_goal: string;
  frequency: string;
  growth_mode: string;
  reason: string;
}

export const RecommendPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState('');
  const [customCategory, setCustomCategory] = useState('Self-care');

  useEffect(() => {
    const stored = localStorage.getItem('tinywins_onboarding_recommendations');
    if (stored) {
      setRecommendations(JSON.parse(stored));
    }
  }, []);

  const handleAddHabit = async (rec: Recommendation) => {
    try {
      const res = await fetchWithAuth('/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: rec.name,
          category: rec.category,
          tiny_goal: rec.tiny_goal,
          frequency: rec.frequency,
          growth_mode: rec.growth_mode,
          start_date: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#F26C4F', '#E05624', '#FEC84C', '#D9838E']
        });
        setAddedIds([...addedIds, rec.name]);
      } else {
        alert("Failed to add habit.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customGoal.trim()) return;

    try {
      const res = await fetchWithAuth('/api/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: customGoal,
          category: customCategory,
          tiny_goal: `Do ${customGoal} for 2 minutes daily`,
          frequency: 'daily',
          growth_mode: 'Keep tiny',
          start_date: new Date().toISOString().split('T')[0]
        })
      });

      if (res.ok) {
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 }
        });
        setCustomGoal('');
        alert("Custom habit created!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-theme-bg p-6 fade-in pb-12">
      <header className="flex items-center gap-2 max-w-md mx-auto w-full pt-4">
        <div className="bg-peach rounded-xl p-1.5 text-orange"><Sun size={16} /></div>
        <span className="text-xs font-black tracking-wider text-theme-text uppercase">Recommendations</span>
      </header>

      <main className="max-w-md mx-auto w-full flex-1 my-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-theme-text tracking-tight">Your Microhabit Recommendations</h2>
          <p className="text-xs text-theme-muted">
            Based on your onboarding scores and blockers, we recommend starting with these low-friction habits.
          </p>
        </div>

        {/* Recommendations list */}
        <div className="grid grid-cols-1 gap-4">
          {recommendations.length > 0 ? (
            recommendations.map((rec, index) => {
              const isAdded = addedIds.includes(rec.name);
              return (
                <div key={index} className="relative">
                  <RecommendationCard
                    recommendation={rec}
                    onAdd={() => handleAddHabit(rec)}
                  />
                  {isAdded && (
                    <div className="absolute inset-0 bg-theme-bg bg-opacity-70 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-2 fade-in">
                      <div className="bg-peach text-orange p-3 rounded-full shadow-soft-peach"><CheckCircle size={28} /></div>
                      <span className="text-xs font-bold text-theme-text">Added to dashboard</span>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-xs text-theme-muted border border-theme-border rounded-2xl bg-theme-card">
              No recommendations generated. Try completing the onboarding profile first.
            </div>
          )}
        </div>

        {/* Custom Habit input */}
        <form onSubmit={handleCreateCustom} className="p-4 border border-theme-border bg-theme-card rounded-2xl space-y-3">
          <span className="text-xs font-bold text-theme-text block">Create your own instead:</span>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={customGoal}
              onChange={e => setCustomGoal(e.target.value)}
              placeholder="e.g. Drink a glass of water"
              className="flex-1 text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
            />
            <SunsetButton type="submit" variant="secondary" className="px-4 text-xs font-bold">
              Add
            </SunsetButton>
          </div>
        </form>
      </main>

      <footer className="max-w-md mx-auto w-full pb-6">
        <SunsetButton
          variant="primary"
          onClick={() => navigate('/today')}
          className="w-full py-3.5 flex items-center justify-center gap-1.5"
        >
          Go to Today Dashboard <ArrowRight size={16} />
        </SunsetButton>
      </footer>
    </div>
  );
};
