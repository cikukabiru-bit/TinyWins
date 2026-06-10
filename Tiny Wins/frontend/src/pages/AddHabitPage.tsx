import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SunsetButton } from '../components/SunsetButton';
import { SecurityToggle } from '../components/SecurityComponents';
import { ArrowLeft, Target } from 'lucide-react';

export const AddHabitPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Self-care');
  const [tinyGoal, setTinyGoal] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [preferredTime, setPreferredTime] = useState('morning');
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [growthMode, setGrowthMode] = useState('Keep tiny');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = ["Health", "Fitness", "Sleep", "Focus", "Learning", "Prayer/Spirituality", "Money", "Work/Productivity", "Self-care", "Relationships", "Emotional wellbeing"];
  const growthModes = ["Keep tiny", "Increase slowly", "Let Tiny Coach suggest"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      name,
      category,
      tiny_goal: tinyGoal || `Spend 2 minutes on ${name}`,
      frequency,
      preferred_time: preferredTime,
      reminder_enabled: reminderEnabled,
      growth_mode: growthMode
    };

    try {
      const res = await fetchWithAuth('/api/habits', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        navigate('/today');
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create habit.");
      }
    } catch (err) {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg p-6 fade-in pb-12">
      <header className="max-w-md mx-auto flex items-center gap-3 py-4 border-b border-theme-border border-opacity-45">
        <button 
          onClick={() => navigate(-1)} 
          className="text-theme-muted hover:text-theme-text transition-colors p-1"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-base font-extrabold text-theme-text">Create Tiny Habit</h1>
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
              placeholder="e.g. Daily Meditation, Save Money, Stretch"
              className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-theme-text block mb-1">Stated Tiny Goal</label>
            <input
              type="text"
              required
              value={tinyGoal}
              onChange={e => setTinyGoal(e.target.value)}
              placeholder="e.g. Stretch for exactly 2 minutes"
              className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
            />
            <span className="text-[10px] text-theme-muted mt-1 block italic">Pair it with a trigger: "After brushing teeth, I will..."</span>
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
                <option value="weekdays">Weekdays (Mon-Fri)</option>
                <option value="weekends">Weekends (Sat-Sun)</option>
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
            label="Enable notifications reminder"
            checked={reminderEnabled}
            onChange={setReminderEnabled}
            description="Alert me on my device at my preferred time"
          />

          <SunsetButton type="submit" variant="primary" loading={loading} className="w-full py-3 mt-4">
            Create Habit Gently
          </SunsetButton>
        </form>
      </main>
    </div>
  );
};
