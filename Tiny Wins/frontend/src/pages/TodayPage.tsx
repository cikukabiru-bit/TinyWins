import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProgressRing } from '../components/ProgressRing';
import { SunsetButton } from '../components/SunsetButton';
import { HabitCard } from '../components/HabitCards';
import { InspirationCard } from '../components/InspirationCards';
import { CoachCard } from '../components/CoachCard';
import { ReflectionModal } from '../components/ReflectionModal';
import { BottomNavigation } from '../components/BottomNavigation';
import { Sun, User, Bell, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Habit {
  id: string;
  name: string;
  category: string;
  tiny_goal: string;
  frequency: string;
  preferred_time?: string;
  reminder_enabled: boolean;
}

interface HabitStats {
  current_streak: number;
  longest_streak: number;
}

export const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, fetchWithAuth } = useAuth();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Record<string, any>>({}); // Maps habitId -> today's log object
  const [stats, setStats] = useState<Record<string, HabitStats>>({}); // Maps habitId -> stats object

  // Inspiration & Coach states
  const [inspiration, setInspiration] = useState<any>(null);
  const [coachMsg, setCoachMsg] = useState<any>(null);

  // Reflection Modal states
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [showReflection, setShowReflection] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch habits
      const habitsRes = await fetchWithAuth('/api/habits');
      if (!habitsRes.ok) return;
      const habitsData = await habitsRes.json();
      setHabits(habitsData);

      // 2. Fetch stats and today's logs for each habit
      const logsTemp: Record<string, any> = {};
      const statsTemp: Record<string, HabitStats> = {};

      for (const h of habitsData) {
        // Logs
        const logsRes = await fetchWithAuth(`/api/habits/${h.id}/logs`);
        if (logsRes.ok) {
          const logsData = await logsRes.json();
          const todayLog = logsData.find((l: any) => l.log_date.split('T')[0] === todayStr);
          if (todayLog) {
            logsTemp[h.id] = todayLog;
          }
        }
        // Stats
        const statsRes = await fetchWithAuth(`/api/habits/${h.id}/stats`);
        if (statsRes.ok) {
          statsTemp[h.id] = await statsRes.json();
        }
      }

      setLogs(logsTemp);
      setStats(statsTemp);

      // 3. Load recommended inspiration
      const inspRes = await fetchWithAuth('/api/inspiration/recommended');
      if (inspRes.ok) {
        setInspiration(await inspRes.json());
      }

      // 4. Load coach daily advice (pass first habit if exists)
      if (habitsData.length > 0) {
        const coachRes = await fetchWithAuth('/api/coach/daily', {
          method: 'POST',
          body: JSON.stringify({ habitId: habitsData[0].id })
        });
        if (coachRes.ok) {
          setCoachMsg(await coachRes.json());
        }
      }
    } catch (err) {
      console.error("Dashboard loading error", err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCheckInToggle = async (habit: Habit) => {
    const isCompleted = logs[habit.id]?.status === 'completed';
    const newStatus = isCompleted ? 'missed' : 'completed';

    try {
      const res = await fetchWithAuth(`/api/habits/${habit.id}/check-in`, {
        method: 'POST',
        body: JSON.stringify({
          log_date: todayStr,
          status: newStatus
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update state
        setLogs(prev => ({ ...prev, [habit.id]: data.log }));
        setStats(prev => ({ ...prev, [habit.id]: data.stats }));

        if (newStatus === 'completed') {
          // Play confetti
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#F26C4F', '#E05624', '#FEC84C', '#D9838E']
          });

          // Open reflection modal
          setActiveHabit(habit);
          setShowReflection(true);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveReflection = async (refData: { reflection: string; mood: string; effort_level: string }) => {
    if (!activeHabit) return;

    try {
      const res = await fetchWithAuth(`/api/habits/${activeHabit.id}/check-in`, {
        method: 'POST',
        body: JSON.stringify({
          log_date: todayStr,
          status: 'completed',
          ...refData
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(prev => ({ ...prev, [activeHabit.id]: data.log }));
        await fetchDashboardData(); // Refresh all to log timeline updates
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Calculations
  const totalHabits = habits.length;
  const completedHabits = Object.values(logs).filter(l => l.status === 'completed').length;
  const percentage = totalHabits > 0 ? (completedHabits / totalHabits) * 100 : 0;

  // Streak metrics sum
  const currentStreakMax = Object.values(stats).reduce((max, s) => Math.max(max, s.current_streak || 0), 0);

  return (
    <div className="min-h-screen bg-theme-bg p-6 pb-28 fade-in">
      {/* Top Header */}
      <header className="max-w-md mx-auto flex items-center justify-between py-4 border-b border-theme-border border-opacity-45">
        <div className="flex items-center gap-2.5">
          <div className="bg-peach rounded-2xl p-2 text-orange"><Sun size={20} className="animate-spin-slow" style={{ animationDuration: '24s' }} /></div>
          <div>
            <h1 className="text-base font-extrabold text-theme-text">Hello, {user?.name || 'Friend'}</h1>
            <p className="text-[10px] text-theme-muted tracking-wide uppercase">Grow softly today</p>
          </div>
        </div>

        {/* Profile Settings Icon */}
        <button 
          onClick={() => navigate('/settings')}
          className="bg-theme-card border border-theme-border p-2.5 rounded-2xl text-theme-muted hover:text-theme-text transition-all hover:scale-105 active:scale-95 shadow-soft-peach"
        >
          <User size={18} />
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-md mx-auto mt-6 space-y-6">
        
        {/* Daily Progress Gauge Card */}
        {totalHabits > 0 ? (
          <div className="p-5 rounded-3xl border border-peach border-opacity-30 bg-theme-card shadow-soft-peach flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Today's Progress</span>
              <h3 className="text-lg font-black text-theme-text">{completedHabits} of {totalHabits} wins</h3>
              <p className="text-xs text-theme-muted">
                {percentage === 100 
                  ? 'Beautiful. All steps completed.' 
                  : 'Take your time. Rhythm counts.'}
              </p>
            </div>
            <ProgressRing percentage={percentage} size={76} strokeWidth={7} />
          </div>
        ) : (
          <div className="p-6 rounded-3xl border border-theme-border bg-theme-card text-center shadow-premium space-y-4">
            <p className="text-xs text-theme-muted leading-relaxed">
              No habits scheduled for today. Start small by listing one tracked habit.
            </p>
            <SunsetButton onClick={() => navigate('/add-habit')} variant="primary" size="sm">
              Create My First Habit
            </SunsetButton>
          </div>
        )}

        {/* Today's Habits checklist */}
        {totalHabits > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider px-1">Today's Habits</h4>
            <div className="grid grid-cols-1 gap-3">
              {habits.map(h => {
                const isCompleted = logs[h.id]?.status === 'completed';
                const s = stats[h.id]?.current_streak || 0;
                
                return (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    streak={s}
                    completedToday={isCompleted}
                    onCheckIn={() => handleCheckInToggle(h)}
                    onOpenReflection={() => {
                      setActiveHabit(h);
                      setShowReflection(true);
                    }}
                    onViewSupport={() => navigate(`/habits/${h.id}`)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Today's Inspiration Card */}
        {inspiration && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider px-1">Today's Encouragement</h4>
            <InspirationCard 
              inspiration={inspiration}
              onFavourite={async () => {
                try {
                  const res = await fetchWithAuth(`/api/inspiration/${inspiration.id}/favourite`, { method: 'POST' });
                  if (res.ok) {
                    const data = await res.json();
                    setInspiration(data);
                  }
                } catch (err) { console.error(err); }
              }}
            />
          </div>
        )}

        {/* Tiny Coach Daily Message bubble */}
        {coachMsg && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider px-1">Tiny Coach Note</h4>
            <CoachCard message={coachMsg} />
          </div>
        )}

      </main>

      {/* Reflection Modal Overlay */}
      {activeHabit && (
        <ReflectionModal
          isOpen={showReflection}
          onClose={() => {
            setShowReflection(false);
            setActiveHabit(null);
          }}
          onSubmit={handleSaveReflection}
          habitName={activeHabit.name}
        />
      )}

      {/* Navigation Footer */}
      <BottomNavigation />
    </div>
  );
};
