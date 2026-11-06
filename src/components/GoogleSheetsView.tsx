import React, { useState } from 'react';
import {
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  PlusCircle,
  Link,
  CheckCircle2,
  AlertTriangle,
  Database,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  LogOut,
  Info,
} from 'lucide-react';
import { GoogleSheetsConfig, AuthUserState, SaleRecord, CustomerSummary } from '../types';

interface GoogleSheetsViewProps {
  authState: AuthUserState;
  sheetConfig: GoogleSheetsConfig;
  records: SaleRecord[];
  customers: CustomerSummary[];
  onSignIn: () => Promise<void>;
  onSignOut: () => Promise<void>;
  onCreateNewSheet: () => Promise<void>;
  onConnectExistingSheet: (sheetIdOrUrl: string) => Promise<void>;
  onSyncFromSheet: () => Promise<void>;
  onPushToSheet: () => Promise<void>;
  onDisconnectSheet: () => void;
}

export const GoogleSheetsView: React.FC<GoogleSheetsViewProps> = ({
  authState,
  sheetConfig,
  records,
  customers,
  onSignIn,
  onSignOut,
  onCreateNewSheet,
  onConnectExistingSheet,
  onSyncFromSheet,
  onPushToSheet,
  onDisconnectSheet,
}) => {
  const [existingInput, setExistingInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleConnectExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!existingInput.trim()) return;
    setIsConnecting(true);
    setActionMessage(null);
    try {
      await onConnectExistingSheet(existingInput.trim());
      setExistingInput('');
      setActionMessage({ type: 'success', text: 'Spreadsheet connected and verified successfully!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to connect spreadsheet.' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleCreateNew = async () => {
    setIsConnecting(true);
    setActionMessage(null);
    try {
      await onCreateNewSheet();
      setActionMessage({ type: 'success', text: 'New dedicated spreadsheet created with SALES, CUSTOMERS, and REPORTS tabs!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to create spreadsheet.' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualSyncFrom = async () => {
    setIsConnecting(true);
    setActionMessage(null);
    try {
      await onSyncFromSheet();
      setActionMessage({ type: 'success', text: 'Successfully pulled latest records from Google Sheets!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to pull from Google Sheets.' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualPushTo = async () => {
    setIsConnecting(true);
    setActionMessage(null);
    try {
      await onPushToSheet();
      setActionMessage({ type: 'success', text: 'All sales, customers, and reports pushed to Google Sheets!' });
    } catch (err: any) {
      setActionMessage({ type: 'error', text: err.message || 'Failed to push to Google Sheets.' });
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 shrink-0">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Google Sheets Primary Cloud Database
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Official API v4
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Connect your Google account to automatically store every sale record, customer balance, and financial KPI report directly in a Google Spreadsheet in your personal Google Drive.
            </p>
          </div>
        </div>

        {/* Auth / Account Button */}
        <div>
          {authState.isSignedIn && authState.user ? (
            <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {authState.user.photoURL ? (
                <img
                  src={authState.user.photoURL}
                  alt={authState.user.displayName || 'Google User'}
                  className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {authState.user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="text-left text-xs pr-2">
                <span className="font-bold text-slate-900 dark:text-white block truncate max-w-[140px]">
                  {authState.user.displayName || 'Google Account'}
                </span>
                <span className="text-slate-400 block truncate max-w-[140px] font-mono text-[10px]">
                  {authState.user.email}
                </span>
              </div>
              <button
                onClick={onSignOut}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Disconnect Google Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold transition shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl border text-sm flex items-center gap-3 animate-in fade-in duration-200 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/70 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/70 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{actionMessage.text}</span>
        </div>
      )}

      {/* Main Connection Status Card */}
      {sheetConfig.isConnected && sheetConfig.spreadsheetId ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-emerald-200 dark:border-emerald-900/60 shadow-lg shadow-emerald-500/5 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Active Database Connection
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {sheetConfig.spreadsheetName}
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {sheetConfig.spreadsheetUrl && (
                <a
                  href={sheetConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-200 dark:border-indigo-800 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in Google Sheets
                </a>
              )}
              <button
                onClick={onDisconnectSheet}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Disconnect
              </button>
            </div>
          </div>

          {/* Sync Stats & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Spreadsheet ID
              </span>
              <span className="font-mono text-xs text-slate-800 dark:text-slate-200 truncate block mt-1">
                {sheetConfig.spreadsheetId}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Last Synchronized
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-1">
                {sheetConfig.lastSyncTime ? new Date(sheetConfig.lastSyncTime).toLocaleTimeString() : 'Just now'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Cloud Sync Status
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block mt-1">
                Live Dual-Sync Active
              </span>
            </div>
          </div>

          {/* Sync Trigger Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleManualSyncFrom}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition disabled:opacity-50"
            >
              <ArrowDownToLine className="w-4 h-4" />
              {isConnecting ? 'Syncing...' : 'Pull Records from Sheet'}
            </button>

            <button
              onClick={handleManualPushTo}
              disabled={isConnecting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50"
            >
              <ArrowUpFromLine className="w-4 h-4" />
              {isConnecting ? 'Pushing...' : 'Push Local Records to Sheet'}
            </button>
          </div>
        </div>
      ) : (
        /* Not Connected State: Choice to create or connect */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Option A: Create Dedicated Spreadsheet Automatically */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Create Dedicated Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Automatically generate a brand new Google Spreadsheet titled <strong>"SalesTracker Pro - Official Database"</strong> in your Google Drive with the 3 required worksheets:
              </p>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <strong>SALES:</strong> Primary sales transactions with auto-calculated total, paid & unpaid in NPR
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <strong>CUSTOMERS:</strong> Dynamic customer credit ledger & contact directory
                </div>
                <div className="flex items-center gap-2 font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <strong>REPORTS:</strong> Real-time KPI revenue metrics & order breakdowns
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateNew}
              disabled={isConnecting || !authState.isSignedIn}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <PlusCircle className="w-4 h-4" />
              {isConnecting ? 'Creating Spreadsheet in Google Drive...' : 'Create Dedicated Database'}
            </button>
            {!authState.isSignedIn && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center font-medium">
                * Please click "Sign in with Google" above first.
              </p>
            )}
          </div>

          {/* Option B: Connect Existing Spreadsheet */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Link className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Connect Existing Spreadsheet
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                Already have a Google Sheet? Paste the full Google Sheet URL or the Spreadsheet ID to link it. Missing tabs will be created automatically.
              </p>

              <form onSubmit={handleConnectExisting} className="mt-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Spreadsheet URL or ID
                  </label>
                  <input
                    type="text"
                    value={existingInput}
                    onChange={(e) => setExistingInput(e.target.value)}
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs.../edit or ID"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isConnecting || !authState.isSignedIn || !existingInput.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  <Link className="w-4 h-4" />
                  {isConnecting ? 'Verifying Spreadsheet...' : 'Connect Existing Sheet'}
                </button>
              </form>
            </div>

            {!authState.isSignedIn && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 text-center font-medium">
                * Please click "Sign in with Google" above first.
              </p>
            )}
          </div>

        </div>
      )}

      {/* Spreadsheet Structure Guide */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Structured Database Schema Details
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white font-mono block">
              1. Worksheet: SALES
            </span>
            <p className="text-slate-500">
              Columns: SN, DATE, CUSTOMER NAME, CUSTOMER PHONE, ITEM NAME, QTY, UNIT PRICE, TOTAL, PAID, UNPAID, STATUS, REMARKS.
            </p>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
              ✓ Auto-appends every sale transaction
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white font-mono block">
              2. Worksheet: CUSTOMERS
            </span>
            <p className="text-slate-500">
              Columns: Customer Name, Phone, Total Orders, Total Spent (NPR), Total Paid, Outstanding Balance, Status, Last Purchase.
            </p>
            <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium block">
              ✓ Keeps ledger of all debtor & settled balances
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white font-mono block">
              3. Worksheet: REPORTS
            </span>
            <p className="text-slate-500">
              Live KPI balance table summarizing gross sales, collections, outstanding debts, and collection rate.
            </p>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block">
              ✓ Provides instant executive overview
            </span>
          </div>
        </div>
      </div>

    </div>
  );
};
