export type CurrencyCode = 'CAD' | 'USD' | 'EUR' | 'GBP' | 'AUD' | 'SGD' | 'AED' | 'JPY' | 'INR' | string;

export interface CurrencyDefinition {
  code: string;
  name: string;
  symbol: string;
  defaultRateINR: number;
  flagEmoji?: string;
  isPopular?: boolean;
}

export type ExpenseCategory =
  | 'Food & Dining'
  | 'Groceries'
  | 'Shopping'
  | 'Transit & Transport'
  | 'Accommodation'
  | 'Entertainment'
  | 'Utilities & Telecom'
  | 'Health & Medical'
  | 'Forex & ATM Fee'
  | 'Miscellaneous';

export type WalletType = 'forex_card' | 'cash' | 'credit_card' | 'bank_account';

export interface ForexWallet {
  id: string;
  name: string;
  currency: CurrencyCode;
  type: WalletType;
  purchasedRateINR: number; // The user's actual purchased cost basis in INR
  initialBalance: number; // Initial foreign currency loaded / purchased
  notes?: string;
  color: string;
  cardLast4?: string;
  isDefault?: boolean;
}

export type TransactionType = 'expense' | 'refund' | 'topup' | 'atm_withdrawal';
export type EntrySource = 'manual_cash' | 'manual_card' | 'pdf_statement' | 'csv_import' | 'sample';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  description: string;
  amount: number; // Foreign currency amount
  currency: CurrencyCode;
  walletId: string;
  exchangeRate: number; // Rate in INR per 1 unit of foreign currency
  amountINR: number; // amount * exchangeRate
  category: ExpenseCategory;
  type: TransactionType;
  source: EntrySource;
  notes?: string;
  receiptNumber?: string;
  rawText?: string;
  createdAt: number;
}

export interface ParsedStatementMeta {
  statementPeriod?: string;
  cardLast4?: string;
  primaryCurrency?: string;
  totalDebits?: number;
  fileName?: string;
}

export interface ParsedTransactionCandidate {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: CurrencyCode;
  category: ExpenseCategory;
  type: 'debit' | 'credit';
  foreignFee?: number;
  rawText?: string;
  selected: boolean;
  walletId: string;
}

export interface MonthlyBudget {
  monthKey: string; // "YYYY-MM"
  targetBudgetINR: number;
  categoryLimits?: Partial<Record<ExpenseCategory, number>>;
}

export interface CategorySummary {
  category: ExpenseCategory;
  amountINR: number;
  percentage: number;
  transactionCount: number;
  foreignAmounts: Record<string, number>;
}
