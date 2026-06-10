import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HabitCalendar } from '../components/HabitCalendar';
import { StreakBadge } from '../components/StreakBadge';
import { ContentCard } from '../components/InspirationCards';
import { ReminderSettingsCard } from '../components/ReminderSettingsCard';
import { SunsetButton } from '../components/SunsetButton';
import { ArrowLeft, Edit2, Calendar, Award, Flame, Lightbulb, ExternalLink } from 'lucide-react';

export const HabitDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();

  const [habit, setHabit] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  
  // Recommendations & Reminders
  const [recommendedLinks, setRecommendedLinks] = useState<any[]>([]);
  const [reminder, setReminder] = useState<any>(null);

  const [loading, setLoading] = useState(true);

  const fetchDetails = async () => {
    try {
      // 1. Fetch Habit
      const resHabit = await fetchWithAuth(`/api/habits/${id}`);
      if (!resHabit.ok) return;
      const h = await resHabit.json();
      setHabit(h);

      // 2. Fetch Stats
      const resStats = await fetchWithAuth(`/api/habits/${id}/stats`);
      if (resStats.ok) {
        setStats(await resStats.json());
      }

      // 3. Fetch Logs
      const resLogs = await fetchWithAuth(`/api/habits/${id}/logs`);
      if (resLogs.ok) {
        setLogs(await resLogs.json());
      }

      // 4. Fetch Recommended content
      const resRec = await fetchWithAuth(`/api/content/recommended/${id}`);
      if (resRec.ok) {
        setRecommendedLinks(await resRec.json());
      }

      // 5. Fetch Reminders (find reminder matching this habit)
      const resRem = await fetchWithAuth('/api/reminders');
      if (resRem.ok) {
        const allRems = await resRem.json();
        const activeRem = allRems.find((r: any) => r.habit_id === id);
        setReminder(activeRem || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleSaveReminder = async (remData: any) => {
    try {
      const url = reminder ? `/api/reminders/${reminder.id}` : '/api/reminders';
      const method = reminder ? 'PUT' : 'POST';
      const payload = {
        ...remData,
        habit_id: id
      };

      const res = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert("Reminders saved successfully.");
        fetchDetails();
      } else {
        alert("Failed to save reminders.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-center py-12 text-xs text-theme-muted">Loading habit details...</div>;
  if (!habit) return <div className="text-center py-12 text-xs text-rose">Habit not found.</div>;

  return (
    <div className="min-h-screen bg-theme-bg p-6 pb-24 fade-in">
      <header className="max-w-md mx-auto flex items-center justify-between py-4 border-b border-theme-border border-opacity-45">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="text-theme-muted hover:text-theme-text transition-colors p-1"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-extrabold text-theme-text">Details</h1>
        </div>

        <button
          onClick={() => navigate(`/habits/${id}/edit`)}
          className="p-2 text-theme-muted hover:text-coral rounded-xl hover:bg-theme-bg transition-colors"
        >
          <Edit2 size={16} />
        </button>
      </header>

      <main className="max-w-md mx-auto mt-6 space-y-6">
        
        {/* Header summary panel */}
        <div className="p-5 border border-theme-border bg-theme-card rounded-3xl shadow-soft-peach space-y-3.5">
          <div>
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">{habit.category}</span>
            <h2 className="text-lg font-black text-theme-text mt-1">{habit.name}</h2>
            <p className="text-xs text-theme-muted mt-1 italic">“{habit.tiny_goal}”</p>
          </div>

          <div className="flex gap-3 pt-2">
            <StreakBadge streak={stats?.current_streak || 0} size="md" />
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-theme-bg border border-theme-border text-theme-muted text-xs font-semibold rounded-full">
              <Award size={14} className="text-yellow" /> Longest: {stats?.longest_streak || 0} days
            </div>
          </div>
        </div>

        {/* Completion History Calendar */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider px-1">Completions Journal</h4>
          <HabitCalendar logs={logs} startDate={habit.start_date} />
        </div>

        {/* Reminders schedule block */}
        <ReminderSettingsCard
          habitName={habit.name}
          initialReminder={reminder}
          onSave={handleSaveReminder}
        />

        {/* Suggested Support Links */}
        {recommendedLinks.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider px-1">Recommended support links</h4>
            <div className="grid grid-cols-1 gap-3">
              {recommendedLinks.map(link => (
                <ContentCard
                  key={link.id}
                  content={link}
                  onFavourite={async () => {
                    try {
                      const res = await fetchWithAuth(`/api/content/${link.id}/favourite`, { method: 'POST' });
                      if (res.ok) fetchDetails();
                    } catch (err) { console.error(err); }
                  }}
                />
              ))}
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
