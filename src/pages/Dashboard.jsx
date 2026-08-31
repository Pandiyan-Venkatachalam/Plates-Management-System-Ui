import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import plateImg from '../assets/plate.png';
import platesMobileImg from '../assets/plates.png';
import {
  ShoppingCart, Package, DollarSign, Users, LayoutDashboard,
  AlertCircle, Leaf, ChevronRight, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Minus, BarChart3, TrendingUp, ShieldAlert,
  Sparkles, X
} from 'lucide-react';

export default function Dashboard({ onTabSelect }) {
  const { apiRequest } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [selectedCard, setSelectedCard] = useState(null);
  const [rippleMap, setRippleMap] = useState({});
  const cardRefs = useRef({});

  const handleCardClick = useCallback((e, cardId) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRippleMap(prev => ({ ...prev, [cardId]: { x, y, key: Date.now() } }));
    setTimeout(() => setRippleMap(prev => {
      const next = { ...prev };
      delete next[cardId];
      return next;
    }), 700);
    setSelectedCard(cardId === selectedCard ? null : cardId);
  }, [selectedCard]);

  useEffect(() => {
    apiRequest('/report/get-dashboard-stats')
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-3">
        <div className="w-10 h-10 rounded-full border-2 border-brand-accent border-t-transparent animate-spin" />
        <p className="text-slate-500 text-sm font-semibold">Loading dashboard metrics...</p>
      </div>
    );
  }

  const cards = [
    {
      id: 0, title: 'Total Sales', shortTitle: 'Sales',
      value: `₹${stats?.totalSales?.toLocaleString() || '0'}`,
      icon: ShoppingCart, gradient: 'from-emerald-400 to-teal-500',
      glow: 'shadow-emerald-200', iconBg: 'bg-white/25',
      trend: '+12%', trendUp: true, tab: 'sales', desc: 'Total revenue from all invoices'
    },
    {
      id: 1, title: 'Total Purchases', shortTitle: 'Purchases',
      value: `₹${stats?.totalPurchases?.toLocaleString() || '0'}`,
      icon: Package, gradient: 'from-amber-400 to-orange-500',
      glow: 'shadow-amber-200', iconBg: 'bg-white/25',
      trend: '+8%', trendUp: true, tab: 'purchase', desc: 'Stock intake cost this period'
    },
    {
      id: 2, title: 'Cash In Hand', shortTitle: 'Cash',
      value: `₹${stats?.cashInHand?.toLocaleString() || '0'}`,
      icon: DollarSign, gradient: 'from-blue-500 to-indigo-600',
      glow: 'shadow-blue-200', iconBg: 'bg-white/25',
      trend: '-5%', trendUp: false, tab: 'account', desc: 'Available balance across accounts'
    },
    {
      id: 3, title: 'Partner Equity', shortTitle: 'Equity',
      value: `₹${stats?.netPartnerEquity?.toLocaleString() || '0'}`,
      icon: Users, gradient: 'from-violet-500 to-purple-600',
      glow: 'shadow-violet-200', iconBg: 'bg-white/25',
      trend: '0%', trendUp: null, tab: 'partner', desc: 'Net equity across business partners'
    },
    {
      id: 4, title: 'Active Products', shortTitle: 'Products',
      value: stats?.activeProductsCount || '0',
      icon: LayoutDashboard, gradient: 'from-pink-400 to-rose-500',
      glow: 'shadow-pink-200', iconBg: 'bg-white/25',
      trend: '0%', trendUp: true, tab: 'product', desc: 'Products currently in catalog'
    },
    {
      id: 5, title: 'Low Stock Alerts', shortTitle: 'Alerts',
      value: stats?.lowStockAlertsCount || '0',
      icon: AlertCircle, gradient: 'from-rose-500 to-red-600',
      glow: 'shadow-rose-200', iconBg: 'bg-white/25',
      trend: stats?.lowStockAlertsCount > 0 ? 'Action needed' : 'All clear',
      trendUp: stats?.lowStockAlertsCount <= 0,
      tab: 'batch', desc: 'Batches below minimum stock threshold'
    },
  ];

  const selectedCardData = selectedCard !== null ? cards.find(c => c.id === selectedCard) : null;

  const realSales = stats?.monthlySales && stats.monthlySales.length > 0
    ? stats.monthlySales
    : [
      { month: 'Apr 2026', amount: 15000 },
      { month: 'May 2026', amount: 35000 },
      { month: 'Jun 2026', amount: 20000 },
      { month: 'Jul 2026', amount: 78000 },
      { month: 'Aug 2026', amount: stats?.totalSales || 102720 }
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

  const featurePills = [
    { icon: Package, label: 'Traceability', sub: 'End-to-End' },
    { icon: CheckCircle2, label: 'Accuracy', sub: 'Real-time' },
    { icon: BarChart3, label: 'Transparency', sub: 'Ledger Driven' },
    { icon: Users, label: 'Growth', sub: 'Scalable' },
  ];

  return (
    <div className="space-y-4">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800 flex items-center gap-2">
            <Sparkles size={20} className="text-brand-accent" />
            Dashboard
          </h2>
          <p className="text-slate-400 text-xs mt-0.5">Click any card to view details</p>
        </div>
        <span className="text-[10px] font-bold text-slate-400 bg-[#fff7f9] border border-slate-200 px-2.5 py-1 rounded-full shadow-sm">
          Live Metrics
        </span>
      </div>

      {/* ── Metric Cards Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const ripple = rippleMap[c.id];
          const isSelected = selectedCard === c.id;
          return (
            <button
              key={c.id}
              ref={el => { cardRefs.current[c.id] = el; }}
              onClick={(e) => handleCardClick(e, c.id)}
              className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br ${c.gradient} ${c.glow} shadow-md sm:shadow-lg text-white text-left cursor-pointer outline-none
                transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:-translate-y-0.5
                active:scale-[0.97] active:duration-100 ${isSelected ? 'ring-2 ring-white/60 ring-offset-1' : ''}`}
              style={{ minHeight: '70px' }}
            >
              {ripple && (
                <span
                  key={ripple.key}
                  className="absolute rounded-full bg-white/30 pointer-events-none animate-ping"
                  style={{ left: ripple.x - 24, top: ripple.y - 24, width: 48, height: 48 }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <div className="absolute -bottom-3 -right-3 w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-white/10 pointer-events-none" />
              <div className="relative z-10 p-2 sm:p-4 flex flex-col h-full justify-between">
                <div className="flex items-start justify-between gap-1">
                  <div className={`flex items-center justify-center w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${c.iconBg} backdrop-blur-sm shrink-0`}>
                    <Icon size={13} className="sm:hidden" />
                    <Icon size={16} className="hidden sm:block" />
                  </div>
                  <span className={`text-[7px] sm:text-[9px] font-bold px-1 py-0.5 rounded-full leading-none shrink-0 ${c.trendUp === false ? 'bg-red-500/40' : 'bg-white/25'}`}>
                    {c.trendUp ? <ArrowUpRight size={7} className="inline" /> : c.trendUp === false ? <ArrowDownRight size={7} className="inline" /> : <Minus size={7} className="inline" />}
                    <span className="hidden sm:inline"> {c.trend}</span>
                  </span>
                </div>
                <div className="mt-1.5 sm:mt-3">
                  <p className="text-[7px] sm:text-[10px] font-semibold uppercase tracking-widest text-white/70 leading-none truncate">
                    <span className="sm:hidden">{c.shortTitle}</span>
                    <span className="hidden sm:inline">{c.title}</span>
                  </p>
                  <p className="text-sm sm:text-2xl font-extrabold text-white leading-tight mt-0.5 tracking-tight">
                    {c.value}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Expanded Card Detail Panel ── */}
      {selectedCardData && (() => {
        const Icon = selectedCardData.icon;
        return (
          <div
            className={`rounded-2xl bg-gradient-to-br ${selectedCardData.gradient} text-white shadow-2xl overflow-hidden`}
            style={{ animation: 'expandCard 0.4s cubic-bezier(0.22, 1, 0.36, 1) both' }}
          >
            <div className="relative p-4 sm:p-5">
              <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center justify-center w-12 h-12 rounded-2xl ${selectedCardData.iconBg} backdrop-blur-sm border border-white/20 shrink-0`}>
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{selectedCardData.title}</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none mt-0.5">{selectedCardData.value}</p>
                    <p className="text-white/60 text-[10px] mt-1">{selectedCardData.desc}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button onClick={() => setSelectedCard(null)} className="text-white/60 hover:text-white transition">
                    <X size={16} />
                  </button>
                  <button
                    onClick={() => { onTabSelect && onTabSelect(selectedCardData.tab); setSelectedCard(null); }}
                    className="flex items-center gap-1 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition"
                  >
                    Open <ChevronRight size={10} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Bottom Section: A-to-Z Banner + Growth Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:items-stretch">

        {/* ── Left: A-to-Z — colorful header & footer, white content ── */}
        <div className="flex">
          <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 w-full flex flex-col h-[240px] lg:h-[280px]">

            {/* Colorful header */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-3 py-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-brand-accent/25 border border-brand-accent/40 flex items-center justify-center">
                  <Leaf size={12} className="text-brand-accent" />
                </div>
                <div>
                  <p className="text-[8px] font-black text-brand-accent uppercase tracking-widest leading-none">System Overview</p>
                  <p className="text-white font-bold text-sm leading-tight">Vinayaga Plates </p>
                </div>
              </div>
              <button
                onClick={() => onTabSelect && onTabSelect('sales')}
                className="shrink-0 flex items-center gap-1 bg-brand-accent hover:bg-blue-500 text-white px-2 py-1 rounded-lg text-[9px] font-bold transition shadow"
              >
                Record Sales <ChevronRight size={9} />
              </button>
            </div>

            {/* Content body — plates.png on mobile view, plate.png on desktop */}
            <div className="relative flex-1 w-full h-full min-h-0 bg-slate-950 overflow-hidden flex items-center justify-center">
              {/* Desktop image */}
              <img 
                src={plateImg} 
                alt="Plate presentation" 
                className="hidden lg:block w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105" 
              />
              {/* Mobile image */}
              <img 
                src={platesMobileImg} 
                alt="Plate presentation" 
                className="block lg:hidden w-full h-full object-cover object-center transition-transform duration-500 hover:scale-105" 
              />
            </div>

            {/* Colorful footer */}
            <div className="bg-gradient-to-r from-brand-accent/80 to-indigo-500/80 px-3 py-1 flex items-center justify-between z-10 relative">
              <p className="text-white/80 text-[8px] font-semibold">Vinayaga Plates Management System</p>
              <span className="text-white/60 text-[7px] font-bold uppercase tracking-widest">Live · Ledger Driven</span>
            </div>

          </div>
        </div>

        {/* ── Right: Colorful Growth Chart ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 text-white shadow-2xl flex flex-col h-[240px] lg:h-[280px]">
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full bg-black/20 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          <div className="relative z-10 p-2 sm:p-3 flex flex-col flex-1">
            {/* Chart header */}
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded bg-white/20 flex items-center justify-center">
                  <TrendingUp size={11} className="text-white" />
                </div>
                <span className="text-white font-bold text-xs">Sales Growth</span>
              </div>
              <div className="flex bg-white/10 p-0.5 rounded border border-white/20 text-[8px] font-bold">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-1.5 py-0.5 rounded transition ${chartType === 'bar' ? 'bg-[#fff7f9] text-violet-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                >Bar</button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-1.5 py-0.5 rounded transition ${chartType === 'line' ? 'bg-[#fff7f9] text-violet-700 shadow-sm' : 'text-white/70 hover:text-white'}`}
                >Line</button>
              </div>
            </div>

            {/* Current value display */}
            <div className="mb-1 text-center">
              <p className="text-white font-extrabold text-lg leading-none">
                ₹{(currentTooltipPoint?.value || 0).toLocaleString()}
              </p>
              <p className="text-white/50 text-[8px] mt-0.5">{currentTooltipPoint?.label || ''}</p>
            </div>

            {/* Chart SVG */}
            <div className="flex-1 flex flex-col min-h-0 mt-2">
              <div className="flex-1 relative">
                <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="bg0" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="bg1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#60a5fa" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f472b6" /><stop offset="100%" stopColor="#ec4899" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fbbf24" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="bg4" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.6" /></linearGradient>
                    <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#fff" stopOpacity="0.35" /><stop offset="100%" stopColor="#fff" stopOpacity="0" /></linearGradient>
                  </defs>
                  <line x1="0" y1="25" x2="100" y2="25" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  <line x1="0" y1="75" x2="100" y2="75" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />

                  {chartType === 'bar' && chartPoints.map((p, idx) => {
                    const fills = ['url(#bg0)', 'url(#bg1)', 'url(#bg2)', 'url(#bg3)', 'url(#bg4)'];
                    const prevVal = idx > 0 ? realSales[idx - 1].amount : realSales[idx].amount;
                    const growthPct = idx > 0 ? ((realSales[idx].amount - prevVal) / prevVal * 100).toFixed(0) : null;
                    return (
                      <g key={idx}>
                        <rect x={p.x - 5} y={p.y} width={10} height={90 - p.y} rx="2"
                          fill={fills[idx % fills.length]} opacity={hoveredPoint === idx ? 1 : 0.82}
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

                  {chartType === 'line' && curveAreaD && <path d={curveAreaD} fill="url(#lg)" />}
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
              {/* Month labels */}
              <div className="flex justify-between text-[8px] text-white/50 select-none pt-1.5 border-t border-white/10 mt-1">
                {realSales.map((s, idx) => (
                  <span key={idx} className={hoveredPoint === idx ? 'text-white font-bold' : ''}>
                    {s.month.split(' ')[0]}
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
