import { SaleRecord, CustomerSummary } from '../types';
import { formatNPR } from '../utils/formatters';

const SALES_TAB = 'SALES';
const CUSTOMERS_TAB = 'CUSTOMERS';
const REPORTS_TAB = 'REPORTS';

export const SALES_HEADERS = [
  'SN',
  'DATE',
  'CUSTOMER NAME',
  'CUSTOMER PHONE',
  'ITEM NAME',
  'QTY',
  'UNIT PRICE (NPR)',
  'TOTAL (NPR)',
  'PAID (NPR)',
  'UNPAID (NPR)',
  'STATUS',
  'REMARKS',
  'RECORD_ID',
];

export const CUSTOMER_HEADERS = [
  'CUSTOMER NAME',
  'PHONE',
  'TOTAL ORDERS',
  'TOTAL SPENT (NPR)',
  'TOTAL PAID (NPR)',
  'OUTSTANDING BALANCE (NPR)',
  'PAYMENT STATUS',
  'LAST PURCHASE DATE',
];

export const REPORT_HEADERS = [
  'METRIC',
  'VALUE',
  'NOTES',
];

/**
 * Format a sale record into a spreadsheet row
 */
export function saleRecordToRow(record: SaleRecord): (string | number)[] {
  return [
    record.sn,
    record.date,
    record.customerName,
    record.customerPhone || '-',
    record.itemName,
    record.quantity,
    record.unitPrice,
    record.totalAmount,
    record.paidAmount,
    record.unpaidAmount,
    record.paymentStatus,
    record.remarks || '',
    record.id,
  ];
}

/**
 * Parse a spreadsheet row back into a SaleRecord
 */
export function rowToSaleRecord(row: any[], rowIndex: number): SaleRecord | null {
  if (!row || row.length < 5) return null;
  const sn = String(row[0] || '').trim();
  if (!sn || sn === 'SN') return null; // Skip header

  const date = String(row[1] || '').trim();
  const customerName = String(row[2] || '').trim();
  const customerPhone = String(row[3] || '').trim().replace(/^[-]$/, '');
  const itemName = String(row[4] || '').trim();
  const quantity = parseFloat(String(row[5] || '1')) || 1;
  const unitPrice = parseFloat(String(row[6] || '0')) || 0;
  const totalAmount = parseFloat(String(row[7] || '0')) || (quantity * unitPrice);
  const paidAmount = parseFloat(String(row[8] || '0')) || 0;
  const unpaidAmount = parseFloat(String(row[9] || '0')) || Math.max(0, totalAmount - paidAmount);
  const statusStr = String(row[10] || '').toUpperCase();
  const paymentStatus = (statusStr === 'PAID' || statusStr === 'PARTIAL' || statusStr === 'UNPAID')
    ? statusStr
    : (paidAmount >= totalAmount ? 'PAID' : paidAmount <= 0 ? 'UNPAID' : 'PARTIAL');
  const remarks = String(row[11] || '');
  const id = String(row[12] || `rec-${Date.now()}-${rowIndex}`);

  // Extract number from SN
  const match = sn.match(/\d+/g);
  const snNumber = match ? parseInt(match[match.length - 1], 10) : 1000 + rowIndex;

  return {
    id,
    sn,
    snNumber,
    date,
    customerName,
    customerPhone,
    itemName,
    quantity,
    unitPrice,
    totalAmount,
    paidAmount,
    unpaidAmount,
    paymentStatus,
    remarks,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sheetRowIndex: rowIndex + 2, // 1-indexed and header is row 1
  };
}

/**
 * Create a new dedicated spreadsheet with SALES, CUSTOMERS, and REPORTS tabs
 */
export async function createDedicatedSpreadsheet(
  accessToken: string,
  title = 'SalesTracker Pro - Official Database'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  
  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: SALES_TAB,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: CUSTOMERS_TAB,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
      {
        properties: {
          title: REPORTS_TAB,
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Failed to create Google Spreadsheet (${response.status})`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize headers on all 3 tabs
  await initializeSpreadsheetHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Initialize headers and styles in the spreadsheet
 */
export async function initializeSpreadsheetHeaders(
  accessToken: string,
  spreadsheetId: string
) {
  const valuesUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;

  const body = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: `${SALES_TAB}!A1:M1`,
        values: [SALES_HEADERS],
      },
      {
        range: `${CUSTOMERS_TAB}!A1:H1`,
        values: [CUSTOMER_HEADERS],
      },
      {
        range: `${REPORTS_TAB}!A1:C1`,
        values: [REPORT_HEADERS],
      },
    ],
  };

  const res = await fetch(valuesUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.warn('Headers initialization notice:', await res.text());
  }
}

/**
 * Verify access to an existing spreadsheet and ensure required tabs exist
 */
export async function verifyAndPrepareSpreadsheet(
  accessToken: string,
  spreadsheetId: string
): Promise<{ title: string; sheetNames: string[] }> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets.properties`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `Cannot access spreadsheet (${res.status}). Verify permissions.`);
  }

  const data = await res.json();
  const title = data.properties?.title || 'Connected Spreadsheet';
  const existingSheets: { sheetId: number; title: string }[] =
    data.sheets?.map((s: any) => ({ sheetId: s.properties.sheetId, title: s.properties.title })) || [];
  const existingTitles = existingSheets.map((s) => s.title);

  // If SALES tab doesn't exist, create it or rename first tab
  const neededTabs = [SALES_TAB, CUSTOMERS_TAB, REPORTS_TAB];
  const missingTabs = neededTabs.filter((tab) => !existingTitles.includes(tab));

  if (missingTabs.length > 0) {
    const requests = missingTabs.map((tab) => ({
      addSheet: {
        properties: {
          title: tab,
          gridProperties: { frozenRowCount: 1 },
        },
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });

    await initializeSpreadsheetHeaders(accessToken, spreadsheetId);
  }

  return { title, sheetNames: [...existingTitles, ...missingTabs] };
}

/**
 * Fetch all sale records from the SALES tab
 */
export async function fetchSalesRecordsFromSheet(
  accessToken: string,
  spreadsheetId: string
): Promise<SaleRecord[]> {
  const range = `${SALES_TAB}!A2:M`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to fetch data from sheet (${res.status})`);
  }

  const data = await res.json();
  const rows = data.values || [];

  const records: SaleRecord[] = [];
  rows.forEach((row: any[], idx: number) => {
    const record = rowToSaleRecord(row, idx);
    if (record) {
      records.push(record);
    }
  });

  return records;
}

/**
 * Append a new sale record to the SALES tab
 */
export async function appendSaleRecordToSheet(
  accessToken: string,
  spreadsheetId: string,
  record: SaleRecord
): Promise<void> {
  const range = `${SALES_TAB}!A:M`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const row = saleRecordToRow(record);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [row],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to append sale to Google Sheet (${res.status})`);
  }
}

/**
 * Overwrite or update all records in SALES tab to ensure 100% synchronization
 */
export async function syncAllRecordsToSheet(
  accessToken: string,
  spreadsheetId: string,
  records: SaleRecord[],
  customers: CustomerSummary[]
): Promise<void> {
  // Sort records by SN / date
  const sorted = [...records].sort((a, b) => (a.snNumber || 0) - (b.snNumber || 0));

  const salesRows = [
    SALES_HEADERS,
    ...sorted.map(saleRecordToRow),
  ];

  const customerRows = [
    CUSTOMER_HEADERS,
    ...customers.map((c) => [
      c.name,
      c.phone || '-',
      c.totalOrders,
      c.totalSpent,
      c.totalPaid,
      c.totalUnpaid,
      c.status,
      c.lastPurchaseDate || '-',
    ]),
  ];

  const totalSales = records.reduce((sum, r) => sum + r.totalAmount, 0);
  const totalPaid = records.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalUnpaid = records.reduce((sum, r) => sum + r.unpaidAmount, 0);
  const paidCount = records.filter((r) => r.paymentStatus === 'PAID').length;
  const partialCount = records.filter((r) => r.paymentStatus === 'PARTIAL').length;
  const unpaidCount = records.filter((r) => r.paymentStatus === 'UNPAID').length;

  const reportRows = [
    REPORT_HEADERS,
    ['Total Orders', records.length, 'Total registered sales orders'],
    ['Total Revenue (NPR)', totalSales, formatNPR(totalSales)],
    ['Total Collected (NPR)', totalPaid, formatNPR(totalPaid)],
    ['Total Outstanding (NPR)', totalUnpaid, formatNPR(totalUnpaid)],
    ['Fully Paid Orders', paidCount, `${records.length ? Math.round((paidCount / records.length) * 100) : 0}% of orders`],
    ['Partially Paid Orders', partialCount, 'Orders with balance remaining'],
    ['Unpaid Orders', unpaidCount, 'Orders with 0 NPR collected'],
    ['Total Customers', customers.length, 'Unique customer directory'],
    ['Last Updated', new Date().toLocaleString(), 'Auto-generated by SalesTracker Pro'],
  ];

  // First clear existing data in SALES, CUSTOMERS, and REPORTS to prevent residual rows
  const clearRanges = [`${SALES_TAB}!A1:Z`, `${CUSTOMERS_TAB}!A1:Z`, `${REPORTS_TAB}!A1:Z`];
  for (const r of clearRanges) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(r)}:clear`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
    }).catch(() => {});
  }

  // Batch update with fresh data
  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  const res = await fetch(updateUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: `${SALES_TAB}!A1:M${salesRows.length}`,
          values: salesRows,
        },
        {
          range: `${CUSTOMERS_TAB}!A1:H${customerRows.length}`,
          values: customerRows,
        },
        {
          range: `${REPORTS_TAB}!A1:C${reportRows.length}`,
          values: reportRows,
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Failed to sync batch to Google Sheet (${res.status})`);
  }
}
