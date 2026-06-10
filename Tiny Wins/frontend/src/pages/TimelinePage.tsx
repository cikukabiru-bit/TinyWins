import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { TimelineItem } from '../components/TimelineItem';
import { BottomNavigation } from '../components/BottomNavigation';
import { Sun, History } from 'lucide-react';

interface TimelineEvent {
  id: string;
  event_type: string;
  title: string;
  description?: string;
  event_date: string;
}

export const TimelinePage: React.FC = () => {
  const { fetchWithAuth } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await fetchWithAuth('/api/timeline');
        if (res.ok) {
          setEvents(await res.json());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  return (
    <div className="min-h-screen bg-theme-bg p-6 pb-28 fade-in">
      <header className="max-w-md mx-auto flex items-center justify-between py-4 border-b border-theme-border border-opacity-45">
        <div className="flex items-center gap-2">
          <div className="bg-peach rounded-xl p-1.5 text-orange"><Sun size={18} /></div>
          <h1 className="text-base font-extrabold text-theme-text">Growth Timeline</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto mt-6">
        {loading ? (
          <div className="text-center py-12 text-xs text-theme-muted">Loading timeline...</div>
        ) : events.length > 0 ? (
          <div className="bg-theme-card border border-theme-border rounded-3xl p-6 shadow-premium">
            <div className="flex flex-col">
              {events.map((e, index) => (
                <TimelineItem 
                  key={e.id}
                  event={e}
                  isLast={index === events.length - 1}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 border border-theme-border bg-theme-card text-center rounded-2xl shadow-premium">
            <p className="text-xs text-theme-muted">No timeline journal logs found yet. Complete a habit on your dashboard to log your first win!</p>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
};
