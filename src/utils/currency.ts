import { Transaction, ExpenseCategory, ForexWallet, CategorySummary, CurrencyDefinition } from '../types';

export const GLOBAL_CURRENCIES: Record<string, CurrencyDefinition> = {
  CAD: {
    code: 'CAD',
    name: 'Canadian Dollar',
    symbol: 'C$',
    defaultRateINR: 67.85,
    flagEmoji: '🇨🇦',
    isPopular: true,
  },
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    defaultRateINR: 95.80,
    flagEmoji: '🇺🇸',
    isPopular: true,
  },
  INR: {
    code: 'INR',
    name: 'Indian Rupee',
    symbol: '₹',
    defaultRateINR: 1.0,
    flagEmoji: '🇮🇳',
    isPopular: true,
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    defaultRateINR: 90.50,
    flagEmoji: '🇪🇺',
    isPopular: true,
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    defaultRateINR: 108.20,
    flagEmoji: '🇬🇧',
    isPopular: true,
  },
  AUD: {
    code: 'AUD',
    name: 'Australian Dollar',
    symbol: 'A$',
    defaultRateINR: 56.40,
    flagEmoji: '🇦🇺',
    isPopular: true,
  },
  SGD: {
    code: 'SGD',
    name: 'Singapore Dollar',
    symbol: 'S$',
    defaultRateINR: 64.80,
    flagEmoji: '🇸🇬',
    isPopular: true,
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'AED',
    defaultRateINR: 23.40,
    flagEmoji: '🇦🇪',
    isPopular: false,
  },
  JPY: {
    code: 'JPY',
    name: 'Japanese Yen',
    symbol: '¥',
    defaultRateINR: 0.58,
    flagEmoji: '🇯🇵',
    isPopular: false,
  },
  CHF: {
    code: 'CHF',
    name: 'Swiss Franc',
    symbol: 'Fr',
    defaultRateINR: 96.20,
    flagEmoji: '🇨🇭',
    isPopular: false,
  },
};

export function getCurrencySymbol(currency: string = 'CAD'): string {
  if (!currency) return 'C$';
  const upper = currency.toUpperCase().trim();
  if (GLOBAL_CURRENCIES[upper]) {
    return GLOBAL_CURRENCIES[upper].symbol;
  }
  if (upper === 'CAD') return 'C$';
  if (upper === 'USD') return '$';
  if (upper === 'INR') return '₹';
  if (upper === 'EUR') return '€';
  if (upper === 'GBP') return '£';
  if (upper === 'AUD') return 'A$';
  if (upper === 'SGD') return 'S$';
  if (upper === 'JPY' || upper === 'CNY') return '¥';
  if (upper === 'CHF') return 'Fr';
  return upper;
}

export function getCurrencyName(currency: string = 'CAD'): string {
  if (!currency) return 'Canadian Dollar';
  const upper = currency.toUpperCase().trim();
  return GLOBAL_CURRENCIES[upper]?.name || `${upper} Currency`;
}

export function formatINR(amount: number): string {
  if (isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatForeign(amount: number, currency: string = 'CAD'): string {
  if (isNaN(amount)) return `${getCurrencySymbol(currency)} 0.00`;
  const symbol = getCurrencySymbol(currency);
  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol} ${formattedNum}`;
}

export function calculateINR(foreignAmount: number, rate: number): number {
  const result = foreignAmount * rate;
  return Math.round((result + Number.EPSILON) * 100) / 100;
}

export function getMonthKey(dateString: string): string {
  // YYYY-MM
  if (!dateString) return new Date().toISOString().slice(0, 7);
  return dateString.slice(0, 7);
}

export function formatMonthDisplay(monthKey: string): string {
  if (!monthKey || monthKey === 'all') return 'All Months';
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function computeCategorySummaries(
  transactions: Transaction[]
): { summaries: CategorySummary[]; totalSpentINR: number } {
  const expenseTxs = transactions.filter((t) => t.type === 'expense');
  const totalSpentINR = expenseTxs.reduce((sum, t) => sum + t.amountINR, 0);

  const categoryMap: Record<
    ExpenseCategory,
    { amountINR: number; count: number; foreignAmounts: Record<string, number> }
  > = {
    'Food & Dining': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Groceries': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Shopping': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Transit & Transport': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Accommodation': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Entertainment': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Utilities & Telecom': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Health & Medical': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Forex & ATM Fee': { amountINR: 0, count: 0, foreignAmounts: {} },
    'Miscellaneous': { amountINR: 0, count: 0, foreignAmounts: {} },
  };

  for (const t of expenseTxs) {
    const cat = t.category || 'Miscellaneous';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { amountINR: 0, count: 0, foreignAmounts: {} };
    }
    categoryMap[cat].amountINR += t.amountINR;
    categoryMap[cat].count += 1;
    const cur = t.currency || 'CAD';
    categoryMap[cat].foreignAmounts[cur] = (categoryMap[cat].foreignAmounts[cur] || 0) + t.amount;
  }

  const summaries: CategorySummary[] = Object.entries(categoryMap)
    .filter(([_, data]) => data.amountINR > 0)
    .map(([cat, data]) => ({
      category: cat as ExpenseCategory,
      amountINR: data.amountINR,
      percentage: totalSpentINR > 0 ? (data.amountINR / totalSpentINR) * 100 : 0,
      transactionCount: data.count,
      foreignAmounts: data.foreignAmounts,
    }))
    .sort((a, b) => b.amountINR - a.amountINR);

  return { summaries, totalSpentINR };
}

export function computeWalletBalances(
  wallets: ForexWallet[],
  transactions: Transaction[]
): Record<string, { spentForeign: number; spentINR: number; remainingForeign: number; remainingINR: number }> {
  const result: Record<string, { spentForeign: number; spentINR: number; remainingForeign: number; remainingINR: number }> = {};

  for (const wallet of wallets) {
    const txs = transactions.filter((t) => t.walletId === wallet.id);
    let spentForeign = 0;
    let spentINR = 0;

    for (const t of txs) {
      if (t.type === 'expense') {
        spentForeign += t.amount;
        spentINR += t.amountINR;
      } else if (t.type === 'refund') {
        spentForeign -= t.amount;
        spentINR -= t.amountINR;
      }
    }

    const remainingForeign = Math.max(0, wallet.initialBalance - spentForeign);
    const remainingINR = remainingForeign * wallet.purchasedRateINR;

    result[wallet.id] = {
      spentForeign,
      spentINR,
      remainingForeign,
      remainingINR,
    };
  }

  return result;
}
