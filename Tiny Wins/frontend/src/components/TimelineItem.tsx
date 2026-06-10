import React from 'react';
import { Calendar, CheckCircle2, AlertCircle, Sparkles, HelpCircle, Edit2, Archive } from 'lucide-react';

interface TimelineItemProps {
  event: {
    id: string;
    event_type: string; // 'completed', 'missed', 'restarted', 'edited', 'habit_created', etc.
    title: string;
    description?: string;
    event_date: string;
  };
  isLast?: boolean;
}

export const TimelineItem: React.FC<TimelineItemProps> = ({ event, isLast = false }) => {
  const getEventStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'completed':
        return {
          icon: <CheckCircle2 size={16} className="text-white" />,
          bgColor: 'bg-coral shadow-soft-coral',
          borderColor: 'border-coral'
        };
      case 'missed':
        return {
          icon: <AlertCircle size={16} className="text-white" />,
          bgColor: 'bg-rose shadow-soft-peach',
          borderColor: 'border-rose'
        };
      case 'coach_suggestion_accepted':
      case 'score_converted':
        return {
          icon: <Sparkles size={16} className="text-white" />,
          bgColor: 'bg-yellow shadow-soft-peach',
          borderColor: 'border-yellow'
        };
      case 'habit_created':
        return {
          icon: <CheckCircle2 size={16} className="text-white" />,
          bgColor: 'bg-orange',
          borderColor: 'border-orange'
        };
      case 'habit_edited':
        return {
          icon: <Edit2 size={14} className="text-white" />,
          bgColor: 'bg-theme-muted',
          borderColor: 'border-theme-border'
        };
      default:
        return {
          icon: <HelpCircle size={16} className="text-white" />,
          bgColor: 'bg-theme-border',
          borderColor: 'border-theme-border'
        };
    }
  };

  const config = getEventStyle(event.event_type);
  const formattedDate = new Date(event.event_date).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex gap-4 group">
      {/* Node column */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 flex-shrink-0 ${config.bgColor}`}>
          {config.icon}
        </div>
        {!isLast && (
          <div className="w-0.5 flex-1 bg-theme-border bg-opacity-65 -my-1 min-h-[40px] group-hover:bg-coral group-hover:bg-opacity-30 transition-all duration-300" />
        )}
      </div>

      {/* Details column */}
      <div className="flex-1 pb-6 mt-0.5">
        <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider block">
          {formattedDate}
        </span>
        <h4 className="text-sm font-bold text-theme-text mt-1">{event.title}</h4>
        {event.description && (
          <p className="text-xs text-theme-muted mt-1 leading-relaxed max-w-sm">
            {event.description}
          </p>
        )}
      </div>
    </div>
  );
};
