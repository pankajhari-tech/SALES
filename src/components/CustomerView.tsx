import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  AlertCircle,
  CheckCircle2,
  Receipt,
  PlusCircle,
  ShoppingBag,
  Clock,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { CustomerSummary, SaleRecord } from '../types';
import { formatNPR, formatDisplayDate } from '../utils/formatters';

interface CustomerViewProps {
  customers: CustomerSummary[];
  records: SaleRecord[];
  onNewSaleForCustomer: (customerName: string, customerPhone?: string) => void;
  onViewReceipt: (record: SaleRecord) => void;
}

export const CustomerView: React.FC<CustomerViewProps> = ({
  customers,
  records,
  onNewSaleForCustomer,
  onViewReceipt,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'OUTSTANDING' | 'CLEAR'>('ALL');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (filterMode === 'OUTSTANDING' && c.totalUnpaid <= 0) return false;
      if (filterMode === 'CLEAR' && c.totalUnpaid > 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchPhone = (c.phone || '').toLowerCase().includes(q);
        return matchName || matchPhone;
      }
      return true;
    });
  }, [customers, filterMode, searchQuery]);

  // Aggregate stats across all customers
  const totalCustomerDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalUnpaid, 0);
  }, [customers]);

  const debtorsCount = useMemo(() => {
    return customers.filter((c) => c.totalUnpaid > 0).length;
  }, [customers]);

  // Order history for selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return records
      .filter((r) => r.customerName.trim().toLowerCase() === selectedCustomer.name.trim().toLowerCase())
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [records, selectedCustomer]);

  return (
    <div className="space-y-6">
      
      {/* Top Header & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Customer Ledger & Balances
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Track customer order volume, total payments, and outstanding debt balances in NPR
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-right">
              <span className="text-[10px] font-bold uppercase text-rose-500 block">Total Credit Outstanding</span>
              <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                {formatNPR(totalCustomerDebt)}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Pills */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
            <span className="text-slate-400 font-medium">Filter:</span>
            <button
              onClick={() => setFilterMode('ALL')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterMode === 'ALL'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              All ({customers.length})
            </button>
            <button
              onClick={() => setFilterMode('OUTSTANDING')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1 ${
                filterMode === 'OUTSTANDING'
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" /> Due Balance ({debtorsCount})
            </button>
            <button
              onClick={() => setFilterMode('CLEAR')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition ${
                filterMode === 'CLEAR'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              Cleared ({customers.length - debtorsCount})
            </button>
          </div>
        </div>
      </div>

      {/* Customer Directory Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Customer Name</th>
                <th className="py-3.5 px-4">Contact Phone</th>
                <th className="py-3.5 px-4 text-center">Orders</th>
                <th className="py-3.5 px-4 text-right">Total Purchases</th>
                <th className="py-3.5 px-4 text-right">Total Paid</th>
                <th className="py-3.5 px-4 text-right">Outstanding Due</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-6 text-center">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400 text-sm">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr
                    key={c.name}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition group"
                  >
                    <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                      {c.name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono">
                      {c.phone || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800 dark:text-slate-200 font-mono">
                      {c.totalOrders}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatNPR(c.totalSpent)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatNPR(c.totalPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold">
                      <span className={c.totalUnpaid > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                        {formatNPR(c.totalUnpaid)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {c.totalUnpaid > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                          <AlertCircle className="w-3 h-3" /> DUE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> CLEAR
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition flex items-center gap-1"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" /> Purchase History
                        </button>
                        <button
                          onClick={() => onNewSaleForCustomer(c.name, c.phone)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 text-xs font-semibold transition flex items-center gap-1"
                          title="Record new sale for this customer"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> New Sale
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Purchase History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Customer Detailed Ledger
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedCustomer.name}
                </h3>
                {selectedCustomer.phone && (
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Phone: {selectedCustomer.phone}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Outstanding Balance</span>
                  <span className={`text-lg font-black font-mono ${selectedCustomer.totalUnpaid > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {formatNPR(selectedCustomer.totalUnpaid)}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-300"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Body: Chronological Invoices List */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-500">
                <span>Complete Purchase History ({customerOrders.length} transactions)</span>
                <button
                  onClick={() => {
                    const cust = selectedCustomer;
                    setSelectedCustomer(null);
                    onNewSaleForCustomer(cust.name, cust.phone);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Add New Sale for {selectedCustomer.name}
                </button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {customerOrders.map((ord) => (
                  <div key={ord.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {ord.sn}
                        </span>
                        <span className="text-slate-400 font-mono text-[11px]">
                          • {formatDisplayDate(ord.date)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : ord.paymentStatus === 'PARTIAL'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {ord.paymentStatus}
                        </span>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                        {ord.itemName} <span className="text-slate-400 font-normal">({ord.quantity} pcs @ {formatNPR(ord.unitPrice)})</span>
                      </p>
                      {ord.remarks && (
                        <p className="text-[11px] text-slate-400 italic">"{ord.remarks}"</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                          {formatNPR(ord.totalAmount)}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                          Paid: {formatNPR(ord.paidAmount)}
                        </div>
                        {ord.unpaidAmount > 0 && (
                          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-mono font-bold">
                            Due: {formatNPR(ord.unpaidAmount)}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          onViewReceipt(ord);
                        }}
                        className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 transition"
                        title="View printable tax receipt"
                      >
                        <Receipt className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
