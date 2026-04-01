import { budgets } from '../data/mockData';

export const BudgetProgress = () => {
  const getProgressColor = (percentage: number) => {
    if (percentage < 75) return 'bg-green-500';
    if (percentage < 90) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = (percentage: number) => {
    if (percentage < 75) return 'text-green-600 dark:text-green-400';
    if (percentage < 90) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 transition-colors duration-200">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        Budget Overview
      </h2>
      <div className="space-y-6">
        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
          return (
            <div key={budget.category}>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: budget.color }}
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {budget.category}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${getTextColor(percentage)}`}>
                  ${budget.spent.toFixed(2)} / ${budget.limit.toFixed(2)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${getProgressColor(percentage)}`}
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${getTextColor(percentage)}`}>
                {percentage.toFixed(1)}% of budget used
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
