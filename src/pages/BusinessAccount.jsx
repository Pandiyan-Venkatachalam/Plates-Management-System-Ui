import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Search, ChevronRight, Pencil, Users, TrendingUp, Wallet, ArrowDownCircle, ArrowUpCircle, RefreshCw, CalendarDays, ShoppingBag } from 'lucide-react';
import Swal from 'sweetalert2';
import { handlePrint } from '../utils/printHelper';
import { sortLatestFirst } from '../utils/sortHelper';
import { getCurrentMonthRange, getPresetDateRange, isDateInRange, formatDateDDMMYYYY } from '../utils/dateHelper';
import DateInput from '../components/DateInput';

const formatAccountType = (type) => {
  if (!type) return "Pandiyan's Acc";
  if (type === 'CASH' || type === 'PANDIYAN' || type.toLowerCase().includes('pandiyan')) return "Pandiyan's Acc";
  if (type === 'BANK' || type === 'RANJITH' || type.toLowerCase().includes('ranjith')) return "Ranjith's Acc";
  return type;
};

const fmt = (val) => `\u20B9${Number(val || 0).toLocaleString('en-IN')}`;

export default function BusinessAccount() {
  const { apiRequest } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ name: '', type: "Pandiyan's Acc" });
  const [editingId, setEditingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');

  // Date Filter State
  const initialDates = getCurrentMonthRange();
  const [period, setPeriod] = useState('thisMonth');
  const [fromDate, setFromDate] = useState(initialDates.fromDate);
  const [toDate, setToDate] = useState(initialDates.toDate);
  const [printTarget, setPrintTarget] = useState('cashInHand'); // 'cashInHand' | 'accounts'

  // Partner summary data
  const [partners, setPartners] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ledgers, setLedgers] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Partner Investment Modal State
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [investmentForm, setInvestmentForm] = useState({
    partnerId: '',
    transactionType: 'INVESTMENT',
    amount: '',
    description: '',
    accountName: '',
    approvedByPartner: false
  });
  const [investmentSubmitting, setInvestmentSubmitting] = useState(false);

  const openInvestmentModal = (partnerId = '', defaultType = 'INVESTMENT', defaultAccount = '') => {
    const defaultPartnerId = partnerId || (partners.length > 0 ? partners[0].partnerId : '');
    const defaultAcc = defaultAccount || (accounts.length > 0 ? accounts[0].accountName : 'Cash');
    setInvestmentForm({
      partnerId: defaultPartnerId,
      transactionType: defaultType,
      amount: '',
      description: defaultType === 'INVESTMENT' ? 'Capital Investment' : 'Partner Withdrawal',
      accountName: defaultAcc,
      approvedByPartner: false
    });
    setShowInvestmentModal(true);
  };

  const handleInvestmentSubmit = async (e) => {
    e.preventDefault();
    if (!investmentForm.partnerId) {
      Swal.fire('Warning', 'Please select a partner.', 'warning');
      return;
    }
    if (!investmentForm.amount || Number(investmentForm.amount) <= 0) {
      Swal.fire('Warning', 'Please enter a valid amount greater than 0.', 'warning');
      return;
    }
    if (investmentForm.transactionType === 'WITHDRAWAL' && !investmentForm.approvedByPartner) {
      Swal.fire('Warning', "Withdrawals require partner's approval. Please check the confirmation checkbox.", 'warning');
      return;
    }

    setInvestmentSubmitting(true);
    const payload = {
      partnerId: parseInt(investmentForm.partnerId),
      transactionType: investmentForm.transactionType,
      amount: parseFloat(investmentForm.amount),
      description: investmentForm.description || (investmentForm.transactionType === 'INVESTMENT' ? 'Partner Investment' : 'Partner Withdrawal'),
      accountName: investmentForm.accountName || 'Cash'
    };

    try {
      await apiRequest('/partnerledger/create-transaction', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      Swal.fire(
        'Success',
        `${investmentForm.transactionType === 'INVESTMENT' ? 'Investment' : 'Withdrawal'} of ₹${Number(investmentForm.amount).toLocaleString('en-IN')} recorded successfully!`,
        'success'
      );
      setShowInvestmentModal(false);
      loadSummaryData();
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to post equity transaction', 'error');
    } finally {
      setInvestmentSubmitting(false);
    }
  };

  const handlePeriodChange = (presetType) => {
    setPeriod(presetType);
    if (presetType === 'all') {
      setFromDate('');
      setToDate('');
    } else if (presetType !== 'custom') {
      const range = getPresetDateRange(presetType);
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    }
  };

  const loadData = () => {
    apiRequest('/account').then(res => setAccounts(sortLatestFirst(res.data, ['accountId', 'id'], 'account'))).catch(console.error);
  };

  const loadSummaryData = async () => {
    setSummaryLoading(true);
    try {
      const [partnerRes, txRes, ledgerRes] = await Promise.all([
        apiRequest('/partner').catch(() => ({ data: [] })),
        apiRequest('/account/transactions').catch(() => ({ data: [] })),
        apiRequest('/partnerledger').catch(() => ({ data: [] })),
      ]);
      setPartners(Array.isArray(partnerRes?.data) ? partnerRes.data : []);
      setTransactions(Array.isArray(txRes?.data) ? txRes.data : []);
      setLedgers(Array.isArray(ledgerRes?.data) ? ledgerRes.data : []);
    } catch (e) { console.error(e); }
    finally { setSummaryLoading(false); }
  };

  useEffect(() => {
    loadData();
    loadSummaryData();
  }, []);


  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      accountName: form.name,
      accountType: form.type
    };
    try {
      if (editingId) {
        await apiRequest(`/account/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        markItemAsUpdated('account', editingId);
        Swal.fire('Success', 'Account updated!', 'success');
      } else {
        await apiRequest('/account', {
          method: 'POST',
          body: JSON.stringify({ id: 0, ...payload })
        });
        Swal.fire('Success', 'Business account created!', 'success');
      }
      setForm({ name: '', type: "Pandiyan's Acc" });
      setEditingId(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (a) => {
    setEditingId(a.accountId);
    setForm({ name: a.accountName, type: formatAccountType(a.accountType) });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this business ledger account?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await apiRequest(`/account/${id}`, { method: 'DELETE' });
      Swal.fire('Deleted!', 'Business account deleted!', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const filteredAccounts = sortLatestFirst(
    accounts.filter(a => 
      a.accountName?.toLowerCase().includes(search.toLowerCase()) ||
      a.accountType?.toLowerCase().includes(search.toLowerCase())
    ),
    ['accountId', 'id'],
    'account'
  );

  // ── Compute per-account (partner) summary ──
  const partnerSummary = accounts.map(acc => {
    const accName = acc.accountName || '';
    
    // Filter transactions for this account and date range
    const accTx = transactions.filter(t => 
      t.accountId === acc.accountId && 
      (period === 'all' || isDateInRange(t.transactionDate || t.createdAt, fromDate, toDate))
    );

    // Sales collected into this account (Credits from SALE)
    const salesCollected = accTx
      .filter(t => t.transactionType === 'CREDIT' && t.referenceType === 'SALE')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Purchases paid from this account (Debits from PURCHASE)
    const purchasesPaid = accTx
      .filter(t => t.transactionType === 'DEBIT' && t.referenceType === 'PURCHASE')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Expenses paid from this account (Debits from EXPENSE only - petrol, diesel, covers, etc.)
    const expensesPaid = accTx
      .filter(t => t.transactionType === 'DEBIT' && t.referenceType === 'EXPENSE')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    // Total invested (partner ledger INVESTMENT minus WITHDRAWAL)
    // Filtered by date range
    const partnerName = formatAccountType(acc.accountType).replace("'s Acc", '').trim();
    const accLedgers = ledgers.filter(l => 
      ((l.partnerName || '').toLowerCase().includes(partnerName.toLowerCase()) || 
       (l.partnerName || '').toLowerCase().includes(accName.toLowerCase())) &&
      (period === 'all' || isDateInRange(l.transactionDate || l.createdAt, fromDate, toDate))
    );
    
    const invested = accLedgers.reduce((sum, l) => {
      if (l.transactionType === 'INVESTMENT') return sum + (Number(l.amount) || 0);
      if (l.transactionType === 'WITHDRAWAL') return sum - (Number(l.amount) || 0);
      return sum;
    }, 0);

    // Net In-Hand for partner (Invested + Sales Collected - Purchases Paid - Expenses Paid)
    const netInHand = (invested + salesCollected) - purchasesPaid - expensesPaid;

    return { acc, accName, salesCollected, purchasesPaid, expensesPaid, invested, netInHand };
  });

  const onPrintCashInHand = () => {
    setPrintTarget('cashInHand');
    setTimeout(() => {
      handlePrint();
    }, 50);
  };

  const onPrintAccounts = () => {
    setPrintTarget('accounts');
    setTimeout(() => {
      handlePrint();
    }, 50);
  };

  const totalInvested = partnerSummary.reduce((s, p) => s + p.invested, 0);
  const totalCollected = partnerSummary.reduce((s, p) => s + p.salesCollected, 0);
  const totalPurchases = partnerSummary.reduce((s, p) => s + p.purchasesPaid, 0);
  const totalExpenses = partnerSummary.reduce((s, p) => s + p.expensesPaid, 0);
  const totalInHand = partnerSummary.reduce((s, p) => s + p.netInHand, 0);

  const partnerColors = [
    { bg: 'from-blue-600 to-indigo-700', badge: 'bg-blue-100 text-blue-700', ring: 'ring-blue-200', icon: 'text-blue-600' },
    { bg: 'from-emerald-600 to-teal-700', badge: 'bg-emerald-100 text-emerald-700', ring: 'ring-emerald-200', icon: 'text-emerald-600' },
    { bg: 'from-violet-600 to-purple-700', badge: 'bg-violet-100 text-violet-700', ring: 'ring-violet-200', icon: 'text-violet-600' },
    { bg: 'from-rose-600 to-pink-700', badge: 'bg-rose-100 text-rose-700', ring: 'ring-rose-200', icon: 'text-rose-600' },
  ];

  return (
    <div className="space-y-4">
      {/* =========================================================
          PARTNER CASH-IN-HAND SUMMARY PANEL
      ========================================================= */}
      <section className="print:hidden">
        {/* Section Title & Filters (Strictly single-line on all devices) */}
        <div className="flex flex-row items-center justify-between gap-1.5 mb-2.5 flex-nowrap">
          <div className="min-w-0 pr-1 shrink">
            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold tracking-widest text-brand-accent uppercase leading-none mb-0.5">
              <Users size={10} className="shrink-0" />
              <span className="truncate">Partner Financials</span>
            </div>
            <h2 className="text-xs sm:text-base font-black text-slate-900 leading-tight truncate">Cash In-Hand</h2>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 flex-nowrap">
            {/* Record Investment */}
            <button
              onClick={() => openInvestmentModal()}
              title="Record Investment"
              className="flex items-center justify-center gap-1 px-2 py-1.5 sm:px-3 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Plus size={12} strokeWidth={3} />
              <span className="hidden sm:inline">Record Investment</span>
              <span className="inline sm:hidden">Invest</span>
            </button>

            {/* Period Dropdown */}
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="bg-white border border-slate-200 text-[10px] sm:text-xs font-bold text-slate-700 rounded-xl px-1.5 sm:px-2.5 py-1.5 focus:outline-none focus:border-brand-accent shadow-sm shrink-0 cursor-pointer"
            >
              <option value="thisMonth">This Month</option>
              <option value="all">All Time</option>
              <option value="lastMonth">Last Month</option>
              <option value="today">Today</option>
              <option value="custom">Custom</option>
            </select>
            {/* Print Button */}
            <button
              onClick={onPrintCashInHand}
              title="Print Cash In-Hand Report"
              className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 transition-all shadow-sm border border-slate-200/60 shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              <span className="hidden md:inline ml-1">Print</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadSummaryData}
              disabled={summaryLoading}
              title="Refresh Data"
              className="flex items-center justify-center p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-[10px] sm:text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all shadow-sm border border-slate-200/60 shrink-0"
            >
              <RefreshCw size={12} className={summaryLoading ? 'animate-spin' : ''} />
              <span className="hidden md:inline ml-1">Refresh</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Picker */}
        {period === 'custom' && (
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-2 mb-2 shadow-inner w-fit">
            <CalendarDays size={12} className="text-slate-400 shrink-0" />
            <DateInput
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 min-w-[85px]"
              textClassName="text-[10px] font-bold text-slate-700"
            />
            <span className="text-slate-400 text-xs font-bold">-</span>
            <DateInput
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-2 py-1 min-w-[85px]"
              textClassName="text-[10px] font-bold text-slate-700"
            />
          </div>
        )}

        {/* Per-Partner Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {partnerSummary.length === 0 ? (
            <div className="col-span-2 bg-slate-50 rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100">
              No accounts found. Create accounts to see partner summary.
            </div>
          ) : (
            partnerSummary.map((ps, idx) => {
              const col = partnerColors[idx % partnerColors.length];
              const initial = (ps.accName || 'A')[0].toUpperCase();
              const matchedPartner = partners.find(p => 
                p.partnerName?.toLowerCase().includes(ps.accName.toLowerCase()) || 
                (ps.acc.accountType && p.partnerName?.toLowerCase().includes(formatAccountType(ps.acc.accountType).toLowerCase().replace("'s acc", '').trim()))
              );
              return (
                <div key={ps.acc.accountId} className={`rounded-2xl overflow-hidden shadow-md ring-1 ${col.ring} bg-white flex flex-col justify-between`}>
                  <div>
                    {/* Card Header */}
                    <div className={`bg-gradient-to-r ${col.bg} px-4 py-3 flex items-center justify-between`}>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center text-white font-black text-base">
                          {initial}
                        </div>
                        <div>
                          <div className="text-white font-black text-sm leading-tight">{ps.accName}</div>
                          <div className="text-white/70 text-[10px] font-bold">{formatAccountType(ps.acc.accountType)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-white/70 text-[9px] font-bold uppercase tracking-wider">Net In-Hand</div>
                        <div className={`text-lg font-black ${ps.netInHand >= 0 ? 'text-white' : 'text-rose-200'}`}>
                          {fmt(ps.netInHand)}
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 bg-white">
                      <div className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <TrendingUp size={11} className="text-blue-500" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Invested</span>
                        </div>
                        <div className="text-[13px] font-black text-slate-800">{fmt(ps.invested)}</div>
                      </div>
                      <div className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <ArrowDownCircle size={11} className="text-emerald-500" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sales</span>
                        </div>
                        <div className="text-[13px] font-black text-emerald-700">{fmt(ps.salesCollected)}</div>
                      </div>
                      <div className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <ShoppingBag size={11} className="text-amber-500" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Purchases</span>
                        </div>
                        <div className="text-[13px] font-black text-amber-700">{fmt(ps.purchasesPaid)}</div>
                      </div>
                      <div className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1 mb-0.5">
                          <ArrowUpCircle size={11} className="text-rose-500" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expenses</span>
                        </div>
                        <div className="text-[13px] font-black text-rose-700">{fmt(ps.expensesPaid)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Card Quick Action Bar */}
                  <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/80 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Equity Actions</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openInvestmentModal(matchedPartner?.partnerId || '', 'INVESTMENT', ps.accName)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60 transition flex items-center gap-1"
                      >
                        <Plus size={11} strokeWidth={3} />
                        <span>Invest</span>
                      </button>
                      <button
                        onClick={() => openInvestmentModal(matchedPartner?.partnerId || '', 'WITHDRAWAL', ps.accName)}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 transition flex items-center gap-1"
                      >
                        <span>Withdraw</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Combined Total Strip */}
        {partnerSummary.length > 1 && (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Wallet size={16} className="text-blue-300" />
              <span className="text-white font-black text-sm">Combined Business</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Total Invested</div>
                <div className="text-blue-400 font-black text-sm">{fmt(totalInvested)}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Total Sales</div>
                <div className="text-emerald-400 font-black text-sm">{fmt(totalCollected)}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Total Purchases</div>
                <div className="text-amber-400 font-black text-sm">{fmt(totalPurchases)}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Total Expenses</div>
                <div className="text-rose-400 font-black text-sm">{fmt(totalExpenses)}</div>
              </div>
              <div className="text-center">
                <div className="text-[9px] font-bold text-slate-400 uppercase">Net In-Hand</div>
                <div className={`font-black text-sm ${totalInHand >= 0 ? 'text-white' : 'text-rose-300'}`}>{fmt(totalInHand)}</div>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-slate-100 pt-2" />


      {/* =========================================================
          CASH IN-HAND PRINT ONLY REPORT (Vinayaga Plates)
      ========================================================= */}
      <div className={`hidden ${printTarget === 'cashInHand' ? 'print:block' : ''} mb-5 space-y-3`}>
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
              Partner Cash In-Hand Financial Report
            </span>
          </div>
        </div>

        {/* Structured KPI Metadata Strip */}
        <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-2 bg-slate-50 text-left">
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Report Date</span>
            <span className="text-[11px] font-black text-slate-900">{formatDateDDMMYYYY(new Date())}</span>
          </div>
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Period Range</span>
            <span className="text-[11px] font-black text-slate-900">
              {period === 'all' ? 'All Time' : period === 'custom' ? `${formatDateDDMMYYYY(fromDate)} to ${formatDateDDMMYYYY(toDate)}` : period === 'thisMonth' ? 'This Month' : period === 'lastMonth' ? 'Last Month' : period === 'today' ? 'Today' : period}
            </span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Net Cash In-Hand</span>
            <span className={`text-[11px] font-black ${totalInHand >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{fmt(totalInHand)}</span>
          </div>
        </div>

        {/* Cash In-Hand Financial Table */}
        <div className="border border-slate-300 rounded-lg overflow-hidden mt-3">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-900 text-white">
              <tr className="border-b border-slate-800">
                <th className="px-3 py-2 text-[9px] font-black uppercase tracking-wider">Partner / Account</th>
                <th className="px-3 py-2 text-[9px] font-black uppercase tracking-wider text-right">Capital Invested</th>
                <th className="px-3 py-2 text-[9px] font-black uppercase tracking-wider text-right">Sales Collected</th>
                <th className="px-3 py-2 text-[9px] font-black uppercase tracking-wider text-right">Purchases Paid</th>
                <th className="px-3 py-2 text-[9px] font-black uppercase tracking-wider text-right">Expenses Paid</th>
                <th className="px-3 py-2 text-[9px] font-black uppercase tracking-wider text-right bg-slate-800">Net Cash In-Hand</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {partnerSummary.map((ps, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-3 py-2.5 font-black text-slate-900">
                    <div>{ps.accName}</div>
                    <div className="text-[9px] font-normal text-slate-500">{formatAccountType(ps.acc.accountType)}</div>
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-700">{fmt(ps.invested)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">{fmt(ps.salesCollected)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-amber-700">{fmt(ps.purchasesPaid)}</td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-700">{fmt(ps.expensesPaid)}</td>
                  <td className={`px-3 py-2.5 text-right font-mono font-black ${ps.netInHand >= 0 ? 'text-slate-900 bg-slate-50' : 'text-rose-700 bg-rose-50'}`}>
                    {fmt(ps.netInHand)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-black border-t-2 border-slate-400">
              <tr>
                <td className="px-3 py-2.5 uppercase text-[9px] text-slate-900 font-black">
                  BUSINESS TOTAL
                </td>
                <td className="px-3 py-2.5 text-right font-mono font-black text-blue-900">{fmt(totalInvested)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-black text-emerald-900">{fmt(totalCollected)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-black text-amber-900">{fmt(totalPurchases)}</td>
                <td className="px-3 py-2.5 text-right font-mono font-black text-rose-900">{fmt(totalExpenses)}</td>
                <td className={`px-3 py-2.5 text-right font-mono font-black ${totalInHand >= 0 ? 'text-slate-950 bg-slate-200/80' : 'text-rose-900 bg-rose-100'}`}>
                  {fmt(totalInHand)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* =========================================================
          BUSINESS ACCOUNTS REGISTER PRINT ONLY REPORT
      ========================================================= */}
      <div className={`hidden ${printTarget === 'accounts' ? 'print:block' : ''} mb-5 space-y-3`}>
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
              Business Accounts Register Report
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
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Registered Accounts</span>
            <span className="text-[11px] font-black text-slate-900">{filteredAccounts.length} Accounts</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}
      <section className="flex flex-col gap-1.5 sm:gap-2 print:hidden">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-accent uppercase mb-1">
            <span>Accounting & Finance</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-slate-400 truncate">Accounts</span>
          </div>
        <div className="flex justify-between items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900">
            Business Accounts
          </h1>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onPrintAccounts}
              className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              <span className="hidden sm:inline">Print Report</span>
            </button>
            <button 
              onClick={() => {
                setEditingId(null);
                setForm({ name: '', type: 'CASH' });
                setShowCreateForm(true);
              }}
              className="flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-brand-accent/25 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
            >
              <Plus size={14} strokeWidth={3} />
              New Account
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}
      <section className="bg-[#fff7f9] rounded-2xl p-2 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 print:hidden">
        <div className="relative w-full lg:max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search account name or account type..."
            className="h-9 w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
          />
        </div>
      </section>

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}
      <section className={`hidden lg:block bg-[#fff7f9] rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${printTarget === 'cashInHand' ? 'print:hidden' : ''}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-24">ID</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-1/2">Account Name</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Account Type</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No business accounts found.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map((a) => (
                  <tr key={a.accountId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3 font-mono font-bold text-[10px] text-slate-500">ACCT-{a.accountId}</td>
                    <td className="px-5 py-3 font-bold text-slate-800 text-xs">{a.accountName}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                        {formatAccountType(a.accountType)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right print:hidden">
                      <div className="flex justify-end items-center gap-1">
                        <button 
                          onClick={() => handleEdit(a)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Edit details"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(a.accountId)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          MOBILE INVOICE CARDS
      ===================================================== */}
      <section className="space-y-3.5 lg:hidden print:hidden">
        {filteredAccounts.length === 0 ? (
          <div className="bg-[#fff7f9] rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">
            No business accounts found.
          </div>
        ) : (
          filteredAccounts.map((a) => (
            <article key={a.accountId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-inner">
                      <span className="font-black text-base text-blue-300 font-mono">{(a.accountName || 'A')[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight mb-0.5">
                        {a.accountName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-200 font-mono tracking-wider">ACCT-{a.accountId}</span>
                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-white/20 text-white tracking-widest">
                          {formatAccountType(a.accountType)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/70 divide-x divide-slate-100">
                  <button 
                    onClick={() => handleEdit(a)}
                    className="flex flex-col items-center justify-center gap-1 py-3 transition-colors text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    <Pencil size={15} />
                    <span className="text-[9px] font-bold">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(a.accountId)}
                    className="flex flex-col items-center justify-center gap-1 py-3 transition-colors text-slate-500 hover:text-rose-600 hover:bg-rose-50/50"
                  >
                    <Trash2 size={15} />
                    <span className="text-[9px] font-bold">Delete</span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* =====================================================
          RECORD SALE FORM OVERLAY MODAL (Sliding Drawer Layout)
      ===================================================== */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-md max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-pink-200/40 pb-3 mb-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingId ? 'Edit Ledger Account' : 'Create Ledger Account'}
              </h3>
              <button 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingId(null);
                }}
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Account Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="e.g. SBI Bank"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Account Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="Pandiyan's Acc">Pandiyan's Acc</option>
                  <option value="Ranjith's Acc">Ranjith's Acc</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3.5 border-t border-pink-200/40">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingId(null);
                  }}
                  className="w-1/2 bg-[#fff7f9] text-slate-700 hover:text-slate-900 rounded-xl py-3 text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-gradient-to-r from-brand-accent to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
                >
                  <Plus size={14} strokeWidth={3} />
                  {editingId ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =====================================================
          PARTNER EQUITY / INVESTMENT FORM OVERLAY MODAL
      ===================================================== */}
      {showInvestmentModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#f0fdf4] border border-emerald-200/80 w-full max-w-md max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-emerald-200/40 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600/15 text-emerald-700 flex items-center justify-center">
                  <TrendingUp size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight">
                    Record Partner Equity
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500">Post partner investment or withdrawal</p>
                </div>
              </div>
              <button 
                onClick={() => setShowInvestmentModal(false)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleInvestmentSubmit} className="space-y-3.5">
              {/* Transaction Type Segmented Switch */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Transaction Type</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setInvestmentForm({ ...investmentForm, transactionType: 'INVESTMENT' })}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      investmentForm.transactionType === 'INVESTMENT'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Plus size={13} strokeWidth={3} />
                    <span>Investment (Add)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvestmentForm({ ...investmentForm, transactionType: 'WITHDRAWAL' })}
                    className={`py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      investmentForm.transactionType === 'WITHDRAWAL'
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span>Withdrawal (Take)</span>
                  </button>
                </div>
              </div>

              {/* Partner Select */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Select Partner</label>
                <select
                  value={investmentForm.partnerId}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, partnerId: e.target.value })}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="">-- Choose Partner --</option>
                  {partners.map(p => (
                    <option key={p.partnerId} value={p.partnerId}>
                      {p.partnerName} {p.contactPhone ? `(${p.contactPhone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount (₹) */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">₹</span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    value={investmentForm.amount}
                    onChange={(e) => setInvestmentForm({ ...investmentForm, amount: e.target.value })}
                    className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl pl-8 pr-3.5 py-2.5 text-sm text-slate-900 font-black transition-all"
                    placeholder="e.g. 50000"
                    required
                  />
                </div>
              </div>

              {/* Business Account Target */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                  {investmentForm.transactionType === 'INVESTMENT' ? 'Deposit Into Account' : 'Deduct From Account'}
                </label>
                <select
                  value={investmentForm.accountName}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, accountName: e.target.value })}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="">-- Choose Account --</option>
                  {accounts.map(a => (
                    <option key={a.accountId} value={a.accountName}>
                      {a.accountName} ({formatAccountType(a.accountType)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Description / Notes</label>
                <input
                  type="text"
                  value={investmentForm.description}
                  onChange={(e) => setInvestmentForm({ ...investmentForm, description: e.target.value })}
                  className="w-full bg-white border border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold transition-all"
                  placeholder="e.g. Initial capital investment, Machinery fund"
                />
              </div>

              {/* Partner Approval Checkbox for Withdrawals */}
              {investmentForm.transactionType === 'WITHDRAWAL' && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={investmentForm.approvedByPartner}
                      onChange={(e) => setInvestmentForm({ ...investmentForm, approvedByPartner: e.target.checked })}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-[11px] font-bold text-rose-900 leading-snug">
                      I confirm that this withdrawal has been approved by the partner.
                    </span>
                  </label>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-emerald-200/40">
                <button
                  type="button"
                  onClick={() => setShowInvestmentModal(false)}
                  className="w-1/2 bg-white text-slate-700 hover:text-slate-900 rounded-xl py-2.5 text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={investmentSubmitting}
                  className={`w-1/2 text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${
                    investmentForm.transactionType === 'INVESTMENT'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20'
                      : 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/20'
                  }`}
                >
                  {investmentSubmitting ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} strokeWidth={3} />
                  )}
                  <span>{investmentForm.transactionType === 'INVESTMENT' ? 'Save Investment' : 'Post Withdrawal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
