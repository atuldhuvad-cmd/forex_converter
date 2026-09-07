import React, { useState, useEffect, useMemo } from 'react';
import {
  ForexWallet,
  Transaction,
  MonthlyBudget,
  CategorySummary,
  ExpenseCategory,
} from './types';
import {
  loadWallets,
  saveWallets,
  loadTransactions,
  saveTransactions,
  loadBudgets,
  saveBudgets,
} from './utils/storage';
import {
  computeCategorySummaries,
  computeWalletBalances,
  formatForeign,
  formatINR,
  getMonthKey,
} from './utils/currency';
import { Navbar } from './components/Navbar';
import { MonthlySummary } from './components/MonthlySummary';
import { SpendingCharts } from './components/SpendingCharts';
import { TransactionList } from './components/TransactionList';
import { QuickConverter } from './components/QuickConverter';
import { AddTransactionModal } from './components/AddTransactionModal';
import { PdfStatementUploader } from './components/PdfStatementUploader';
import { ForexWalletsModal } from './components/ForexWalletsModal';
import { SyncBackupModal } from './components/SyncBackupModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import {
  PlusCircle,
  FileUp,
  Calculator,
  CreditCard,
  Banknote,
  Coins,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';

export default function App() {
  // Primary persistent state
  const [wallets, setWallets] = useState<ForexWallet[]>(loadWallets);
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>(loadBudgets);

  // View state
  const [activeTab, setActiveTab] = useState<'expenses' | 'analytics' | 'converter'>('expenses');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isWalletsModalOpen, setIsWalletsModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Network & PWA Install state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // Save changes to localStorage
  useEffect(() => {
    saveWallets(wallets);
  }, [wallets]);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    saveBudgets(budgets);
  }, [budgets]);

  // Online / Offline event listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // PWA Install prompt listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Filter transactions by selected month
  const currentMonthTransactions = useMemo(() => {
    if (selectedMonth === 'all') return transactions;
    return transactions.filter((t) => getMonthKey(t.date) === selectedMonth);
  }, [transactions, selectedMonth]);

  // Available unique months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    // Always include current month
    months.add(new Date().toISOString().slice(0, 7));
    transactions.forEach((t) => {
      if (t.date) months.add(getMonthKey(t.date));
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Category Summaries for current view
  const { summaries: categorySummaries, totalSpentINR } = useMemo(() => {
    return computeCategorySummaries(currentMonthTransactions);
  }, [currentMonthTransactions]);

  // Wallet balances are lifetime balances and must include transactions from
  // every month, regardless of the dashboard's selected reporting month.
  const walletBalances = useMemo(() => {
    return computeWalletBalances(wallets, transactions);
  }, [wallets, transactions]);

  // Active budget for current month
  const activeBudget = useMemo(() => {
    const existing = budgets.find((b) => b.monthKey === selectedMonth);
    if (existing) return existing;
    return {
      monthKey: selectedMonth,
      targetBudgetINR: 0,
    };
  }, [budgets, selectedMonth]);

  const handleUpdateBudget = (newBudgetINR: number) => {
    setBudgets((prev) => {
      const idx = prev.findIndex((b) => b.monthKey === selectedMonth);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], targetBudgetINR: newBudgetINR };
        return updated;
      }
      return [...prev, { monthKey: selectedMonth, targetBudgetINR: newBudgetINR }];
    });
  };

  // Transaction Actions
  const handleAddTransaction = (newTx: Transaction) => {
    setTransactions((prev) => {
      const exists = prev.some((t) => t.id === newTx.id);
      if (exists) {
        return prev.map((t) => (t.id === newTx.id ? newTx : t));
      }
      return [newTx, ...prev];
    });
    setEditingTransaction(null);
  };

  const handleImportBatchTransactions = (newTxs: Transaction[]) => {
    setTransactions((prev) => [...newTxs, ...prev]);
  };

  const handleDeleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const handleDeleteMultipleTransactions = (ids: string[]) => {
    const idSet = new Set(ids);
    setTransactions((prev) => prev.filter((t) => !idSet.has(t.id)));
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setIsAddModalOpen(true);
  };

  const handleDuplicateTransaction = (tx: Transaction) => {
    const duplicated: Transaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      description: `${tx.description} (Copy)`,
    };
    handleAddTransaction(duplicated);
  };

  const handleQuickAddFromConverter = (amount: number, currency: string, walletId: string) => {
    setEditingTransaction({
      id: '',
      date: new Date().toISOString().slice(0, 10),
      description: '',
      amount: amount,
      currency: currency,
      walletId: walletId,
      exchangeRate: wallets.find((w) => w.id === walletId)?.purchasedRateINR || 0,
      amountINR: 0,
      category: 'Food & Dining',
      type: 'expense',
      source: 'manual_card',
      createdAt: Date.now(),
    });
    setIsAddModalOpen(true);
  };

  const handleRestoreAllData = (
    restoredWallets: ForexWallet[],
    restoredTransactions: Transaction[],
    restoredBudgets: MonthlyBudget[]
  ) => {
    setWallets(restoredWallets);
    setTransactions(restoredTransactions);
    if (restoredBudgets && restoredBudgets.length > 0) {
      setBudgets(restoredBudgets);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        wallets={wallets}
        isOnline={isOnline}
        canInstallPWA={Boolean(deferredPrompt)}
        onInstallPWA={handleInstallPWA}
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
        onOpenPdfModal={() => setIsPdfModalOpen(true)}
        onOpenConverterModal={() => setActiveTab('converter')}
        onOpenWalletsModal={() => setIsWalletsModalOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* PWA Install Banner if applicable */}
        <PWAInstallBanner
          canInstall={Boolean(deferredPrompt)}
          onInstall={handleInstallPWA}
        />

        {/* Purchase Rate Quick Highlights Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {wallets.map((w) => {
            const isCard = w.type === 'forex_card';
            const balance = walletBalances[w.id] || {
              spentForeign: 0,
              spentINR: 0,
              remainingForeign: w.initialBalance,
              remainingINR: w.initialBalance * w.purchasedRateINR,
            };
            return (
              <div
                key={w.id}
                onClick={() => setIsWalletsModalOpen(true)}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800/90 hover:border-blue-500/50 hover:bg-slate-850 hover:shadow-lg cursor-pointer transition flex items-center justify-between group shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isCard
                        ? 'bg-blue-950/80 text-blue-400 border border-blue-800/70'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/70'
                    }`}
                  >
                    {isCard ? <CreditCard className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block group-hover:text-blue-400 transition truncate max-w-[140px]">
                      {w.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      1 {w.currency} = ₹{w.purchasedRateINR.toFixed(2)} INR
                    </span>
                    <span className="text-[11px] text-emerald-300 font-mono font-semibold block mt-1">
                      Balance: {formatForeign(balance.remainingForeign, w.currency)} · {formatINR(balance.remainingINR)}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition font-semibold">
                  Edit
                </span>
              </div>
            );
          })}
        </div>

        {/* Tab 1: Transactions & Monthly Summary */}
        {activeTab === 'expenses' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Monthly Summary Cards */}
            <MonthlySummary
              transactions={currentMonthTransactions}
              wallets={wallets}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              availableMonths={availableMonths}
              budget={activeBudget}
              onUpdateBudget={handleUpdateBudget}
            />

            {/* Transaction Ledger Table */}
            <TransactionList
              transactions={currentMonthTransactions}
              wallets={wallets}
              onDeleteTransaction={handleDeleteTransaction}
              onDeleteMultipleTransactions={handleDeleteMultipleTransactions}
              onEditTransaction={handleEditTransaction}
              onDuplicateTransaction={handleDuplicateTransaction}
              onOpenAddModal={() => {
                setEditingTransaction(null);
                setIsAddModalOpen(true);
              }}
            />
          </div>
        )}

        {/* Tab 2: Category Analytics */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fadeIn">
            <MonthlySummary
              transactions={currentMonthTransactions}
              wallets={wallets}
              selectedMonth={selectedMonth}
              onSelectMonth={setSelectedMonth}
              availableMonths={availableMonths}
              budget={activeBudget}
              onUpdateBudget={handleUpdateBudget}
            />

            <SpendingCharts
              transactions={currentMonthTransactions}
              categorySummaries={categorySummaries}
              totalSpentINR={totalSpentINR}
              wallets={wallets}
              selectedMonth={selectedMonth}
            />
          </div>
        )}

        {/* Tab 3: Quick Currency Converter */}
        {activeTab === 'converter' && (
          <div className="space-y-6 animate-fadeIn">
            <QuickConverter
              wallets={wallets}
              onQuickAdd={handleQuickAddFromConverter}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button for Mobile Add Expense */}
      <div className="fixed bottom-6 right-6 z-30 sm:hidden">
        <button
          onClick={() => {
            setEditingTransaction(null);
            setIsAddModalOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center hover:bg-blue-500 active:scale-95 transition"
          title="Add Expense"
        >
          <PlusCircle className="w-7 h-7" />
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/90 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <p>
          Forex Expense & Currency Converter PWA • Your data stays in this browser
        </p>
      </footer>

      {/* Modals */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        wallets={wallets}
        onAddTransaction={handleAddTransaction}
        initialData={editingTransaction}
      />

      <PdfStatementUploader
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        wallets={wallets}
        onImportTransactions={handleImportBatchTransactions}
        existingTransactions={transactions}
      />

      <ForexWalletsModal
        isOpen={isWalletsModalOpen}
        onClose={() => setIsWalletsModalOpen(false)}
        wallets={wallets}
        onSaveWallets={setWallets}
        transactions={transactions}
      />

      <SyncBackupModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        wallets={wallets}
        transactions={transactions}
        budgets={budgets}
        onRestoreData={handleRestoreAllData}
      />
    </div>
  );
}
