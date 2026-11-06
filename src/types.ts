export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

export interface SaleLineItem {
  id: string;
  itemName: string;
  quantity: number;
  unitPrice: number; // in NPR
  totalAmount: number; // quantity * unitPrice
}

export interface SaleRecord {
  id: string; // Unique UUID / timestamp identifier
  sn: string; // Formatted serial number, e.g. "SN-1001"
  snNumber: number; // Numeric sequence number for reliable sorting and auto-increment
  date: string; // YYYY-MM-DD
  customerName: string;
  customerPhone: string;
  items?: SaleLineItem[]; // Multiple items support
  itemName: string; // Primary item or summarized item string
  quantity: number; // Total quantity across items
  unitPrice: number; // in NPR (average or single unit price)
  totalAmount: number; // Total across all items
  paidAmount: number; // in NPR
  unpaidAmount: number; // Total - Paid
  paymentStatus: PaymentStatus;
  remarks?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  sheetRowIndex?: number; // Position in Google Sheet if synced
}

export interface CustomerSummary {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  totalPaid: number;
  totalUnpaid: number;
  lastPurchaseDate: string;
  status: 'CLEAR' | 'OUTSTANDING';
}

export type DateFilterPreset = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom';

export interface FilterOptions {
  searchQuery: string;
  statusFilter: 'ALL' | PaymentStatus;
  dateFilterPreset: DateFilterPreset;
  startDate: string;
  endDate: string;
  customerFilter?: string;
  itemFilter?: string;
  sortBy: keyof SaleRecord | 'snNumber';
  sortDirection: 'asc' | 'desc';
}

export interface GoogleSheetsConfig {
  spreadsheetId: string | null;
  spreadsheetName: string;
  spreadsheetUrl: string | null;
  isConnected: boolean;
  lastSyncTime: string | null;
  isSyncing: boolean;
  syncError: string | null;
}

export interface AuthUserState {
  isSignedIn: boolean;
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  } | null;
  accessToken: string | null;
}
