import React, { useState } from 'react';
import {
  Calculator,
  ArrowRightLeft,
  CreditCard,
  Banknote,
  PlusCircle,
  TrendingDown,
  Sparkles,
  Info,
  ArrowDown,
} from 'lucide-react';
import { ForexWallet } from '../types';
import { formatINR, formatForeign, getCurrencySymbol, getCurrencyName } from '../utils/currency';

interface QuickConverterProps {
  wallets: ForexWallet[];
  onQuickAdd: (amount: number, currency: string, walletId: string) => void;
}

export const QuickConverter: React.FC<QuickConverterProps> = ({ wallets, onQuickAdd }) => {
  const [foreignInput, setForeignInput] = useState<string>('50');
  const [inrInput, setInrInput] = useState<string>('5000');
  const [mode, setMode] = useState<'foreign_to_inr' | 'inr_to_foreign'>('foreign_to_inr');

  // Extract all distinct currencies from wallets
  const availableCurrencies: string[] = Array.from(new Set<string>(wallets.map((w) => w.currency.toUpperCase())));
  const [selectedCurrency, setSelectedCurrency] = useState<string>(availableCurrencies[0] || 'CAD');

  const parsedForeign = parseFloat(foreignInput) || 0;
  const parsedINR = parseFloat(inrInput) || 0;

  // Filter wallets for the selected currency
  const currencyWallets = selectedCurrency === 'ALL'
    ? wallets
    : wallets.filter((w) => w.currency.toUpperCase() === selectedCurrency.toUpperCase());

  // Fallback to all wallets if none match currency
  const targetWallets = currencyWallets.length > 0 ? currencyWallets : wallets;

  // Find CAD card & cash for comparative savings
  const cadCard = wallets.find((w) => w.id === 'cad_forex_card' || (w.currency === 'CAD' && w.type === 'forex_card'));
  const cadCash = wallets.find((w) => w.id === 'cad_cash' || (w.currency === 'CAD' && w.type === 'cash'));

  const cardCostINR = cadCard ? parsedForeign * cadCard.purchasedRateINR : 0;
  const cashCostINR = cadCash ? parsedForeign * cadCash.purchasedRateINR : 0;
  const cadSavingsINR = cashCostINR > cardCostINR ? cashCostINR - cardCostINR : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/80">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Live Cost & Exchange Converter</h2>
            <p className="text-xs text-slate-400">
              Instantly convert foreign currency amounts to INR (₹) using your actual purchased rates
            </p>
          </div>
        </div>

        {/* Currency Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {availableCurrencies.map((cur) => (
            <button
              key={cur}
              onClick={() => setSelectedCurrency(cur)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 ${
                selectedCurrency === cur
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="font-mono">{getCurrencySymbol(cur)}</span>
              <span>{cur}</span>
            </button>
          ))}
          <button
            onClick={() => setSelectedCurrency('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              selectedCurrency === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Instruments
          </button>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {mode === 'foreign_to_inr' ? (
          <div className="md:col-span-12 space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              Enter Foreign Amount ({selectedCurrency === 'ALL' ? 'Selected Currencies' : `${selectedCurrency} - ${getCurrencyName(selectedCurrency)}`}) to convert to INR (₹):
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-400 font-mono font-bold text-base">
                {selectedCurrency === 'ALL' ? '¤' : getCurrencySymbol(selectedCurrency)}
              </span>
              <input
                id="converter-foreign-input"
                type="number"
                step="any"
                value={foreignInput}
                onChange={(e) => setForeignInput(e.target.value)}
                placeholder="e.g. 50.00"
                className="w-full pl-14 pr-28 py-3.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xl sm:text-2xl font-bold font-mono text-white focus:outline-none transition"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                {[10, 25, 50, 100, 200].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => setForeignInput(quick.toString())}
                    className="hidden sm:inline-block px-2 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-md text-xs font-mono text-slate-200 font-semibold shadow-xs"
                  >
                    {quick}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="md:col-span-12 space-y-2">
            <label className="block text-xs font-bold text-slate-300">
              Enter INR Amount (₹) to see Foreign Currency equivalence:
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-4 text-slate-500 font-mono font-bold text-lg">₹</span>
              <input
                type="number"
                step="any"
                value={inrInput}
                onChange={(e) => setInrInput(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full pl-10 pr-24 py-3.5 bg-slate-950 border border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-xl sm:text-2xl font-bold font-mono text-white focus:outline-none transition"
              />
              <div className="absolute right-2 flex items-center gap-1.5">
                {[1000, 5000, 10000].map((quick) => (
                  <button
                    key={quick}
                    onClick={() => setInrInput(quick.toString())}
                    className="hidden sm:inline-block px-2 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-md text-xs font-mono text-slate-200 font-semibold shadow-xs"
                  >
                    ₹{quick}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Side-by-Side Comparison Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {targetWallets.map((wallet) => {
          const inrValue = mode === 'foreign_to_inr'
            ? parsedForeign * wallet.purchasedRateINR
            : parsedINR;
          const foreignEquiv = mode === 'inr_to_foreign'
            ? parsedINR / (wallet.purchasedRateINR || 1)
            : parsedForeign;

          const isCard = wallet.type === 'forex_card';

          return (
            <div
              key={wallet.id}
              className={`p-4 rounded-xl border relative transition-all shadow-xs ${
                isCard
                  ? 'bg-blue-950/30 border-blue-800/80'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isCard
                        ? 'bg-blue-950/80 text-blue-400 border border-blue-800/80'
                        : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                    }`}
                  >
                    {isCard ? <CreditCard className="w-4 h-4" /> : <Banknote className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-sm font-bold text-white block">{wallet.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {getCurrencySymbol(wallet.currency)} {wallet.currency}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                  @ ₹{wallet.purchasedRateINR.toFixed(2)}
                </span>
              </div>

              {/* Converted Values */}
              <div className="space-y-1 my-3">
                <div className="text-2xl font-extrabold font-mono text-white tracking-tight">
                  {mode === 'foreign_to_inr' ? formatINR(inrValue) : formatForeign(foreignEquiv, wallet.currency)}
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  {mode === 'foreign_to_inr'
                    ? `${formatForeign(parsedForeign, wallet.currency)} × ₹${wallet.purchasedRateINR}`
                    : `₹${parsedINR} ÷ ₹${wallet.purchasedRateINR}`}
                </p>
              </div>

              {/* Quick Add Expense Action */}
              <button
                onClick={() => onQuickAdd(parsedForeign, wallet.currency, wallet.id)}
                className="w-full mt-2 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-blue-600 text-slate-200 hover:text-white border border-slate-700 hover:border-blue-600 shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
                <span>Log as {wallet.name} Expense</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Smart Insight Bar for CAD Card vs Cash */}
      {cadCard && cadCash && parsedForeign > 0 && selectedCurrency === 'CAD' && (
        <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Forex Card Rate (<strong>₹{cadCard.purchasedRateINR.toFixed(2)}</strong>) vs CAD Cash (<strong>₹{cadCash.purchasedRateINR.toFixed(2)}</strong>) saves you{' '}
              <strong className="text-emerald-400 font-mono font-bold">{formatINR(cadSavingsINR)}</strong> on {formatForeign(parsedForeign, 'CAD')}.
            </span>
          </div>
          <span className="text-slate-400 font-mono font-semibold">Diff: ₹{Math.abs(cadCash.purchasedRateINR - cadCard.purchasedRateINR).toFixed(2)}/CAD</span>
        </div>
      )}
    </div>
  );
};
