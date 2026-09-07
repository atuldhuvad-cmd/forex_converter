import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  Download,
  Upload,
  Copy,
  Check,
  Smartphone,
  Monitor,
  FileSpreadsheet,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ForexWallet, Transaction, MonthlyBudget } from '../types';
import {
  downloadJSONBackup,
  exportTransactionsToCSV,
  generateSyncCode,
  decodeSyncCode,
} from '../utils/storage';

interface SyncBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: ForexWallet[];
  transactions: Transaction[];
  budgets: MonthlyBudget[];
  onRestoreData: (wallets: ForexWallet[], transactions: Transaction[], budgets: MonthlyBudget[]) => void;
}

export const SyncBackupModal: React.FC<SyncBackupModalProps> = ({
  isOpen,
  onClose,
  wallets,
  transactions,
  budgets,
  onRestoreData,
}) => {
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [genPassphrase, setGenPassphrase] = useState('');
  const [importPassphrase, setImportPassphrase] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    setGenError(null);
    setIsGenerating(true);
    try {
      const code = await generateSyncCode(wallets, transactions, budgets, genPassphrase);
      setGeneratedCode(code);
    } catch (err: any) {
      setGenError(err?.message || 'Failed to generate sync code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleApplySyncCode = async () => {
    setImportError(null);
    if (!syncCodeInput.trim()) {
      setImportError('Please paste a valid Sync Code.');
      return;
    }
    if (!importPassphrase.trim()) {
      setImportError('Enter the passphrase used to generate this sync code.');
      return;
    }
    setIsImporting(true);
    try {
      const payload = await decodeSyncCode(syncCodeInput, importPassphrase);
      if (confirm(`Restore ${payload.transactions.length} transactions and ${payload.wallets.length} wallets? This will merge with or update your current device data.`)) {
        onRestoreData(payload.wallets, payload.transactions, payload.budgets || []);
        setImportStatus('Data successfully synchronized across devices!');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setImportError(err?.message || 'Invalid sync code or passphrase.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!Array.isArray(parsed.wallets) || !Array.isArray(parsed.transactions)) {
          throw new Error('Invalid JSON backup structure');
        }
        if (confirm(`Restore ${parsed.transactions.length} transactions from "${file.name}"?`)) {
          onRestoreData(parsed.wallets, parsed.transactions, parsed.budgets || []);
          setImportStatus('Backup restored successfully!');
          setTimeout(() => onClose(), 1200);
        }
      } catch (err: any) {
        alert(`Failed to parse backup file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/80">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Desktop & Mobile Synchronization</h2>
              <p className="text-xs text-slate-400">
                Seamlessly transfer your Forex card rates & transactions between phone and laptop
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {importStatus && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              {importStatus}
            </div>
          )}

          {/* Sync Overview Flow */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-around text-center text-xs">
            <div className="space-y-1">
              <Smartphone className="w-6 h-6 text-blue-400 mx-auto" />
              <p className="font-bold text-white">Mobile PWA</p>
              <p className="text-slate-400">Offline & Fast</p>
            </div>
            <div className="text-blue-400 font-mono text-sm font-bold">⇄</div>
            <div className="space-y-1">
              <Monitor className="w-6 h-6 text-slate-300 mx-auto" />
              <p className="font-bold text-white">Desktop Browser</p>
              <p className="text-slate-400">Full Screen Ledger</p>
            </div>
          </div>

          {/* Method 1: Passphrase-Encrypted Sync Code */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Encrypted Transfer Code
            </h3>
            <p className="text-xs text-slate-400">
              Choose a passphrase to AES-256 encrypt a code containing all card statements, exchange rates, and cash expenses. You'll need to enter the same passphrase on the other device to decrypt it.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Passphrase (used to encrypt)
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Choose a passphrase..."
                  value={genPassphrase}
                  onChange={(e) => setGenPassphrase(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleGenerateCode}
                  disabled={isGenerating || !genPassphrase.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white shrink-0 shadow-xs transition"
                >
                  {isGenerating ? 'Encrypting...' : 'Generate Code'}
                </button>
              </div>
              {genError && <p className="text-xs text-red-400">{genError}</p>}
              {generatedCode && (
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={generatedCode}
                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white truncate"
                  />
                  <button
                    onClick={handleCopyCode}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white shrink-0 shadow-xs transition flex items-center gap-1.5"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedCode ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="block text-xs font-medium text-slate-300">
                Receive data from another device:
              </label>
              <input
                type="text"
                placeholder="Paste encrypted sync code here..."
                value={syncCodeInput}
                onChange={(e) => setSyncCodeInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Enter the passphrase used to encrypt it..."
                  value={importPassphrase}
                  onChange={(e) => setImportPassphrase(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  onClick={handleApplySyncCode}
                  disabled={isImporting}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shrink-0 shadow-xs transition"
                >
                  {isImporting ? 'Decrypting...' : 'Import Data'}
                </button>
              </div>
              {importError && <p className="text-xs text-red-400">{importError}</p>}
            </div>
          </div>

          {/* Method 2: Backup Files */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Download JSON */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                <Download className="w-4 h-4 text-blue-400" />
                <span>Export JSON Backup</span>
              </div>
              <p className="text-xs text-slate-400">
                Save a local file backup of all transactions, rates, and budgets.
              </p>
              <button
                onClick={() => downloadJSONBackup(wallets, transactions, budgets)}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition"
              >
                Download .JSON Backup
              </button>
            </div>

            {/* Restore JSON */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
              <div className="flex items-center space-x-2 text-white font-semibold text-sm">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Restore JSON Backup</span>
              </div>
              <p className="text-xs text-slate-400">
                Restore previously downloaded .JSON backup files into this app.
              </p>
              <label className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 shadow-xs transition flex items-center justify-center cursor-pointer">
                <span>Select Backup File</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* CSV Spreadsheet Export */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-white font-semibold text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export to Excel / Google Sheets (CSV)</span>
              </div>
              <p className="text-xs text-slate-400">
                Export clean tabular data with original currencies, exchange rates, and converted INR.
              </p>
            </div>
            <button
              onClick={() => exportTransactionsToCSV(transactions, wallets)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shrink-0 shadow-xs"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
