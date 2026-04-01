import { Bell, ChevronRight, MoonStar, Search, SunMedium } from 'lucide-react'

import type { Theme } from '../types/finance'

interface HeaderProps {
  currentDate: string
  theme: Theme
  userName: string
  onToggleTheme: () => void
}

export function Header({
  currentDate,
  theme,
  userName,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="surface-card rounded-[32px] px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-secondary)]">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Financial command center
          </div>
          <h1 className="font-display text-4xl tracking-[-0.06em] text-[var(--text-primary)] sm:text-5xl">
            Good evening, {userName}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-[var(--text-secondary)] sm:text-base">
            Your liquidity is strong, discretionary spend is trending down, and
            investments are pacing ahead of plan heading into month end.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:w-[29rem]">
          <div className="surface-subtle rounded-3xl p-4">
            <div className="mb-3 inline-flex rounded-2xl bg-[var(--surface-muted)] p-2 text-[var(--text-primary)]">
              <Bell size={18} />
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Today
            </p>
            <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
              {currentDate}
            </p>
          </div>

          <button
            type="button"
            className="surface-subtle group rounded-3xl p-4 text-left transition duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
          >
            <div className="mb-3 inline-flex rounded-2xl bg-[var(--surface-muted)] p-2 text-[var(--text-primary)]">
              <Search size={18} />
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Focus
            </p>
            <div className="mt-2 flex items-center justify-between gap-2 text-sm font-semibold text-[var(--text-primary)]">
              Spend anomalies
              <ChevronRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </div>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="surface-subtle group rounded-3xl p-4 text-left transition duration-300 hover:border-[var(--border-strong)] hover:bg-[var(--surface-muted)]"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            <div className="mb-3 inline-flex rounded-2xl bg-[var(--surface-muted)] p-2 text-[var(--text-primary)]">
              {theme === 'light' ? (
                <MoonStar size={18} />
              ) : (
                <SunMedium size={18} />
              )}
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Theme
            </p>
            <div className="mt-2 flex items-center justify-between gap-2 text-sm font-semibold text-[var(--text-primary)]">
              {theme === 'light' ? 'Enable dark mode' : 'Enable light mode'}
              <ChevronRight
                size={16}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
