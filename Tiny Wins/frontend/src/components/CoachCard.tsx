import React from 'react';
import { Sparkles, Check, CheckCircle2 } from 'lucide-react';

interface CoachCardProps {
  message: {
    id: string;
    message: string;
    message_type: string; // 'daily', 'weekly_review', 'suggestion'
    accepted: boolean;
    created_at: string;
  };
  onAccept?: () => void;
  isAccepting?: boolean;
}

export const CoachCard: React.FC<CoachCardProps> = ({
  message,
  onAccept,
  isAccepting = false
}) => {
  const isSuggestion = message.message_type === 'suggestion';
  const formattedDate = new Date(message.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className={`p-5 rounded-3xl border transition-all duration-300 relative fade-in
      ${isSuggestion 
        ? 'border-peach bg-peach-light bg-opacity-35 shadow-soft-peach' 
        : 'border-theme-border bg-theme-card shadow-soft-peach'
      }`}>
      
      {/* Bot Icon */}
      <div className="flex items-center gap-3">
        <div className="bg-gradient-to-tr from-orange to-coral text-white p-2 rounded-2xl shadow-soft-coral flex-shrink-0 animate-pulse-slow">
          <Sparkles size={16} />
        </div>
        <div>
          <h4 className="text-xs font-bold text-theme-text">Tiny Coach</h4>
          <span className="text-[10px] text-theme-muted">{formattedDate}</span>
        </div>
      </div>

      {/* Message content */}
      <p className="text-sm font-medium text-theme-text mt-4 leading-relaxed italic">
        “{message.message}”
      </p>

      {/* If suggestion and not yet accepted, offer action */}
      {isSuggestion && (
        <div className="mt-4 pt-3.5 border-t border-peach border-opacity-40 flex items-center justify-between">
          <span className="text-[10px] text-warm-brown opacity-80 italic">Ready to adjust?</span>
          
          {message.accepted ? (
            <span className="text-xs font-bold text-orange flex items-center gap-1">
              <CheckCircle2 size={14} className="stroke-[2.5]" /> Suggestion accepted
            </span>
          ) : (
            onAccept && (
              <button
                onClick={onAccept}
                disabled={isAccepting}
                className="py-1.5 px-4 bg-orange hover:bg-orange-dark text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all active:scale-95 shadow-soft-coral disabled:opacity-50"
              >
                {isAccepting ? "Accepting..." : "Try this step"} <Check size={12} className="stroke-[2.5]" />
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
};
