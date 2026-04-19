'use client';

import { useEffect } from 'react';
import { useSettings } from '@/app/lib/SettingsStore';
import { Header } from './Header';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  return (
    <>
      <Header />
      <div className="flex-1">{children}</div>
    </>
  );
}
