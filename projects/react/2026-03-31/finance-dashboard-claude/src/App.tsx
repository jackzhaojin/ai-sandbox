import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { CategoryChart } from './components/CategoryChart';
import { TransactionsTable } from './components/TransactionsTable';
import { BudgetProgress } from './components/BudgetProgress';

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Summary Cards */}
          <section className="mb-8">
            <SummaryCards />
          </section>

          {/* Charts Section */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <TrendChart />
            <CategoryChart />
          </section>

          {/* Transactions and Budget Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionsTable />
            </div>
            <div>
              <BudgetProgress />
            </div>
          </section>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
