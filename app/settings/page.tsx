'use client';

import { useSettings } from '@/app/lib/SettingsStore';

export default function SettingsPage() {
  const { settings, toggleUnits, toggleTheme, setDefaultServings } = useSettings();

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="mt-6 space-y-4 max-w-md">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Units</p>
            <p className="text-sm text-gray-600">
              {settings.units === 'metric' ? 'Metric (g, ml)' : 'Imperial (oz, cups)'}
            </p>
          </div>
          <button
            onClick={toggleUnits}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            data-testid="toggle-units"
          >
            Toggle
          </button>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm text-gray-600">
              {settings.theme === 'light' ? 'Light' : 'Dark'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            data-testid="toggle-theme"
          >
            Toggle
          </button>
        </div>

        <div className="rounded-lg border p-4">
          <label htmlFor="servings" className="block font-medium">
            Default Servings
          </label>
          <input
            id="servings"
            type="number"
            min={1}
            max={20}
            value={settings.defaultServings}
            onChange={e => setDefaultServings(Number(e.target.value))}
            className="mt-2 w-full rounded-md border px-3 py-2"
            data-testid="default-servings"
          />
        </div>
      </div>
    </main>
  );
}
