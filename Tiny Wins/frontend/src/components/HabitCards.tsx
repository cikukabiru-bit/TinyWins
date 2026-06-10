import React from 'react';
import { Check, Flame, Clock, Heart, Award, ArrowUpRight, Plus, HelpCircle, Activity, Compass, Moon, DollarSign, Target as FocusIcon } from 'lucide-react';
import { StreakBadge } from './StreakBadge';

// Helper to match category to Lucide icons
export const getCategoryIcon = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('fitness') || cat.includes('health')) return <Activity size={18} />;
  if (cat.includes('prayer') || cat.includes('spiritual')) return <Compass size={18} />;
  if (cat.includes('sleep')) return <Moon size={18} />;
  if (cat.includes('money') || cat.includes('finance')) return <DollarSign size={18} />;
  if (cat.includes('focus') || cat.includes('productivity') || cat.includes('work')) return <FocusIcon size={18} />;
  return <Heart size={18} />;
};

// ==========================================
// 1. DASHBOARD HABIT CARD
// ==========================================
interface HabitCardProps {
  habit: {
    id: string;
    name: string;
    category: string;
    tiny_goal: string;
    frequency: string;
    preferred_time?: string;
    reminder_enabled: boolean;
  };
  streak: number;
  completedToday: boolean;
  onCheckIn: () => void;
  onOpenReflection?: () => void;
  onViewSupport?: () => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  streak,
  completedToday,
  onCheckIn,
  onOpenReflection,
  onViewSupport
}) => {
  return (
    <div className={`p-5 rounded-2xl border transition-all duration-300 bg-theme-card relative overflow-hidden
      ${completedToday 
        ? 'border-peach border-opacity-40 shadow-soft-peach' 
        : 'border-theme-border hover:shadow-premium hover:border-peach hover:border-opacity-30'
      }`}>
      
      {/* Background soft glow when completed */}
      {completedToday && (
        <div className="absolute inset-0 bg-peach-light bg-opacity-10 pointer-events-none" />
      )}

      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1 pr-4">
          <div className="flex items-center gap-2 text-theme-muted">
            <span className="text-coral bg-peach bg-opacity-30 p-1.5 rounded-lg">
              {getCategoryIcon(habit.category)}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider">{habit.category}</span>
          </div>

          <h3 className="text-base font-bold text-theme-text mt-3">{habit.name}</h3>
          <p className="text-xs text-theme-muted mt-1 italic">
            Goal: {habit.tiny_goal}
          </p>

          <div className="flex items-center gap-3 mt-4 text-[11px] text-theme-muted">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {habit.preferred_time || 'flexible'}
            </span>
            <span className="w-1 h-1 bg-theme-border rounded-full" />
            <span className="capitalize">{habit.frequency}</span>
          </div>
        </div>

        {/* Big Check-in circle */}
        <button
          onClick={onCheckIn}
          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-300 active:scale-90 flex-shrink-0
            ${completedToday 
              ? 'bg-gradient-to-r from-orange to-coral border-transparent text-white shadow-soft-coral' 
              : 'border-theme-border text-transparent hover:border-coral bg-theme-bg'
            }`}
        >
          {completedToday ? <Check size={20} className="stroke-[3]" /> : <Check size={20} className="stroke-[2] text-theme-border hover:text-coral" />}
        </button>
      </div>

      {/* Footer statistics and options */}
      <div className="border-t border-theme-border border-opacity-40 mt-4 pt-3.5 flex items-center justify-between relative z-10">
        <StreakBadge streak={streak} size="sm" />
        
        <div className="flex items-center gap-3">
          {completedToday && onOpenReflection && (
            <button
              onClick={onOpenReflection}
              className="text-[11px] font-semibold text-coral hover:text-coral-dark underline flex items-center gap-0.5"
            >
              Reflection
            </button>
          )}
          {onViewSupport && (
            <button
              onClick={onViewSupport}
              className="text-[11px] font-semibold text-theme-muted hover:text-theme-text flex items-center gap-0.5"
            >
              Support link <ArrowUpRight size={10} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 2. RECOMMENDATION CARD
// ==========================================
interface RecommendationCardProps {
  recommendation: {
    name: string;
    category: string;
    tiny_goal: string;
    frequency: string;
    growth_mode: string;
    reason: string;
  };
  onAdd: () => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAdd
}) => {
  return (
    <div className="p-4 rounded-2xl border border-theme-border bg-theme-card hover:border-peach transition-all shadow-premium flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-coral bg-peach bg-opacity-20 p-1.5 rounded-lg">
            {getCategoryIcon(recommendation.category)}
          </span>
          <span className="text-xs font-semibold text-theme-muted uppercase tracking-wider">{recommendation.category}</span>
        </div>
        
        <h4 className="text-sm font-bold text-theme-text mt-3">{recommendation.name}</h4>
        <p className="text-xs text-theme-text opacity-95 mt-1 italic">
          “{recommendation.tiny_goal}”
        </p>
        <p className="text-[11px] text-theme-muted mt-2 leading-relaxed bg-theme-bg p-2.5 rounded-xl border border-theme-border border-opacity-50">
          {recommendation.reason}
        </p>
      </div>

      <button
        onClick={onAdd}
        className="w-full mt-4 py-2 px-3 bg-peach bg-opacity-30 hover:bg-peach text-warm-brown text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
      >
        <Plus size={14} /> Add this tiny win
      </button>
    </div>
  );
};

// ==========================================
// 3. WEEKLY REVIEW METRICS CARD
// ==========================================
interface WeeklyReviewCardProps {
  wins: number;
  streak: number;
  blocker?: string;
  coachNote?: string;
  onClose?: () => void;
}

export const WeeklyReviewCard: React.FC<WeeklyReviewCardProps> = ({
  wins,
  streak,
  blocker = 'unknown',
  coachNote,
  onClose
}) => {
  return (
    <div className="p-6 rounded-3xl border border-peach border-opacity-40 bg-theme-card shadow-soft-peach fade-in text-center max-w-sm mx-auto">
      <div className="w-14 h-14 bg-gradient-to-tr from-yellow to-peach rounded-2xl flex items-center justify-center text-orange mx-auto shadow-soft-peach mb-4">
        <Award size={28} />
      </div>

      <h3 className="text-lg font-extrabold text-theme-text">Your Weekly Review</h3>
      <p className="text-xs text-theme-muted mt-0.5">Quiet steps of consistent growth</p>

      {/* Review Metrics Row */}
      <div className="grid grid-cols-2 gap-4 my-5">
        <div className="bg-theme-bg p-3.5 rounded-2xl border border-theme-border">
          <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Wins This Week</span>
          <span className="block text-2xl font-black text-coral mt-1">{wins} times</span>
        </div>
        <div className="bg-theme-bg p-3.5 rounded-2xl border border-theme-border">
          <span className="text-[10px] font-semibold text-theme-muted uppercase tracking-wider">Top Streak</span>
          <span className="block text-2xl font-black text-orange mt-1">{streak} days</span>
        </div>
      </div>

      {coachNote && (
        <div className="bg-peach-light bg-opacity-40 rounded-2xl p-4 text-left border border-peach border-opacity-30">
          <span className="text-[10px] font-bold text-orange uppercase tracking-wider">Tiny Coach Reflection</span>
          <p className="text-xs text-warm-brown mt-1.5 leading-relaxed font-medium">
            {coachNote}
          </p>
        </div>
      )}

      {onClose && (
        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 bg-gradient-to-r from-orange to-coral text-white text-xs font-bold rounded-xl shadow-soft-coral hover:scale-[1.01] transition-all active:scale-[0.98]"
        >
          Grow with Grace
        </button>
      )}
    </div>
  );
};
