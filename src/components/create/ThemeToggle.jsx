'use client';

import { useSyncExternalStore } from 'react';
import { Moon, Sun } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { getTheme, subscribeTheme, switchTheme } from '@/lib/theme';

export function ThemeToggle({ className }) {
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => 'light');

  const toggle = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    switchTheme(theme === 'dark' ? 'light' : 'dark', { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <IconButton
      label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      icon={theme === 'dark' ? Sun : Moon}
      onClick={toggle}
      className={className}
    />
  );
}
