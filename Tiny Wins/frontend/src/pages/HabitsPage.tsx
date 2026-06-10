import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BottomNavigation } from '../components/BottomNavigation';
import { SunsetButton } from '../components/SunsetButton';
import { Sun, Plus, Edit2, ChevronRight, Target, Activity } from 'lucide-react';
import { getCategoryIcon } from '../components/HabitCards';

interface Habit {
  id: string;
  name: string;
  category: string;
  tiny_goal: string;
  frequency: string;
  active: boolean;
}

export const HabitsPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();
  
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHabits = async () => {
    try {
      const res = await fetchWithAuth('/api/habits');
      if (res.ok) {
        setHabits(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  return (
    <div className="min-h-screen bg-theme-bg p-6 pb-28 fade-in">
      <header className="max-w-md mx-auto flex items-center justify-between py-4 border-b border-theme-border border-opacity-45">
        <div className="flex items-center gap-2">
          <div className="bg-peach rounded-xl p-1.5 text-orange"><Sun size={18} /></div>
          <h1 className="text-base font-extrabold text-theme-text">My Habits</h1>
        </div>
        
        <SunsetButton 
          variant="secondary" 
          size="sm" 
          onClick={() => navigate('/add-habit')}
          className="flex items-center gap-1 text-xs"
        >
          <Plus size={14} /> New Habit
        </SunsetButton>
      </header>

      <main className="max-w-md mx-auto mt-6 space-y-4">
        {loading ? (
          <div className="text-center py-12 text-xs text-theme-muted">Loading habits...</div>
        ) : habits.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {habits.map(h => (
              <div 
                key={h.id}
                onClick={() => navigate(`/habits/${h.id}`)}
                className="p-4 bg-theme-card border border-theme-border rounded-2xl flex items-center justify-between hover:border-peach transition-all shadow-premium cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-coral bg-peach bg-opacity-25 p-2 rounded-xl">
                    {getCategoryIcon(h.category)}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-theme-text">{h.name}</h3>
                    <p className="text-[10px] text-theme-muted mt-0.5 uppercase tracking-wider">{h.category} • {h.frequency}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/habits/${h.id}/edit`);
                    }}
                    className="p-2 text-theme-muted hover:text-coral rounded-xl hover:bg-theme-bg transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <ChevronRight size={16} className="text-theme-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 border border-theme-border bg-theme-card text-center rounded-2xl shadow-premium space-y-4">
            <p className="text-xs text-theme-muted">No habits added yet. Let's create your first microhabit!</p>
            <SunsetButton onClick={() => navigate('/add-habit')} variant="primary" size="md">
              Create a Habit
            </SunsetButton>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};
