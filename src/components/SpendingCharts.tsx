import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Transaction, CategorySummary, ForexWallet } from '../types';
import { formatINR, formatForeign } from '../utils/currency';
import { CATEGORY_CONFIG } from '../data/initialData';
import { TrendingUp, PieChart as PieIcon, BarChart3, Layers } from 'lucide-react';

interface SpendingChartsProps {
  transactions: Transaction[];
  categorySummaries: CategorySummary[];
  totalSpentINR: number;
  wallets: ForexWallet[];
  selectedMonth: string;
}

export const SpendingCharts: React.FC<SpendingChartsProps> = ({
  transactions,
  categorySummaries,
  totalSpentINR,
  wallets,
  selectedMonth,
}) => {
  if (transactions.length === 0 || totalSpentINR === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400 space-y-3 shadow-xs">
        <PieIcon className="w-12 h-12 text-slate-600 mx-auto" />
        <h3 className="text-base font-semibold text-slate-200">No Spending Data Available</h3>
        <p className="text-xs text-slate-400">
          Upload a card statement or add cash transactions to view visual category breakdowns.
        </p>
      </div>
    );
  }

  // Prepare Donut Chart Data
  const pieData = categorySummaries.map((cat) => ({
    name: cat.category,
    value: cat.amountINR,
    color: CATEGORY_CONFIG[cat.category]?.hexColor || '#94a3b8',
    percentage: cat.percentage,
    count: cat.transactionCount,
  }));

  // Prepare Daily Spend Bar Chart Data
  const dailyMap = new Map<string, number>();
  const expenseTxs = transactions.filter((t) => t.type === 'expense');

  // Sort chronologically
  const sortedTxs = [...expenseTxs].sort((a, b) => a.date.localeCompare(b.date));

  for (const t of sortedTxs) {
    const day = t.date ? t.date.slice(5) : 'Unknown'; // MM-DD
    dailyMap.set(day, (dailyMap.get(day) || 0) + t.amountINR);
  }

  const barData = Array.from(dailyMap.entries()).map(([day, amount]) => ({
    day,
    amountINR: Math.round(amount),
  }));

  // Payment source split
  const walletMap = new Map<string, ForexWallet>(wallets.map((w) => [w.id, w]));
  const sourceSpendMap = new Map<string, number>();
  for (const t of expenseTxs) {
    const wName = walletMap.get(t.walletId)?.name || t.walletId;
    sourceSpendMap.set(wName, (sourceSpendMap.get(wName) || 0) + t.amountINR);
  }

  const sourceData = Array.from(sourceSpendMap.entries()).map(([name, amount]) => ({
    name,
    amount,
    percentage: (amount / totalSpentINR) * 100,
  }));

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown Donut */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/80">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Spending by Category</h3>
                <p className="text-xs text-slate-400">Total: {formatINR(totalSpentINR)}</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold text-white">{data.name}</p>
                          <p className="text-rose-400 font-mono font-semibold">
                            {formatINR(data.value)} ({data.percentage.toFixed(1)}%)
                          </p>
                          <p className="text-slate-400">{data.count} transactions</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-xs text-slate-400 font-medium">Categories</span>
              <span className="text-base font-bold font-mono text-white">{categorySummaries.length}</span>
            </div>
          </div>

          {/* Mini Legend List */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800 text-xs">
            {pieData.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <div className="flex items-center space-x-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="truncate text-slate-300 font-medium">{cat.name}</span>
                </div>
                <span className="font-mono text-white font-bold ml-1">{cat.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Spending Trend Bar Chart */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/80">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Daily Spending Trend (INR)</h3>
                <p className="text-xs text-slate-400">Expense timeline</p>
              </div>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val > 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-950 border border-slate-800 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="text-slate-400">Date: {data.day}</p>
                          <p className="text-rose-400 font-mono font-bold">{formatINR(data.amountINR)}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="amountINR" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Source Split Progress */}
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
            <span className="text-xs font-semibold text-slate-300">Payment Instrument Split:</span>
            <div className="space-y-2">
              {sourceData.map((src) => (
                <div key={src.name} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span className="truncate font-medium">{src.name}</span>
                    <span className="font-mono text-white font-bold">
                      {formatINR(src.amount)} ({src.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, src.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Category Table with Foreign Currency Subtotals */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Layers className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-white">Monthly Category Summary Breakdown</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {categorySummaries.map((cat) => {
            const config = CATEGORY_CONFIG[cat.category];
            const foreignList = Object.entries(cat.foreignAmounts).map(([cur, amt]) =>
              formatForeign(Number(amt), cur)
            );

            return (
              <div
                key={cat.category}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 hover:shadow-xs transition"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${config?.bgBadge || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                    {cat.category}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{cat.transactionCount} items</span>
                </div>

                <div className="space-y-0.5 pt-1">
                  <div className="text-lg font-extrabold font-mono text-rose-400">{formatINR(cat.amountINR)}</div>
                  <p className="text-xs text-slate-400 font-mono truncate">{foreignList.join(' + ')}</p>
                </div>

                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, cat.percentage)}%`,
                      backgroundColor: config?.hexColor || '#3b82f6',
                    }}
                  />
                </div>
                <div className="text-right text-[10px] text-slate-400 font-mono font-medium">
                  {cat.percentage.toFixed(1)}% of total
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
