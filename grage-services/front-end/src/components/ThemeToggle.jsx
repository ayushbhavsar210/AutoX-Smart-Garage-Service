import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

function ThemeToggle() {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Toggle ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <>
          <span className="theme-icon">☀️</span>
          <span className="theme-label">Light</span>
        </>
      ) : (
        <>
          <span className="theme-icon">🌙</span>
          <span className="theme-label">Dark</span>
        </>
      )}
    </button>
  );
}

export default ThemeToggle;
