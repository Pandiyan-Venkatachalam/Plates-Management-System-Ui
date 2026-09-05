import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import plateImg from '../assets/plate.png';
import platesMobileImg from '../assets/plates.png';
import {
  ShoppingCart, Package, DollarSign,
  AlertCircle, Leaf, ChevronRight,
  BarChart3, TrendingUp,
  Sparkles, CalendarDays, Layers
} from 'lucide-react';
import { getCurrentMonthRange, getPresetDateRange, formatDateToYMD, isDateInRange, formatDateDDMMYYYY } from '../utils/dateHelper';
import DateInput from '../components/DateInput';

const money = (val) =>
  '₹' + Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Dashboard({ onTabSelect }) {
  const { apiRequest } = useAuth();
  const [stats, setStats] = useState(null);
  const [salesList, setSalesList] = useState([]);
  const [purchaseList, setPurchaseList] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const initialDates = getCurrentMonthRange();
  const [period, setPeriod] = useState('thisMonth');
  const [fromDate, setFromDate] = useState(initialDates.fromDate);
  const [toDate, setToDate] = useState(initialDates.toDate);

  const handlePeriodChange = (presetType) => {
    setPeriod(presetType);
    if (presetType !== 'custom') {
      const range = getPresetDateRange(presetType);
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    }
  };

  useEffect(() => {
    Promise.all([
      apiRequest('/report/get-dashboard-stats'),
      apiRequest('/sales'),
      apiRequest('/purchase'),
      apiRequest('/product'),
    ])
      .then(([statsRes, salesRes, purchaseRes, prodRes]) => {
        setStats(statsRes.data);
        setSalesList(Array.isArray(salesRes.data) ? salesRes.data : []);
        setPurchaseList(Array.isArray(purchaseRes.data) ? purchaseRes.data : []);
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ─── Filtered Metrics ───────────────────────────────────────────────────────
  const filteredSales = salesList.filter(s =>
    s.status !== 'CANCELLED' && isDateInRange(s.saleDate, fromDate, toDate)
  );
  const filteredPurchases = purchaseList.filter(p =>
    p.status !== 'CANCELLED' && isDateInRange(p.purchaseDate, fromDate, toDate)
  );

  const totalSales = filteredSales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  const netProfit = totalSales - totalPurchases;

  // ─── Plate Size Breakdown ───────────────────────────────────────────────────
  // Compute total qty sold per variant / size directly from variantName
  const plateSizeBreakdown = (() => {
    const sizeMap = {};
    filteredSales.forEach(sale => {
      (sale.details || []).forEach(d => {
        const prod = products.find(p => p.productId === d.productId);
        let label = '';
        let badge = '';

        if (prod) {
          const vName = (prod.variantName || '').trim();
          const pName = (prod.productName || '').trim();

          // Directly use Variant Name from database
          label = vName || pName || 'Standard';

          const numMatch = label.match(/\d+/);
          const num = numMatch ? numMatch[0] : '';

          if (num) {
            badge = `${num}"`;
          } else {
            badge = label.length > 5 ? label.slice(0, 4) : label;
          }
        } else {
          label = 'Standard';
          badge = 'Plate';
        }

        const key = label;
        if (!sizeMap[key]) {
          sizeMap[key] = { label, badge, qty: 0, amount: 0 };
        }
        sizeMap[key].qty += Number(d.quantity) || 0;
        sizeMap[key].amount += (Number(d.quantity) || 0) * (Number(d.unitPrice) || 0);
      });
    });

    return Object.values(sizeMap).sort((a, b) => {
      const an = parseInt(a.badge) || 0;
      const bn = parseInt(b.badge) || 0;
      if (an !== bn) return an - bn;
      return a.label.localeCompare(b.label);
    });
  })();


  // ─── Chart Data ─────────────────────────────────────────────────────────────
  const realSales = stats?.monthlySales && stats.monthlySales.length > 0
    ? stats.monthlySales
    : [
      { month: 'Apr', amount: 15000 },
      { month: 'May', amount: 35000 },
      { month: 'Jun', amount: 20000 },
      { month: 'Jul', amount: 78000 },
      { month: 'Aug', amount: stats?.totalSales || 102720 }
    ];
  const maxVal = Math.max(...realSales.map(s => s.amount), 5000);
  const chartPoints = realSales.map((s, idx) => {
    const x = realSales.length > 1 ? (idx / (realSales.length - 1)) * 100 : 50;
    const y = 90 - (s.amount / maxVal) * 75;
    return { x, y, label: s.month, value: s.amount };
  });
  const curveLineD = chartPoints.length > 1 ? 'M ' + chartPoints.map(p => `${p.x} ${p.y}`).join(' L ') : '';
  const curveAreaD = chartPoints.length > 1 ? `${curveLineD} L 100 100 L 0 100 Z` : '';
  const currentTooltipPoint = hoveredPoint !== null ? chartPoints[hoveredPoint] : chartPoints[chartPoints.length - 1];

  const periodLabels = {
    thisMonth: 'This Month', today: 'Today', lastMonth: 'Last Month',
    quarter: 'This Quarter', year: 'This Year', all: 'All Time', custom: 'Custom Range'
  };
  const currentPeriodLabel = periodLabels[period] || 'Selected Period';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
        <p className="text-slate-500 text-sm font-semibold">Loading dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <Sparkles size={20} className="text-brand-accent shrink-0" />
          <span>Dashboard</span>
        </h2>
        <span className="text-[10px] font-bold text-slate-500 bg-[#fff7f9] border border-slate-200/80 px-2.5 py-1 rounded-full shadow-xs shrink-0 whitespace-nowrap">
          Live Analytics
        </span>
      </div>

      {/* ── Date Filter Bar ── */}
      <section className="bg-[#fff7f9] rounded-2xl p-2 sm:p-2.5 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 print:hidden items-stretch lg:items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          {[
            { id: 'thisMonth', label: 'This Month' },
            { id: 'today', label: 'Today' },
            { id: 'lastMonth', label: 'Last Month' },
            { id: 'quarter', label: 'Quarter' },
            { id: 'year', label: 'This Year' },
            { id: 'all', label: 'All Time' }
          ].map(p => (
            <button
              key={p.id}
              onClick={() => handlePeriodChange(p.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                period === p.id
                  ? 'bg-gradient-to-r from-slate-900 to-blue-950 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between sm:justify-start gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-3 h-9 shrink-0">
          <CalendarDays size={13} className="text-slate-400 shrink-0" />
          <DateInput
            value={fromDate}
            onChange={e => { setFromDate(e.target.value); setPeriod('custom'); }}
            className="min-w-[90px] sm:w-[105px]"
          />
          <span className="text-slate-300 text-[10px] shrink-0">-</span>
          <DateInput
            value={toDate}
            onChange={e => { setToDate(e.target.value); setPeriod('custom'); }}
            className="min-w-[90px] sm:w-[105px]"
          />
        </div>
      </section>

      {/* ── Metric Cards + Plate Size Cards — unified grid ── */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4">

        {/* Sales */}
        <div
          onClick={() => onTabSelect && onTabSelect('sales')}
          role="button" tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-emerald-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600">
              <TrendingUp size={13} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Sales</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(totalSales)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5 relative z-10">{filteredSales.length} Invoices</p>
        </div>

        {/* Purchases */}
        <div
          onClick={() => onTabSelect && onTabSelect('purchase')}
          role="button" tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-100 text-blue-600">
              <Package size={13} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Purchases</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(totalPurchases)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5 relative z-10">{filteredPurchases.length} Orders</p>
        </div>

        {/* Cash In Hand */}
        <div
          onClick={() => onTabSelect && onTabSelect('account')}
          role="button" tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-amber-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-amber-100 text-amber-600">
              <DollarSign size={13} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Cash<br/>In Hand</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(stats?.cashInHand || 0)}</p>
          <p className="text-[9px] text-slate-400 font-medium mt-0.5 relative z-10">Live balance</p>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => onTabSelect && onTabSelect('batch')}
          role="button" tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className={`absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 rounded-full transition-transform group-hover:scale-150 ${
            (stats?.lowStockAlertsCount || 0) > 0 ? 'bg-rose-50' : 'bg-emerald-50'
          }`} />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl ${
              (stats?.lowStockAlertsCount || 0) > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
            }`}>
              <AlertCircle size={13} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Low Stock<br/>Alerts</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{stats?.lowStockAlertsCount || 0}</p>
          <p className={`text-[9px] font-medium mt-0.5 relative z-10 ${
            (stats?.lowStockAlertsCount || 0) > 0 ? 'text-rose-400' : 'text-emerald-500'
          }`}>
            {(stats?.lowStockAlertsCount || 0) > 0 ? 'Action needed' : 'All clear'}
          </p>
        </div>

        {/* ── Plate Size Cards (8", 10", 10" Square, 12", etc.) — Green gradient like P&L green card ── */}
        {plateSizeBreakdown.map(({ label, badge, qty, amount }, idx) => {
          return (
            <div
              key={`plate-${idx}`}
              onClick={() => onTabSelect && onTabSelect('sales')}
              role="button" tabIndex={0}
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 border border-emerald-500 rounded-2xl p-2.5 sm:p-4 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group text-white"
            >
              <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-white/10 rounded-full transition-transform group-hover:scale-150" />
              <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
                <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/20 text-white font-black text-[10px] sm:text-xs">
                  {badge}
                </div>
                <p className="text-[8px] sm:text-[9px] font-bold text-white/80 uppercase tracking-widest leading-tight truncate">{label}</p>
              </div>
              <p className="text-base sm:text-xl font-black text-white tracking-tight relative z-10">{qty.toLocaleString()}</p>
              <p className="text-[9px] text-white/70 font-medium mt-0.5 relative z-10">pcs · {money(amount)}</p>
            </div>
          );
        })}

        {/* Total All Sizes — dark summary card */}
        {plateSizeBreakdown.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800 to-blue-950 rounded-2xl p-2.5 sm:p-4 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-white/10 rounded-full transition-transform group-hover:scale-150" />
            <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
              <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/20 text-white">
                <Layers size={13} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
              </div>
              <p className="text-[8px] sm:text-[9px] font-bold text-white/70 uppercase tracking-widest leading-tight">Total<br/>All Sizes</p>
            </div>
            <p className="text-base sm:text-xl font-black text-white tracking-tight relative z-10">
              {plateSizeBreakdown.reduce((s, x) => s + x.qty, 0).toLocaleString()}
            </p>
            <p className="text-[9px] text-white/60 font-medium mt-0.5 relative z-10">
              pcs · {money(totalSales)}
            </p>
          </div>
        )}
      </section>



      {/* ── Bottom: Banner + Growth Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:items-stretch">

        {/* Left: A-to-Z Banner */}
        <div className="flex">
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 w-full flex flex-col h-[280px] lg:h-[320px]">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-brand-accent/25 border border-brand-accent/40 flex items-center justify-center">
                  <Leaf size={12} className="text-brand-accent" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest leading-none">System Overview</p>
                  <p className="text-white font-bold text-sm leading-tight">Vinayaga Plates</p>
                </div>
              </div>
              <button
                onClick={() => onTabSelect && onTabSelect('sales')}
                className="shrink-0 flex items-center gap-1 bg-brand-accent hover:bg-blue-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold transition shadow"
              >
                Record Sales <ChevronRight size={9} />
              </button>
            </div>
            <div className="relative flex-1 w-full min-h-0 bg-slate-950 overflow-hidden flex items-center justify-center">
              {/* Desktop — object-cover fills the card, slight edge crop but no dark gaps */}
              <img
                src={plateImg}
                alt="Premium Areca Plates"
                className="hidden lg:block w-full h-full object-cover object-left transition-transform duration-500 hover:scale-105"
              />
              {/* Mobile — stacked plates image */}
              <img
                src={platesMobileImg}
                alt="Areca Plates"
                className="block lg:hidden w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105"
              />
            </div>
            <div className="bg-gradient-to-r from-brand-accent/80 to-indigo-500/80 px-3 py-1 flex items-center justify-between z-10 relative">
              <p className="text-white/80 text-[8px] font-semibold">Vinayaga Plates Management System</p>
              <span className="text-white/60 text-[7px] font-bold uppercase tracking-widest">Live · Ledger Driven</span>
            </div>
          </div>
        </div>

        {/* Right: Growth Chart */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shadow-2xl flex flex-col h-[280px] lg:h-[320px]">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/5 blur-xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/20 pointer-events-none" />

          <div className="relative z-10 p-3 flex flex-col flex-1">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-white/10 flex items-center justify-center">
                  <TrendingUp size={11} className="text-white" />
                </div>
                <span className="text-white font-bold text-xs">Sales Growth</span>
              </div>
              <div className="flex bg-white/10 p-0.5 rounded border border-white/20 text-[8px] font-bold">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-1.5 py-0.5 rounded transition ${chartType === 'bar' ? 'bg-[#fff7f9] text-slate-800 shadow-sm' : 'text-white/70 hover:text-white'}`}
                >Bar</button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-1.5 py-0.5 rounded transition ${chartType === 'line' ? 'bg-[#fff7f9] text-slate-800 shadow-sm' : 'text-white/70 hover:text-white'}`}
                >Line</button>
              </div>
            </div>

            <div className="mb-1 text-center">
              <p className="text-white font-extrabold text-lg leading-none">₹{(currentTooltipPoint?.value || 0).toLocaleString()}</p>
              <p className="text-white/50 text-[8px] mt-0.5">{currentTooltipPoint?.label || ''}</p>
            </div>

            <div className="flex-1 flex flex-col min-h-0 mt-2">
              <div className="flex-1 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="db0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="db1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="db2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f472b6" /><stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="db3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="db4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="dlg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.35" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></linearGradient>
                  </defs>
                  <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                  {chartType === 'bar' && chartPoints.map((p, idx) => {
                    const fills = ['url(#db0)', 'url(#db1)', 'url(#db2)', 'url(#db3)', 'url(#db4)'];
                    const prevVal = idx > 0 ? realSales[idx - 1].amount : realSales[idx].amount;
                    const growthPct = idx > 0 ? ((realSales[idx].amount - prevVal) / prevVal * 100).toFixed(0) : null;
                    return (
                      <g key={idx}>
                        <rect x={p.x - 5} y={p.y} width={10} height={90 - p.y} rx="2"
                          fill={fills[idx % fills.length]} opacity={hoveredPoint === idx ? 1 : 0.75}
                          className="cursor-pointer transition-all duration-200"
                          onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)}
                        />
                        {growthPct !== null && (
                          <text x={p.x} y={p.y - 2} textAnchor="middle" fontSize="4" fontWeight="bold"
                            fill={Number(growthPct) >= 0 ? 'rgba(52,211,153,0.95)' : 'rgba(251,113,133,0.95)'}>
                            {Number(growthPct) >= 0 ? '+' : ''}{growthPct}%
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {chartType === 'line' && curveAreaD && <path d={curveAreaD} fill="url(#dlg)" />}
                  {chartType === 'line' && curveLineD && (
                    <path d={curveLineD} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinejoin="round" />
                  )}
                  {chartType === 'line' && chartPoints.map((p, idx) => (
                    <circle key={idx} cx={p.x} cy={p.y}
                      r={hoveredPoint === idx ? 3 : 1.5}
                      fill={hoveredPoint === idx ? '#fff' : 'rgba(255,255,255,0.7)'}
                      stroke="white" strokeWidth={hoveredPoint === idx ? 1.5 : 0}
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredPoint(idx)} onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>
              </div>
              <div className="flex justify-between text-[8px] text-white/40 select-none pt-1.5 border-t border-white/10 mt-1">
                {realSales.map((s, idx) => (
                  <span key={idx} className={hoveredPoint === idx ? 'text-white font-bold' : ''}>
                    {typeof s.month === 'string' ? s.month.split(' ')[0] : s.month}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
