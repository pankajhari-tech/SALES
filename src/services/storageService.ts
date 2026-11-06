import * as XLSX from 'xlsx';
import { SaleRecord, CustomerSummary, GoogleSheetsConfig } from '../types';
import { formatNPR, getTodayDateString } from '../utils/formatters';

const STORAGE_KEY_RECORDS = 'salestracker_pro_records_v1';
const STORAGE_KEY_CONFIG = 'salestracker_pro_sheet_config_v1';

/**
 * Generate initial realistic seed data for immediate demonstration
 */
function getInitialSeedRecords(): SaleRecord[] {
  const today = new Date();
  const d = (daysAgo: number) => {
    const target = new Date(today);
    target.setDate(target.getDate() - daysAgo);
    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, '0')}-${String(target.getDate()).padStart(2, '0')}`;
  };

  return [
    {
      id: 'seed-1',
      sn: 'SN-1001',
      snNumber: 1001,
      date: d(0), // Today
      customerName: 'Aayush Shrestha',
      customerPhone: '9841234567',
      itemName: 'Dell UltraSharp 27" 4K Monitor',
      quantity: 2,
      unitPrice: 48000,
      totalAmount: 96000,
      paidAmount: 96000,
      unpaidAmount: 0,
      paymentStatus: 'PAID',
      remarks: 'Delivered to New Baneshwor office. Paid via eSewa.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    },
    {
      id: 'seed-2',
      sn: 'SN-1002',
      snNumber: 1002,
      date: d(0), // Today
      customerName: 'Sunita Maharjan',
      customerPhone: '9801876543',
      itemName: 'Logitech MX Master 3S Wireless Mouse',
      quantity: 5,
      unitPrice: 14500,
      totalAmount: 72500,
      paidAmount: 40000,
      unpaidAmount: 32500,
      paymentStatus: 'PARTIAL',
      remarks: 'Remaining रू 32,500 promised by Friday.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'seed-3',
      sn: 'SN-1003',
      snNumber: 1003,
      date: d(1), // Yesterday
      customerName: 'Bikram Thapa',
      customerPhone: '9860112233',
      itemName: 'Apple MacBook Pro M3 16/512GB',
      quantity: 1,
      unitPrice: 245000,
      totalAmount: 245000,
      paidAmount: 0,
      unpaidAmount: 245000,
      paymentStatus: 'UNPAID',
      remarks: 'Corporate purchase invoice issued. PO #NP-2026-88',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'seed-4',
      sn: 'SN-1004',
      snNumber: 1004,
      date: d(2),
      customerName: 'Pooja Karki',
      customerPhone: '9813445566',
      itemName: 'Keychron Q1 Pro Mechanical Keyboard',
      quantity: 3,
      unitPrice: 22000,
      totalAmount: 66000,
      paidAmount: 66000,
      unpaidAmount: 0,
      paymentStatus: 'PAID',
      remarks: 'Cash on Delivery received at Lalitpur.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'seed-5',
      sn: 'SN-1005',
      snNumber: 1005,
      date: d(3),
      customerName: 'Sunita Maharjan',
      customerPhone: '9801876543',
      itemName: 'Anker 7-in-1 USB-C Hub Adapter',
      quantity: 4,
      unitPrice: 6500,
      totalAmount: 26000,
      paidAmount: 26000,
      unpaidAmount: 0,
      paymentStatus: 'PAID',
      remarks: 'Repeat order. Cleared in full.',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 'seed-6',
      sn: 'SN-1006',
      snNumber: 1006,
      date: d(5),
      customerName: 'Dinesh Adhikari',
      customerPhone: '9849988776',
      itemName: 'Samsung 990 Pro 2TB NVMe SSD',
      quantity: 6,
      unitPrice: 27500,
      totalAmount: 165000,
      paidAmount: 100000,
      unpaidAmount: 65000,
      paymentStatus: 'PARTIAL',
      remarks: '50% advance received, balance on installation.',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'seed-7',
      sn: 'SN-1007',
      snNumber: 1007,
      date: d(7),
      customerName: 'Roshan Shrestha',
      customerPhone: '9851098765',
      itemName: 'Sony WH-1000XM5 Headphones',
      quantity: 2,
      unitPrice: 46000,
      totalAmount: 92000,
      paidAmount: 92000,
      unpaidAmount: 0,
      paymentStatus: 'PAID',
      remarks: 'Paid via FonePay QR.',
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
  ];
}

/**
 * Load records from localStorage or initial seed
 */
export function loadSavedRecords(): SaleRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading records from localStorage:', e);
  }
  const initial = getInitialSeedRecords();
  saveRecordsToStorage(initial);
  return initial;
}

/**
 * Save records to localStorage
 */
export function saveRecordsToStorage(records: SaleRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Error saving records to localStorage:', e);
  }
}

/**
 * Load Google Sheets configuration from localStorage
 */
export function loadSavedSheetConfig(): GoogleSheetsConfig {
  const defaultConfig: GoogleSheetsConfig = {
    spreadsheetId: null,
    spreadsheetName: 'SalesTracker Pro Database',
    spreadsheetUrl: null,
    isConnected: false,
    lastSyncTime: null,
    isSyncing: false,
    syncError: null,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (raw) {
      return { ...defaultConfig, ...JSON.parse(raw), isSyncing: false, syncError: null };
    }
  } catch (e) {
    console.error('Error loading sheet config:', e);
  }
  return defaultConfig;
}

/**
 * Save Google Sheets configuration to localStorage
 */
export function saveSheetConfigToStorage(config: GoogleSheetsConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.error('Error saving sheet config to storage:', e);
  }
}

/**
 * Derive full customer summaries dynamically from sales records
 */
export function deriveCustomersFromRecords(records: SaleRecord[]): CustomerSummary[] {
  const map = new Map<string, CustomerSummary>();

  // Process in chronological order
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const record of sorted) {
    const key = record.customerName.trim().toLowerCase();
    if (!key) continue;

    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name: record.customerName.trim(),
        phone: record.customerPhone || '',
        totalOrders: 1,
        totalSpent: record.totalAmount,
        totalPaid: record.paidAmount,
        totalUnpaid: record.unpaidAmount,
        lastPurchaseDate: record.date,
        status: record.unpaidAmount > 0 ? 'OUTSTANDING' : 'CLEAR',
      });
    } else {
      existing.totalOrders += 1;
      existing.totalSpent += record.totalAmount;
      existing.totalPaid += record.paidAmount;
      existing.totalUnpaid += record.unpaidAmount;
      existing.status = existing.totalUnpaid > 0 ? 'OUTSTANDING' : 'CLEAR';
      if (record.date >= existing.lastPurchaseDate) {
        existing.lastPurchaseDate = record.date;
      }
      if (record.customerPhone && !existing.phone) {
        existing.phone = record.customerPhone;
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Export sales records, customer ledger, and summary to Excel (.xlsx) workbook
 */
export function exportToExcel(records: SaleRecord[], customers: CustomerSummary[], fileName?: string): void {
  const workbook = XLSX.utils.book_new();

  // 1. Sales Sheet
  const salesData = records.map((r) => ({
    'SN': r.sn,
    'Date': r.date,
    'Customer Name': r.customerName,
    'Customer Phone': r.customerPhone || '-',
    'Item Name': r.itemName,
    'Quantity': r.quantity,
    'Unit Price (NPR)': r.unitPrice,
    'Total Amount (NPR)': r.totalAmount,
    'Paid Amount (NPR)': r.paidAmount,
    'Unpaid Amount (NPR)': r.unpaidAmount,
    'Status': r.paymentStatus,
    'Remarks': r.remarks || '',
    'Record ID': r.id,
  }));
  const salesSheet = XLSX.utils.json_to_sheet(salesData);
  XLSX.utils.book_append_sheet(workbook, salesSheet, 'SALES');

  // 2. Customers Sheet
  const customerData = customers.map((c) => ({
    'Customer Name': c.name,
    'Phone': c.phone || '-',
    'Total Orders': c.totalOrders,
    'Total Spent (NPR)': c.totalSpent,
    'Total Paid (NPR)': c.totalPaid,
    'Outstanding Balance (NPR)': c.totalUnpaid,
    'Status': c.status,
    'Last Purchase Date': c.lastPurchaseDate,
  }));
  const customerSheet = XLSX.utils.json_to_sheet(customerData);
  XLSX.utils.book_append_sheet(workbook, customerSheet, 'CUSTOMERS');

  // 3. Financial Summary Sheet
  const totalRevenue = records.reduce((s, r) => s + r.totalAmount, 0);
  const totalPaid = records.reduce((s, r) => s + r.paidAmount, 0);
  const totalUnpaid = records.reduce((s, r) => s + r.unpaidAmount, 0);
  const paidCount = records.filter((r) => r.paymentStatus === 'PAID').length;
  const partialCount = records.filter((r) => r.paymentStatus === 'PARTIAL').length;
  const unpaidCount = records.filter((r) => r.paymentStatus === 'UNPAID').length;

  const summaryData = [
    { 'Metric': 'Total Orders', 'Value': records.length, 'Formatted': `${records.length} orders` },
    { 'Metric': 'Total Revenue', 'Value': totalRevenue, 'Formatted': formatNPR(totalRevenue) },
    { 'Metric': 'Total Collected', 'Value': totalPaid, 'Formatted': formatNPR(totalPaid) },
    { 'Metric': 'Total Outstanding', 'Value': totalUnpaid, 'Formatted': formatNPR(totalUnpaid) },
    { 'Metric': 'Collection Rate', 'Value': totalRevenue ? Math.round((totalPaid / totalRevenue) * 100) : 0, 'Formatted': `${totalRevenue ? Math.round((totalPaid / totalRevenue) * 100) : 0}%` },
    { 'Metric': 'Fully Paid Orders', 'Value': paidCount, 'Formatted': `${paidCount}` },
    { 'Metric': 'Partially Paid Orders', 'Value': partialCount, 'Formatted': `${partialCount}` },
    { 'Metric': 'Unpaid Orders', 'Value': unpaidCount, 'Formatted': `${unpaidCount}` },
    { 'Metric': 'Total Customers', 'Value': customers.length, 'Formatted': `${customers.length} unique` },
    { 'Metric': 'Export Timestamp', 'Value': new Date().toISOString(), 'Formatted': new Date().toLocaleString() },
  ];
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'FINANCIAL_SUMMARY');

  const finalName = fileName || `SalesTracker_Export_${getTodayDateString()}.xlsx`;
  XLSX.writeFile(workbook, finalName);
}

/**
 * Export sales records to CSV
 */
export function exportToCSV(records: SaleRecord[], fileName?: string): void {
  const headers = [
    'SN',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Item Name',
    'Quantity',
    'Unit Price (NPR)',
    'Total Amount (NPR)',
    'Paid Amount (NPR)',
    'Unpaid Amount (NPR)',
    'Status',
    'Remarks',
  ];

  const rows = records.map((r) => [
    `"${r.sn}"`,
    `"${r.date}"`,
    `"${r.customerName.replace(/"/g, '""')}"`,
    `"${(r.customerPhone || '').replace(/"/g, '""')}"`,
    `"${r.itemName.replace(/"/g, '""')}"`,
    r.quantity,
    r.unitPrice,
    r.totalAmount,
    r.paidAmount,
    r.unpaidAmount,
    `"${r.paymentStatus}"`,
    `"${(r.remarks || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName || `SalesRecords_${getTodayDateString()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parse an uploaded Excel (.xlsx, .xls) or CSV file into SaleRecord[]
 */
export async function parseImportFile(file: File): Promise<SaleRecord[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames.includes('SALES') ? 'SALES' : workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

  if (!jsonData || jsonData.length < 2) {
    throw new Error('File does not contain valid sales rows or is empty.');
  }

  // Find header index
  let headerRowIdx = 0;
  for (let i = 0; i < Math.min(5, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && Array.isArray(row) && row.some((cell) => String(cell).toUpperCase().includes('CUSTOMER') || String(cell).toUpperCase() === 'SN')) {
      headerRowIdx = i;
      break;
    }
  }

  const rows = jsonData.slice(headerRowIdx + 1);
  const importedRecords: SaleRecord[] = [];

  rows.forEach((row: any[], idx: number) => {
    if (!row || row.length < 4) return;
    const sn = String(row[0] || `SN-${1000 + idx}`).trim();
    const date = String(row[1] || getTodayDateString()).trim();
    const customerName = String(row[2] || '').trim();
    if (!customerName) return;

    // Check if col 3 is phone or item
    let customerPhone = '';
    let itemName = '';
    let quantity = 1;
    let unitPrice = 0;
    let totalAmount = 0;
    let paidAmount = 0;

    if (row.length >= 10) {
      // standard 12-column structure
      customerPhone = String(row[3] || '').trim().replace(/^[-]$/, '');
      itemName = String(row[4] || '').trim();
      quantity = parseFloat(String(row[5] || '1')) || 1;
      unitPrice = parseFloat(String(row[6] || '0')) || 0;
      totalAmount = parseFloat(String(row[7] || '0')) || (quantity * unitPrice);
      paidAmount = parseFloat(String(row[8] || '0')) || 0;
    } else {
      // fallback 8-10 column structure
      itemName = String(row[3] || '').trim();
      quantity = parseFloat(String(row[4] || '1')) || 1;
      unitPrice = parseFloat(String(row[5] || '0')) || 0;
      totalAmount = parseFloat(String(row[6] || '0')) || (quantity * unitPrice);
      paidAmount = parseFloat(String(row[7] || '0')) || 0;
    }

    const unpaidAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = paidAmount >= totalAmount ? 'PAID' : paidAmount <= 0 ? 'UNPAID' : 'PARTIAL';
    const remarks = String(row[row.length > 11 ? 11 : row.length - 1] || '');

    const match = sn.match(/\d+/g);
    const snNumber = match ? parseInt(match[match.length - 1], 10) : 1000 + idx;

    importedRecords.push({
      id: `imported-${Date.now()}-${idx}`,
      sn,
      snNumber,
      date,
      customerName,
      customerPhone,
      itemName: itemName || 'General Item',
      quantity,
      unitPrice,
      totalAmount,
      paidAmount,
      unpaidAmount,
      paymentStatus,
      remarks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  return importedRecords;
}
