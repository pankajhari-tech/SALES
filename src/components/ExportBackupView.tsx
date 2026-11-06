import React, { useRef, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Database,
} from 'lucide-react';
import { SaleRecord, CustomerSummary } from '../types';
import { exportToExcel, exportToCSV, parseImportFile } from '../services/storageService';
import { formatNPR } from '../utils/formatters';

interface ExportBackupViewProps {
  records: SaleRecord[];
  customers: CustomerSummary[];
  onImportRecords: (newRecords: SaleRecord[]) => void;
  onResetDatabase: () => void;
}

export const ExportBackupView: React.FC<ExportBackupViewProps> = ({
  records,
  customers,
  onImportRecords,
  onResetDatabase,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadExcel = () => {
    exportToExcel(records, customers);
  };

  const handleDownloadCSV = () => {
    exportToCSV(records);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportStatus(null);

    try {
      const imported = await parseImportFile(file);
      if (imported.length === 0) {
        throw new Error('No valid records found in the uploaded file.');
      }
      onImportRecords(imported);
      setImportStatus({
        type: 'success',
        message: `Successfully imported ${imported.length} sales records!`,
      });
    } catch (err: any) {
      console.error('Import error:', err);
      setImportStatus({
        type: 'error',
        message: err.message || 'Failed to parse file. Ensure it is a valid Excel (.xlsx) or CSV file.',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 shrink-0">
            <Database className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Data Export, Import & Offline Excel Backup
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Export full multi-sheet Microsoft Excel workbooks, download CSV archives, or upload previous backups to maintain 100% data ownership and business continuity offline.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right text-xs">
          <span className="text-slate-400 uppercase font-semibold text-[10px] block">Current Local Database</span>
          <span className="text-base font-black font-mono text-slate-900 dark:text-white">
            {records.length} records • {customers.length} customers
          </span>
        </div>
      </div>

      {/* Notification banner */}
      {importStatus && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 animate-in fade-in duration-200 ${
            importStatus.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {importStatus.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{importStatus.message}</span>
        </div>
      )}

      {/* Export & Import Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Export Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Download Sales Database
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generate clean, formatted files for auditing or offline accounting
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  Microsoft Excel Workbook (.xlsx)
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Includes 3 sheets: SALES, CUSTOMERS, and FINANCIAL_SUMMARY
                </span>
              </div>
              <button
                onClick={handleDownloadExcel}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-xs"
              >
                <FileSpreadsheet className="w-4 h-4" /> Export Excel
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                  Comma-Separated Values (.csv)
                </span>
                <span className="text-xs text-slate-500 mt-0.5 block">
                  Compatible with any spreadsheet or accounting software
                </span>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
              >
                <FileText className="w-4 h-4" /> Export CSV
              </button>
            </div>
          </div>
        </div>

        {/* Import Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Import from Excel or CSV
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Batch-load historical sales records or restore from a backup
              </p>
            </div>
          </div>

          <div className="pt-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition cursor-pointer group"
            >
              <Upload className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 mx-auto mb-2 transition" />
              <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 block">
                {isProcessing ? 'Processing file...' : 'Click to select or upload an Excel (.xlsx) or CSV file'}
              </span>
              <span className="text-[11px] text-slate-400 mt-1 block">
                Automatic mapping of SN, Date, Customer Name, Items, and Amounts
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Danger Zone: Reset Database */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-rose-200 dark:border-rose-900/50 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-rose-600 dark:text-rose-400">
            Reset Sample Data
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Reverts all local records back to the initial sample seed database.
          </p>
        </div>
        <button
          onClick={onResetDatabase}
          className="px-4 py-2.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs font-bold transition flex items-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" /> Reset to Demo Records
        </button>
      </div>

    </div>
  );
};
