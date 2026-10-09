import React from 'react';
import {
  Coins,
  CreditCard,
  PlusCircle,
  FileUp,
  Calculator,
  RefreshCw,
  Download,
  Settings,
  Wifi,
  WifiOff,
  Sparkles,
  ReceiptText,
  PieChart,
} from 'lucide-react';
import { ForexWallet } from '../types';

interface NavbarProps {
  wallets: ForexWallet[];
  isOnline: boolean;
  canInstallPWA: boolean;
  onInstallPWA: () => void;
  onOpenAddModal: () => void;
  onOpenPdfModal: () => void;
  showPdfUpload: boolean;
  onOpenConverterModal: () => void;
  onOpenWalletsModal: () => void;
  onOpenSyncModal: () => void;
  activeTab: 'expenses' | 'analytics' | 'converter';
  setActiveTab: (tab: 'expenses' | 'analytics' | 'converter') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isOnline,
  canInstallPWA,
  onInstallPWA,
  onOpenAddModal,
  onOpenPdfModal,
  showPdfUpload,
  onOpenConverterModal,
  onOpenWalletsModal,
  onOpenSyncModal,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/90 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo and App Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white font-bold">
              <Coins className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1">
                  Forex<span className="text-blue-400">Tracker</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-950/80 text-blue-300 border border-blue-800/80">
                  ₹ INR Base
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multi-Currency Forex & Expense Manager
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs for Desktop */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800">
            <button
              id="nav-tab-expenses"
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'expenses'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <ReceiptText className="w-4 h-4" />
              <span>Transactions & Summary</span>
            </button>
            <button
              id="nav-tab-analytics"
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Category Analytics</span>
            </button>
            <button
              id="nav-tab-converter"
              onClick={() => setActiveTab('converter')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'converter'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Quick Converter</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Online/Offline Status Indicator */}
            <div
              className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/80'
              }`}
              title={isOnline ? 'Online & Ready to Parse Statements' : 'Working Offline (Cached Local Storage)'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Offline Ready</span>
                </>
              )}
            </div>

            {/* Install PWA Button (if browser supports install prompt) */}
            {canInstallPWA && (
              <button
                id="btn-install-pwa"
                onClick={onInstallPWA}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs hover:opacity-95 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                Install App
              </button>
            )}

            {/* Manage Forex Rates & Currencies */}
            <button
              id="btn-manage-rates"
              onClick={onOpenWalletsModal}
              className="p-2 rounded-xl text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 shadow-xs transition flex items-center gap-1.5"
              title="Currencies, Forex Rates & Wallets"
            >
              <Coins className="w-4 h-4 text-amber-400" />
              <span className="hidden xl:inline text-xs font-medium text-slate-300">Currencies & Rates</span>
            </button>

            {/* Sync & Backup */}
            <button
              id="btn-open-sync"
              onClick={onOpenSyncModal}
              className="p-2 rounded-xl text-slate-300 bg-slate-900 hover:bg-slate-800 hover:text-white border border-slate-800 shadow-xs transition"
              title="Desktop Sync, Backup & Restore"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* AI PDF parsing is omitted from the static-hosted build. */}
            {showPdfUpload && (
              <button
                id="btn-upload-statement-header"
                onClick={onOpenPdfModal}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-blue-400 border border-blue-800/70 shadow-xs transition"
              >
                <FileUp className="w-4 h-4 text-blue-400" />
                <span>Upload Card PDF</span>
              </button>
            )}

            {/* Add Transaction Button */}
            <button
              id="btn-add-transaction-header"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden xs:inline">Add Expense</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('expenses')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'expenses' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ReceiptText className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'analytics' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Analytics</span>
          </button>
          <button
            onClick={() => setActiveTab('converter')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'converter' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Converter</span>
          </button>
          <button
            onClick={onOpenWalletsModal}
            className="px-2.5 py-1.5 rounded-lg font-semibold text-amber-300 bg-amber-950/60 border border-amber-800/80 flex items-center gap-1"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Rates</span>
          </button>
        </div>
      </div>
    </header>
  );
};
