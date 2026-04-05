import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { CategoryChart } from './components/CategoryChart';
import { TransactionsTable } from './components/TransactionsTable';
import { BudgetProgress } from './components/BudgetProgress';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <SummaryCards />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TrendChart />
              </div>
              <div className="lg:col-span-1">
                <CategoryChart />
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <TransactionsTable />
              </div>
              <div className="lg:col-span-1">
                <BudgetProgress />
              </div>
            </div>
          </div>
        </main>

        <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            FinanceHub &copy; {new Date().getFullYear()} - Personal Finance Dashboard
          </p>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
