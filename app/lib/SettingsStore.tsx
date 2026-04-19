'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';

export interface AppSettings {
  units: 'metric' | 'imperial';
  theme: 'light' | 'dark';
  defaultServings: number;
}

interface SettingsStoreValue {
  settings: AppSettings;
  toggleUnits: () => void;
  toggleTheme: () => void;
  setDefaultServings: (servings: number) => void;
}

const STORAGE_KEY = 'recipe-book:settings';

const DEFAULT_SETTINGS: AppSettings = {
  units: 'metric',
  theme: 'light',
  defaultServings: 4,
};

const SettingsStoreContext = createContext<SettingsStoreValue | null>(null);

function loadSettings(): AppSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return {
        units: parsed.units === 'imperial' ? 'imperial' : 'metric',
        theme: parsed.theme === 'dark' ? 'dark' : 'light',
        defaultServings: typeof parsed.defaultServings === 'number' ? parsed.defaultServings : DEFAULT_SETTINGS.defaultServings,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }
  return DEFAULT_SETTINGS;
}

export function SettingsStoreProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const persist = useCallback((updater: (prev: AppSettings) => AppSettings) => {
    setSettings(prev => {
      const next = updater(prev);
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const toggleUnits = useCallback(() => {
    persist(prev => ({
      ...prev,
      units: prev.units === 'metric' ? 'imperial' : 'metric',
    }));
  }, [persist]);

  const toggleTheme = useCallback(() => {
    persist(prev => ({
      ...prev,
      theme: prev.theme === 'light' ? 'dark' : 'light',
    }));
  }, [persist]);

  const setDefaultServings = useCallback((servings: number) => {
    persist(prev => ({
      ...prev,
      defaultServings: servings,
    }));
  }, [persist]);

  const value = useMemo(
    () => ({
      settings,
      toggleUnits,
      toggleTheme,
      setDefaultServings,
    }),
    [settings, toggleUnits, toggleTheme, setDefaultServings]
  );

  return (
    <SettingsStoreContext.Provider value={value}>
      {children}
    </SettingsStoreContext.Provider>
  );
}

export function useSettings(): SettingsStoreValue {
  const ctx = useContext(SettingsStoreContext);
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsStoreProvider');
  }
  return ctx;
}
