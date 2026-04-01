import { BudgetProgress } from './components/BudgetProgress'
import { CategoryChart } from './components/CategoryChart'
import { Header } from './components/Header'
import { SummaryCards } from './components/SummaryCards'
import { TransactionsTable } from './components/TransactionsTable'
import { TrendChart } from './components/TrendChart'
import { dashboardData } from './data/financeData'
import { useTheme } from './hooks/useTheme'

function App() {
  const { theme, toggleTheme } = useTheme()
  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="pointer-events-none absolute inset-0 opacity-95">
        <div className="absolute -left-32 top-0 h-72 w-72 rounded-full bg-[radial-gradient(circle,_rgba(22,163,74,0.18),_transparent_68%)] blur-3xl" />
        <div className="absolute right-0 top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,_rgba(15,23,42,0.12),_transparent_62%)] blur-3xl dark:bg-[radial-gradient(circle,_rgba(14,165,233,0.18),_transparent_62%)]" />
        <div className="absolute bottom-0 left-1/4 h-80 w-80 rounded-full bg-[radial-gradient(circle,_rgba(249,115,22,0.13),_transparent_68%)] blur-3xl" />
      </div>

      <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <Header
          currentDate={todayLabel}
          theme={theme}
          userName={dashboardData.userName}
          onToggleTheme={toggleTheme}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
          <div className="flex flex-col gap-6">
            <SummaryCards metrics={dashboardData.summaryMetrics} />
            <TrendChart data={dashboardData.monthlyTrend} />
            <TransactionsTable
              categories={dashboardData.transactionCategories}
              transactions={dashboardData.transactions}
            />
          </div>

          <div className="flex flex-col gap-6">
            <CategoryChart categories={dashboardData.expenseCategories} />
            <BudgetProgress budgets={dashboardData.budgets} />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
