import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  SaleRecord,
  CustomerSummary,
  GoogleSheetsConfig,
  AuthUserState,
} from './types';
import {
  loadSavedRecords,
  saveRecordsToStorage,
  loadSavedSheetConfig,
  saveSheetConfigToStorage,
  deriveCustomersFromRecords,
} from './services/storageService';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
} from './services/firebaseAuth';
import {
  createDedicatedSpreadsheet,
  verifyAndPrepareSpreadsheet,
  fetchSalesRecordsFromSheet,
  appendSaleRecordToSheet,
  syncAllRecordsToSheet,
} from './services/googleSheetsService';

import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { SalesEntryForm } from './components/SalesEntryForm';
import { DashboardView } from './components/DashboardView';
import { RecordsView } from './components/RecordsView';
import { CustomerView } from './components/CustomerView';
import { GoogleSheetsView } from './components/GoogleSheetsView';
import { ExportBackupView } from './components/ExportBackupView';
import { ReceiptModal } from './components/ReceiptModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { SecurityLockScreen } from './components/SecurityLockScreen';

export default function App() {
  // Master Security Lock State
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return (
      localStorage.getItem('salestracker_auth_session') === 'authenticated' ||
      sessionStorage.getItem('salestracker_auth_session') === 'authenticated'
    );
  });

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('salestracker_theme');
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // App data state
  const [records, setRecords] = useState<SaleRecord[]>(() => loadSavedRecords());
  const [sheetConfig, setSheetConfig] = useState<GoogleSheetsConfig>(() => loadSavedSheetConfig());

  // Navigation & Active tab
  const [currentTab, setCurrentTab] = useState<NavTab>('entry');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Editing state
  const [editingRecord, setEditingRecord] = useState<SaleRecord | null>(null);
  const [prefillCustomer, setPrefillCustomer] = useState<{ name: string; phone?: string } | null>(null);

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<SaleRecord | null>(null);
  const [recordToDelete, setRecordToDelete] = useState<SaleRecord | null>(null);

  // Filters passed to records view
  const [recordsInitialStatusFilter, setRecordsInitialStatusFilter] = useState<string>('ALL');

  // Auth state
  const [authState, setAuthState] = useState<AuthUserState>({
    isSignedIn: false,
    user: null,
    accessToken: null,
  });

  // Global Notification Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 5000);
  }, []);

  // Sync theme to DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('salestracker_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('salestracker_theme', 'light');
    }
  }, [isDarkMode]);

  // Initialize Firebase Auth listener on load
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setAuthState({
          isSignedIn: true,
          user: {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          },
          accessToken: token,
        });
      },
      () => {
        setAuthState({
          isSignedIn: false,
          user: null,
          accessToken: null,
        });
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Persist records to storage whenever updated
  useEffect(() => {
    saveRecordsToStorage(records);
  }, [records]);

  // Persist sheetConfig to storage whenever updated
  useEffect(() => {
    saveSheetConfigToStorage(sheetConfig);
  }, [sheetConfig]);

  // Dynamically derived customer summaries
  const customers = useMemo(() => {
    return deriveCustomersFromRecords(records);
  }, [records]);

  // Unpaid count for sidebar alert badge
  const unpaidCount = useMemo(() => {
    return records.filter((r) => r.paymentStatus !== 'PAID').length;
  }, [records]);

  // Google Sign-In Handler
  const handleSignIn = async () => {
    try {
      const res = await googleSignIn();
      if (res) {
        setAuthState({
          isSignedIn: true,
          user: {
            uid: res.user.uid,
            displayName: res.user.displayName,
            email: res.user.email,
            photoURL: res.user.photoURL,
          },
          accessToken: res.accessToken,
        });
        showToast('Google Account authenticated with Google Sheets permissions!');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to authenticate with Google.', 'error');
    }
  };

  // Google Sign-Out Handler
  const handleSignOut = async () => {
    try {
      await logout();
      setAuthState({
        isSignedIn: false,
        user: null,
        accessToken: null,
      });
      showToast('Signed out of Google account.', 'info');
    } catch (err: any) {
      showToast(err.message || 'Failed to sign out.', 'error');
    }
  };

  // Create Dedicated Spreadsheet
  // Helper to ensure valid Google OAuth token before any Google API action
  const ensureGoogleToken = async (): Promise<string | null> => {
    let token = authState.accessToken || (await getAccessToken());
    if (token) return token;

    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setAuthState({
          isSignedIn: true,
          user: {
            uid: res.user.uid,
            displayName: res.user.displayName,
            email: res.user.email,
            photoURL: res.user.photoURL,
          },
          accessToken: res.accessToken,
        });
        return res.accessToken;
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to authorize with Google.', 'error');
    }
    return null;
  };

  // Create Dedicated Spreadsheet
  const handleCreateNewSheet = async () => {
    const token = await ensureGoogleToken();
    if (!token) return;

    try {
      setSheetConfig((prev) => ({ ...prev, isSyncing: true, syncError: null }));
      const { spreadsheetId, spreadsheetUrl } = await createDedicatedSpreadsheet(token);

      // Immediately sync current records and customer rollups to the new sheet
      await syncAllRecordsToSheet(token, spreadsheetId, records, customers);

      const updatedConfig: GoogleSheetsConfig = {
        spreadsheetId,
        spreadsheetName: 'SalesTracker Pro - Official Database',
        spreadsheetUrl,
        isConnected: true,
        lastSyncTime: new Date().toISOString(),
        isSyncing: false,
        syncError: null,
      };

      setSheetConfig(updatedConfig);
      showToast('Dedicated Google Spreadsheet created and synced with 3 worksheets!');
    } catch (err: any) {
      setSheetConfig((prev) => ({ ...prev, isSyncing: false, syncError: err.message }));
      showToast(err.message || 'Error creating Google Spreadsheet.', 'error');
      throw err;
    }
  };

  // Connect Existing Spreadsheet
  const handleConnectExistingSheet = async (sheetIdOrUrl: string) => {
    let cleanId = sheetIdOrUrl.trim();
    // Extract ID from full URL if pasted: https://docs.google.com/spreadsheets/d/{ID}/edit
    const urlMatch = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (urlMatch) {
      cleanId = urlMatch[1];
    }

    const token = await ensureGoogleToken();
    if (!token) return;

    try {
      setSheetConfig((prev) => ({ ...prev, isSyncing: true, syncError: null }));
      const { title } = await verifyAndPrepareSpreadsheet(token, cleanId);

      // Pull records from sheet or push if sheet is blank
      const sheetRecords = await fetchSalesRecordsFromSheet(token, cleanId);
      if (sheetRecords.length > 0) {
        setRecords(sheetRecords);
        showToast(`Connected to "${title}". Loaded ${sheetRecords.length} records.`);
      } else {
        // Sheet was empty, push current records
        await syncAllRecordsToSheet(token, cleanId, records, customers);
        showToast(`Connected to "${title}". Pushed ${records.length} records to sheet.`);
      }

      setSheetConfig({
        spreadsheetId: cleanId,
        spreadsheetName: title,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}/edit`,
        isConnected: true,
        lastSyncTime: new Date().toISOString(),
        isSyncing: false,
        syncError: null,
      });
    } catch (err: any) {
      setSheetConfig((prev) => ({ ...prev, isSyncing: false, syncError: err.message }));
      showToast(err.message || 'Cannot access spreadsheet. Verify ID and permissions.', 'error');
      throw err;
    }
  };

  // Sync from Sheet (pull latest from Google Sheets)
  const handleSyncFromSheet = async () => {
    if (!sheetConfig.spreadsheetId) return;
    const token = await ensureGoogleToken();
    if (!token) return;

    try {
      setSheetConfig((prev) => ({ ...prev, isSyncing: true }));
      const sheetRecords = await fetchSalesRecordsFromSheet(token, sheetConfig.spreadsheetId);
      setRecords(sheetRecords);
      setSheetConfig((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        syncError: null,
      }));
      showToast(`Pulled ${sheetRecords.length} sales records from Google Sheets.`);
    } catch (err: any) {
      setSheetConfig((prev) => ({ ...prev, isSyncing: false, syncError: err.message }));
      showToast(err.message || 'Failed to sync from Google Sheets.', 'error');
      throw err;
    }
  };

  // Push all to Sheet (overwrite batch sync)
  const handlePushToSheet = async () => {
    if (!sheetConfig.spreadsheetId) return;
    const token = await ensureGoogleToken();
    if (!token) return;

    try {
      setSheetConfig((prev) => ({ ...prev, isSyncing: true }));
      await syncAllRecordsToSheet(token, sheetConfig.spreadsheetId, records, customers);
      setSheetConfig((prev) => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date().toISOString(),
        syncError: null,
      }));
      showToast(`All records, customers, and reports pushed to Google Sheets.`);
    } catch (err: any) {
      setSheetConfig((prev) => ({ ...prev, isSyncing: false, syncError: err.message }));
      showToast(err.message || 'Failed to push to Google Sheets.', 'error');
      throw err;
    }
  };

  // Disconnect Sheet
  const handleDisconnectSheet = () => {
    setSheetConfig({
      spreadsheetId: null,
      spreadsheetName: 'SalesTracker Pro Database',
      spreadsheetUrl: null,
      isConnected: false,
      lastSyncTime: null,
      isSyncing: false,
      syncError: null,
    });
    showToast('Spreadsheet disconnected. Operating in local mode.', 'info');
  };

  // Save New Sale (Form submission)
  const handleSaveSale = async (
    data: Omit<SaleRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<boolean> => {
    const newRecord: SaleRecord = {
      ...data,
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updatedRecords = [newRecord, ...records];
    setRecords(updatedRecords);

    // If Google Sheets is connected, sync to sheet
    if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
      try {
        const token = authState.accessToken || (await getAccessToken());
        if (token) {
          await appendSaleRecordToSheet(token, sheetConfig.spreadsheetId, newRecord);
          // Also asynchronously update CUSTOMERS and REPORTS tabs
          syncAllRecordsToSheet(
            token,
            sheetConfig.spreadsheetId,
            updatedRecords,
            deriveCustomersFromRecords(updatedRecords)
          ).catch((e) => console.warn('Background tab sync note:', e));
        }
      } catch (err: any) {
        console.error('Google Sheets sync error:', err);
        showToast(
          `Record saved locally, but Google Sheets sync failed: ${err.message}`,
          'error'
        );
      }
    }

    return true;
  };

  // Update Sale Record
  const handleUpdateSale = async (updated: SaleRecord): Promise<boolean> => {
    const updatedRecords = records.map((r) => (r.id === updated.id ? updated : r));
    setRecords(updatedRecords);
    setEditingRecord(null);

    // If Google Sheets connected, push full update
    if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
      try {
        const token = authState.accessToken || (await getAccessToken());
        if (token) {
          await syncAllRecordsToSheet(
            token,
            sheetConfig.spreadsheetId,
            updatedRecords,
            deriveCustomersFromRecords(updatedRecords)
          );
        }
      } catch (err: any) {
        showToast(`Record updated locally, but sheet update failed: ${err.message}`, 'error');
      }
    }

    return true;
  };

  // Confirm and Delete Sale Record
  const handleConfirmDelete = async () => {
    if (!recordToDelete) return;
    const target = recordToDelete;
    const updatedRecords = records.filter((r) => r.id !== target.id);
    setRecords(updatedRecords);
    setRecordToDelete(null);

    showToast(`Record #${target.sn} deleted successfully.`);

    // If Google Sheets connected, update sheet
    if (sheetConfig.isConnected && sheetConfig.spreadsheetId) {
      try {
        const token = authState.accessToken || (await getAccessToken());
        if (token) {
          await syncAllRecordsToSheet(
            token,
            sheetConfig.spreadsheetId,
            updatedRecords,
            deriveCustomersFromRecords(updatedRecords)
          );
        }
      } catch (err: any) {
        showToast(`Record deleted locally, but sheet update failed: ${err.message}`, 'error');
      }
    }
  };

  // Quick Action: Pre-fill New Sale for specific customer
  const handleNewSaleForCustomer = (cName: string, cPhone?: string) => {
    setPrefillCustomer({ name: cName, phone: cPhone });
    setEditingRecord(null);
    setCurrentTab('entry');
  };

  // Import Records from Excel / CSV
  const handleImportRecords = (newRecords: SaleRecord[]) => {
    const combined = [...newRecords, ...records];
    // Deduplicate by id or sn
    const seen = new Set<string>();
    const unique = combined.filter((r) => {
      if (seen.has(r.sn)) return false;
      seen.add(r.sn);
      return true;
    });

    setRecords(unique);
    showToast(`Loaded ${unique.length} sales into system.`);
  };

  // Reset to initial demo records
  const handleResetDatabase = () => {
    localStorage.removeItem('salestracker_pro_records_v1');
    const fresh = loadSavedRecords();
    setRecords(fresh);
    showToast('Reset to default demo sales database.', 'info');
  };

  // Lock Application
  const handleLockSystem = () => {
    localStorage.removeItem('salestracker_auth_session');
    localStorage.removeItem('salestracker_auth_token');
    localStorage.removeItem('salestracker_auth_email');
    sessionStorage.removeItem('salestracker_auth_session');
    sessionStorage.removeItem('salestracker_auth_token');
    setIsUnlocked(false);
    showToast('Application locked. Master credentials required.', 'info');
  };

  // Clean up any historical plaintext email storage on startup
  useEffect(() => {
    localStorage.removeItem('salestracker_auth_email');
  }, []);

  // MASTER SECURITY BARRIER: If not unlocked, render lock screen exclusively
  if (!isUnlocked) {
    return (
      <SecurityLockScreen
        onUnlock={() => {
          setIsUnlocked(true);
          showToast('Access Authorized. Master session active.');
        }}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      
      {/* Top Navbar */}
      <Navbar
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode((prev) => !prev)}
        sheetConfig={sheetConfig}
        authState={authState}
        onOpenSheetsTab={() => setCurrentTab('sheets')}
        onOpenNewSale={() => {
          setEditingRecord(null);
          setCurrentTab('entry');
        }}
        onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
        onLockSystem={handleLockSystem}
      />

      {/* Main Layout Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'entry' && editingRecord) {
              // keep editing record if going to entry
            }
          }}
          unpaidCount={unpaidCount}
          totalRecordsCount={records.length}
          sheetConfig={sheetConfig}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          onLockSystem={handleLockSystem}
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0">
          
          {/* TAB 1: Sales Entry Form */}
          {currentTab === 'entry' && (
            <SalesEntryForm
              records={records}
              customers={customers}
              editingRecord={editingRecord}
              sheetConfig={sheetConfig}
              prefillCustomer={prefillCustomer}
              onSaveSale={handleSaveSale}
              onUpdateSale={handleUpdateSale}
              onCancelEdit={() => setEditingRecord(null)}
            />
          )}

          {/* TAB 2: Dashboard */}
          {currentTab === 'dashboard' && (
            <DashboardView
              records={records}
              customers={customers}
              onNavigateToRecords={(statusFilter) => {
                if (statusFilter) {
                  setRecordsInitialStatusFilter(statusFilter);
                }
                setCurrentTab('records');
              }}
            />
          )}

          {/* TAB 3: Sales Records Management Table */}
          {currentTab === 'records' && (
            <RecordsView
              records={records}
              customers={customers}
              initialStatusFilter={recordsInitialStatusFilter}
              onEditRecord={(record) => {
                setEditingRecord(record);
                setCurrentTab('entry');
              }}
              onDeleteRecord={(record) => setRecordToDelete(record)}
              onViewReceipt={(record) => setSelectedReceipt(record)}
              onNavigateToEntry={() => {
                setEditingRecord(null);
                setCurrentTab('entry');
              }}
            />
          )}

          {/* TAB 4: Customer Directory & Ledgers */}
          {currentTab === 'customers' && (
            <CustomerView
              customers={customers}
              records={records}
              onNewSaleForCustomer={(name, phone) => {
                handleNewSaleForCustomer(name, phone);
              }}
              onViewReceipt={(record) => setSelectedReceipt(record)}
            />
          )}

          {/* TAB 5: Google Sheets Integration */}
          {currentTab === 'sheets' && (
            <GoogleSheetsView
              authState={authState}
              sheetConfig={sheetConfig}
              records={records}
              customers={customers}
              onSignIn={handleSignIn}
              onSignOut={handleSignOut}
              onCreateNewSheet={handleCreateNewSheet}
              onConnectExistingSheet={handleConnectExistingSheet}
              onSyncFromSheet={handleSyncFromSheet}
              onPushToSheet={handlePushToSheet}
              onDisconnectSheet={handleDisconnectSheet}
            />
          )}

          {/* TAB 6: Export & Backup */}
          {currentTab === 'export' && (
            <ExportBackupView
              records={records}
              customers={customers}
              onImportRecords={handleImportRecords}
              onResetDatabase={handleResetDatabase}
            />
          )}

        </main>
      </div>

      {/* Global Application Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 py-4 px-4 sm:px-6 lg:px-8 print:hidden transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-slate-200">SalesTracker Pro</span>
            <span>•</span>
            <span>Sales & Financial Ledger System (NPR)</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span>Designed & Made by</span>
            <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
              Pankaj Yadav
            </span>
          </div>
        </div>
      </footer>

      {/* Floating Global Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 dark:border-slate-300 text-xs font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <span className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Printable Receipt Modal */}
      <ReceiptModal
        sale={selectedReceipt}
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
      />

      {/* Delete Record Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(recordToDelete)}
        title="Delete Sales Record"
        message={
          recordToDelete
            ? `Are you sure you want to permanently delete sale #${recordToDelete.sn} for ${recordToDelete.customerName} (${recordToDelete.itemName})? This will also update your Google Sheet.`
            : 'Are you sure you want to delete this record?'
        }
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setRecordToDelete(null)}
      />

    </div>
  );
}
