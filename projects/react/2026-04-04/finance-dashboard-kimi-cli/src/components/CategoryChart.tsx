import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { CategoryData } from '../types';

interface CategoryChartProps {
  data: CategoryData[];
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const CategoryChart = ({ data }: CategoryChartProps) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-[var(--card)] rounded-xl p-6 border border-[var(--border)] shadow-sm">
      <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
        Expenses by Category
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)',
              }}
              formatter={(value, name) => {
                const percentage = ((value as number / total) * 100).toFixed(1);
                return [`${formatCurrency(value as number)} (${percentage}%)`, name];
              }}
              labelStyle={{ color: 'var(--muted-foreground)' }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span style={{ color: 'var(--foreground)' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
