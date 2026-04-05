import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { CategoryChart } from './components/CategoryChart';
import { TransactionsTable } from './components/TransactionsTable';
import { BudgetProgress } from './components/BudgetProgress';
import { useTheme } from './hooks/useTheme';
import { summaryData, monthlyData, categoryData, transactions, budgets, categories } from './data/mockData';

function App() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--background)] transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <SummaryCards data={summaryData} />

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart data={monthlyData} />
          <CategoryChart data={categoryData} />
        </div>

        {/* Transactions and Budget Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TransactionsTable transactions={transactions} categories={categories} />
          </div>
          <div className="lg:col-span-1">
            <BudgetProgress budgets={budgets} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-12 py-6 text-center">
        <p className="text-sm text-[var(--muted-foreground)]">
          Personal Finance Dashboard &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}

export default App;
