import { ForexWallet, Transaction, ExpenseCategory } from '../types';

export const DEFAULT_WALLETS: ForexWallet[] = [
  {
    id: 'cad_forex_card',
    name: 'CAD Forex Card',
    currency: 'CAD',
    type: 'forex_card',
    purchasedRateINR: 67.85,
    initialBalance: 3000.0,
    color: 'from-blue-600 to-indigo-600',
    notes: 'Bought at market price 67.85 INR/CAD',
    cardLast4: '4821',
    isDefault: true,
  },
  {
    id: 'cad_cash',
    name: 'CAD Cash',
    currency: 'CAD',
    type: 'cash',
    purchasedRateINR: 68.70,
    initialBalance: 500.0,
    color: 'from-emerald-600 to-teal-700',
    notes: 'Bought physical cash at 68.70 INR/CAD',
  },
  {
    id: 'usd_cash',
    name: 'USD Cash',
    currency: 'USD',
    type: 'cash',
    purchasedRateINR: 95.80,
    initialBalance: 300.0,
    color: 'from-amber-600 to-orange-700',
    notes: 'Bought physical USD at 95.80 INR/USD',
  },
];

export const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; color: string; hexColor: string; iconName: string; bgBadge: string }
> = {
  'Food & Dining': {
    label: 'Food & Dining',
    color: 'text-amber-400',
    hexColor: '#f59e0b',
    iconName: 'Utensils',
    bgBadge: 'bg-amber-950/60 border-amber-700/60 text-amber-300',
  },
  'Groceries': {
    label: 'Groceries',
    color: 'text-emerald-400',
    hexColor: '#10b981',
    iconName: 'ShoppingBag',
    bgBadge: 'bg-emerald-950/60 border-emerald-700/60 text-emerald-300',
  },
  'Shopping': {
    label: 'Shopping',
    color: 'text-violet-400',
    hexColor: '#a78bfa',
    iconName: 'Tag',
    bgBadge: 'bg-violet-950/60 border-violet-700/60 text-violet-300',
  },
  'Transit & Transport': {
    label: 'Transit & Transport',
    color: 'text-sky-400',
    hexColor: '#38bdf8',
    iconName: 'Car',
    bgBadge: 'bg-sky-950/60 border-sky-700/60 text-sky-300',
  },
  'Accommodation': {
    label: 'Accommodation',
    color: 'text-indigo-400',
    hexColor: '#818cf8',
    iconName: 'Hotel',
    bgBadge: 'bg-indigo-950/60 border-indigo-700/60 text-indigo-300',
  },
  'Entertainment': {
    label: 'Entertainment',
    color: 'text-pink-400',
    hexColor: '#f472b6',
    iconName: 'Film',
    bgBadge: 'bg-pink-950/60 border-pink-700/60 text-pink-300',
  },
  'Utilities & Telecom': {
    label: 'Utilities & Telecom',
    color: 'text-cyan-400',
    hexColor: '#22d3ee',
    iconName: 'Wifi',
    bgBadge: 'bg-cyan-950/60 border-cyan-700/60 text-cyan-300',
  },
  'Health & Medical': {
    label: 'Health & Medical',
    color: 'text-rose-400',
    hexColor: '#fb7185',
    iconName: 'HeartPulse',
    bgBadge: 'bg-rose-950/60 border-rose-700/60 text-rose-300',
  },
  'Forex & ATM Fee': {
    label: 'Forex & ATM Fee',
    color: 'text-yellow-400',
    hexColor: '#facc15',
    iconName: 'Percent',
    bgBadge: 'bg-yellow-950/60 border-yellow-700/60 text-yellow-300',
  },
  'Miscellaneous': {
    label: 'Miscellaneous',
    color: 'text-slate-400',
    hexColor: '#94a3b8',
    iconName: 'Layers',
    bgBadge: 'bg-slate-800/80 border-slate-700 text-slate-300',
  },
};

export const INITIAL_SAMPLE_TRANSACTIONS: Transaction[] = [];
