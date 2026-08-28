import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Printer,
  Trash2,
  Edit2,
  Copy,
  CreditCard,
  Banknote,
  FileText,
  PlusCircle,
  Sparkles,
  CheckSquare,
  Square,
  MinusSquare,
  X,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { Transaction, ForexWallet, ExpenseCategory } from '../types';
import { formatINR, formatForeign, getCurrencySymbol } from '../utils/currency';
import { CATEGORY_CONFIG } from '../data/initialData';
import { exportTransactionsToCSV } from '../utils/storage';

interface TransactionListProps {
  transactions: Transaction[];
  wallets: ForexWallet[];
  onDeleteTransaction: (id: string) => void;
  onDeleteMultipleTransactions?: (ids: string[]) => void;
  onEditTransaction: (tx: Transaction) => void;
  onDuplicateTransaction: (tx: Transaction) => void;
  onOpenAddModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  wallets,
  onDeleteTransaction,
  onDeleteMultipleTransactions,
  onEditTransaction,
  onDuplicateTransaction,
  onOpenAddModal,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const walletMap = new Map<string, ForexWallet>(wallets.map((w) => [w.id, w]));

  // Filter & Search
  const filtered = transactions.filter((t) => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (selectedWallet !== 'all' && t.walletId !== selectedWallet) return false;
    if (selectedType !== 'all') {
      if (selectedType === 'payments' && t.type !== 'expense') return false;
      if (selectedType === 'receipts' && t.type !== 'refund' && t.type !== 'income') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchNotes = (t.notes || '').toLowerCase().includes(q);
      const matchCat = (t.category || '').toLowerCase().includes(q);
      const matchWallet = (walletMap.get(t.walletId)?.name || '').toLowerCase().includes(q);
      if (!matchDesc && !matchNotes && !matchCat && !matchWallet) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'date_desc') return b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0);
    if (sortBy === 'date_asc') return a.date.localeCompare(b.date) || (a.createdAt || 0) - (b.createdAt || 0);
    if (sortBy === 'amount_desc') return b.amountINR - a.amountINR;
    if (sortBy === 'amount_asc') return a.amountINR - b.amountINR;
    return 0;
  });

  // Selection statistics
  const visibleSelectedCount = useMemo(() => {
    return sorted.filter((t) => selectedIds.has(t.id)).length;
  }, [sorted, selectedIds]);

  const isAllVisibleSelected = sorted.length > 0 && visibleSelectedCount === sorted.length;
  const isPartiallySelected = visibleSelectedCount > 0 && visibleSelectedCount < sorted.length;

  const totalSelectedINR = useMemo(() => {
    return transactions
      .filter((t) => selectedIds.has(t.id))
      .reduce((sum, t) => {
        if (t.type === 'refund' || t.type === 'income') {
          return sum - t.amountINR;
        }
        return sum + t.amountINR;
      }, 0);
  }, [transactions, selectedIds]);

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllVisibleSelected) {
      // Unselect visible items
      sorted.forEach((t) => next.delete(t.id));
    } else {
      // Select all visible items
      sorted.forEach((t) => next.add(t.id));
    }
    setSelectedIds(next);
  };

  const handleToggleRow = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleBulkDelete = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    const confirmMsg =
      idsToDelete.length === 1
        ? 'Are you sure you want to delete this 1 selected transaction?'
        : `Are you sure you want to permanently delete all ${idsToDelete.length} selected transactions?`;

    if (confirm(confirmMsg)) {
      if (onDeleteMultipleTransactions) {
        onDeleteMultipleTransactions(idsToDelete);
      } else {
        idsToDelete.forEach((id) => onDeleteTransaction(id));
      }
      setSelectedIds(new Set());
    }
  };

  const handleExportSelectedCSV = () => {
    const selectedTransactions = transactions.filter((t) => selectedIds.has(t.id));
    if (selectedTransactions.length === 0) return;
    exportTransactionsToCSV(
      selectedTransactions,
      wallets,
      `forex-expenses-selected-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const handleExportCSV = () => {
    exportTransactionsToCSV(sorted, wallets);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden space-y-4">
      {/* Table Header Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-800 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <span>Converted Expense Ledger</span>
              <div className="flex items-center gap-2 text-xs font-normal">
                <span className="inline-flex items-center gap-1 text-rose-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span> Payments (Red)
                </span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center gap-1 text-emerald-400 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Receipts / Refunds (Green)
                </span>
              </div>
            </h3>
            <p className="text-xs text-slate-400">
              Showing {sorted.length} of {transactions.length} total entries
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 shadow-xs transition flex items-center gap-1.5"
              title="Export filtered transactions to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 shadow-xs transition flex items-center gap-1.5"
              title="Print expense report"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-2 lg:col-span-3 relative">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search merchant, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Categories</option>
              {Object.keys(CATEGORY_CONFIG).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet Filter */}
          <div className="lg:col-span-2">
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Wallets / Rates</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (@ ₹{w.purchasedRateINR.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter (Payments / Receipts) */}
          <div className="lg:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">All Types (↑ / ↓)</option>
              <option value="payments">↓ Payments / Expenses (Red)</option>
              <option value="receipts">↑ Receipts / Refunds (Green)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="date_desc">Newest Date</option>
              <option value="date_asc">Oldest Date</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar Banner */}
      {selectedIds.size > 0 && (
        <div
          id="bulk-selection-toolbar"
          className="mx-4 sm:mx-6 p-3 sm:p-4 bg-slate-950 text-white rounded-xl shadow-lg flex flex-wrap items-center justify-between gap-3 animate-fadeIn border border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center font-bold text-sm text-blue-300">
              {selectedIds.size}
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <span>{selectedIds.size} transaction{selectedIds.size > 1 ? 's' : ''} selected</span>
                <span className="text-slate-500 text-xs font-normal hidden sm:inline">•</span>
                <span className="text-slate-300 font-mono text-xs sm:text-sm font-bold hidden sm:inline">
                  Net Selected: {formatINR(totalSelectedINR)}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Bulk delete or export the selected entries at once
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelectedCSV}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1.5"
              title="Export only selected transactions to CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span className="hidden sm:inline">Export Selected</span>
            </button>

            <button
              id="bulk-delete-btn"
              onClick={handleBulkDelete}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition flex items-center gap-1.5 focus:ring-2 focus:ring-rose-400 focus:outline-none"
              title={`Permanently delete ${selectedIds.size} transactions`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedIds.size})</span>
            </button>

            <button
              onClick={handleClearSelection}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Deselect all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Transaction Table / List */}
      {sorted.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-600 mx-auto" />
          <h4 className="text-base font-semibold text-slate-300">No transactions found</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Log your cash/card expenses and merchant refunds, or upload a forex statement from the top header.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              id="btn-empty-add-expense"
              onClick={onOpenAddModal}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
            >
              Add Expense
            </button>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                {/* Select All Checkbox */}
                <th className="p-3.5 sm:p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    id="select-all-transactions"
                    aria-label="Select all visible transactions"
                    checked={isAllVisibleSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isPartiallySelected;
                    }}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition"
                  />
                </th>
                <th className="p-3.5 sm:p-4">Date</th>
                <th className="p-3.5 sm:p-4">Merchant / Details</th>
                <th className="p-3.5 sm:p-4">Category</th>
                <th className="p-3.5 sm:p-4">Payment Source</th>
                <th className="p-3.5 sm:p-4 text-right">Foreign Amount</th>
                <th className="p-3.5 sm:p-4 text-right">Converted INR</th>
                <th className="p-3.5 sm:p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300">
              {sorted.map((tx) => {
                const wallet = walletMap.get(tx.walletId);
                const categoryConfig = CATEGORY_CONFIG[tx.category];
                const isCard = wallet?.type === 'forex_card';
                const isSelected = selectedIds.has(tx.id);
                const isReceipt = tx.type === 'refund' || tx.type === 'income';

                return (
                  <tr
                    key={tx.id}
                    className={`transition group ${
                      isSelected
                        ? 'bg-blue-950/40 hover:bg-blue-950/60'
                        : 'hover:bg-slate-850/60'
                    }`}
                  >
                    {/* Row Checkbox */}
                    <td className="p-3.5 sm:p-4 text-center">
                      <input
                        type="checkbox"
                        id={`tx-checkbox-${tx.id}`}
                        aria-label={`Select transaction ${tx.description}`}
                        checked={isSelected}
                        onChange={() => handleToggleRow(tx.id)}
                        className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-700 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition"
                      />
                    </td>

                    {/* Date & Time */}
                    <td className="p-3.5 sm:p-4 whitespace-nowrap">
                      <div className="font-mono text-slate-100 font-semibold text-xs sm:text-sm">{tx.date}</div>
                      {tx.time && <div className="text-[11px] text-slate-500 font-mono">{tx.time}</div>}
                    </td>

                    {/* Merchant & Notes */}
                    <td className="p-3.5 sm:p-4">
                      <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                        <span>{tx.description}</span>
                        {isReceipt ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
                            title="Receipt / Refund / Credit (Inflow)"
                          >
                            <ArrowUp className="w-3 h-3 text-emerald-400" />
                            Receipt / Refund
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/80"
                            title="Expense / Outflow Payment"
                          >
                            <ArrowDown className="w-2.5 h-2.5 text-rose-400" />
                            Expense
                          </span>
                        )}
                        {tx.source === 'pdf_statement' && (
                          <span
                            className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80"
                            title="Scanned from Card PDF statement"
                          >
                            PDF
                          </span>
                        )}
                      </div>
                      {tx.notes && (
                        <p className="text-xs text-slate-400 truncate max-w-xs">{tx.notes}</p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="p-3.5 sm:p-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${categoryConfig?.bgBadge || 'bg-slate-800 border-slate-700 text-slate-300'}`}
                      >
                        {tx.category}
                      </span>
                    </td>

                    {/* Payment Wallet & Rate */}
                    <td className="p-3.5 sm:p-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        {isCard ? (
                          <CreditCard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        ) : (
                          <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                          {wallet?.name || tx.walletId}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400">
                        @ ₹{tx.exchangeRate.toFixed(2)} / {tx.currency}
                      </div>
                    </td>

                    {/* Foreign Amount: Green with Up Arrow for Receipts, Red with Down Arrow for Payments */}
                    <td className="p-3.5 sm:p-4 text-right whitespace-nowrap font-mono font-semibold">
                      <span className={`inline-flex items-center justify-end gap-1 ${isReceipt ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isReceipt ? (
                          <ArrowUp className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                        )}
                        <span>{isReceipt ? '+' : '-'} {formatForeign(tx.amount, tx.currency)}</span>
                      </span>
                    </td>

                    {/* Converted INR: Green font for Receipts, Red font for Payments */}
                    <td className="p-3.5 sm:p-4 text-right whitespace-nowrap">
                      <div
                        className={`font-extrabold font-mono text-sm sm:text-base inline-flex items-center justify-end gap-1 ${
                          isReceipt ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isReceipt ? (
                          <ArrowUp className="w-4 h-4 shrink-0 text-emerald-400" />
                        ) : (
                          <ArrowDown className="w-4 h-4 shrink-0 text-rose-400" />
                        )}
                        <span>{isReceipt ? '+' : '-'} {formatINR(tx.amountINR)}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {tx.amount} {getCurrencySymbol(tx.currency)} × ₹{tx.exchangeRate}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 sm:p-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center space-x-1 opacity-70 group-hover:opacity-100 transition">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDuplicateTransaction(tx)}
                          className="p-1.5 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition"
                          title="Duplicate transaction"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete transaction "${tx.description}"?`)) {
                              onDeleteTransaction(tx.id);
                              // Remove from selection if selected
                              if (selectedIds.has(tx.id)) {
                                const next = new Set(selectedIds);
                                next.delete(tx.id);
                                setSelectedIds(next);
                              }
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/50 transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
