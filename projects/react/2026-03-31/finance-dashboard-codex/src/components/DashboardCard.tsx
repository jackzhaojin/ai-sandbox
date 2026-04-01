import type { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  eyebrow?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardCard({
  title,
  eyebrow,
  action,
  children,
  className = '',
}: DashboardCardProps) {
  return (
    <section
      className={`surface-card rounded-[28px] p-5 transition-transform duration-300 hover:-translate-y-0.5 sm:p-6 ${className}`}
    >
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--text-muted)]">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="font-display text-2xl tracking-[-0.04em] text-[var(--text-primary)]">
            {title}
          </h2>
        </div>
        {action ? <div>{action}</div> : null}
      </header>
      {children}
    </section>
  )
}
