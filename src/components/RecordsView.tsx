import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  FileSpreadsheet,
  Printer,
  Edit2,
  Trash2,
  Receipt,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Phone,
  FileText,
} from 'lucide-react';
import { SaleRecord, PaymentStatus, CustomerSummary } from '../types';
import { formatNPR, formatDisplayDate } from '../utils/formatters';
import { exportToExcel, exportToCSV } from '../services/storageService';

interface RecordsViewProps {
  records: SaleRecord[];
  customers: CustomerSummary[];
  initialStatusFilter?: string;
  onEditRecord: (record: SaleRecord) => void;
  onDeleteRecord: (record: SaleRecord) => void;
  onViewReceipt: (record: SaleRecord) => void;
  onNavigateToEntry: () => void;
}

export const RecordsView: React.FC<RecordsViewProps> = ({
  records,
  customers,
  initialStatusFilter,
  onEditRecord,
  onDeleteRecord,
  onViewReceipt,
  onNavigateToEntry,
}) => {
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting state
  const [sortField, setSortField] = useState<keyof SaleRecord | 'snNumber'>('snNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter logic
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      // 1. Status Filter
      if (statusFilter !== 'ALL' && r.paymentStatus !== statusFilter) {
        return false;
      }

      // 2. Date Range Filter
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;

      // 3. Search query: Customer name, Item name, SN
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCustomer = r.customerName.toLowerCase().includes(q);
        const matchItem = r.itemName.toLowerCase().includes(q);
        const matchSn = r.sn.toLowerCase().includes(q);
        const matchPhone = (r.customerPhone || '').toLowerCase().includes(q);
        const matchRemarks = (r.remarks || '').toLowerCase().includes(q);
        if (!matchCustomer && !matchItem && !matchSn && !matchPhone && !matchRemarks) {
          return false;
        }
      }

      return true;
    });
  }, [records, statusFilter, startDate, endDate, searchQuery]);

  // Sort logic
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'snNumber') {
        aVal = a.snNumber || 0;
        bVal = b.snNumber || 0;
      }

      if (typeof aVal === 'string' || typeof bVal === 'string') {
        const cmp = String(aVal || '').localeCompare(String(bVal || ''));
        return sortDirection === 'asc' ? cmp : -cmp;
      }

      if (typeof aVal === 'number' || typeof bVal === 'number') {
        const aNum = Number(aVal) || 0;
        const bNum = Number(bVal) || 0;
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      return 0;
    });
  }, [filteredRecords, sortField, sortDirection]);

  // Filtered Totals
  const filteredTotal = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  }, [filteredRecords]);

  const filteredPaid = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.paidAmount, 0);
  }, [filteredRecords]);

  const filteredUnpaid = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.unpaidAmount, 0);
  }, [filteredRecords]);

  // Handle column sort toggle
  const toggleSort = (field: keyof SaleRecord | 'snNumber') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIndicator = (field: keyof SaleRecord | 'snNumber') => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
    ) : (
      <ArrowDown className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
    );
  };

  // Export actions
  const handleExportExcel = () => {
    exportToExcel(filteredRecords, customers, `Sales_Filtered_${new Date().toISOString().substring(0, 10)}.xlsx`);
  };

  const handleExportCSV = () => {
    exportToCSV(filteredRecords, `Sales_Filtered_${new Date().toISOString().substring(0, 10)}.csv`);
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Search, Filter & Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Input (Customer, Item, SN) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, item name, phone, or serial number (SN)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {/* Export & Print Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800 transition"
              title="Download structured multi-sheet Excel file"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export Excel
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs transition"
              title="Download standard CSV file"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={handlePrintReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-xs"
              title="Print formatted sales report"
            >
              <Printer className="w-4 h-4" />
              Print Report
            </button>
          </div>
        </div>

        {/* Filter Pills & Date Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          
          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px] mr-1">
              Status:
            </span>
            {(['ALL', 'PAID', 'PARTIAL', 'UNPAID'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-xl font-bold transition ${
                  statusFilter === st
                    ? st === 'PAID'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : st === 'PARTIAL'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : st === 'UNPAID'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
            {(startDate || endDate || searchQuery || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setSearchQuery('');
                  setStatusFilter('ALL');
                }}
                className="text-xs text-indigo-600 dark:text-indigo-400 underline font-medium ml-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Summary Metrics Bar for Filtered Records */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Filtered Records
          </span>
          <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
            {filteredRecords.length} sales
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Filtered Revenue
          </span>
          <span className="text-lg font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
            {formatNPR(filteredTotal)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider block">
            Filtered Collected
          </span>
          <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {formatNPR(filteredPaid)}
          </span>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider block">
            Filtered Unpaid / Due
          </span>
          <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
            {formatNPR(filteredUnpaid)}
          </span>
        </div>
      </div>

      {/* Primary Table (Matching Backend Google Sheets Primary Table Structure) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800 select-none">
              <tr>
                <th
                  onClick={() => toggleSort('snNumber')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SN</span>
                    {renderSortIndicator('snNumber')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('date')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Date</span>
                    {renderSortIndicator('date')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('customerName')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Customer Name</span>
                    {renderSortIndicator('customerName')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('itemName')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Item Name</span>
                    {renderSortIndicator('itemName')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('quantity')}
                  className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>QTY</span>
                    {renderSortIndicator('quantity')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('unitPrice')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unit Price</span>
                    {renderSortIndicator('unitPrice')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('totalAmount')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total</span>
                    {renderSortIndicator('totalAmount')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('paidAmount')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Paid</span>
                    {renderSortIndicator('paidAmount')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('unpaidAmount')}
                  className="py-3.5 px-4 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Unpaid</span>
                    {renderSortIndicator('unpaidAmount')}
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('paymentStatus')}
                  className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status</span>
                    {renderSortIndicator('paymentStatus')}
                  </div>
                </th>
                <th className="py-3.5 px-4 text-center print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedRecords.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-16 text-center text-slate-400 text-sm">
                    No sales records found matching the current search criteria.
                    <div className="mt-3">
                      <button
                        onClick={onNavigateToEntry}
                        className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition"
                      >
                        Create New Sale Record
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedRecords.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition group"
                  >
                    {/* SN */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {r.sn}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDisplayDate(r.date)}
                    </td>

                    {/* Customer Name & Phone */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {r.customerName}
                      </div>
                      {r.customerPhone && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {r.customerPhone}
                        </div>
                      )}
                    </td>

                    {/* Item Name & Breakdown */}
                    <td className="py-3.5 px-4">
                      {r.items && r.items.length > 1 ? (
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {r.items[0].itemName}
                            </span>
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                              +{r.items.length - 1} more items
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[250px] mt-0.5" title={r.items.map(it => `${it.itemName} (${it.quantity} pcs @ ${formatNPR(it.unitPrice)})`).join(', ')}>
                            {r.items.map(it => `${it.itemName} (${it.quantity}x)`).join(' • ')}
                          </div>
                        </div>
                      ) : (
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {r.itemName}
                        </div>
                      )}
                      {r.remarks && (
                        <div className="text-[11px] text-slate-400 truncate max-w-[220px] flex items-center gap-1 mt-0.5" title={r.remarks}>
                          <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{r.remarks}</span>
                        </div>
                      )}
                    </td>

                    {/* QTY */}
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                      {r.quantity}
                    </td>

                    {/* Unit Price */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600 dark:text-slate-400">
                      {formatNPR(r.unitPrice)}
                    </td>

                    {/* TOTAL */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatNPR(r.totalAmount)}
                    </td>

                    {/* PAID */}
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatNPR(r.paidAmount)}
                    </td>

                    {/* UNPAID */}
                    <td className={`py-3.5 px-4 text-right font-mono font-semibold ${r.unpaidAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}`}>
                      {formatNPR(r.unpaidAmount)}
                    </td>

                    {/* STATUS */}
                    <td className="py-3.5 px-4 text-center">
                      {r.paymentStatus === 'PAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> PAID
                        </span>
                      )}
                      {r.paymentStatus === 'PARTIAL' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                          <Clock className="w-3 h-3" /> PARTIAL
                        </span>
                      )}
                      {r.paymentStatus === 'UNPAID' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <AlertCircle className="w-3 h-3" /> UNPAID
                        </span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap print:hidden">
                      <div className="flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100">
                        <button
                          onClick={() => onViewReceipt(r)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="View / Print Tax Receipt"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditRecord(r)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Edit Sales Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord(r)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-900 dark:text-white font-mono">{sortedRecords.length}</strong> of{' '}
            <strong className="text-slate-900 dark:text-white font-mono">{records.length}</strong> total sales
          </span>
          <span className="font-mono">
            Net Selected: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{formatNPR(filteredTotal)}</strong>
          </span>
        </div>
      </div>

    </div>
  );
};
