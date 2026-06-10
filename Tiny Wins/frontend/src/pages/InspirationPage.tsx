import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { InspirationCard } from '../components/InspirationCards';
import { SunsetButton } from '../components/SunsetButton';
import { ArrowLeft, Plus, AlertCircle } from 'lucide-react';

interface InspirationItem {
  id: string;
  text: string;
  author?: string;
  type: string;
  tone?: string;
  is_favourite: boolean;
  is_user_added: boolean;
}

export const InspirationPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();

  const [items, setItems] = useState<InspirationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'favourites'>('all');

  // Custom quote form states
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('');
  const [type, setType] = useState('quote');
  const [tone, setTone] = useState('Calm');

  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetchWithAuth('/api/inspiration');
      if (res.ok) {
        setItems(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleAddQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!text.trim()) {
      setError("Inspiration text is required");
      return;
    }

    try {
      const res = await fetchWithAuth('/api/inspiration', {
        method: 'POST',
        body: JSON.stringify({
          text,
          author: author || 'User Private',
          type,
          tone
        })
      });

      if (res.ok) {
        setText('');
        setAuthor('');
        setShowForm(false);
        fetchItems();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save quote.");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleFavourite = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/inspiration/${id}/favourite`, { method: 'POST' });
      if (res.ok) {
        fetchItems();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredItems = tab === 'all' ? items : items.filter(i => i.is_favourite);

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
          <h1 className="text-base font-extrabold text-theme-text">Inspiration</h1>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="text-coral hover:bg-peach-light hover:bg-opacity-20 p-2 rounded-xl transition-all"
        >
          <Plus size={18} />
        </button>
      </header>

      <main className="max-w-md mx-auto mt-6 space-y-6">
        
        {/* Quote Form */}
        {showForm && (
          <form onSubmit={handleAddQuote} className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-4">
            <span className="text-xs font-bold text-theme-text block border-b border-theme-border pb-2">Add Inspiration Quote</span>

            {error && (
              <div className="p-2.5 bg-rose bg-opacity-10 border border-rose border-opacity-35 rounded-xl text-rose text-xs font-semibold flex items-center gap-1">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Quote text</label>
              <textarea
                required
                rows={3}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Write your private quote or calm reflection..."
                className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none resize-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Author / Source</label>
                <input
                  type="text"
                  value={author}
                  onChange={e => setAuthor(e.target.value)}
                  placeholder="e.g. Saint Augustine (optional)"
                  className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Quote Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                >
                  <option value="quote">General Quote</option>
                  <option value="reflection">Calm Reflection</option>
                  <option value="prompt">Action Prompt</option>
                </select>
              </div>
            </div>

            <SunsetButton type="submit" variant="primary" className="w-full mt-2">
              Save Inspiration
            </SunsetButton>
          </form>
        )}

        {/* Tabs */}
        <div className="flex gap-2.5 bg-theme-card border border-theme-border p-1 rounded-2xl shadow-soft-peach w-full">
          <button
            onClick={() => setTab('all')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all
              ${tab === 'all' ? 'bg-gradient-to-tr from-orange to-coral text-white shadow-soft-coral' : 'text-theme-muted'}`}
          >
            All Quotes
          </button>
          <button
            onClick={() => setTab('favourites')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all
              ${tab === 'favourites' ? 'bg-gradient-to-tr from-orange to-coral text-white shadow-soft-coral' : 'text-theme-muted'}`}
          >
            Favourites
          </button>
        </div>

        {/* Quotes list */}
        {loading ? (
          <div className="text-center py-12 text-xs text-theme-muted">Loading inspiration...</div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map(item => (
              <InspirationCard
                key={item.id}
                inspiration={item}
                onFavourite={() => handleFavourite(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-theme-border bg-theme-card rounded-2xl shadow-premium text-xs text-theme-muted">
            No items found. Click the '+' button to add your first private reflection.
          </div>
        )}
      </main>
    </div>
  );
};
