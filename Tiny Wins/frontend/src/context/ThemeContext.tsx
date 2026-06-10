import React, { createContext, useContext, useState, useEffect } from 'react';

export type SunsetTheme = 'sunset' | 'peach' | 'plum' | 'cream';

interface ThemeContextProps {
  theme: SunsetTheme;
  setTheme: (theme: SunsetTheme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<SunsetTheme>(() => {
    const saved = localStorage.getItem('tinywins_theme');
    return (saved as SunsetTheme) || 'sunset';
  });

  const setTheme = (newTheme: SunsetTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('tinywins_theme', newTheme);
  };

  useEffect(() => {
    // Remove existing themes
    document.body.classList.remove('theme-sunset', 'theme-peach', 'theme-plum', 'theme-cream');
    // Add new theme class
    document.body.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};
