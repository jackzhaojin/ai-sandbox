import { Sun, Moon, User } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const Header = ({ theme, toggleTheme }: HeaderProps) => {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="bg-[var(--card)] border-b border-[var(--border)] px-4 sm:px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--primary)] flex items-center justify-center">
            <User className="w-5 h-5 text-[var(--primary-foreground)]" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              {greeting}, Alex
            </h1>
            <p className="text-sm text-[var(--muted-foreground)]">{today}</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:bg-[var(--accent)] transition-colors duration-200"
          aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
};
