import React from 'react';
import {
  Moon,
  Sun,
  FileSpreadsheet,
  PlusCircle,
  Menu,
  ShieldCheck,
  TrendingUp,
  Lock,
} from 'lucide-react';
import { GoogleSheetsConfig, AuthUserState } from '../types';

interface NavbarProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  sheetConfig: GoogleSheetsConfig;
  authState: AuthUserState;
  onOpenSheetsTab: () => void;
  onOpenNewSale: () => void;
  onToggleMobileMenu: () => void;
  onLockSystem: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isDarkMode,
  onToggleDarkMode,
  sheetConfig,
  authState,
  onOpenSheetsTab,
  onOpenNewSale,
  onToggleMobileMenu,
  onLockSystem,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Toggle menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-indigo-600/30">
              ST
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                  SalesTracker
                </span>
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block -mt-0.5 font-medium">
                Made by <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">Pankaj Yadav</strong> • NPR Business Ledger
              </span>
            </div>
          </div>
        </div>

        {/* Center: Google Sheets Live Sync Pill & Author Badge */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            onClick={onOpenSheetsTab}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition border ${
              sheetConfig.isConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className={`w-3.5 h-3.5 ${sheetConfig.isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
            <span>
              {sheetConfig.isConnected
                ? `Sheets Sync: ${sheetConfig.spreadsheetName}`
                : 'Connect Google Sheets'}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                sheetConfig.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            ></span>
          </button>

          {/* Author Badge */}
          <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            <span>Made by Pankaj Yadav</span>
          </div>
        </div>

        {/* Right: Actions (New Sale, Theme Toggle, Profile) */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenNewSale}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            New Sale
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Toggle theme"
            title="Toggle color theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Lock App Button */}
          <button
            onClick={onLockSystem}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="Lock application"
            title="Lock application (Sign out of session)"
          >
            <Lock className="w-4 h-4" />
          </button>

          {/* Auth indicator */}
          {authState.isSignedIn && authState.user && (
            <div
              onClick={onOpenSheetsTab}
              className="cursor-pointer"
              title={`Connected as ${authState.user.email}`}
            >
              {authState.user.photoURL ? (
                <img
                  src={authState.user.photoURL}
                  alt={authState.user.displayName || 'Google Account'}
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                  {authState.user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
