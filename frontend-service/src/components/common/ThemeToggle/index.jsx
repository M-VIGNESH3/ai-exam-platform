import React, { useState } from 'react';
import { usePlatform } from '../../../contexts/PlatformContext';
import { Sun, Moon, Laptop } from 'lucide-react';

const ThemeToggle = () => {
  const { theme, setTheme } = usePlatform();
  const [isOpen, setIsOpen] = useState(false);

  const getThemeIcon = (t) => {
    switch (t) {
      case 'light':
        return <Sun size={18} />;
      case 'dark':
        return <Moon size={18} />;
      case 'system':
      default:
        return <Laptop size={18} />;
    }
  };

  const handleThemeSelect = (t) => {
    setTheme(t);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem',
          borderRadius: 'var(--radius-md)'
        }}
        title="Switch Theme"
      >
        {getThemeIcon(theme)}
        <span style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}>{theme}</span>
      </button>

      {isOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 90
            }}
            onClick={() => setIsOpen(false)}
          />
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              padding: '0.25rem',
              minWidth: '120px'
            }}
          >
            <button
              onClick={() => handleThemeSelect('light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                border: 'none',
                background: theme === 'light' ? 'var(--color-primary-light)' : 'transparent',
                color: theme === 'light' ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                fontWeight: theme === 'light' ? '600' : '400'
              }}
            >
              <Sun size={16} />
              <span style={{ fontSize: '0.8rem' }}>Light</span>
            </button>
            <button
              onClick={() => handleThemeSelect('dark')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                border: 'none',
                background: theme === 'dark' ? 'var(--color-primary-light)' : 'transparent',
                color: theme === 'dark' ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                fontWeight: theme === 'dark' ? '600' : '400'
              }}
            >
              <Moon size={16} />
              <span style={{ fontSize: '0.8rem' }}>Dark</span>
            </button>
            <button
              onClick={() => handleThemeSelect('system')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                border: 'none',
                background: theme === 'system' ? 'var(--color-primary-light)' : 'transparent',
                color: theme === 'system' ? 'var(--color-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'left',
                fontWeight: theme === 'system' ? '600' : '400'
              }}
            >
              <Laptop size={16} />
              <span style={{ fontSize: '0.8rem' }}>System</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeToggle;
