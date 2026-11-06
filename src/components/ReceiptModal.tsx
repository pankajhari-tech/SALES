import React from 'react';
import { X, Printer, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { SaleRecord } from '../types';
import { formatNPR, formatDisplayDate } from '../utils/formatters';

interface ReceiptModalProps {
  sale: SaleRecord | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, isOpen, onClose }) => {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs print:p-0 print:bg-white animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Top Action Bar (hidden on print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              Official Tax Invoice / Receipt
            </span>
            <span className="text-xs text-slate-500 font-mono">{sale.sn}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Receipt
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div id="printable-receipt" className="p-8 overflow-y-auto space-y-6 print:p-0 print:space-y-4">
          
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-lg">
                  ST
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    SALESTRACKER ENTERPRISES
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kathmandu, Nepal • PAN/VAT: 601239845
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Phone: +977-1-4412345 • support@salestracker.np
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                INVOICE NUMBER
              </span>
              <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">
                {sale.sn}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Date: <strong className="text-slate-700 dark:text-slate-300">{formatDisplayDate(sale.date)}</strong>
              </p>
            </div>
          </div>

          {/* Customer & Payment Badge */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Billed To Customer
              </span>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white mt-0.5">
                {sale.customerName}
              </h3>
              {sale.customerPhone && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-mono">
                  Phone: {sale.customerPhone}
                </p>
              )}
            </div>

            <div className="text-right flex flex-col items-end justify-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Payment Status
              </span>
              {sale.paymentStatus === 'PAID' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> FULLY PAID
                </span>
              )}
              {sale.paymentStatus === 'PARTIAL' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                  <Clock className="w-3.5 h-3.5" /> PARTIALLY PAID
                </span>
              )}
              {sale.paymentStatus === 'UNPAID' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                  <AlertCircle className="w-3.5 h-3.5" /> UNPAID / DUE
                </span>
              )}
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Unit Price (NPR)</th>
                  <th className="py-3 px-4 text-right">Total (NPR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((it, idx) => (
                    <tr key={it.id || idx}>
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                        <span className="text-xs text-slate-400 mr-2 font-mono">#{idx + 1}</span>
                        {it.itemName}
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-mono">
                        {it.quantity}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300 font-mono">
                        {formatNPR(it.unitPrice)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                        {formatNPR(it.totalAmount || (it.quantity * it.unitPrice))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white">
                      {sale.itemName}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-700 dark:text-slate-300 font-mono">
                      {sale.quantity}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 dark:text-slate-300 font-mono">
                      {formatNPR(sale.unitPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white font-mono">
                      {formatNPR(sale.totalAmount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals Calculation */}
          <div className="flex justify-end pt-2">
            <div className="w-72 space-y-2 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">{formatNPR(sale.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Amount Paid:</span>
                <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                  {formatNPR(sale.paidAmount)}
                </span>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between font-bold text-base text-slate-900 dark:text-white">
                <span>Outstanding Balance:</span>
                <span className={`font-mono ${sale.unpaidAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                  {formatNPR(sale.unpaidAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Remarks */}
          {sale.remarks && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Remarks / Notes:</span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5">{sale.remarks}</p>
            </div>
          )}

          {/* Footer & Signature Line */}
          <div className="pt-8 border-t border-dashed border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700 dark:text-slate-300">Terms & Conditions:</p>
              <p className="mt-1">
                Goods once sold can be returned within 7 days in original condition. Thank you for doing business with us!
              </p>
              <p className="mt-2 text-[10px] text-slate-400 font-medium">
                SalesTracker Pro • System Designed & Made by <strong>Pankaj Yadav</strong>
              </p>
            </div>
            <div className="text-right flex flex-col justify-end items-end">
              <div className="w-40 border-b border-slate-300 dark:border-slate-700 mb-1"></div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Authorized Signature</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
