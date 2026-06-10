import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SunsetButton } from '../components/SunsetButton';
import { Sun, Plus, AlertCircle, ArrowRight, Trash2, Award, Heart, HelpCircle, Activity } from 'lucide-react';
import { getCategoryIcon } from '../components/HabitCards';

interface ScoreItem {
  id?: string;
  habit_name: string;
  category: string;
  score: number;
  note?: string;
  current_frequency?: string;
  desired_improvement?: string;
  difficulty_level: string;
  emotional_feeling: string;
  priority: string;
}

export const HabitScorePage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();

  const [scores, setScores] = useState<ScoreItem[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Form states for new score
  const [habitName, setHabitName] = useState('');
  const [category, setCategory] = useState('Health');
  const [score, setScore] = useState(5);
  const [note, setNote] = useState('');
  const [difficulty, setDifficulty] = useState('moderate');
  const [feeling, setFeeling] = useState('neutral');
  const [priority, setPriority] = useState('medium');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const categories = ["Health", "Fitness", "Sleep", "Focus", "Learning", "Prayer/Spirituality", "Money", "Work/Productivity", "Self-care", "Relationships", "Emotional wellbeing"];
  const feelings = ["proud", "frustrated", "neutral", "hopeful", "overwhelmed"];

  const fetchScores = async () => {
    try {
      const res = await fetchWithAuth('/api/habit-scores');
      if (res.ok) {
        const data = await res.json();
        setScores(data);
        if (data.length >= 3) {
          setShowForm(false);
          calculateSummary();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchScores();
  }, []);

  const handleAddScore = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!habitName.trim()) {
      setError("Habit name is required");
      return;
    }

    setLoading(true);
    const payload = {
      habit_name: habitName,
      category,
      score,
      note,
      difficulty_level: difficulty,
      emotional_feeling: feeling,
      priority
    };

    try {
      const res = await fetchWithAuth('/api/habit-scores', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setHabitName('');
        setNote('');
        setScore(5);
        setDifficulty('moderate');
        setFeeling('neutral');
        setPriority('medium');
        await fetchScores();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save habit score");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/habit-scores/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchScores();
        setSummary(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const calculateSummary = async () => {
    try {
      const res = await fetchWithAuth('/api/habit-scores/summary');
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-theme-bg p-6 fade-in pb-12">
      <header className="flex items-center gap-2 max-w-md mx-auto w-full pt-4">
        <div className="bg-peach rounded-xl p-1.5 text-orange"><Sun size={16} /></div>
        <span className="text-xs font-black tracking-wider text-theme-text uppercase">Habit Assessment</span>
      </header>

      <main className="max-w-md mx-auto w-full flex-1 my-6 space-y-6">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-theme-text tracking-tight">Assess Your Daily Rhythm</h2>
          <p className="text-xs text-theme-muted">
            List and score 3 to 7 of your current habits to identify where you want to grow gently.
          </p>
        </div>

        {/* List of currently scored habits */}
        {scores.length > 0 && (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-theme-text uppercase tracking-wider">Scored Habits ({scores.length})</h3>
            <div className="grid grid-cols-1 gap-2">
              {scores.map((s, idx) => (
                <div key={s.id || idx} className="p-3.5 bg-theme-card border border-theme-border rounded-xl flex items-center justify-between shadow-soft-peach">
                  <div className="flex items-center gap-2.5">
                    <span className="text-coral bg-peach bg-opacity-20 p-1.5 rounded-lg flex-shrink-0">
                      {getCategoryIcon(s.category)}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-theme-text">{s.habit_name}</h4>
                      <span className="text-[10px] text-theme-muted uppercase tracking-wider">{s.category} • Priority: {s.priority}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black px-2.5 py-1 bg-peach text-orange rounded-lg">
                      {s.score}/10
                    </span>
                    <button 
                      onClick={() => s.id && handleDelete(s.id)}
                      className="text-theme-muted hover:text-rose p-1 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Form Toggle */}
        {showForm && (
          <form onSubmit={handleAddScore} className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-4">
            <span className="text-xs font-bold text-theme-text block border-b border-theme-border pb-2">Score a Habit</span>

            {error && (
              <div className="p-2.5 bg-rose bg-opacity-10 border border-rose border-opacity-35 rounded-xl text-rose text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Habit name</label>
              <input
                type="text"
                required
                value={habitName}
                onChange={e => setHabitName(e.target.value)}
                placeholder="e.g. Exercise, Morning Prayer, Reading"
                className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Score (1-10)</label>
                <select
                  value={score}
                  onChange={e => setScore(parseInt(e.target.value))}
                  className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                >
                  {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>{n}/10</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Difficulty level</label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="moderate">Moderate</option>
                  <option value="difficult">Difficult</option>
                </select>
              </div>
              
              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={e => setPriority(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Emotion attached</label>
              <div className="flex flex-wrap gap-2">
                {feelings.map(f => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFeeling(f)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all capitalize
                      ${feeling === f 
                        ? 'border-coral bg-peach bg-opacity-25 text-theme-text' 
                        : 'border-theme-border hover:bg-theme-bg text-theme-muted'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Brief note (Why this score?)</label>
              <input
                type="text"
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="e.g. Hard to find time during morning rushes."
                className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
              />
            </div>

            <SunsetButton type="submit" variant="primary" loading={loading} className="w-full">
              Add Scored Habit
            </SunsetButton>
          </form>
        )}

        {/* Toggle Form button */}
        {scores.length > 0 && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs font-bold text-coral flex items-center justify-center gap-1 mx-auto hover:underline"
          >
            {showForm ? "Close Form" : "Score another habit"} <Plus size={14} />
          </button>
        )}

        {/* Calculated Summary cards */}
        {summary && (
          <div className="space-y-4 fade-in bg-theme-card p-5 border border-peach border-opacity-40 rounded-2xl shadow-soft-peach">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-orange bg-peach bg-opacity-20 p-2 rounded-xl"><Award size={18} /></span>
              <div>
                <h4 className="text-sm font-extrabold text-theme-text">Your Rhythm Summary</h4>
                <p className="text-[10px] text-theme-muted">Assessment diagnostics</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 bg-theme-bg border border-theme-border rounded-xl">
                <span className="text-[9px] text-theme-muted uppercase tracking-wider block">Strongest Habit</span>
                <span className="font-bold text-theme-text mt-1 block">{summary.strongest_habit} ({summary.strongest_score}/10)</span>
              </div>
              <div className="p-3 bg-theme-bg border border-theme-border rounded-xl">
                <span className="text-[9px] text-theme-muted uppercase tracking-wider block">Highest Priority</span>
                <span className="font-bold text-coral mt-1 block">{summary.highest_priority_habit}</span>
              </div>
            </div>

            <div className="bg-peach-light bg-opacity-40 rounded-xl p-3.5 border border-peach border-opacity-30">
              <span className="text-[9px] font-bold text-orange uppercase tracking-wider">Tiny Coach Suggestion</span>
              <p className="text-xs text-warm-brown mt-1.5 leading-relaxed font-medium">
                {summary.tiny_coach_note}
              </p>
              <div className="bg-white rounded-lg p-2.5 border border-peach border-opacity-20 mt-3 text-xs">
                <span className="font-bold text-orange">First Microhabit:</span>
                <p className="text-warm-brown mt-0.5">{summary.recommended_first_microhabit}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="max-w-md mx-auto w-full pb-6">
        {scores.length < 3 ? (
          <div className="p-3 bg-theme-border bg-opacity-40 text-theme-muted text-[11px] font-semibold text-center rounded-xl flex items-center justify-center gap-1">
            <AlertCircle size={14} /> Please add and score at least 3 habits to proceed.
          </div>
        ) : (
          <SunsetButton
            variant="primary"
            onClick={() => navigate('/recommendations')}
            className="w-full py-3.5 flex items-center justify-center gap-1.5"
          >
            Review Custom Microhabits <ArrowRight size={16} />
          </SunsetButton>
        )}
      </footer>
    </div>
  );
};
