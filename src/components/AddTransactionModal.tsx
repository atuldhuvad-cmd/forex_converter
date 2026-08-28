import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  CreditCard,
  Banknote,
  Calendar,
  Tag,
  FileText,
  Check,
  Sparkles,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { ForexWallet, ExpenseCategory, Transaction, TransactionType } from '../types';
import { formatINR, formatForeign, calculateINR, getCurrencySymbol } from '../utils/currency';
import { CATEGORY_CONFIG } from '../data/initialData';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: ForexWallet[];
  onAddTransaction: (transaction: Transaction) => void;
  initialData?: Partial<Transaction> | null;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  wallets,
  onAddTransaction,
  initialData,
}) => {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || 'cad_forex_card');
  const [customRate, setCustomRate] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Food & Dining');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [notes, setNotes] = useState('');

  // Selected wallet object
  const selectedWallet = wallets.find((w) => w.id === walletId) || wallets[0];

  const resetForm = () => {
    setDescription('');
    setAmountStr('');
    setNotes('');
    setCategory('Food & Dining');
    setDate(new Date().toISOString().slice(0, 10));
    setTxType('expense');
  };

  useEffect(() => {
    if (initialData) {
      if (initialData.description) setDescription(initialData.description);
      if (initialData.amount) setAmountStr(initialData.amount.toString());
      if (initialData.walletId) setWalletId(initialData.walletId);
      if (initialData.category) setCategory(initialData.category);
      if (initialData.date) setDate(initialData.date);
      if (initialData.notes) setNotes(initialData.notes);
      if (initialData.type) setTxType(initialData.type);
    } else {
      resetForm();
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (selectedWallet) {
      setCustomRate(selectedWallet.purchasedRateINR.toString());
    }
  }, [walletId, selectedWallet]);

  const parsedAmount = parseFloat(amountStr) || 0;
  const parsedRate = parseFloat(customRate) || selectedWallet?.purchasedRateINR || 67.85;
  const calculatedINR = calculateINR(parsedAmount, parsedRate);
  const isReceipt = txType === 'refund' || txType === 'income';

  const handleSubmit = (e: React.FormEvent, addAnother = false) => {
    e.preventDefault();
    if (!description.trim() || parsedAmount <= 0) {
      alert('Please enter a valid description and an amount greater than 0.');
      return;
    }

    const newTx: Transaction = {
      id: initialData?.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      date,
      time: initialData?.time || undefined,
      description: description.trim(),
      amount: parsedAmount,
      currency: selectedWallet?.currency || 'CAD',
      walletId: selectedWallet?.id || 'cad_forex_card',
      exchangeRate: parsedRate,
      amountINR: calculatedINR,
      category,
      type: txType,
      source: selectedWallet?.type === 'cash' ? 'manual_cash' : 'manual_card',
      notes: notes.trim(),
      createdAt: initialData?.createdAt || Date.now(),
    };

    onAddTransaction(newTx);

    if (addAnother) {
      setDescription('');
      setAmountStr('');
      setNotes('');
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/80">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData?.id ? 'Edit Transaction' : 'Record Transaction'}
              </h2>
              <p className="text-xs text-slate-400">
                Auto-converts foreign currency to INR at purchased cost basis
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

        {/* Modal Form Body */}
        <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Transaction Type: Payment vs Receipt/Refund */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Transaction Type:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="btn-type-payment"
                onClick={() => setTxType('expense')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  txType === 'expense'
                    ? 'bg-rose-950/70 border-rose-600 text-rose-300 ring-1 ring-rose-600 shadow-xs'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <ArrowDown className="w-3.5 h-3.5 text-rose-400" />
                <span>↓ Payment / Expense</span>
              </button>
              <button
                type="button"
                id="btn-type-receipt"
                onClick={() => setTxType('refund')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  txType === 'refund' || txType === 'income'
                    ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300 ring-1 ring-emerald-600 shadow-xs'
                    : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5 text-emerald-400" />
                <span>↑ Receipt / Refund</span>
              </button>
            </div>
          </div>

          {/* Wallet / Payment Instrument Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Payment Source / Wallet:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {wallets.map((w) => {
                const isSelected = w.id === walletId;
                const isCard = w.type === 'forex_card';
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => setWalletId(w.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-950/80 border-blue-500 text-white shadow-xs ring-1 ring-blue-500'
                        : 'bg-slate-800/70 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate text-slate-100">{w.name}</span>
                      {isCard ? (
                        <CreditCard className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      ) : (
                        <Banknote className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>{getCurrencySymbol(w.currency)} {w.currency}</span>
                      <span>@ ₹{w.purchasedRateINR.toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Foreign Amount & Live INR Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Amount in Foreign Currency ({selectedWallet?.currency || 'CAD'})
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono font-bold text-sm">
                  {getCurrencySymbol(selectedWallet?.currency || 'CAD')}
                </span>
                <input
                  id="input-transaction-foreign-amount"
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className={`w-full pl-11 pr-3 py-2.5 bg-slate-800 border rounded-xl text-lg font-bold font-mono focus:outline-none focus:ring-2 ${
                    isReceipt
                      ? 'border-emerald-700/80 text-emerald-400 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-rose-700/80 text-rose-400 focus:border-rose-500 focus:ring-rose-500/20'
                  }`}
                />
              </div>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cost Basis Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-xs font-bold">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  title="Exchange Rate applied to this transaction"
                />
              </div>
            </div>
          </div>

          {/* Converted Total Highlight Box */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isReceipt
                ? 'bg-emerald-950/30 border-emerald-800/60'
                : 'bg-rose-950/30 border-rose-800/60'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${isReceipt ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                {isReceipt ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
              </div>
              <span className="text-xs font-semibold text-slate-300">
                {isReceipt ? 'Refund Inflow (Receipt):' : 'Payment Outflow (Expense):'}
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-lg font-extrabold font-mono flex items-center justify-end gap-1 ${
                  isReceipt ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                <span>{isReceipt ? '+' : '-'} {formatINR(calculatedINR)}</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                {parsedAmount.toFixed(2)} {getCurrencySymbol(selectedWallet?.currency)} ({selectedWallet?.currency}) × ₹{parsedRate.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Merchant / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Merchant / Description:
            </label>
            <input
              id="input-transaction-merchant"
              type="text"
              required
              placeholder="e.g. Tim Hortons, Walmart, Taxi, Merchant Refund"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Spending Category:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-slate-950/60 rounded-xl border border-slate-800">
              {Object.keys(CATEGORY_CONFIG).map((catName) => {
                const isSelected = category === catName;
                const config = CATEGORY_CONFIG[catName as ExpenseCategory];
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => setCategory(catName as ExpenseCategory)}
                    className={`p-2 rounded-lg text-xs font-medium text-left transition truncate border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 font-semibold shadow-xs'
                        : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-mono"
            />
          </div>

          {/* Notes / Optional details */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. airport purchase, refund reference ID"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!initialData?.id && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 shadow-xs transition"
              >
                Save & Add Another
              </button>
            )}

            <button
              id="btn-submit-transaction-save"
              onClick={(e) => handleSubmit(e, false)}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {initialData?.id ? 'Update Entry' : 'Save Entry'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
