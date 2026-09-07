import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Check,
  CreditCard,
  Banknote,
  ShieldAlert,
  Sparkles,
  DollarSign,
  PlusCircle,
  Coins,
} from 'lucide-react';
import { ForexWallet, Transaction } from '../types';
import {
  formatForeign,
  formatINR,
  computeWalletBalances,
  getCurrencySymbol,
  getCurrencyName,
  GLOBAL_CURRENCIES,
} from '../utils/currency';
import { DEFAULT_WALLETS } from '../data/initialData';

interface ForexWalletsModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: ForexWallet[];
  onSaveWallets: (wallets: ForexWallet[]) => void;
  transactions: Transaction[];
}

export const ForexWalletsModal: React.FC<ForexWalletsModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onSaveWallets,
  transactions,
}) => {
  const [localWallets, setLocalWallets] = useState<ForexWallet[]>(wallets);
  const [activeTab, setActiveTab] = useState<'wallets' | 'add_currency'>('wallets');
  const [newWallet, setNewWallet] = useState<Partial<ForexWallet>>({
    name: '',
    currency: 'EUR',
    type: 'forex_card',
    purchasedRateINR: 0,
    initialBalance: 0,
    color: 'from-blue-600 to-indigo-600',
  });

  useEffect(() => {
    if (isOpen) {
      setLocalWallets(wallets);
      setActiveTab('wallets');
    }
  }, [isOpen, wallets]);

  const walletBalances = computeWalletBalances(localWallets, transactions);

  const handleUpdateRate = (id: string, newRate: number) => {
    setLocalWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, purchasedRateINR: newRate } : w))
    );
  };

  const handleUpdateBalance = (id: string, newBalance: number) => {
    setLocalWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, initialBalance: newBalance } : w))
    );
  };

  const handleUpdateName = (id: string, newName: string) => {
    setLocalWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, name: newName } : w))
    );
  };

  const handleDeleteWallet = (id: string) => {
    if (localWallets.length <= 1) {
      alert('You must keep at least one Forex wallet or payment instrument.');
      return;
    }
    setLocalWallets((prev) => prev.filter((w) => w.id !== id));
  };

  const handleQuickAddPreset = (code: string) => {
    const meta = GLOBAL_CURRENCIES[code] || { name: code, symbol: code, defaultRateINR: 0 };
    const walletName = `${code} Forex Card`;
    const newId = `wallet_${code.toLowerCase()}_${Date.now()}`;

    const created: ForexWallet = {
      id: newId,
      name: walletName,
      currency: code,
      type: 'forex_card',
      purchasedRateINR: meta.defaultRateINR,
      initialBalance: 0,
      color: code === 'EUR' ? 'from-amber-600 to-yellow-700' : code === 'GBP' ? 'from-purple-600 to-indigo-700' : 'from-blue-600 to-cyan-700',
      notes: `${meta.name} instrument added at ₹${meta.defaultRateINR}`,
    };

    setLocalWallets([...localWallets, created]);
    setActiveTab('wallets');
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    const code = (newWallet.currency || 'EUR').toUpperCase().trim();
    if (!newWallet.name || !code || !newWallet.purchasedRateINR) {
      alert('Please fill out the wallet name, currency code, and purchase rate.');
      return;
    }

    const created: ForexWallet = {
      id: `wallet_${code.toLowerCase()}_${Date.now()}`,
      name: newWallet.name.trim(),
      currency: code,
      type: newWallet.type || 'forex_card',
      purchasedRateINR: Number(newWallet.purchasedRateINR),
      initialBalance: Number(newWallet.initialBalance || 0),
      color: newWallet.type === 'cash' ? 'from-emerald-600 to-teal-700' : 'from-blue-600 to-indigo-600',
      notes: `Custom ${code} instrument with rate ${newWallet.purchasedRateINR} INR`,
    };

    setLocalWallets([...localWallets, created]);
    setActiveTab('wallets');
    setNewWallet({
      name: '',
      currency: 'EUR',
      type: 'forex_card',
      purchasedRateINR: 0,
      initialBalance: 0,
    });
  };

  const handleSaveAndApply = () => {
    onSaveWallets(localWallets);
    onClose();
  };

  const handleResetToUserDefaults = () => {
    if (confirm('Remove all configured wallets and return to a blank setup?')) {
      setLocalWallets(DEFAULT_WALLETS);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/80">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Currencies, Forex Rates & Wallets</h2>
              <p className="text-xs text-slate-400">
                Manage your currency instruments, cost basis (INR per unit), and Euro / UK Pound presets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/30">
          <button
            type="button"
            onClick={() => setActiveTab('wallets')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'wallets'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Active Instruments ({localWallets.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('add_currency')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'add_currency'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Add Euro / UK Pound / New Currency</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'wallets' ? (
            <>
              {/* Key Rates Notice Banner */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 text-xs sm:text-sm text-blue-300 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-white mb-0.5">Configured Forex Cost Basis</p>
                  <p className="text-slate-300 text-xs">
                    Every transaction automatically calculates its exact INR cost based on the purchase rate of its selected card or cash wallet. You can update exchange rates or initial balances at any time.
                  </p>
                </div>
              </div>

              {/* Wallets List */}
              <div className="space-y-4">
                {localWallets.map((wallet) => {
                  const balance = walletBalances[wallet.id] || {
                    spentForeign: 0,
                    spentINR: 0,
                    remainingForeign: wallet.initialBalance,
                    remainingINR: wallet.initialBalance * wallet.purchasedRateINR,
                  };
                  const symbol = getCurrencySymbol(wallet.currency);

                  return (
                    <div
                      key={wallet.id}
                      className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-3 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`p-2 rounded-xl ${
                              wallet.type === 'cash'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                                : 'bg-blue-950/80 text-blue-400 border border-blue-800/80'
                            }`}
                          >
                            {wallet.type === 'cash' ? (
                              <Banknote className="w-4 h-4" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              value={wallet.name}
                              onChange={(e) => handleUpdateName(wallet.id, e.target.value)}
                              className="font-bold text-white bg-transparent border-b border-transparent hover:border-slate-600 focus:border-blue-500 focus:outline-none px-1 text-sm sm:text-base"
                            />
                            <div className="flex items-center gap-2 text-xs text-slate-400 px-1">
                              <span className="uppercase font-mono bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-slate-200 font-bold">
                                {symbol} {wallet.currency}
                              </span>
                              <span>• {getCurrencyName(wallet.currency)}</span>
                              <span>• {wallet.type === 'cash' ? 'Physical Cash' : 'Forex Card'}</span>
                              {wallet.cardLast4 && <span>(Ending in {wallet.cardLast4})</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteWallet(wallet.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-950/40 transition"
                          title="Remove wallet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Rate & Initial Balance Controls */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Purchase Rate (INR per 1 {wallet.currency})
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              value={wallet.purchasedRateINR}
                              onChange={(e) => handleUpdateRate(wallet.id, parseFloat(e.target.value) || 0)}
                              className="w-full pl-7 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1">
                            Initial Purchased Quantity ({symbol})
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-2.5 text-slate-500 text-xs font-mono font-bold">
                              {symbol}
                            </span>
                            <input
                              type="number"
                              step="any"
                              value={wallet.initialBalance}
                              onChange={(e) => handleUpdateBalance(wallet.id, parseFloat(e.target.value) || 0)}
                              className="w-full pl-12 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Balance Status Footer */}
                      <div className="bg-slate-950/70 p-2.5 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 border border-slate-800">
                        <div>
                          <span className="text-slate-400">Total Spent: </span>
                          <span className="font-bold text-rose-400">
                            {formatForeign(balance.spentForeign, wallet.currency)}
                          </span>
                          <span className="text-slate-400 ml-1">({formatINR(balance.spentINR)})</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Remaining Balance: </span>
                          <span className="font-bold text-emerald-400">
                            {formatForeign(balance.remainingForeign, wallet.currency)}
                          </span>
                          <span className="text-slate-400 ml-1">({formatINR(balance.remainingINR)})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add More Button */}
              <button
                onClick={() => setActiveTab('add_currency')}
                className="w-full py-3 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/60 hover:bg-slate-800 text-slate-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition shadow-xs"
              >
                <PlusCircle className="w-4 h-4 text-blue-400" />
                Add Euro, UK Pound, or Custom Currency Instrument
              </button>
            </>
          ) : (
            <div className="space-y-6">
              {/* Quick Presets Section */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-400" />
                  Quick-Add Major Preset Currencies
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
                    { code: 'GBP', name: 'UK Pound (£)', symbol: '£' },
                    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
                    { code: 'CAD', name: 'Canadian Dollar (C$)', symbol: 'C$' },
                    { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
                    { code: 'SGD', name: 'Singapore Dollar (S$)', symbol: 'S$' },
                  ].map((preset) => (
                    <button
                      key={preset.code}
                      type="button"
                      onClick={() => handleQuickAddPreset(preset.code)}
                      className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-blue-500 text-left transition hover:bg-slate-800/80 group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm text-white group-hover:text-blue-400">{preset.code}</span>
                        <span className="font-mono font-extrabold text-blue-400 text-sm">{preset.symbol}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{preset.name}</p>
                      <p className="text-[10px] text-emerald-400 font-mono mt-1">Enter your rate</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Form Section */}
              <form onSubmit={handleAddNew} className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-blue-400" />
                  Insert New Custom Currency or Instrument
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Currency Code</label>
                    <input
                      type="text"
                      required
                      maxLength={5}
                      placeholder="e.g. EUR, GBP, AUD, JPY, AED"
                      value={newWallet.currency || ''}
                      onChange={(e) => {
                        const cur = e.target.value.toUpperCase();
                        const meta = GLOBAL_CURRENCIES[cur];
                        setNewWallet({
                          ...newWallet,
                          currency: cur,
                          name: newWallet.name || (meta ? `${cur} Forex Card` : ''),
                          purchasedRateINR: meta ? meta.defaultRateINR : newWallet.purchasedRateINR,
                        });
                      }}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono uppercase focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Symbol: {getCurrencySymbol(newWallet.currency || 'EUR')} • {getCurrencyName(newWallet.currency || 'EUR')}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Instrument / Wallet Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Euro ICICI Travel Card, GBP Sterling Cash"
                      value={newWallet.name || ''}
                      onChange={(e) => setNewWallet({ ...newWallet, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Instrument Type</label>
                    <select
                      value={newWallet.type || 'forex_card'}
                      onChange={(e) => setNewWallet({ ...newWallet, type: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="forex_card">Forex Prepaid Card</option>
                      <option value="cash">Physical Cash</option>
                      <option value="credit_card">International Credit Card</option>
                      <option value="bank_account">Foreign Bank Account</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Purchased Cost Basis Rate (₹ / unit)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 90.50"
                      value={newWallet.purchasedRateINR || ''}
                      onChange={(e) => setNewWallet({ ...newWallet, purchasedRateINR: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Balance / Quantity</label>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 1000"
                      value={newWallet.initialBalance || ''}
                      onChange={(e) => setNewWallet({ ...newWallet, initialBalance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('wallets')}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    Create Currency Instrument
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={handleResetToUserDefaults}
            className="text-xs text-slate-400 hover:text-blue-400 underline font-medium"
          >
            Return to Blank Setup
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save & Apply Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
