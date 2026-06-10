import React from 'react';
import { NavLink } from 'react-router-dom';
import { Sun, Target, History, Sparkles, Compass } from 'lucide-react';

export const BottomNavigation: React.FC = () => {
  const tabs = [
    { name: 'Today', path: '/today', icon: Sun },
    { name: 'Habits', path: '/habits', icon: Target },
    { name: 'Timeline', path: '/timeline', icon: History },
    { name: 'Coach', path: '/coach', icon: Sparkles },
    { name: 'Library', path: '/library', icon: Compass }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-theme-nav border-t border-theme-border py-2 px-4 z-40 shadow-premium pb-safe-bottom">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.name}
              to={tab.path}
              className={({ isActive }) => `flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all duration-300 gap-0.5
                ${isActive 
                  ? 'text-coral scale-105 font-medium' 
                  : 'text-theme-muted hover:text-theme-text'
                }`
              }
            >
              <Icon size={20} className="stroke-[2.2]" />
              <span className="text-[10px] tracking-wide">{tab.name}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
