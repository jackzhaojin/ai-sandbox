import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CategoryData } from '../types';

interface CategoryChartProps {
  data: CategoryData[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatPercent(value: number, total: number): string {
  return `${((value / total) * 100).toFixed(1)}%`;
}

export function CategoryChart({ data }: CategoryChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Expense Breakdown
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Spending by category this month
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              animationDuration={800}
              animationBegin={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  strokeWidth={0}
                  className="hover:opacity-80 transition-opacity cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as CategoryData;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-1">
                        {item.name}
                      </p>
                      <p className="text-lg font-semibold" style={{ color: item.color }}>
                        {formatCurrency(item.value)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatPercent(item.value, total)} of total
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value: string, entry: object) => {
                const item = (entry as { payload?: CategoryData }).payload;
                if (!item) return value;
                return (
                  <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {value}
                  </span>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 space-y-2">
        {data.slice(0, 4).map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-slate-600 dark:text-slate-400">{item.name}</span>
            </div>
            <span className="font-medium text-slate-800 dark:text-slate-100">
              {formatPercent(item.value, total)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
