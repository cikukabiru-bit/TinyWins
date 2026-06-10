import React from 'react';

interface SunsetButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const SunsetButton: React.FC<SunsetButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading,
  className = '',
  ...props
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  
  const variants = {
    primary: 'btn-sunset font-semibold text-white shadow-soft-coral',
    secondary: 'bg-peach-light hover:bg-peach text-warm-brown border border-peach border-opacity-40 hover:scale-[1.01] shadow-soft-peach',
    outline: 'border border-theme-border text-theme-text bg-transparent hover:bg-theme-card hover:scale-[1.01]',
    danger: 'bg-rose hover:bg-rose-dark text-white hover:scale-[1.01]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base'
  };

  return (
    <button
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
};
