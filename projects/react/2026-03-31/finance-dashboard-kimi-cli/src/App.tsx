import { useTheme } from './components/hooks/useTheme';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { CategoryChart } from './components/CategoryChart';
import { TransactionsTable } from './components/TransactionsTable';
import { BudgetProgress } from './components/BudgetProgress';
import { 
  summaryData, 
  monthlyData, 
  categoryData, 
  budgets, 
  transactions 
} from './data/mockData';

function App() {
  const [theme, toggleTheme] = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header theme={theme} onToggleTheme={toggleTheme} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <SummaryCards data={summaryData} />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 sm:mt-8">
          <div className="lg:col-span-2">
            <TrendChart data={monthlyData} />
          </div>
          <div>
            <CategoryChart data={categoryData} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6 sm:mt-8">
          <div className="lg:col-span-2">
            <TransactionsTable transactions={transactions} />
          </div>
          <div>
            <BudgetProgress budgets={budgets} />
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200 dark:border-slate-700 mt-8">
        <p className="text-center text-sm text-slate-500 dark:text-slate-400">
          © 2026 Finance Dashboard. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
