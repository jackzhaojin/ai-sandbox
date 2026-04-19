'use client';

import { useSettings } from '@/app/lib/SettingsStore';

export default function SettingsPage() {
  const { settings, toggleUnits, toggleTheme, setDefaultServings } = useSettings();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      <p className="mt-2 text-gray-600 dark:text-gray-400">
        Customize your recipe book experience
      </p>

      <div className="mt-8 space-y-6">
        {/* Measurement Units */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Measurement Units
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Choose how ingredient quantities are displayed
              </p>
            </div>
            <button
              onClick={toggleUnits}
              data-testid="toggle-units"
              aria-label="Toggle measurement units"
              className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{
                backgroundColor: settings.units === 'imperial' ? '#2563eb' : '#d1d5db',
              }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.units === 'imperial' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {(['metric', 'imperial'] as const).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => {
                  if (settings.units !== u) toggleUnits();
                }}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  settings.units === u
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {u === 'metric' ? 'Metric (g, ml)' : 'Imperial (oz, cups)'}
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Theme</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {settings.theme === 'light' ? 'Light' : 'Dark'}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              data-testid="toggle-theme"
              aria-label="Toggle theme"
              className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              style={{
                backgroundColor: settings.theme === 'dark' ? '#2563eb' : '#d1d5db',
              }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  settings.theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="mt-4 flex gap-2">
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (settings.theme !== t) toggleTheme();
                }}
                className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  settings.theme === t
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                {t === 'light' ? 'Day' : 'Night'}
              </button>
            ))}
          </div>
        </div>

        {/* Default Servings */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
          <label
            htmlFor="servings"
            className="block text-lg font-semibold text-gray-900 dark:text-white"
          >
            Default Servings
          </label>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Number of servings shown by default on recipe pages
          </p>
          <input
            id="servings"
            type="number"
            min={1}
            max={20}
            value={settings.defaultServings}
            onChange={(e) => setDefaultServings(Number(e.target.value))}
            data-testid="default-servings"
            className="mt-4 block w-32 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400"
          />
        </div>
      </div>
    </main>
  );
}
