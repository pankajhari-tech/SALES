import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Save,
  RotateCcw,
  Search,
  CheckCircle,
  FileEdit,
  Eraser,
  Sparkles,
  DollarSign,
  Calendar,
  User,
  Phone,
  Package,
  Layers,
  FileText,
  AlertCircle,
  ShieldAlert,
  Plus,
  Trash2,
} from 'lucide-react';
import { SaleRecord, CustomerSummary, PaymentStatus, GoogleSheetsConfig, SaleLineItem } from '../types';
import { CustomerSearchModal } from './CustomerSearchModal';
import {
  formatNPR,
  calculatePaymentStatus,
  calculateUnpaidAmount,
  getTodayDateString,
  generateNextSN,
} from '../utils/formatters';

export interface FormLineItem {
  id: string;
  itemName: string;
  quantity: number | '';
  unitPrice: number | '';
}

interface SalesEntryFormProps {
  records: SaleRecord[];
  customers: CustomerSummary[];
  editingRecord: SaleRecord | null;
  sheetConfig: GoogleSheetsConfig;
  prefillCustomer?: { name: string; phone?: string } | null;
  onSaveSale: (record: Omit<SaleRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  onUpdateSale: (record: SaleRecord) => Promise<boolean>;
  onCancelEdit: () => void;
  onOpenCustomerSearch?: () => void;
}

const COMMON_ITEMS = [
  { name: 'Dell UltraSharp 27" 4K Monitor', price: 48000 },
  { name: 'Logitech MX Master 3S Mouse', price: 14500 },
  { name: 'Keychron Q1 Pro Mechanical Keyboard', price: 22000 },
  { name: 'Apple MacBook Pro M3 16/512GB', price: 245000 },
  { name: 'Samsung 990 Pro 2TB NVMe SSD', price: 27500 },
  { name: 'Anker 7-in-1 USB-C Hub Adapter', price: 6500 },
  { name: 'Sony WH-1000XM5 Headphones', price: 46000 },
  { name: 'HP LaserJet Pro M404dn Printer', price: 38500 },
];

export const SalesEntryForm: React.FC<SalesEntryFormProps> = ({
  records,
  customers,
  editingRecord,
  sheetConfig,
  prefillCustomer,
  onSaveSale,
  onUpdateSale,
  onCancelEdit,
  onOpenCustomerSearch,
}) => {
  // Form State
  const [sn, setSn] = useState<string>('');
  const [snNumber, setSnNumber] = useState<number>(1001);
  const [date, setDate] = useState<string>(getTodayDateString());
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  
  // MULTI-ITEM STATE
  const [items, setItems] = useState<FormLineItem[]>([
    { id: 'item-1', itemName: '', quantity: 1, unitPrice: '' },
  ]);

  const [paidAmount, setPaidAmount] = useState<number | ''>(0);
  const [remarks, setRemarks] = useState<string>('');
  const [allowOverpayment, setAllowOverpayment] = useState<boolean>(false);

  // UI state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);

  // Handle prefill customer from outside (e.g. from CustomerView)
  useEffect(() => {
    if (prefillCustomer) {
      setCustomerName(prefillCustomer.name);
      if (prefillCustomer.phone) {
        setCustomerPhone(prefillCustomer.phone);
      }
    }
  }, [prefillCustomer]);

  // Initialize or update auto SN & items when editing
  useEffect(() => {
    if (editingRecord) {
      setSn(editingRecord.sn);
      setSnNumber(editingRecord.snNumber || 1001);
      setDate(editingRecord.date);
      setCustomerName(editingRecord.customerName);
      setCustomerPhone(editingRecord.customerPhone || '');
      
      if (editingRecord.items && editingRecord.items.length > 0) {
        setItems(
          editingRecord.items.map((it, idx) => ({
            id: it.id || `item-${idx}`,
            itemName: it.itemName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
          }))
        );
      } else {
        setItems([
          {
            id: 'item-1',
            itemName: editingRecord.itemName,
            quantity: editingRecord.quantity,
            unitPrice: editingRecord.unitPrice,
          },
        ]);
      }

      setPaidAmount(editingRecord.paidAmount);
      setRemarks(editingRecord.remarks || '');
      setAllowOverpayment(editingRecord.paidAmount > editingRecord.totalAmount);
      setErrors({});
    } else {
      const next = generateNextSN(records);
      setSn(next.sn);
      setSnNumber(next.snNumber);
    }
  }, [editingRecord, records]);

  // Multi-item management handlers
  const handleAddItem = (preset?: { name: string; price: number }) => {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        itemName: preset ? preset.name : '',
        quantity: 1,
        unitPrice: preset ? preset.price : '',
      },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleItemChange = (
    id: string,
    field: 'itemName' | 'quantity' | 'unitPrice',
    value: any
  ) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
    // Clear error for that item field
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`item_${id}_${field}`];
      return next;
    });
  };

  // Quick item preset catalog click
  const handleSelectItem = (item: { name: string; price: number }) => {
    // If the last item is completely blank, fill it. Otherwise, add as new item!
    const lastItem = items[items.length - 1];
    if (lastItem && !lastItem.itemName.trim() && lastItem.unitPrice === '') {
      handleItemChange(lastItem.id, 'itemName', item.name);
      handleItemChange(lastItem.id, 'unitPrice', item.price);
    } else {
      handleAddItem(item);
    }
  };

  // Reactive Total Calculations Across All Items
  const totalQty = useMemo(() => {
    return items.reduce(
      (sum, it) => sum + (typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 0),
      0
    );
  }, [items]);

  const totalAmount = useMemo(() => {
    const sum = items.reduce((acc, it) => {
      const q = typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 0;
      const p = typeof it.unitPrice === 'number' && it.unitPrice >= 0 ? it.unitPrice : 0;
      return acc + q * p;
    }, 0);
    return Number(sum.toFixed(2));
  }, [items]);

  const numericPaid = typeof paidAmount === 'number' && paidAmount >= 0 ? paidAmount : 0;
  const unpaidAmount = useMemo(() => {
    return calculateUnpaidAmount(totalAmount, numericPaid);
  }, [totalAmount, numericPaid]);

  const paymentStatus: PaymentStatus = useMemo(() => {
    return calculatePaymentStatus(totalAmount, numericPaid);
  }, [totalAmount, numericPaid]);

  // Validation
  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!sn.trim()) errs.sn = 'Serial Number is required.';
    if (!date) errs.date = 'Date is required.';
    if (!customerName.trim()) errs.customerName = 'Customer Name is required.';

    if (items.length === 0) {
      errs.items = 'At least one item must be added.';
    } else {
      items.forEach((it, idx) => {
        if (!it.itemName.trim()) {
          errs[`item_${it.id}_name`] = `Item #${idx + 1} name is required.`;
        }
        if (typeof it.quantity !== 'number' || it.quantity <= 0) {
          errs[`item_${it.id}_qty`] = `Item #${idx + 1} quantity must be at least 1.`;
        }
        if (typeof it.unitPrice !== 'number' || it.unitPrice < 0) {
          errs[`item_${it.id}_price`] = `Item #${idx + 1} price cannot be negative.`;
        }
      });
    }

    if (typeof paidAmount !== 'number' || paidAmount < 0) {
      errs.paidAmount = 'Paid Amount cannot be negative.';
    } else if (paidAmount > totalAmount && !allowOverpayment) {
      errs.paidAmount = `Paid amount (${formatNPR(paidAmount)}) cannot exceed Total (${formatNPR(totalAmount)}) without authorization.`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Handle Form Submission
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessBanner(null);

    // Build line items
    const saleItems: SaleLineItem[] = items.map((it) => {
      const q = typeof it.quantity === 'number' && it.quantity > 0 ? it.quantity : 1;
      const p = typeof it.unitPrice === 'number' && it.unitPrice >= 0 ? it.unitPrice : 0;
      return {
        id: it.id,
        itemName: it.itemName.trim(),
        quantity: q,
        unitPrice: p,
        totalAmount: Number((q * p).toFixed(2)),
      };
    });

    const summaryItemName =
      saleItems.length === 1
        ? saleItems[0].itemName
        : saleItems.map((it) => `${it.itemName} (${it.quantity})`).join(', ');

    const averageUnitPrice =
      totalQty > 0
        ? Number((totalAmount / totalQty).toFixed(2))
        : (saleItems[0]?.unitPrice || 0);

    try {
      if (editingRecord) {
        const updated: SaleRecord = {
          ...editingRecord,
          sn,
          snNumber,
          date,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          items: saleItems,
          itemName: summaryItemName,
          quantity: totalQty,
          unitPrice: averageUnitPrice,
          totalAmount,
          paidAmount: numericPaid,
          unpaidAmount,
          paymentStatus,
          remarks: remarks.trim(),
          updatedAt: new Date().toISOString(),
        };

        const success = await onUpdateSale(updated);
        if (success) {
          setSuccessBanner(`Record #${sn} updated successfully!`);
          confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
          setTimeout(() => setSuccessBanner(null), 5000);
        }
      } else {
        const payload: Omit<SaleRecord, 'id' | 'createdAt' | 'updatedAt'> = {
          sn,
          snNumber,
          date,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          items: saleItems,
          itemName: summaryItemName,
          quantity: totalQty,
          unitPrice: averageUnitPrice,
          totalAmount,
          paidAmount: numericPaid,
          unpaidAmount,
          paymentStatus,
          remarks: remarks.trim(),
        };

        const success = await onSaveSale(payload);
        if (success) {
          setSuccessBanner(
            `Sale #${sn} with ${saleItems.length} item(s) saved successfully! Synced to ${
              sheetConfig.isConnected ? 'Google Sheets' : 'local database'
            }.`
          );
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
          handleClearForm();
          setTimeout(() => setSuccessBanner(null), 6000);
        }
      }
    } catch (err: any) {
      console.error('Submission error:', err);
      setErrors({ form: err.message || 'Failed to save sales record.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear Form (keeps auto-generated SN and today's date)
  const handleClearForm = () => {
    const next = generateNextSN(records);
    setSn(next.sn);
    setSnNumber(next.snNumber);
    setDate(getTodayDateString());
    setCustomerName('');
    setCustomerPhone('');
    setItems([{ id: 'item-1', itemName: '', quantity: 1, unitPrice: '' }]);
    setPaidAmount(0);
    setRemarks('');
    setAllowOverpayment(false);
    setErrors({});
    if (editingRecord) {
      onCancelEdit();
    }
  };

  // Reset Form (full reset to initial default state)
  const handleResetForm = () => {
    handleClearForm();
  };

  // Quick customer selection autofill
  const handleSelectCustomer = (cName: string) => {
    const cust = customers.find((c) => c.name.toLowerCase() === cName.toLowerCase());
    setCustomerName(cName);
    if (cust && cust.phone) {
      setCustomerPhone(cust.phone);
    }
  };

  // Quick payment calculations
  const setFullPayment = () => {
    setPaidAmount(totalAmount);
    setErrors((prev) => ({ ...prev, paidAmount: '' }));
  };

  const setZeroPayment = () => {
    setPaidAmount(0);
    setErrors((prev) => ({ ...prev, paidAmount: '' }));
  };

  const setHalfPayment = () => {
    setPaidAmount(Number((totalAmount / 2).toFixed(2)));
    setErrors((prev) => ({ ...prev, paidAmount: '' }));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all">
      
      {/* Header Banner */}
      <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl ${editingRecord ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-indigo-600 text-white shadow-indigo-500/20 shadow-md'}`}>
            {editingRecord ? <FileEdit className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingRecord ? `Edit Sales Record (${editingRecord.sn})` : 'New Sales Entry Form'}
              </h2>
              {editingRecord && (
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                  Editing Mode
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Record sales, compute paid/unpaid balances in NPR, and sync directly to Google Sheets
            </p>
          </div>
        </div>

        {/* Sync Status Badge */}
        <div className="flex items-center gap-2 text-xs">
          {sheetConfig.isConnected ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Google Sheets Connected: <strong className="font-semibold">{sheetConfig.spreadsheetName}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
              <span>Local Storage Active (Connect Google Sheets for Cloud Sync)</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successBanner && (
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-200 text-sm animate-in fade-in duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{successBanner}</span>
        </div>
      )}

      {/* General Error Alert */}
      {errors.form && (
        <div className="mx-6 mt-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-800 dark:text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span className="font-medium">{errors.form}</span>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
        
        {/* ROW 1: SN, Date, Customer Search Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 items-end">
          
          {/* 1. SN (Serial Number) */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Serial Number (SN) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-xs font-bold">
                #
              </span>
              <input
                type="text"
                value={sn}
                onChange={(e) => setSn(e.target.value)}
                placeholder="SN-1001"
                className={`w-full pl-8 pr-4 py-3 rounded-2xl border ${
                  errors.sn ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                } bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition`}
              />
            </div>
            {errors.sn && <p className="mt-1.5 text-xs text-rose-500">{errors.sn}</p>}
          </div>

          {/* 2. Date */}
          <div className="lg:col-span-4">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Sale Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border ${
                  errors.date ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                } bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition`}
              />
            </div>
            {errors.date && <p className="mt-1.5 text-xs text-rose-500">{errors.date}</p>}
          </div>

          {/* Quick Customer Search Trigger Button */}
          <div className="lg:col-span-5 flex justify-end">
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition border border-indigo-200 dark:border-indigo-800/60 shadow-2xs"
            >
              <Search className="w-4 h-4" />
              Search Existing Customer Directory
            </button>
          </div>
        </div>

        {/* ROW 2: Customer Name & Customer Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* 3. Customer Name */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              {customers.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  {customers.length} registered customers
                </span>
              )}
            </div>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                list="customer-suggestions"
                value={customerName}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                placeholder="e.g. Aayush Shrestha"
                className={`w-full pl-10 pr-4 py-3 rounded-2xl border ${
                  errors.customerName ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                } bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition`}
              />
              <datalist id="customer-suggestions">
                {customers.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.phone ? `Phone: ${c.phone}` : ''}
                  </option>
                ))}
              </datalist>
            </div>
            {errors.customerName && <p className="mt-1.5 text-xs text-rose-500">{errors.customerName}</p>}
          </div>

          {/* 4. Customer Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Customer Phone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9841234567 or 01-4412345"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition font-mono"
              />
            </div>
          </div>
        </div>

        {/* ROW 3: MULTI-ITEM SECTION WITH + ADD ITEM BUTTON */}
        <div className="space-y-4 pt-2">
          
          {/* Header & The Requested + Add Item Button */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Sales Items & Products <span className="text-rose-500">*</span>
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Add multiple items to this single sale with custom quantities and unit prices
              </p>
            </div>

            {/* THE REQUESTED + BUTTON */}
            <button
              type="button"
              onClick={() => handleAddItem()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Item</span>
            </button>
          </div>

          {/* Quick Catalog Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-slate-400 font-semibold mr-1">Quick Add:</span>
            {COMMON_ITEMS.slice(0, 5).map((it) => (
              <button
                type="button"
                key={it.name}
                onClick={() => handleSelectItem(it)}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] transition text-left flex items-center gap-1 group"
              >
                <Plus className="w-3 h-3 text-indigo-500 group-hover:scale-110 transition-transform" />
                <span>{it.name.split(' ')[0]} {it.name.split(' ')[1]}</span>
                <span className="text-slate-400 font-mono">({formatNPR(it.price, false)})</span>
              </button>
            ))}
          </div>

          {/* Line Items List */}
          <div className="space-y-3 pt-2">
            {items.map((item, index) => {
              const itemQty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 0;
              const itemPrice = typeof item.unitPrice === 'number' && item.unitPrice >= 0 ? item.unitPrice : 0;
              const lineTotal = Number((itemQty * itemPrice).toFixed(2));

              const nameErr = errors[`item_${item.id}_name`];
              const qtyErr = errors[`item_${item.id}_qty`];
              const priceErr = errors[`item_${item.id}_price`];

              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition shadow-xs"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    
                    {/* Item Number Badge & Name */}
                    <div className="md:col-span-5">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <span>Product / Item Name</span>
                        </label>
                      </div>
                      <div className="relative">
                        <Package className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(item.id, 'itemName', e.target.value)}
                          placeholder="e.g. Dell UltraSharp 27-inch Monitor"
                          className={`w-full pl-9 pr-3 py-2.5 rounded-xl border ${
                            nameErr ? 'border-rose-500 ring-rose-500/20' : 'border-slate-200 dark:border-slate-700'
                          } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition`}
                        />
                      </div>
                      {nameErr && <p className="mt-1 text-[11px] text-rose-500">{nameErr}</p>}
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        QTY
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1);
                            handleItemChange(item.id, 'quantity', val);
                          }}
                          className={`w-full px-3 py-2.5 rounded-xl border ${
                            qtyErr ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                          } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold font-mono text-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition`}
                        />
                      </div>
                      {qtyErr && <p className="mt-1 text-[11px] text-rose-500">{qtyErr}</p>}
                    </div>

                    {/* Unit Price */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Unit Price (NPR)
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                          रू
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                            handleItemChange(item.id, 'unitPrice', val);
                          }}
                          placeholder="0.00"
                          className={`w-full pl-7 pr-3 py-2.5 rounded-xl border ${
                            priceErr ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                          } bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold font-mono text-right focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition`}
                        />
                      </div>
                      {priceErr && <p className="mt-1 text-[11px] text-rose-500">{priceErr}</p>}
                    </div>

                    {/* Subtotal */}
                    <div className="md:col-span-2 text-right">
                      <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Subtotal
                      </span>
                      <div className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {formatNPR(lineTotal)}
                      </div>
                    </div>

                    {/* Remove Action Button */}
                    <div className="md:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length <= 1}
                        className={`p-2 rounded-xl transition ${
                          items.length <= 1
                            ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                            : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-400'
                        }`}
                        title={items.length <= 1 ? 'Sale must have at least one item' : 'Remove this item'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

          {/* Secondary Full-Width "+ Add Another Item" Button */}
          <button
            type="button"
            onClick={() => handleAddItem()}
            className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-bold transition flex items-center justify-center gap-2 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30"
          >
            <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>+ Add Another Item (Quantity & Unit Price)</span>
          </button>
        </div>

        {/* ROW 4: Financial Summary Box (Total, Paid, Unpaid, Status) */}
        <div className="p-6 rounded-3xl bg-slate-900 text-white dark:bg-slate-800/90 border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-indigo-400" />
              <h3 className="font-bold text-sm tracking-wide uppercase text-slate-200">
                Payment Breakdown & Status Calculation
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Currency:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-900/80 text-indigo-300 border border-indigo-700">
                NPR (Nepali Rupee)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-center">
            
            {/* 8. Total Amount (Auto-calculated) */}
            <div className="p-4 rounded-2xl bg-slate-800/80 dark:bg-slate-900/80 border border-slate-700/60">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Amount (QTY × Price)
              </span>
              <div className="mt-1 text-2xl font-black text-white font-mono tracking-tight">
                {formatNPR(totalAmount)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block font-mono">
                {items.length} {items.length === 1 ? 'item' : 'items'} ({totalQty} total pcs)
              </span>
            </div>

            {/* 9. Paid Amount */}
            <div className="p-4 rounded-2xl bg-slate-800/80 dark:bg-slate-900/80 border border-slate-700/60">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Paid Amount (NPR)
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={setFullPayment}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-800 font-bold border border-emerald-800 transition"
                    title="100% Paid"
                  >
                    Full
                  </button>
                  <button
                    type="button"
                    onClick={setHalfPayment}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-amber-950 text-amber-300 hover:bg-amber-800 font-bold border border-amber-800 transition"
                    title="50% Advance"
                  >
                    50%
                  </button>
                  <button
                    type="button"
                    onClick={setZeroPayment}
                    className="px-1.5 py-0.5 text-[10px] rounded bg-rose-950 text-rose-300 hover:bg-rose-800 font-bold border border-rose-800 transition"
                    title="0 Paid (Due)"
                  >
                    Nil
                  </button>
                </div>
              </div>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400 font-bold text-xs">
                  रू
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={paidAmount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0);
                    setPaidAmount(val);
                  }}
                  className={`w-full pl-8 pr-3 py-2 rounded-xl bg-slate-900 text-emerald-300 font-bold font-mono text-lg border ${
                    errors.paidAmount ? 'border-rose-500' : 'border-slate-700'
                  } focus:outline-hidden focus:ring-2 focus:ring-emerald-400`}
                />
              </div>
              {errors.paidAmount && <p className="mt-1 text-[11px] text-rose-400">{errors.paidAmount}</p>}
            </div>

            {/* 10. Unpaid Amount (Auto-calculated) */}
            <div className="p-4 rounded-2xl bg-slate-800/80 dark:bg-slate-900/80 border border-slate-700/60">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider block">
                Unpaid / Due (Total − Paid)
              </span>
              <div className={`mt-1 text-2xl font-black font-mono tracking-tight ${unpaidAmount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                {formatNPR(unpaidAmount)}
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                {unpaidAmount > 0 ? 'Pending collection from customer' : 'Settled with zero balance'}
              </span>
            </div>

            {/* 11. Payment Status (Auto-generated Badge) */}
            <div className="p-4 rounded-2xl bg-slate-800/80 dark:bg-slate-900/80 border border-slate-700/60 text-center flex flex-col justify-center items-center">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Auto Payment Status
              </span>
              {paymentStatus === 'PAID' && (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-inner">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  PAID
                </div>
              )}
              {paymentStatus === 'PARTIAL' && (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-inner">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  PARTIAL
                </div>
              )}
              {paymentStatus === 'UNPAID' && (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-black text-sm bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-inner">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  UNPAID
                </div>
              )}
              <span className="text-[10px] text-slate-400 mt-1">
                {paymentStatus === 'PAID' ? 'Fully settled' : paymentStatus === 'PARTIAL' ? 'Part payment received' : 'Zero payment received'}
              </span>
            </div>

          </div>

          {/* Overpayment Authorization Switch */}
          {numericPaid > totalAmount && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Paid amount exceeds total. Treat excess as advance credit?</span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer font-semibold">
                <input
                  type="checkbox"
                  checked={allowOverpayment}
                  onChange={(e) => {
                    setAllowOverpayment(e.target.checked);
                    if (e.target.checked) {
                      setErrors((prev) => ({ ...prev, paidAmount: '' }));
                    }
                  }}
                  className="rounded text-amber-500 focus:ring-amber-400"
                />
                Authorize Advance
              </label>
            </div>
          )}
        </div>

        {/* ROW 5: 12. Remarks (Optional Text) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Remarks / Delivery Notes (Optional)
          </label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Paid via eSewa / FonePay, delivered via Courier, promised balance date..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
        </div>

        {/* BUTTONS BAR */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          
          {/* Secondary Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleClearForm}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs"
            >
              <Eraser className="w-4 h-4" />
              Clear Form
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Form
            </button>
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition shadow-2xs"
            >
              <Search className="w-4 h-4" />
              Search Customer
            </button>
          </div>

          {/* Primary Submit Action */}
          <div className="flex items-center gap-3">
            {editingRecord && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel Edit
              </button>
            )}

            {editingRecord ? (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <FileEdit className="w-4 h-4" />
                {isSubmitting ? 'Updating in Google Sheets...' : 'Update Record'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSubmitting ? 'Saving to Google Sheets...' : 'Save Sale'}
              </button>
            )}
          </div>

        </div>

      </form>

      {/* Customer Quick Search & Selection Modal */}
      <CustomerSearchModal
        isOpen={isSearchModalOpen}
        customers={customers}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectCustomer={(c) => {
          setCustomerName(c.name);
          if (c.phone) {
            setCustomerPhone(c.phone);
          }
        }}
      />
    </div>
  );
};
