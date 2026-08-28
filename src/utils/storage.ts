import { ForexWallet, Transaction, MonthlyBudget } from '../types';
import { DEFAULT_WALLETS, INITIAL_SAMPLE_TRANSACTIONS } from '../data/initialData';

const STORAGE_KEYS = {
  WALLETS: 'forex_pwa_wallets_v1',
  TRANSACTIONS: 'forex_pwa_transactions_v1',
  BUDGETS: 'forex_pwa_budgets_v1',
  LAST_SYNC: 'forex_pwa_last_sync_v1',
};

export interface ExportDataPayload {
  version: string;
  exportedAt: string;
  wallets: ForexWallet[];
  transactions: Transaction[];
  budgets: MonthlyBudget[];
}

export function loadWallets(): ForexWallet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load wallets from localStorage:', e);
  }
  return DEFAULT_WALLETS;
}

export function saveWallets(wallets: ForexWallet[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  } catch (e) {
    console.error('Failed to save wallets to localStorage:', e);
  }
}

export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip legacy sample transactions
        const dummyIds = new Set(['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6']);
        return parsed.filter((t) => !dummyIds.has(t.id));
      }
    }
  } catch (e) {
    console.error('Failed to load transactions from localStorage:', e);
  }
  return [];
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage:', e);
  }
}

export function loadBudgets(): MonthlyBudget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BUDGETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load budgets:', e);
  }
  return [
    {
      monthKey: new Date().toISOString().slice(0, 7),
      targetBudgetINR: 150000,
    },
  ];
}

export function saveBudgets(budgets: MonthlyBudget[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (e) {
    console.error('Failed to save budgets:', e);
  }
}

export function exportAllDataAsJSON(
  wallets: ForexWallet[],
  transactions: Transaction[],
  budgets: MonthlyBudget[]
): string {
  const payload: ExportDataPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    wallets,
    transactions,
    budgets,
  };
  return JSON.stringify(payload, null, 2);
}

export function downloadJSONBackup(
  wallets: ForexWallet[],
  transactions: Transaction[],
  budgets: MonthlyBudget[]
): void {
  const jsonStr = exportAllDataAsJSON(wallets, transactions, budgets);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `forex-expense-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportTransactionsToCSV(
  transactions: Transaction[],
  wallets: ForexWallet[],
  customFilename?: string
): void {
  const walletMap = new Map(wallets.map((w) => [w.id, w.name]));

  const headers = [
    'Date',
    'Time',
    'Description',
    'Category',
    'Wallet / Instrument',
    'Foreign Currency',
    'Foreign Amount',
    'Exchange Rate (INR)',
    'Amount in INR',
    'Type',
    'Source',
    'Notes',
  ];

  const rows = transactions.map((t) => [
    `"${t.date || ''}"`,
    `"${t.time || ''}"`,
    `"${(t.description || '').replace(/"/g, '""')}"`,
    `"${t.category || ''}"`,
    `"${walletMap.get(t.walletId) || t.walletId}"`,
    `"${t.currency || ''}"`,
    t.amount.toFixed(2),
    t.exchangeRate.toFixed(2),
    t.amountINR.toFixed(2),
    `"${t.type}"`,
    `"${t.source}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = customFilename || `forex-expenses-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function generateSyncCode(
  wallets: ForexWallet[],
  transactions: Transaction[],
  budgets: MonthlyBudget[]
): string {
  const payload: ExportDataPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    wallets,
    transactions,
    budgets,
  };
  const str = JSON.stringify(payload);
  return btoa(encodeURIComponent(str));
}

export function decodeSyncCode(code: string): ExportDataPayload {
  const jsonStr = decodeURIComponent(atob(code.trim()));
  const payload = JSON.parse(jsonStr) as ExportDataPayload;
  if (!payload || !Array.isArray(payload.wallets) || !Array.isArray(payload.transactions)) {
    throw new Error('Invalid backup data format');
  }
  return payload;
}
