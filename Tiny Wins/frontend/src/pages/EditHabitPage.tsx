import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SunsetButton } from '../components/SunsetButton';
import { SecurityToggle } from '../components/SecurityComponents';
import { ArrowLeft, Trash2 } from 'lucide-react';

export const EditHabitPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { fetchWithAuth } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Self-care');
  const [tinyGoal, setTinyGoal] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [preferredTime, setPreferredTime] = useState('morning');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [growthMode, setGrowthMode] = useState('Keep tiny');
  const [active, setActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ["Health", "Fitness", "Sleep", "Focus", "Learning", "Prayer/Spirituality", "Money", "Work/Productivity", "Self-care", "Relationships", "Emotional wellbeing"];
  const growthModes = ["Keep tiny", "Increase slowly", "Let Tiny Coach suggest"];

  useEffect(() => {
    const fetchHabit = async () => {
      try {
        const res = await fetchWithAuth(`/api/habits/${id}`);
        if (res.ok) {
          const h = await res.json();
          setName(h.name);
          setCategory(h.category);
          setTinyGoal(h.tiny_goal);
          setFrequency(h.frequency);
          setPreferredTime(h.preferred_time || 'flexible');
          setReminderEnabled(h.reminder_enabled);
          setGrowthMode(h.growth_mode || 'Keep tiny');
          setActive(h.active);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchHabit();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      category,
      tiny_goal: tinyGoal,
      frequency,
      preferred_time: preferredTime,
      reminder_enabled: reminderEnabled,
      growth_mode: growthMode,
      active
    };

    try {
      const res = await fetchWithAuth(`/api/habits/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/habits');
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update habit.");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Do you want to archive and delete this habit? All past logs will be deleted.")) return;
    try {
      const res = await fetchWithAuth(`/api/habits/${id}`, { method: 'DELETE' });
      if (res.ok) {
        navigate('/habits');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg p-6 fade-in pb-12">
      <header className="max-w-md mx-auto flex items-center justify-between py-4 border-b border-theme-border border-opacity-45">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="text-theme-muted hover:text-theme-text transition-colors p-1"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-extrabold text-theme-text">Edit Habit</h1>
        </div>

        <button
          onClick={handleDelete}
          className="text-rose hover:bg-rose-light hover:bg-opacity-10 p-2 rounded-xl transition-all"
        >
          <Trash2 size={16} />
        </button>
      </header>

      <main className="max-w-md mx-auto mt-6">
        <form onSubmit={handleSubmit} className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-4">
          
          {error && (
            <div className="p-3 bg-rose bg-opacity-10 border border-rose border-opacity-35 rounded-xl text-rose text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1">Habit name</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1">Tiny Goal</label>
            <input
              type="text"
              required
              value={tinyGoal}
              onChange={e => setTinyGoal(e.target.value)}
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
              <label className="text-xs font-semibold text-theme-text block mb-1">Growth mode</label>
              <select
                value={growthMode}
                onChange={e => setGrowthMode(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
              >
                {growthModes.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
              >
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekends">Weekends</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Time of day</label>
              <select
                value={preferredTime}
                onChange={e => setPreferredTime(e.target.value)}
                className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
              >
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
          </div>

          <SecurityToggle
            label="Active tracking status"
            checked={active}
            onChange={setActive}
            description="Archive or pause tracking this habit"
          />

          <SecurityToggle
            label="Enable notifications reminder"
            checked={reminderEnabled}
            onChange={setReminderEnabled}
            description="Alert me on my device at my preferred time"
          />

          <SunsetButton type="submit" variant="primary" loading={loading} className="w-full py-3 mt-4">
            Save Changes
          </SunsetButton>
        </form>
      </main>
    </div>
  );
};
