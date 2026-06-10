import React from 'react';
import { Sun } from 'lucide-react';

interface StreakBadgeProps {
  streak: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, size = 'md' }) => {
  const isZero = streak === 0;

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2'
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20
  };

  return (
    <div className={`inline-flex items-center rounded-full font-medium transition-all duration-300
      ${isZero 
        ? 'bg-theme-border text-theme-muted border border-theme-border border-opacity-60' 
        : 'bg-gradient-to-r from-orange-light to-coral text-white shadow-soft-coral'
      } ${sizes[size]}`}>
      <Sun 
        size={iconSizes[size]} 
        className={`${isZero ? 'text-theme-muted' : 'animate-spin-slow text-yellow'} flex-shrink-0`}
        style={{ animationDuration: '12s' }}
      />
      <span>{streak} {streak === 1 ? 'day' : 'days'}</span>
    </div>
  );
};
