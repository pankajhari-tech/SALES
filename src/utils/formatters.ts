import { PaymentStatus, SaleRecord } from '../types';

/**
 * Format currency in Nepali Rupees (NPR / रू) with proper grouping
 */
export function formatNPR(amount: number, includeDecimals = true): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'रू 0.00';
  }
  
  // Format using South Asian (en-IN) number grouping commonly used in Nepal
  const formattedNumber = Math.abs(amount).toLocaleString('en-IN', {
    minimumFractionDigits: includeDecimals ? 2 : 0,
    maximumFractionDigits: includeDecimals ? 2 : 0,
  });

  const sign = amount < 0 ? '-' : '';
  return `${sign}रू ${formattedNumber}`;
}

/**
 * Determine payment status based on total and paid amounts
 */
export function calculatePaymentStatus(totalAmount: number, paidAmount: number): PaymentStatus {
  if (totalAmount <= 0) {
    return paidAmount > 0 ? 'PAID' : 'UNPAID';
  }
  if (paidAmount >= totalAmount) {
    return 'PAID';
  }
  if (paidAmount <= 0) {
    return 'UNPAID';
  }
  return 'PARTIAL';
}

/**
 * Calculate unpaid amount safely
 */
export function calculateUnpaidAmount(totalAmount: number, paidAmount: number): number {
  const unpaid = totalAmount - paidAmount;
  return unpaid > 0 ? Number(unpaid.toFixed(2)) : 0;
}

/**
 * Get today's date formatted as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date string (YYYY-MM-DD) into user-friendly format (e.g. "4 Nov 2026")
 */
export function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Generate next Serial Number based on existing records
 */
export function generateNextSN(records: SaleRecord[]): { sn: string; snNumber: number } {
  if (!records || records.length === 0) {
    return { sn: 'SN-1001', snNumber: 1001 };
  }

  let maxNum = 1000;
  for (const record of records) {
    if (record.snNumber && record.snNumber > maxNum) {
      maxNum = record.snNumber;
    } else if (record.sn) {
      // Try to extract numbers from SN string e.g. "SN-1005" -> 1005
      const matches = record.sn.match(/\d+/g);
      if (matches) {
        const num = parseInt(matches[matches.length - 1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  const nextNum = maxNum + 1;
  return {
    sn: `SN-${nextNum}`,
    snNumber: nextNum,
  };
}

/**
 * Helper to get date boundaries for filters
 */
export function getDateFilterBounds(preset: string): { start: string; end: string } {
  const today = new Date();
  const todayStr = getTodayDateString();

  if (preset === 'today') {
    return { start: todayStr, end: todayStr };
  }

  if (preset === 'yesterday') {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
    return { start: yStr, end: yStr };
  }

  if (preset === 'week') {
    // Current week starting from Sunday or Monday
    const dayOfWeek = today.getDay(); // 0 is Sunday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    const startStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
    return { start: startStr, end: todayStr };
  }

  if (preset === 'month') {
    // Start of current month
    const startStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    return { start: startStr, end: todayStr };
  }

  return { start: '', end: '' };
}
