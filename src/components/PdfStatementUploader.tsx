import React, { useState, useRef } from 'react';
import {
  FileUp,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Calendar,
  Layers,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
  FileText,
} from 'lucide-react';
import {
  ForexWallet,
  ExpenseCategory,
  ParsedStatementMeta,
  ParsedTransactionCandidate,
  Transaction,
} from '../types';
import { formatINR, formatForeign, calculateINR } from '../utils/currency';
import { CATEGORY_CONFIG } from '../data/initialData';

interface PdfStatementUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: ForexWallet[];
  onImportTransactions: (transactions: Transaction[]) => void;
  existingTransactions: Transaction[];
}

export const PdfStatementUploader: React.FC<PdfStatementUploaderProps> = ({
  isOpen,
  onClose,
  wallets,
  onImportTransactions,
  existingTransactions,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [meta, setMeta] = useState<ParsedStatementMeta | null>(null);
  const [candidates, setCandidates] = useState<ParsedTransactionCandidate[]>([]);
  const targetWallet =
    wallets.find((w) => w.id === 'cad_forex_card' || (w.type === 'forex_card' && w.currency === 'CAD')) ||
    wallets.find((w) => w.type === 'forex_card') ||
    wallets[0];
  const targetWalletId = targetWallet?.id || 'cad_forex_card';

  const [showSampleText, setShowSampleText] = useState(false);
  const [rawTextContent, setRawTextContent] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsProcessing(true);
    setErrorMessage(null);
    setCandidates([]);
    setProcessingStep('Reading document...');

    try {
      // Check file size (limit to 25MB for safety)
      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File size exceeds 25MB limit. Please upload a smaller statement.');
      }

      setProcessingStep('Converting document for AI Analysis...');
      const base64Data = await fileToBase64(file);

      setProcessingStep('Gemini AI is parsing card debits & categorizing merchants...');

      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
          defaultCurrency: targetWallet?.currency || 'CAD',
        }),
      });

      const resJson = await response.json();

      if (!response.ok) {
        throw new Error(resJson.error || 'Failed to parse statement.');
      }

      if (!resJson.data || !Array.isArray(resJson.data.transactions)) {
        throw new Error('Could not find transaction items in the uploaded document.');
      }

      const parsedTxs: ParsedTransactionCandidate[] = resJson.data.transactions.map(
        (t: any, idx: number) => ({
          id: `cand_${Date.now()}_${idx}`,
          date: t.date || new Date().toISOString().slice(0, 10),
          description: t.description || 'Forex Card Transaction',
          amount: parseFloat(t.amount) || 0,
          currency: t.currency || targetWallet.currency || 'CAD',
          category: (t.category as ExpenseCategory) || 'Miscellaneous',
          type: t.type === 'credit' ? 'credit' : 'debit',
          foreignFee: t.foreignFee || 0,
          rawText: t.rawText || '',
          selected: true,
          walletId: targetWalletId,
        })
      );

      setMeta({
        statementPeriod: resJson.data.statementPeriod,
        cardLast4: resJson.data.cardLast4,
        primaryCurrency: resJson.data.primaryCurrency || targetWallet.currency,
        totalDebits: resJson.data.totalDebits,
        fileName: file.name,
      });

      setCandidates(parsedTxs);
      setProcessingStep('');
    } catch (err: any) {
      console.error('File parsing failure:', err);
      setErrorMessage(err.message || 'Error parsing document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Strip data:application/pdf;base64, prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleParseRawText = async () => {
    if (!rawTextContent.trim()) {
      setErrorMessage('Please paste statement text or CSV rows.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    setProcessingStep('Parsing statement text with Gemini AI...');

    try {
      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: rawTextContent,
          fileName: 'pasted-statement.txt',
          defaultCurrency: targetWallet?.currency || 'CAD',
        }),
      });

      const resJson = await response.json();
      if (!response.ok) {
        throw new Error(resJson.error || 'Failed to parse text.');
      }

      const parsedTxs: ParsedTransactionCandidate[] = resJson.data.transactions.map(
        (t: any, idx: number) => ({
          id: `cand_${Date.now()}_${idx}`,
          date: t.date || new Date().toISOString().slice(0, 10),
          description: t.description || 'Forex Card Transaction',
          amount: parseFloat(t.amount) || 0,
          currency: t.currency || targetWallet.currency || 'CAD',
          category: (t.category as ExpenseCategory) || 'Miscellaneous',
          type: t.type === 'credit' ? 'credit' : 'debit',
          foreignFee: t.foreignFee || 0,
          rawText: t.rawText || '',
          selected: true,
          walletId: targetWalletId,
        })
      );

      setMeta({
        statementPeriod: resJson.data.statementPeriod || 'Custom Import',
        primaryCurrency: resJson.data.primaryCurrency || targetWallet.currency,
        fileName: 'Pasted Statement',
      });
      setCandidates(parsedTxs);
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleLoadSampleStatement = () => {
    const sampleStatement = `
CARD STATEMENT - CAD MULTI-CURRENCY FOREX CARD (CARD NO: XXXX-XXXX-XXXX-0000)
Statement Date: 26-AUG-2026

Transactions:
2026-08-20  TIM HORTONS #4928 TORONTO ON           CAD  12.45  DEBIT
2026-08-21  SHOPPERS DRUG MART VANCOUVER BC        CAD  34.80  DEBIT
2026-08-22  UBER TRIP TORONTO ON                   CAD  28.60  DEBIT
2026-08-23  LOBLAWS SUPERMARKET                    CAD  92.15  DEBIT
2026-08-24  AIR CANADA IN-FLIGHT WIFI              CAD  15.00  DEBIT
2026-08-25  ROYAL ONTARIO MUSEUM ADMISSION         CAD  42.00  DEBIT
2026-08-26  CINEPLEX CINEMAS DOWNTOWN              CAD  19.50  DEBIT
    `;
    setRawTextContent(sampleStatement.trim());
    setShowSampleText(true);
  };

  const toggleSelectCandidate = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: select })));
  };

  const updateCandidateCategory = (id: string, newCat: ExpenseCategory) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, category: newCat } : c))
    );
  };

  const handleFinalImport = () => {
    const selectedItems = candidates.filter((c) => c.selected);
    if (selectedItems.length === 0) {
      alert('Please select at least one transaction to import.');
      return;
    }

    const applicableRate = targetWallet?.purchasedRateINR || 0;

    const importedTransactions: Transaction[] = selectedItems.map((c) => {
      const inrAmount = calculateINR(c.amount, applicableRate);

      return {
        id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        date: c.date,
        time: '12:00',
        description: c.description,
        amount: c.amount,
        currency: c.currency,
        walletId: targetWalletId,
        exchangeRate: applicableRate,
        amountINR: inrAmount,
        category: c.category,
        type: c.type === 'credit' ? 'refund' : 'expense',
        source: 'pdf_statement',
        rawText: c.rawText,
        notes: `Imported from ${meta?.fileName || 'CAD Forex Card Statement'}`,
        createdAt: Date.now(),
      };
    });

    onImportTransactions(importedTransactions);
    onClose();
  };

  const selectedCount = candidates.filter((c) => c.selected).length;
  const totalSelectedForeign = candidates
    .filter((c) => c.selected)
    .reduce((sum, c) => sum + c.amount, 0);
  const totalSelectedINR = totalSelectedForeign * (targetWallet?.purchasedRateINR || 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/80">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                AI Statement Scanner
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-400 font-medium border border-blue-800">
                  Gemini
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Upload your CAD Forex Card statement or receipt to auto-convert to INR
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

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {candidates.length === 0 ? (
            /* Upload Stage */
            <div className="space-y-5">
              {/* Target Statement Instrument: CAD Forex Card Only */}
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-200 mb-0.5">
                    Target Statement Instrument:
                  </label>
                  <p className="text-xs text-slate-400">
                    Statements are exclusively parsed and logged to your CAD Forex Card ledger
                  </p>
                </div>
                <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-semibold text-white shadow-xs">
                  <div className="p-1.5 rounded-lg bg-blue-950/80 text-blue-400 border border-blue-800/80">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white">{targetWallet?.name || 'CAD Forex Card'}</span>
                    <span className="text-xs font-mono text-slate-400 ml-2 font-semibold">
                      (CAD @ ₹{(targetWallet?.purchasedRateINR || 0).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-950/30 scale-[1.01]'
                    : 'border-slate-700 bg-slate-950/40 hover:border-blue-500 hover:bg-slate-950/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-950/80 text-blue-400 border border-blue-800/80 flex items-center justify-center shadow-xs">
                  <FileUp className="w-7 h-7" />
                </div>

                <h3 className="text-base font-bold text-white mb-1">
                  Upload CAD Forex Card Statement or Receipt
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto mb-4">
                  Drag and drop your CAD Forex Card PDF statement, e-statement, receipt image, or CSV here, or browse files.
                </p>

                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-mono">
                  <span>Supports: PDF, PNG, JPG, CSV</span>
                </div>
              </div>

              {/* Sample Statement Testing Helper */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                <div className="flex items-center space-x-2 text-slate-300">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Don't have a statement PDF on hand right now?</span>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleStatement}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-blue-400 border border-slate-700 font-semibold shadow-xs transition"
                >
                  Try Sample CAD Forex Card Statement
                </button>
              </div>

              {/* Text / Paste Box */}
              {showSampleText && (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white">
                      Paste Statement Text or Edit Sample:
                    </label>
                    <button
                      onClick={() => setShowSampleText(false)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Hide
                    </button>
                  </div>
                  <textarea
                    rows={6}
                    value={rawTextContent}
                    onChange={(e) => setRawTextContent(e.target.value)}
                    className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Paste tabular statement lines..."
                  />
                  <button
                    onClick={handleParseRawText}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4" />
                    Extract Transactions from Text
                  </button>
                </div>
              )}

              {/* Processing Progress Loader */}
              {isProcessing && (
                <div className="p-6 rounded-2xl bg-blue-950/40 border border-blue-800/80 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                  <h4 className="text-sm font-bold text-white">{processingStep}</h4>
                  <p className="text-xs text-slate-400">
                    Extracting merchants, dates, and amounts in foreign currency, and mapping them to categories.
                  </p>
                </div>
              )}

              {/* Error Box */}
              {errorMessage && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-rose-200">Statement Processing Notice</p>
                    <p>{errorMessage}</p>
                    <p className="mt-1 text-rose-400">
                      Tip: You can also use the 'Add Expense' manual entry form or paste transaction rows.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Review & Confirm Candidates Stage */
            <div className="space-y-4">
              {/* Meta Banner */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-white text-sm">
                    Extracted {candidates.length} Transactions
                  </span>
                  <p className="text-slate-400">
                    File: <span className="text-slate-200 font-semibold">{meta?.fileName}</span>
                    {meta?.statementPeriod && ` • Period: ${meta.statementPeriod}`}
                    {meta?.cardLast4 && ` • Card: ****${meta.cardLast4}`}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 shadow-xs font-semibold"
                  >
                    Select All
                  </button>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-200 shadow-xs font-semibold"
                  >
                    Deselect All
                  </button>
                  <button
                    onClick={() => {
                      setCandidates([]);
                      setSelectedFile(null);
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 hover:bg-rose-950/50 text-slate-300 hover:text-rose-400 shadow-xs font-semibold"
                  >
                    Upload Another
                  </button>
                </div>
              </div>

              {/* Transactions Candidate Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900 shadow-xs">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
                      <tr>
                        <th className="p-3 w-10">#</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Merchant / Description</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-right">Foreign Amount</th>
                        <th className="p-3 text-right">Converted INR (@ ₹{targetWallet.purchasedRateINR})</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {candidates.map((cand) => {
                        const inr = calculateINR(cand.amount, targetWallet.purchasedRateINR);
                        return (
                          <tr
                            key={cand.id}
                            className={`hover:bg-slate-800/50 transition ${
                              cand.selected ? 'bg-slate-900' : 'opacity-40 bg-slate-950/50'
                            }`}
                          >
                            <td className="p-3">
                              <button
                                onClick={() => toggleSelectCandidate(cand.id)}
                                className="text-blue-400"
                              >
                                {cand.selected ? (
                                  <CheckSquare className="w-4 h-4 text-blue-400" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-600" />
                                )}
                              </button>
                            </td>
                            <td className="p-3 font-mono text-slate-300 font-semibold whitespace-nowrap">
                              {cand.date}
                            </td>
                            <td className="p-3 font-bold text-white max-w-[200px] truncate">
                              {cand.description}
                            </td>
                            <td className="p-3">
                              <select
                                value={cand.category}
                                onChange={(e) =>
                                  updateCandidateCategory(cand.id, e.target.value as ExpenseCategory)
                                }
                                className="px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none"
                              >
                                {Object.keys(CATEGORY_CONFIG).map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="p-3 text-right font-mono font-semibold text-rose-400 whitespace-nowrap">
                              {formatForeign(cand.amount, cand.currency)}
                            </td>
                            <td className="p-3 text-right font-mono font-extrabold text-rose-400 whitespace-nowrap">
                              {formatINR(inr)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Preview Summary */}
              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Selected for Batch Import: </span>
                  <strong className="text-white font-bold">{selectedCount} Transactions</strong>
                  <span className="text-slate-400 ml-2">
                    ({formatForeign(totalSelectedForeign, targetWallet.currency)})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Total Converted INR: </span>
                  <strong className="text-rose-400 text-sm font-extrabold font-mono">
                    {formatINR(totalSelectedINR)}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          {candidates.length > 0 && (
            <button
              onClick={handleFinalImport}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Import {selectedCount} Transactions to Tracker
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
