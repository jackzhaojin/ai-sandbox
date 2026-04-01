import { TrendingUp, TrendingDown, PiggyBank, Wallet } from 'lucide-react';
import { summaryData } from '../data/mockData';

interface SummaryCardProps {
  title: string;
  amount: number;
  icon: React.ReactNode;
  colorClass: string;
  isPositive?: boolean;
}

const SummaryCard = ({ title, amount, icon, colorClass }: SummaryCardProps) => {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Math.abs(amount));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-all duration-200 hover:shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className={`text-2xl sm:text-3xl font-bold ${colorClass}`}>
            {formattedAmount}
          </p>
        </div>
        <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export const SummaryCards = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <SummaryCard
        title="Total Income"
        amount={summaryData.income}
        icon={<TrendingUp className="w-6 h-6 text-green-600" />}
        colorClass="text-green-600 dark:text-green-400"
        isPositive={true}
      />
      <SummaryCard
        title="Total Expenses"
        amount={summaryData.expenses}
        icon={<TrendingDown className="w-6 h-6 text-red-600" />}
        colorClass="text-red-600 dark:text-red-400"
        isPositive={false}
      />
      <SummaryCard
        title="Savings"
        amount={summaryData.savings}
        icon={<PiggyBank className="w-6 h-6 text-blue-600" />}
        colorClass="text-blue-600 dark:text-blue-400"
        isPositive={true}
      />
      <SummaryCard
        title="Net Worth"
        amount={summaryData.netWorth}
        icon={<Wallet className="w-6 h-6 text-purple-600" />}
        colorClass="text-purple-600 dark:text-purple-400"
        isPositive={true}
      />
    </div>
  );
};
