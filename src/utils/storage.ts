import { ForexWallet, Transaction, MonthlyBudget } from '../types';
import { DEFAULT_WALLETS } from '../data/initialData';

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
  return [];
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

    // Neutralize leading =, +, -, @ (and tab/CR) so spreadsheet apps never
  // interpret AI-parsed or user-entered text as a formula (CSV injection).
  const csvSafe = (value: string): string => {
    const str = value || '';
    return /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  };

  const rows = transactions.map((t) => [
    `"${csvSafe(t.date || '')}"`,
    `"${csvSafe(t.time || '')}"`,
    `"${csvSafe(t.description || '').replace(/"/g, '""')}"`,
    `"${csvSafe(t.category || '')}"`,
    `"${csvSafe(walletMap.get(t.walletId) || t.walletId)}"`,
    `"${csvSafe(t.currency || '')}"`,
    t.amount.toFixed(2),
    t.exchangeRate.toFixed(2),
    t.amountINR.toFixed(2),
    `"${csvSafe(t.type)}"`,
    `"${csvSafe(t.source)}"`,
    `"${csvSafe(t.notes || '').replace(/"/g, '""')}"`,
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

// Sync codes are real AES-256-GCM ciphertext, keyed by a passphrase the user
// chooses and re-enters on the receiving device (PBKDF2-derived, so nothing
// about the passphrase itself is stored in the code). Wire format:
// base64( salt[16] || iv[12] || ciphertext ), prefixed with "v2:".
const SYNC_CODE_PREFIX = 'v2:';
const PBKDF2_ITERATIONS = 210_000;

async function deriveSyncKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export async function generateSyncCode(
  wallets: ForexWallet[],
  transactions: Transaction[],
  budgets: MonthlyBudget[],
  passphrase: string
): Promise<string> {
  if (!passphrase.trim()) {
    throw new Error('A passphrase is required to encrypt the sync code.');
  }
  const payload: ExportDataPayload = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    wallets,
    transactions,
    budgets,
  };
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveSyncKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(JSON.stringify(payload))
  );

  const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

  return SYNC_CODE_PREFIX + bytesToBase64(combined);
}

export async function decodeSyncCode(code: string, passphrase: string): Promise<ExportDataPayload> {
  const trimmed = code.trim();
  if (!trimmed.startsWith(SYNC_CODE_PREFIX)) {
    throw new Error('Invalid or outdated sync code format.');
  }
  if (!passphrase.trim()) {
    throw new Error('Enter the passphrase used to generate this sync code.');
  }

  const combined = base64ToBytes(trimmed.slice(SYNC_CODE_PREFIX.length));
  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const ciphertext = combined.slice(28);

  const key = await deriveSyncKey(passphrase, salt);
  let plaintext: ArrayBuffer;
  try {
    plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  } catch {
    throw new Error('Could not decrypt: wrong passphrase or corrupted code.');
  }

  const payload = JSON.parse(new TextDecoder().decode(plaintext)) as ExportDataPayload;
  if (!payload || !Array.isArray(payload.wallets) || !Array.isArray(payload.transactions)) {
    throw new Error('Invalid backup data format');
  }
  return payload;
}
