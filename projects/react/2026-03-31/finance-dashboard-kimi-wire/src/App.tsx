import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { CategoryChart } from './components/CategoryChart';
import { TransactionsTable } from './components/TransactionsTable';
import { BudgetProgress } from './components/BudgetProgress';
import { summaryData, monthlyData, categoryData, transactions, budgets } from './data/mockData';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <Header />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Summary Cards */}
            <SummaryCards data={summaryData} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendChart data={monthlyData} />
              <CategoryChart data={categoryData} />
            </div>

            {/* Budget and Transactions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <BudgetProgress budgets={budgets} />
              </div>
              <div className="lg:col-span-2">
                <TransactionsTable transactions={transactions} />
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Personal Finance Dashboard &copy; {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}

export default App;
