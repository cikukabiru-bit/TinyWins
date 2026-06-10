import React from 'react';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showText?: boolean;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 72,
  strokeWidth = 6,
  showText = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          className="text-theme-border"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Foreground progress circle */}
        <circle
          className="text-coral transition-all duration-700 ease-out"
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showText && (
        <div className="absolute text-center">
          <span className="text-xs font-semibold text-theme-text">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  );
};
