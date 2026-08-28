import React, { useState } from 'react';
import {
  Calendar,
  Wallet,
  TrendingUp,
  CreditCard,
  Banknote,
  PiggyBank,
  Edit2,
  Check,
  Percent,
  Download,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { Transaction, ForexWallet, MonthlyBudget } from '../types';
import { formatINR, formatForeign, getCurrencySymbol } from '../utils/currency';
import { exportTransactionsToCSV } from '../utils/storage';

interface MonthlySummaryProps {
  transactions: Transaction[];
  wallets: ForexWallet[];
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  availableMonths: string[];
  budget: MonthlyBudget;
  onUpdateBudget: (newBudgetINR: number) => void;
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({
  transactions,
  wallets,
  selectedMonth,
  onSelectMonth,
  availableMonths,
  budget,
  onUpdateBudget,
}) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [budgetString, setBudgetString] = useState(budget.targetBudgetINR.toString());

  // Calculations for payments and receipts/refunds
  const expenseTxs = transactions.filter((t) => t.type === 'expense');
  const refundTxs = transactions.filter((t) => t.type === 'refund' || t.type === 'income');

  const totalPaymentsINR = expenseTxs.reduce((sum, t) => sum + t.amountINR, 0);
  const totalReceiptsINR = refundTxs.reduce((sum, t) => sum + t.amountINR, 0);
  const netSpentINR = totalPaymentsINR - totalReceiptsINR;

  // Group by Foreign Currencies
  const foreignTotals: Record<string, { payments: number; receipts: number }> = {};
  for (const t of transactions) {
    const cur = t.currency || 'CAD';
    if (!foreignTotals[cur]) {
      foreignTotals[cur] = { payments: 0, receipts: 0 };
    }
    if (t.type === 'refund' || t.type === 'income') {
      foreignTotals[cur].receipts += t.amount;
    } else {
      foreignTotals[cur].payments += t.amount;
    }
  }

  // Card vs Cash Split
  const walletMap = new Map<string, ForexWallet>(wallets.map((w) => [w.id, w]));
  let cardSpentINR = 0;
  let cashSpentINR = 0;

  for (const t of expenseTxs) {
    const w = walletMap.get(t.walletId);
    if (w?.type === 'cash') {
      cashSpentINR += t.amountINR;
    } else {
      cardSpentINR += t.amountINR;
    }
  }

  const budgetProgress = budget.targetBudgetINR > 0 ? (netSpentINR / budget.targetBudgetINR) * 100 : 0;

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(budgetString) || 0;
    onUpdateBudget(val);
    setIsEditingBudget(false);
  };

  const handleDownloadMonthlyCSV = () => {
    const filename =
      selectedMonth === 'all'
        ? `forex-expenses-all-${new Date().toISOString().slice(0, 10)}.csv`
        : `forex-expenses-${selectedMonth}.csv`;
    exportTransactionsToCSV(transactions, wallets, filename);
  };

  return (
    <div className="space-y-4">
      {/* Month Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/80">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Monthly Expense Overview</h2>
            <p className="text-xs text-slate-400">
              Categorized spending & merchant refunds converted at purchased forex rates
            </p>
          </div>
        </div>

        {/* Month Dropdown & Download CSV */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 hidden sm:block font-medium">Statement Month:</label>
            <select
              value={selectedMonth}
              id="statement-month-select"
              onChange={(e) => onSelectMonth(e.target.value)}
              className="px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Transactions</option>
              {availableMonths.map((m) => {
                const [y, mon] = m.split('-');
                const dateObj = new Date(parseInt(y), parseInt(mon) - 1, 1);
                const label = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                return (
                  <option key={m} value={m}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>

          <button
            onClick={handleDownloadMonthlyCSV}
            disabled={transactions.length === 0}
            id="download-monthly-csv-btn"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition shadow-xs"
            title="Download current month's transactions as CSV for personal record-keeping"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Spend & Payments vs Refunds */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Net Converted Spend
            </span>
            <div className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/80">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
              {formatINR(netSpentINR)}
            </div>
            <div className="flex items-center gap-3 text-xs mt-1.5 font-mono">
              <span className="text-rose-400 font-semibold inline-flex items-center gap-0.5" title="Total Payments">
                <ArrowDown className="w-3 h-3 text-rose-400 shrink-0" />
                - {formatINR(totalPaymentsINR)}
              </span>
              {totalReceiptsINR > 0 && (
                <span className="text-emerald-400 font-semibold inline-flex items-center gap-0.5" title="Total Receipts / Merchant Refunds">
                  <ArrowUp className="w-3 h-3 text-emerald-400 shrink-0" />
                  + {formatINR(totalReceiptsINR)}
                </span>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Entries:</span>
            <span className="font-mono text-slate-300 font-semibold">
              {expenseTxs.length} payments {refundTxs.length > 0 ? `• ${refundTxs.length} refunds` : ''}
            </span>
          </div>
        </div>

        {/* Card 2: Foreign Currencies Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Foreign Currency Outflow
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
              <Wallet className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1.5">
            {Object.keys(foreignTotals).length > 0 ? (
              Object.entries(foreignTotals).map(([cur, totals]) => (
                <div key={cur} className="flex items-center justify-between font-mono text-xs sm:text-sm">
                  <span className="text-slate-400 font-medium">{cur} ({getCurrencySymbol(cur)}):</span>
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold inline-flex items-center gap-0.5">
                      <ArrowDown className="w-3 h-3 text-rose-400 shrink-0" />
                      - {formatForeign(totals.payments, cur)}
                    </span>
                    {totals.receipts > 0 && (
                      <span className="text-emerald-400 font-bold text-xs inline-flex items-center gap-0.5">
                        <ArrowUp className="w-3 h-3 text-emerald-400 shrink-0" />
                        + {formatForeign(totals.receipts, cur)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm font-mono text-slate-500">No transactions</div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Currencies:</span>
            <span className="font-mono text-slate-300 font-semibold">{Object.keys(foreignTotals).join(', ') || 'None'}</span>
          </div>
        </div>

        {/* Card 3: Forex Card vs Cash Split */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Card vs Cash Payments
            </span>
            <div className="p-1.5 rounded-lg bg-violet-950/80 text-violet-400 border border-violet-800/80">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1 font-medium">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Forex Card:
              </span>
              <span className="font-mono font-bold text-rose-400">- {formatINR(cardSpentINR)}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-300 flex items-center gap-1 font-medium">
                <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Cash:
              </span>
              <span className="font-mono font-bold text-rose-400">- {formatINR(cashSpentINR)}</span>
            </div>
          </div>

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-blue-500 rounded-l-full"
              style={{
                width: `${totalPaymentsINR > 0 ? (cardSpentINR / totalPaymentsINR) * 100 : 0}%`,
              }}
              title="Forex Card"
            />
            <div
              className="h-full bg-emerald-500 rounded-r-full"
              style={{
                width: `${totalPaymentsINR > 0 ? (cashSpentINR / totalPaymentsINR) * 100 : 0}%`,
              }}
              title="Cash"
            />
          </div>
        </div>

        {/* Card 4: Monthly Budget Goal & Progress */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Budget Goal (INR)
            </span>
            <button
              onClick={() => setIsEditingBudget(!isEditingBudget)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Set Target Budget"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {isEditingBudget ? (
            <form onSubmit={handleSaveBudget} className="flex items-center gap-1.5">
              <input
                type="number"
                value={budgetString}
                onChange={(e) => setBudgetString(e.target.value)}
                className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                placeholder="₹ Target"
              />
              <button
                type="submit"
                className="p-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-500 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </form>
          ) : (
            <div>
              <div className="text-lg font-bold font-mono text-white">
                {formatINR(budget.targetBudgetINR)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {budgetProgress.toFixed(0)}% used •{' '}
                {formatINR(Math.max(0, budget.targetBudgetINR - netSpentINR))} left
              </p>
            </div>
          )}

          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                budgetProgress > 90 ? 'bg-rose-500' : budgetProgress > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, budgetProgress))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
