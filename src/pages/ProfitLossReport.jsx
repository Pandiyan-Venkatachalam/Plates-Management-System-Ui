import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, BarChart2, Layers, MapPin, Users, ChevronRight, ChevronDown, CalendarDays, Download, Printer, FileText } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { downloadCsvCrossPlatform } from '../utils/exportCsv';
import { getCurrentMonthRange, getPresetDateRange, formatDateToYMD, formatDateDDMMYYYY } from '../utils/dateHelper';
import DateInput from '../components/DateInput';

export default function ProfitLossReport({ onNavigate }) {
  const { apiRequest } = useAuth();
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('supplier'); // supplier, batch, size, location
  const [loading, setLoading] = useState(true);

  // Date Filtering States - Defaults to Current Month (Auto-resets on 1st of every month)
  const initialDates = getCurrentMonthRange();
  const [preset, setPreset] = useState('month');
  const [fromDate, setFromDate] = useState(initialDates.fromDate);
  const [toDate, setToDate] = useState(initialDates.toDate);

  const fetchReport = (from = fromDate, to = toDate) => {
    setLoading(true);
    let url = '/report/profit-loss';
    const params = [];
    if (from) params.push(`fromDate=${from}`);
    if (to) params.push(`toDate=${to}`);
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    apiRequest(url)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  const applyPreset = (presetType) => {
    setPreset(presetType);
    const range = getPresetDateRange(presetType);
    setFromDate(range.fromDate);
    setToDate(range.toDate);
    fetchReport(range.fromDate, range.toDate);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    setPreset('custom');
    fetchReport(fromDate, toDate);
  };

  // Download report as CSV — works on both web and Android app
  const downloadCSV = async () => {
    if (!data) return;
    // Inline tab lookup (getTabRecords not yet in scope here)
    const tabMap = {
      supplier: { label: 'Supplier', list: data.supplierWise || [] },
      batch: { label: 'Batch No', list: data.batchWise || [] },
      size: { label: 'Size / Sizing', list: data.sizeWise || [] },
      location: { label: 'Godown Location', list: data.locationWise || [] },
    };
    const tab = tabMap[activeTab] || { label: 'Category', list: [] };
    const rows = [
      ['P&L Report', fromDate ? `From: ${formatDateDDMMYYYY(fromDate)}` : 'All Time', toDate ? `To: ${formatDateDDMMYYYY(toDate)}` : ''],
      [],
      [tab.label, 'Qty Purchased', 'Qty Sold', 'Revenue', 'Cost', 'Net Profit'],
      ...tab.list.map(r => [
        r.category,
        r.totalPurchasedQuantity || 0,
        r.totalQuantity || 0,
        r.totalRevenue || 0,
        r.totalCost || 0,
        r.netProfit || 0,
      ]),
      [],
      ['TOTALS',
        tab.list.reduce((s, r) => s + (Number(r.totalPurchasedQuantity) || 0), 0),
        tab.list.reduce((s, r) => s + (Number(r.totalQuantity) || 0), 0),
        tab.list.reduce((s, r) => s + (Number(r.totalRevenue) || 0), 0),
        tab.list.reduce((s, r) => s + (Number(r.totalCost) || 0), 0),
        tab.list.reduce((s, r) => s + (Number(r.netProfit) || 0), 0),
      ],
      [],
      ['Summary'],
      ['Total Revenue', data.totalRevenue],
      ['Total Cost of Goods', data.totalCost],
      ['Total Expenses', data.totalExpenses || 0],
      ['Net Profit', data.totalProfit],
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `PL_Report_${fromDate || 'All'}_to_${toDate || 'All'}.csv`;
    await downloadCsvCrossPlatform(csv, filename);
  };

  useEffect(() => {
    fetchReport(initialDates.fromDate, initialDates.toDate);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-brand-accent font-semibold animate-pulse">Generating Profit & Loss analytics...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-rose-450">Failed to load Profit & Loss report data.</p>
      </div>
    );
  }

  // Choose table records based on active tab
  const getTabRecords = () => {
    switch (activeTab) {
      case 'supplier': return { label: 'Supplier', list: data.supplierWise };
      case 'batch': return { label: 'Batch No', list: data.batchWise };
      case 'size': return { label: 'Size / Sizing', list: data.sizeWise };
      case 'location': return { label: 'Godown Location', list: data.locationWise };
      default: return { label: 'Category', list: [] };
    }
  };

  const currentTab = getTabRecords();

  const money = (val) => {
    if (val === undefined || val === null) return '₹0';
    return '₹' + Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 });
  };

  const isMobile = Capacitor.isNativePlatform();

  return (
    <div className="space-y-4">
      {/* =====================================================
          HEADER — same style as Sales.jsx
      ===================================================== */}
      <section className="flex flex-row justify-between items-center gap-2 print:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-accent uppercase mb-1">
            <span>Reports</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-slate-400 truncate">P&amp;L</span>
          </div>
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900 truncate">
            Profit &amp; Loss
          </h1>
        </div>

        <div className="flex gap-2 shrink-0">
          {/* Mobile: Download CSV */}
          
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold transition shadow-sm"
            >
              <Download size={14} className="text-slate-400" />
              <span>Download CSV</span>
            </button>
          
          {/* Web: Print Report */}
          
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 text-xs font-bold transition shadow-sm"
            >
              <FileText size={14} className="text-slate-400" />
              <span>Print Report</span>
            </button>
        </div>
      </section>

      {/* =========================================================
          PREMIUM PRINT ONLY REPORT HEADER (Vinayaga Plates)
      ========================================================= */}
      <div className="hidden print:block mb-5 space-y-3">
        <div className="text-center pb-2.5 border-b-2 border-slate-900">
          <div className="flex items-center justify-center gap-3 mb-0.5">
            <div className="h-[1.5px] w-12 bg-blue-900" />
            <h1 className="text-3xl font-black tracking-[0.2em] text-blue-950 uppercase print-brand-title">
              VINAYAGA PLATES
            </h1>
            <div className="h-[1.5px] w-12 bg-blue-900" />
          </div>
          <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            Manufacturing & Inventory Management System
          </p>
          <div className="mt-2">
            <span className="inline-block px-4 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[11px] uppercase tracking-widest">
              Profit &amp; Loss Report
            </span>
          </div>
        </div>

        {/* Structured KPI Metadata Strip */}
        <div className="grid grid-cols-2 gap-2 border border-slate-300 rounded-lg p-2 bg-slate-50 text-left">
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Report Date</span>
            <span className="text-[11px] font-black text-slate-900">{formatDateDDMMYYYY(new Date())}</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Report Period</span>
            <span className="text-[11px] font-black text-slate-900">
              {preset === 'all' ? 'All Time History' : `${formatDateDDMMYYYY(fromDate)} to ${formatDateDDMMYYYY(toDate)}`}
            </span>
          </div>
        </div>
      </div>

      {/* =====================================================
          PRESET & DATE RANGE FILTER BAR
      ===================================================== */}
      <section className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-3 shadow-sm border border-slate-100 flex flex-col lg:flex-row items-center gap-2.5 print:hidden">
        <div className="relative w-full lg:w-48 shrink-0">
          <select
            value={preset}
            onChange={(e) => applyPreset(e.target.value)}
            className="h-10 appearance-none w-full rounded-xl bg-slate-50 border border-slate-200/80 pl-3.5 pr-9 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all cursor-pointer hover:border-slate-300"
          >
            <option value="all">📅 All Time History</option>
            <option value="today">⚡ Today Only</option>
            <option value="month">🗓️ This Month</option>
            <option value="quarter">📊 This Quarter</option>
            <option value="year">📈 This Year</option>
            <option value="custom">⚙️ Custom Range</option>
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        
        <div className="flex items-center justify-between sm:justify-start gap-2 rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 h-10 w-full flex-1 min-w-0">
          <CalendarDays size={15} className="text-slate-400 shrink-0 hidden xs:block" />
          <DateInput 
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPreset('custom');
            }}
            className="w-full flex-1 min-w-0"
          />
          <span className="text-slate-400 text-xs font-black shrink-0">-</span>
          <DateInput 
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPreset('custom');
            }}
            className="w-full flex-1 min-w-0"
          />
        </div>

        <button
          onClick={() => fetchReport(fromDate, toDate)}
          className="h-10 px-6 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 rounded-xl text-xs font-bold transition-all flex items-center justify-center whitespace-nowrap shrink-0 w-full lg:w-auto"
        >
          Apply Filter
        </button>
      </section>

      {/* =====================================================
          SUMMARY METRICS CARDS
      ===================================================== */}
      <section className="grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4 print:hidden">
        {/* Total Revenue → Sales */}
        <div
          onClick={() => onNavigate && onNavigate('sales')}
          role="button"
          tabIndex={0}
          title="Go to Sales Invoices"
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-emerald-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600">
              <TrendingUp size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Revenue</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(data.totalRevenue)}</p>
        </div>

        {/* Total Cost → Purchase */}
        <div
          onClick={() => onNavigate && onNavigate('purchase')}
          role="button"
          tabIndex={0}
          title="Go to Purchases"
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-100 text-blue-600">
              <BarChart2 size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Cost</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(data.totalCost)}</p>
        </div>

        {/* Total Expenses → Expense */}
        <div
          onClick={() => onNavigate && onNavigate('expense')}
          role="button"
          tabIndex={0}
          title="Go to Expenses"
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-amber-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-amber-100 text-amber-600">
              <BarChart2 size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Expenses</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(data.totalExpenses || 0)}</p>
        </div>

        {/* Net Profit Card */}
        <div className={`rounded-2xl p-2.5 sm:p-4 shadow-sm flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group ${
          data.totalProfit >= 0 
            ? 'bg-gradient-to-br from-emerald-600 to-emerald-700 border border-emerald-500' 
            : 'bg-gradient-to-br from-rose-500 to-rose-600 border border-rose-400'
        }`}>
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-white/10 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/20 text-white">
              <Layers size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-white/80 uppercase tracking-widest leading-tight">Net<br/>Profit</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-white tracking-tight relative z-10 leading-none">{money(data.totalProfit)}</p>
        </div>
      </section>

      {/* =====================================================
          TAB SELECTOR & HISTORY
      ===================================================== */}
      <section className="bg-[#fff7f9] shadow-sm border border-slate-100 rounded-2xl p-2 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1.5 border-b border-slate-100 pb-2 px-1 pt-1 print:hidden">
          <button
            onClick={() => setActiveTab('supplier')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'supplier' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Users size={14} />
            Supplier-Wise
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'batch' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <Layers size={14} />
            Batch-Wise
          </button>
          <button
            onClick={() => setActiveTab('size')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'size' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <BarChart2 size={14} />
            Size-Wise
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'location' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
          >
            <MapPin size={14} />
            Godown-Wise
          </button>
        </div>

        {/* Desktop grouped list table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">{currentTab.label}</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Qty Purchased</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Qty Sold</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Revenue</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Cost</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentTab.list.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-5 py-3 font-bold text-slate-800 text-xs">{r.category}</td>
                  <td className="px-5 py-3 text-right text-slate-900 font-bold text-xs">{r.totalPurchasedQuantity?.toLocaleString() || 0}</td>
                  <td className="px-5 py-3 text-right text-slate-900 font-bold text-xs">{r.totalQuantity?.toLocaleString()}</td>
                  <td className="px-5 py-3 text-right text-slate-600 font-mono text-xs">{money(r.totalRevenue)}</td>
                  <td className="px-5 py-3 text-right text-slate-600 font-mono text-xs">{money(r.totalCost)}</td>
                  <td className={`px-5 py-3 text-right font-extrabold font-mono text-xs ${r.netProfit >= 0 ? 'text-brand-accent' : 'text-rose-500'}`}>
                    {money(r.netProfit)}
                  </td>
                </tr>
              ))}
              {currentTab.list.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">
                    No transactions found for this timeframe presets.
                  </td>
                </tr>
              )}
            </tbody>
            {currentTab.list.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                <tr className="bg-slate-100/90 hover:bg-slate-100">
                  <td className="px-5 py-2.5 font-black text-slate-900 text-xs uppercase tracking-wider">Total ({currentTab.list.length})</td>
                  <td className="px-5 py-2.5 text-right text-slate-900 font-black text-xs">
                    {currentTab.list.reduce((s, r) => s + (Number(r.totalPurchasedQuantity) || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 text-right text-slate-900 font-black text-xs">
                    {currentTab.list.reduce((s, r) => s + (Number(r.totalQuantity) || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-5 py-2.5 text-right text-slate-900 font-black text-xs font-mono">
                    {money(currentTab.list.reduce((s, r) => s + (Number(r.totalRevenue) || 0), 0))}
                  </td>
                  <td className="px-5 py-2.5 text-right text-slate-900 font-black text-xs font-mono">
                    {money(currentTab.list.reduce((s, r) => s + (Number(r.totalCost) || 0), 0))}
                  </td>
                  <td className={`px-5 py-2.5 text-right font-black font-mono text-xs ${
                    currentTab.list.reduce((s, r) => s + (Number(r.netProfit) || 0), 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'
                  }`}>
                    {money(currentTab.list.reduce((s, r) => s + (Number(r.netProfit) || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Mobile Cards Grouped List */}
        <div className="block lg:hidden space-y-3 pt-2">
          {currentTab.list.map((r, idx) => (
            <article key={idx} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="bg-white rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-2 relative z-10">
                    <span className="font-mono font-bold text-xs text-blue-300">#{idx + 1}</span>
                    <h3 className="text-sm font-black text-white leading-tight">
                      {r.category}
                    </h3>
                  </div>
                  <span className={`relative z-10 font-mono font-bold text-xs px-2.5 py-1 rounded-full border backdrop-blur-md ${
                    r.netProfit >= 0 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {money(r.netProfit)}
                  </span>
                </div>

                {/* Card Body Details */}
                <div className="p-4 bg-white text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Qty Purchased:</span>
                    <span className="font-bold text-slate-800">{r.totalPurchasedQuantity?.toLocaleString() || 0} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Qty Sold:</span>
                    <span className="font-bold text-slate-800">{r.totalQuantity?.toLocaleString() || 0} pcs</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Revenue:</span>
                    <span className="font-mono font-bold text-slate-800">{money(r.totalRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400">Cost:</span>
                    <span className="font-mono font-bold text-slate-800">{money(r.totalCost)}</span>
                  </div>
                </div>
              </div>
            </article>
          ))}
          {currentTab.list.length === 0 && (
            <p className="text-center py-6 text-slate-400 text-sm">No records found.</p>
          )}
        </div>
      </section>
    </div>
  );
}
