import React, { useState } from 'react';
import { Search, X, User, Phone, Check, AlertCircle } from 'lucide-react';
import { CustomerSummary } from '../types';
import { formatNPR } from '../utils/formatters';

interface CustomerSearchModalProps {
  isOpen: boolean;
  customers: CustomerSummary[];
  onClose: () => void;
  onSelectCustomer: (customer: CustomerSummary) => void;
}

export const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  isOpen,
  customers,
  onClose,
  onSelectCustomer,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.phone.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Search Customer Directory
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pick a customer to auto-fill sales entry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type name or phone number..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="p-3 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 flex-1">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching customers found for "{query}".
            </div>
          ) : (
            filtered.map((customer) => (
              <div
                key={customer.name + customer.phone}
                className="py-3 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between group"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {customer.name}
                    </span>
                    {customer.totalUnpaid > 0 && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400">
                        <AlertCircle className="w-3 h-3" /> Due {formatNPR(customer.totalUnpaid)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {customer.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {customer.phone}
                      </span>
                    )}
                    <span>• {customer.totalOrders} order{customer.totalOrders === 1 ? '' : 's'}</span>
                    <span>• Total: {formatNPR(customer.totalSpent)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectCustomer(customer);
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 dark:hover:bg-indigo-600 dark:hover:text-white text-xs font-semibold transition flex items-center gap-1 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5" /> Select
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
