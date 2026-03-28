'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun, Bell, BellOff } from 'lucide-react';

export default function SettingsPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    // Load saved preferences
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const savedNotifications = localStorage.getItem('notifications');

    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      }
    }

    if (savedNotifications !== null) {
      setNotifications(savedNotifications === 'true');
    }
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleNotificationsChange = (enabled: boolean) => {
    setNotifications(enabled);
    localStorage.setItem('notifications', enabled.toString());
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Settings
      </h1>

      <div className="space-y-6">
        {/* Theme Setting */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Theme Preference
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleThemeChange('light')}
              className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition ${
                theme === 'light'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Sun className="w-5 h-5" />
              <span className="font-medium">Light</span>
            </button>

            <button
              onClick={() => handleThemeChange('dark')}
              className={`flex items-center justify-center space-x-2 p-4 rounded-lg border-2 transition ${
                theme === 'dark'
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <Moon className="w-5 h-5" />
              <span className="font-medium">Dark</span>
            </button>
          </div>
        </div>

        {/* Notifications Setting */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Notifications
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Enable or disable message notifications
              </p>
            </div>

            <button
              onClick={() => handleNotificationsChange(!notifications)}
              className={`relative inline-flex h-12 w-20 items-center rounded-full transition ${
                notifications
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-flex h-10 w-10 transform items-center justify-center rounded-full bg-white shadow-lg transition ${
                  notifications ? 'translate-x-9' : 'translate-x-1'
                }`}
              >
                {notifications ? (
                  <Bell className="w-5 h-5 text-purple-600" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-400" />
                )}
              </span>
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            About
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>Chat App v1.0.0</p>
            <p>Full-stack conversational chat application</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-4">
              Built with Next.js, SQLite, and TailwindCSS
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
