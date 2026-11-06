import React, { useMemo, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  AlertCircle,
  ShoppingBag,
  Users,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Calendar,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import { SaleRecord, CustomerSummary, DateFilterPreset } from '../types';
import { formatNPR, getDateFilterBounds, formatDisplayDate } from '../utils/formatters';

interface DashboardViewProps {
  records: SaleRecord[];
  customers: CustomerSummary[];
  onSelectDatePreset?: (preset: DateFilterPreset) => void;
  onNavigateToRecords: (statusFilter?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  customers,
  onNavigateToRecords,
}) => {
  // Date filter state
  const [preset, setPreset] = useState<DateFilterPreset>('all');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  // Filter records based on selected date filter
  const filteredRecords = useMemo(() => {
    if (preset === 'all') return records;

    let start = '';
    let end = '';

    if (preset === 'custom') {
      start = customStart;
      end = customEnd;
    } else {
      const bounds = getDateFilterBounds(preset);
      start = bounds.start;
      end = bounds.end;
    }

    return records.filter((r) => {
      if (start && r.date < start) return false;
      if (end && r.date > end) return false;
      return true;
    });
  }, [records, preset, customStart, customEnd]);

  // Key KPI metrics calculations
  const totalSales = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.totalAmount, 0);
  }, [filteredRecords]);

  const totalCollected = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.paidAmount, 0);
  }, [filteredRecords]);

  const totalOutstanding = useMemo(() => {
    return filteredRecords.reduce((sum, r) => sum + r.unpaidAmount, 0);
  }, [filteredRecords]);

  const totalOrders = filteredRecords.length;

  const fullyPaidOrders = useMemo(() => {
    return filteredRecords.filter((r) => r.paymentStatus === 'PAID').length;
  }, [filteredRecords]);

  const partiallyPaidOrders = useMemo(() => {
    return filteredRecords.filter((r) => r.paymentStatus === 'PARTIAL').length;
  }, [filteredRecords]);

  const unpaidOrders = useMemo(() => {
    return filteredRecords.filter((r) => r.paymentStatus === 'UNPAID').length;
  }, [filteredRecords]);

  // Unique customers in filtered records
  const activeCustomersCount = useMemo(() => {
    const names = new Set(filteredRecords.map((r) => r.customerName.trim().toLowerCase()));
    return names.size;
  }, [filteredRecords]);

  const collectionRate = totalSales > 0 ? Math.round((totalCollected / totalSales) * 100) : 0;

  // Chart 1: Daily Sales Trend (group by date)
  const dailySalesData = useMemo(() => {
    const map = new Map<string, { date: string; sales: number; collected: number; count: number }>();
    
    // Sort chronological
    const sorted = [...filteredRecords].sort((a, b) => a.date.localeCompare(b.date));

    // If all time or long range, take the last 14 distinct active dates
    sorted.forEach((r) => {
      const existing = map.get(r.date) || { date: r.date, sales: 0, collected: 0, count: 0 };
      existing.sales += r.totalAmount;
      existing.collected += r.paidAmount;
      existing.count += 1;
      map.set(r.date, existing);
    });

    const list = Array.from(map.values());
    return list.slice(-14);
  }, [filteredRecords]);

  const maxDailySales = useMemo(() => {
    const max = Math.max(...dailySalesData.map((d) => d.sales), 1000);
    return max;
  }, [dailySalesData]);

  // Chart 2: Monthly Sales
  const monthlySalesData = useMemo(() => {
    const map = new Map<string, { month: string; sales: number; collected: number }>();

    filteredRecords.forEach((r) => {
      const m = r.date.substring(0, 7); // YYYY-MM
      const existing = map.get(m) || { month: m, sales: 0, collected: 0 };
      existing.sales += r.totalAmount;
      existing.collected += r.paidAmount;
      map.set(m, existing);
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredRecords]);

  const maxMonthlySales = useMemo(() => {
    return Math.max(...monthlySalesData.map((d) => d.sales), 1000);
  }, [monthlySalesData]);

  // Chart 3: Top-Selling Items
  const topSellingItems = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number }>();
    filteredRecords.forEach((r) => {
      if (r.items && r.items.length > 0) {
        r.items.forEach((it) => {
          const key = it.itemName.trim();
          const existing = map.get(key) || { name: key, quantity: 0, revenue: 0 };
          existing.quantity += it.quantity;
          existing.revenue += (it.quantity * it.unitPrice);
          map.set(key, existing);
        });
      } else {
        const key = r.itemName.trim();
        const existing = map.get(key) || { name: key, quantity: 0, revenue: 0 };
        existing.quantity += r.quantity;
        existing.revenue += r.totalAmount;
        map.set(key, existing);
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredRecords]);

  const maxItemRevenue = useMemo(() => {
    return Math.max(...topSellingItems.map((i) => i.revenue), 1000);
  }, [topSellingItems]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Analytics Time Horizon:
          </span>
        </div>

        {/* Preset Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Range' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setPreset(item.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                preset === item.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Custom Range Inputs */}
        {preset === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto pt-2 md:pt-0">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>
        )}
      </div>

      {/* 8 Main KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* 1. Total Sales */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Sales
            </span>
            <div className="p-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white tracking-tight">
              {formatNPR(totalSales)}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gross revenue for period</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500/80"></div>
        </div>

        {/* 2. Total Amount Collected */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Collected
            </span>
            <div className="p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl lg:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatNPR(totalCollected)}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{collectionRate}% collection efficiency</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
        </div>

        {/* 3. Total Outstanding / Unpaid */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-400/50 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Outstanding
            </span>
            <div className="p-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-2xl lg:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 tracking-tight">
              {formatNPR(totalOutstanding)}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
              <span>{100 - collectionRate}% pending balance due</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
        </div>

        {/* 4. Total Orders & Customers */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Orders & Customers
            </span>
            <div className="p-2 rounded-2xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-4">
            <div>
              <span className="text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white">
                {totalOrders}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">Orders</span>
            </div>
            <div className="border-l border-slate-200 dark:border-slate-800 pl-4">
              <span className="text-2xl lg:text-3xl font-black font-mono text-slate-900 dark:text-white">
                {activeCustomersCount}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">Customers</span>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500"></div>
        </div>

      </div>

      {/* Row of Payment Status Distribution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Fully Paid Orders */}
        <div
          onClick={() => onNavigateToRecords('PAID')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-400 transition group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Fully Paid Orders
              </span>
              <h4 className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                {fullyPaidOrders}
              </h4>
            </div>
          </div>
          <div className="text-right flex items-center gap-1 text-xs text-slate-400 group-hover:text-emerald-600 transition">
            <span>{totalOrders > 0 ? Math.round((fullyPaidOrders / totalOrders) * 100) : 0}%</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Partially Paid Orders */}
        <div
          onClick={() => onNavigateToRecords('PARTIAL')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-400 transition group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-400">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Partially Paid Orders
              </span>
              <h4 className="text-2xl font-black font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                {partiallyPaidOrders}
              </h4>
            </div>
          </div>
          <div className="text-right flex items-center gap-1 text-xs text-slate-400 group-hover:text-amber-600 transition">
            <span>{totalOrders > 0 ? Math.round((partiallyPaidOrders / totalOrders) * 100) : 0}%</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        {/* Unpaid Orders */}
        <div
          onClick={() => onNavigateToRecords('UNPAID')}
          className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-rose-400 transition group"
        >
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Unpaid Orders (Due)
              </span>
              <h4 className="text-2xl font-black font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                {unpaidOrders}
              </h4>
            </div>
          </div>
          <div className="text-right flex items-center gap-1 text-xs text-slate-400 group-hover:text-rose-600 transition">
            <span>{totalOrders > 0 ? Math.round((unpaidOrders / totalOrders) * 100) : 0}%</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Chart 1: Daily Sales Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Daily Sales Trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Recent sales revenue vs amount collected (NPR)
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-xs bg-indigo-600"></span> Total Sale
                </span>
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-300">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500"></span> Collected
                </span>
              </div>
            </div>

            {/* Daily Chart Bars */}
            <div className="mt-8">
              {dailySalesData.length === 0 ? (
                <div className="py-20 text-center text-sm text-slate-400">
                  No sales recorded in this date range.
                </div>
              ) : (
                <div className="h-56 flex items-end gap-2 sm:gap-3 pt-6 pb-2">
                  {dailySalesData.map((d) => {
                    const heightPercent = Math.max(8, Math.round((d.sales / maxDailySales) * 100));
                    const collectedPercent = d.sales > 0 ? Math.round((d.collected / d.sales) * 100) : 0;
                    return (
                      <div
                        key={d.date}
                        className="flex-1 flex flex-col items-center h-full justify-end group relative"
                      >
                        {/* Hover Tooltip */}
                        <div className="absolute -top-14 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                          <div className="bg-slate-900 text-white text-[11px] py-1 px-2.5 rounded-lg shadow-xl font-mono whitespace-nowrap">
                            <span className="font-bold">{formatNPR(d.sales)}</span>
                            <span className="text-emerald-400 block text-[10px]">Collected: {formatNPR(d.collected)}</span>
                          </div>
                          <div className="w-2 h-2 bg-slate-900 rotate-45 -mt-1"></div>
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[42px] bg-indigo-100 dark:bg-indigo-950/60 rounded-t-lg relative overflow-hidden flex flex-col justify-end transition-all group-hover:bg-indigo-200"
                        >
                          {/* Collected Fill Bar */}
                          <div
                            style={{ height: `${collectedPercent}%` }}
                            className="w-full bg-emerald-500 rounded-t-xs transition-all"
                          ></div>
                        </div>

                        {/* Date Label */}
                        <span className="text-[10px] text-slate-400 mt-2 truncate max-w-full font-mono">
                          {d.date.substring(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-500">
            <span>Data grouped by transaction date</span>
            <span className="font-mono font-medium">Peak Day: {formatNPR(maxDailySales)}</span>
          </div>
        </div>

        {/* Chart 2: Paid vs Unpaid Breakdown & Monthly (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Paid vs Unpaid Distribution Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Financial Settlement Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Cash collected vs pending credit
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Collected ({collectionRate}%)
                  </span>
                  <span className="font-mono">{formatNPR(totalCollected)}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${collectionRate}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Unpaid / Credit ({100 - collectionRate}%)
                  </span>
                  <span className="font-mono">{formatNPR(totalOutstanding)}</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${100 - collectionRate}%` }}
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Net Business Volume:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-sm">
                {formatNPR(totalSales)}
              </span>
            </div>
          </div>

          {/* Monthly Sales Summary Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Monthly Revenue Aggregates
            </h3>
            <div className="mt-4 space-y-3">
              {monthlySalesData.length === 0 ? (
                <p className="text-xs text-slate-400">No monthly data available.</p>
              ) : (
                monthlySalesData.map((m) => (
                  <div key={m.month} className="flex items-center justify-between text-xs py-1">
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {m.month}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="w-28 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.round((m.sales / maxMonthlySales) * 100)}%` }}
                          className="bg-indigo-600 h-full rounded-full"
                        ></div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-white w-24 text-right">
                        {formatNPR(m.sales)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Chart 4: Top-Selling Items */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Top-Selling Products & Items
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Ranked by total sales revenue generated in NPR
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            Top {topSellingItems.length} Products
          </span>
        </div>

        <div className="mt-6 space-y-5">
          {topSellingItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No product sales found.</p>
          ) : (
            topSellingItems.map((item, idx) => {
              const percent = Math.round((item.revenue / maxItemRevenue) * 100);
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {item.name}
                      </span>
                      <span className="text-slate-400 font-mono">
                        ({item.quantity} units sold)
                      </span>
                    </div>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">
                      {formatNPR(item.revenue)}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                    ></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
