import React from 'react';
import {
  FileEdit,
  LayoutDashboard,
  Table,
  Users,
  FileSpreadsheet,
  Database,
  AlertCircle,
  X,
  CreditCard,
  PlusCircle,
  Lock,
} from 'lucide-react';
import { GoogleSheetsConfig } from '../types';

export type NavTab = 'entry' | 'dashboard' | 'records' | 'customers' | 'sheets' | 'export';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unpaidCount: number;
  totalRecordsCount: number;
  sheetConfig: GoogleSheetsConfig;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onLockSystem?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  unpaidCount,
  totalRecordsCount,
  sheetConfig,
  isOpenMobile,
  onCloseMobile,
  onLockSystem,
}) => {
  const navItems = [
    {
      id: 'entry' as NavTab,
      label: 'Sales Entry Form',
      description: 'Enter new sales & calculate balances',
      icon: FileEdit,
      badge: null,
    },
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      description: 'KPI metrics, revenue & trends',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'records' as NavTab,
      label: 'Sales Records',
      description: 'Search, filter, sort & print',
      icon: Table,
      badge: totalRecordsCount > 0 ? totalRecordsCount : null,
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    },
    {
      id: 'customers' as NavTab,
      label: 'Customer Ledgers',
      description: 'Balances & purchase histories',
      icon: Users,
      badge: unpaidCount > 0 ? `${unpaidCount} Due` : null,
      badgeColor: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 font-bold',
    },
    {
      id: 'sheets' as NavTab,
      label: 'Google Sheets Sync',
      description: 'Primary cloud database sync',
      icon: FileSpreadsheet,
      badge: sheetConfig.isConnected ? 'Connected' : 'Setup',
      badgeColor: sheetConfig.isConnected
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
    },
    {
      id: 'export' as NavTab,
      label: 'Export & Backup',
      description: 'Excel .xlsx, CSV & import',
      icon: Database,
      badge: null,
    },
  ];

  const handleItemClick = (id: NavTab) => {
    onSelectTab(id);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 md:static md:translate-x-0 print:hidden ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Mobile Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between md:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                ST
              </div>
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                SalesTracker Pro
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Create Action Button */}
          <div className="p-4">
            <button
              onClick={() => handleItemClick('entry')}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-lg shadow-indigo-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record New Sale</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition group ${
                    isActive
                      ? 'bg-slate-100 dark:bg-slate-800/80 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold block leading-tight">
                        {item.label}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal hidden lg:block">
                        {item.description}
                      </span>
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Info Box */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Data Storage
              </span>
              <span className={`w-2 h-2 rounded-full ${sheetConfig.isConnected ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              {sheetConfig.isConnected
                ? `Synced to: ${sheetConfig.spreadsheetName}`
                : 'Local mode active. Connect Google Sheets for cloud database sync.'}
            </p>
          </div>

          {/* Lock App Quick Action */}
          {onLockSystem && (
            <button
              onClick={onLockSystem}
              className="w-full mt-3 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Lock Application</span>
            </button>
          )}

          {/* Author Attribution */}
          <div className="mt-3 pt-2 text-center border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Made by <strong className="text-indigo-600 dark:text-indigo-400 font-semibold">Pankaj Yadav</strong>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
