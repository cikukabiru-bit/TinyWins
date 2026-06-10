import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ContentCard } from '../components/InspirationCards';
import { SunsetButton } from '../components/SunsetButton';
import { ArrowLeft, Plus, Globe, Link, AlertCircle } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  category: string;
  type: string;
  url: string;
  platform?: string;
  short_description?: string;
  estimated_duration?: string;
  is_favourite: boolean;
  is_user_added: boolean;
}

export const SupportLinksPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchWithAuth } = useAuth();

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'all' | 'favourites'>('all');

  // Custom link states
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Fitness');
  const [type, setType] = useState('video');
  const [desc, setDesc] = useState('');
  const [duration, setDuration] = useState('5m');

  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const res = await fetchWithAuth('/api/content');
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

  const handleAddLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !url.trim()) {
      setError("Title and URL are required");
      return;
    }

    try {
      const res = await fetchWithAuth('/api/content', {
        method: 'POST',
        body: JSON.stringify({
          title,
          url,
          category,
          type,
          short_description: desc,
          estimated_duration: duration
        })
      });

      if (res.ok) {
        setTitle('');
        setUrl('');
        setDesc('');
        setShowForm(false);
        fetchItems();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add support link");
      }
    } catch (err) {
      setError("Network error");
    }
  };

  const handleFavourite = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/content/${id}/favourite`, { method: 'POST' });
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
          <h1 className="text-base font-extrabold text-theme-text">Support Links</h1>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="text-coral hover:bg-peach-light hover:bg-opacity-20 p-2 rounded-xl transition-all"
        >
          <Plus size={18} />
        </button>
      </header>

      <main className="max-w-md mx-auto mt-6 space-y-6">
        
        {/* Toggle form slider */}
        {showForm && (
          <form onSubmit={handleAddLink} className="p-5 border border-theme-border bg-theme-card rounded-2xl shadow-premium space-y-4">
            <span className="text-xs font-bold text-theme-text block border-b border-theme-border pb-2">Add Support Link</span>

            {error && (
              <div className="p-2.5 bg-rose bg-opacity-10 border border-rose border-opacity-35 rounded-xl text-rose text-xs font-semibold flex items-center gap-1">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Resource Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Morning Yoga flow"
                className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Web Address (URL)</label>
              <input
                type="url"
                required
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://youtube.com/..."
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
                  <option value="Fitness">Fitness</option>
                  <option value="Health">Health</option>
                  <option value="Focus">Focus</option>
                  <option value="Prayer/Spirituality">Prayer/Spirituality</option>
                  <option value="Sleep">Sleep</option>
                  <option value="Self-care">Self-care</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-theme-text block mb-1">Resource Type</label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value)}
                  className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
                >
                  <option value="video">Video</option>
                  <option value="playlist">Playlist</option>
                  <option value="song">Song</option>
                  <option value="breathing">Breathing guide</option>
                  <option value="article">Article</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-theme-text block mb-1">Short Description</label>
              <input
                type="text"
                value={desc}
                onChange={e => setDesc(e.target.value)}
                placeholder="What is this link for?"
                className="w-full text-xs p-3 rounded-xl border border-theme-border bg-theme-bg text-theme-text focus:outline-none"
              />
            </div>

            <SunsetButton type="submit" variant="primary" className="w-full mt-2">
              Save Resource Link
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
            All Resources
          </button>
          <button
            onClick={() => setTab('favourites')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all
              ${tab === 'favourites' ? 'bg-gradient-to-tr from-orange to-coral text-white shadow-soft-coral' : 'text-theme-muted'}`}
          >
            Favourites
          </button>
        </div>

        {/* Directory Grid */}
        {loading ? (
          <div className="text-center py-12 text-xs text-theme-muted">Loading support links...</div>
        ) : filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {filteredItems.map(item => (
              <ContentCard
                key={item.id}
                content={item}
                onFavourite={() => handleFavourite(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-theme-border bg-theme-card rounded-2xl shadow-premium text-xs text-theme-muted">
            No links found in this filter category.
          </div>
        )}

        {/* Disclaimer */}
        <div className="text-[10px] text-theme-muted text-center italic p-4 bg-theme-bg border border-theme-border border-opacity-50 rounded-2xl">
          “Support links open outside TinyWins. Choose what feels supportive for you.”
        </div>
      </main>
    </div>
  );
};
