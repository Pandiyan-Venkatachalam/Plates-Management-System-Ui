import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Search, ChevronRight, ChevronDown, Pencil, DollarSign, WalletCards, Lock, Unlock } from 'lucide-react';
import Swal from 'sweetalert2';

export default function Expense() {
  const { apiRequest } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');

  // Period Lock & Monthly Accounting States
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [lockedMonths, setLockedMonths] = useState(() => {
    try {
      const saved = localStorage.getItem('vpms_locked_months');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Form State
  const [form, setForm] = useState({
    desc: '',
    amount: '',
    accountId: ''
  });

  const loadData = () => {
    apiRequest('/expense').then(res => setExpenses(res.data)).catch(console.error);
    apiRequest('/account').then(res => setAccounts(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const isPeriodClosed = selectedMonth !== 'all' && lockedMonths.includes(selectedMonth);

  const getMonthsList = () => {
    const months = new Set();
    expenses.forEach(e => {
      const date = new Date(e.expenseDate || e.createdAt);
      if (!isNaN(date)) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        months.add(monthKey);
      }
    });
    months.add(currentMonthKey);
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  };

  const togglePeriodLock = () => {
    if (selectedMonth === 'all') return;
    
    let updated;
    if (isPeriodClosed) {
      updated = lockedMonths.filter(m => m !== selectedMonth);
      Swal.fire('Period Re-opened', `Accounting period ${selectedMonth} is now open for postings.`, 'info');
    } else {
      updated = [...lockedMonths, selectedMonth];
      Swal.fire('Period Closed', `Accounting period ${selectedMonth} has been closed. Outflows are locked.`, 'success');
    }
    setLockedMonths(updated);
    localStorage.setItem('vpms_locked_months', JSON.stringify(updated));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPeriodClosed) {
      Swal.fire('Locked', 'This accounting period is closed. Re-open to register expenses.', 'warning');
      return;
    }
    if (!form.accountId) {
      Swal.fire('Warning', 'Please select a debit account', 'warning');
      return;
    }
    const payload = {
      description: form.desc,
      amount: parseFloat(form.amount),
      accountId: parseInt(form.accountId)
    };
    try {
      if (editingId) {
        await apiRequest(`/expense/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        Swal.fire('Success', 'Expense record updated!', 'success');
      } else {
        await apiRequest('/expense/create-expense', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        Swal.fire('Success', 'Expense outflow recorded!', 'success');
      }
      setForm({ desc: '', amount: '', accountId: '' });
      setEditingId(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (e) => {
    if (isPeriodClosed) {
      Swal.fire('Locked', 'This period is closed. You cannot edit past expenses.', 'warning');
      return;
    }
    setEditingId(e.transactionId);
    setForm({
      desc: e.description,
      amount: e.amount,
      accountId: e.accountId
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    if (isPeriodClosed) {
      Swal.fire('Locked', 'This period is closed. You cannot delete locked entries.', 'warning');
      return;
    }
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this expense record?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await apiRequest(`/expense/${id}`, { method: 'DELETE' });
      Swal.fire('Deleted!', 'Expense record deleted!', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const filteredExpenses = expenses.filter(e => {
    const date = new Date(e.expenseDate || e.createdAt);
    if (selectedMonth !== 'all') {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthKey !== selectedMonth) return false;
    }

    const term = search.toLowerCase();
    return (
      e.description?.toLowerCase().includes(term) ||
      e.account?.accountName?.toLowerCase().includes(term)
    );
  });

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const totalExpenseVal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const formatMonthLabel = (key) => {
    if (key === 'all') return 'All Months';
    const [year, month] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
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
              Expenses & Outflows Report
            </span>
          </div>
        </div>

        {/* Structured KPI Metadata Strip */}
        <div className="grid grid-cols-3 gap-2 border border-slate-300 rounded-lg p-2 bg-slate-50 text-left">
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Report Date</span>
            <span className="text-[11px] font-black text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Active Ledger Month</span>
            <span className="text-[11px] font-black text-slate-900">{selectedMonth}</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Expenses</span>
            <span className="text-[11px] font-black text-rose-600">-{money(totalExpenseVal)}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}
      
      
      <section className="flex flex-col gap-1.5 sm:gap-2 print:hidden">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <span>Accounting & Finance</span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-brand-accent">Expenses Ledger</span>
        </div>
        <div className="flex justify-between items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900">
            General Expenses
          </h1>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => window.print()}
              className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              <span className="hidden sm:inline">Print Report</span>
            </button>
            <button
              onClick={togglePeriodLock}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-sm border ${
                isPeriodClosed 
                  ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                  : 'bg-[#fff7f9] border-slate-200 text-brand-accent hover:bg-slate-50'
              }`}
            >
              {isPeriodClosed ? <Unlock size={14} strokeWidth={2.5} /> : <Lock size={14} strokeWidth={2.5} />}
              <span className="hidden sm:inline">{isPeriodClosed ? 'Open Period' : 'Close Period'}</span>
            </button>
            <button 
              onClick={() => {
                if (isPeriodClosed) {
                  Swal.fire('Locked', 'This accounting period has been finalized. Open the period to register new outflows.', 'warning');
                  return;
                }
                setEditingId(null);
                setForm({ desc: '', amount: '', accountId: '' });
                setShowCreateForm(true);
              }}
              disabled={isPeriodClosed}
              className={`flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg ${
                isPeriodClosed 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none' 
                  : 'bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-brand-accent/25 hover:shadow-brand-accent/40 hover:-translate-y-0.5'
              }`}
            >
              <Plus size={14} strokeWidth={3} />
              New Expense
            </button>
          </div>
        </div>
      </section>

      {/* Period Close Alert banner */}
      {isPeriodClosed && (
        <div className="bg-rose-50 border border-rose-100 p-3 rounded-2xl flex items-center gap-2.5 text-xs text-rose-700 shadow-sm animate-fade-in print:hidden">
          <Lock size={16} className="shrink-0" />
          <span>The accounting ledger for <strong className="font-bold">{formatMonthLabel(selectedMonth)}</strong> is finalized and closed. Edits and entries are locked.</span>
        </div>
      )}

      {/* =====================================================
          STAT CARDS: 2 ON MOBILE, 3 ON DESKTOP
      ===================================================== */}
      <section className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 print:hidden">
        {/* Card 1: Total Expenses */}
        <div className="bg-[#fff7f9] rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-12 h-12 sm:w-14 sm:h-14 bg-rose-50 rounded-full transition-transform group-hover:scale-150 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 shadow-sm">
              <DollarSign size={15} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Total<br className="sm:hidden"/> Expenses</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10 truncate">{money(totalExpenseVal)}</p>
        </div>

        {/* Card 2: Closing Status */}
        <div className="bg-[#fff7f9] rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className={`absolute -right-4 -top-4 w-12 h-12 sm:w-14 sm:h-14 ${isPeriodClosed ? 'bg-rose-50' : 'bg-emerald-50'} rounded-full transition-transform group-hover:scale-150 pointer-events-none`} />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className={`flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl shadow-sm ${isPeriodClosed ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
              <WalletCards size={15} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Current<br className="sm:hidden"/> Status</p>
          </div>
          <div className="flex items-center gap-1.5 relative z-10">
            <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-black tracking-wide ${
              isPeriodClosed 
                ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
            }`}>
              {isPeriodClosed ? '🔒 Closed' : '🔓 Open'}
            </span>
          </div>
        </div>

        {/* Card 3: Active Ledger Month (Visible on Desktop alongside Outflow & Closing Status) */}
        <div className="hidden md:flex bg-[#fff7f9] rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-100 flex-col justify-center gap-1.5 relative group hover:shadow-md hover:-translate-y-0.5 transition-all">
          <div className="absolute right-0 bottom-0 w-20 h-20 bg-blue-50/50 rounded-tl-full transition-transform group-hover:scale-110 -z-0 pointer-events-none" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10">Active Ledger Month</span>
          <div className="relative w-full z-10">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="h-10 w-full appearance-none rounded-xl bg-slate-50 border border-slate-200/80 pl-3.5 pr-9 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all cursor-pointer hover:border-slate-300"
            >
              <option value="all">📅 All Months</option>
              {getMonthsList().map(m => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)} {lockedMonths.includes(m) ? '🔒 (Closed)' : '🔓 (Open)'}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </section>

      {/* =====================================================
          MOBILE VIEW: COMBINED MONTH SELECTOR & SEARCH BAR CARD
      ===================================================== */}
      <section className="block md:hidden bg-[#fff7f9] rounded-2xl p-2.5 shadow-sm border border-slate-100 space-y-2 print:hidden">
        {/* Active Ledger Month Dropdown */}
        <div className="relative w-full">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-10 w-full appearance-none rounded-xl bg-slate-50 border border-slate-200/80 pl-3.5 pr-9 text-xs font-bold text-slate-800 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all cursor-pointer"
          >
            <option value="all">📅 All Months</option>
            {getMonthsList().map(m => (
              <option key={m} value={m}>
                {formatMonthLabel(m)} {lockedMonths.includes(m) ? '🔒 (Closed)' : '🔓 (Open)'}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>

        {/* Search Input */}
        <div className="relative w-full">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expense description or account name..."
            className="h-10 w-full rounded-xl bg-slate-50 border border-slate-200/80 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all"
          />
        </div>
      </section>

      {/* =====================================================
          DESKTOP VIEW: FULL WIDTH SEARCH BAR (BELOW THE 3 CARDS)
      ===================================================== */}
      <section className="hidden md:block bg-[#fff7f9] rounded-2xl p-2.5 shadow-sm border border-slate-100 print:hidden">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search expense description or account name..."
            className="h-10 w-full rounded-xl bg-slate-50 border border-slate-100 pl-10 pr-3.5 text-sm text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 transition-all hover:bg-slate-50/80"
          />
        </div>
      </section>

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}
      <section className="hidden lg:block bg-[#fff7f9] rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
              <tr className="border-b border-slate-800">
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[44%]">Description</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[22%]">Debit Account</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[26%]">Expenses</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[8%] print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No expense records found.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((e) => (
                  <tr key={e.transactionId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3 font-bold text-slate-800 text-xs">{e.description}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-bold">
                        {e.account?.accountName || `Account #${e.accountId}`}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right font-black text-rose-500 text-xs">
                      -{money(e.amount)}
                    </td>
                    <td className="px-5 py-3 text-right print:hidden">
                      <div className="flex justify-end items-center gap-1">
                        <button 
                          onClick={() => handleEdit(e)}
                          disabled={isPeriodClosed}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isPeriodClosed 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                          }`}
                          title={isPeriodClosed ? "Period Closed" : "Edit details"}
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(e.transactionId)}
                          disabled={isPeriodClosed}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isPeriodClosed 
                              ? 'text-slate-300 cursor-not-allowed' 
                              : 'text-slate-400 hover:text-rose-600 hover:bg-slate-100'
                          }`}
                          title={isPeriodClosed ? "Period Closed" : "Delete record"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredExpenses.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                <tr className="bg-slate-100/90 hover:bg-slate-100">
                  <td colSpan={2} className="px-5 py-2.5 font-black text-slate-900 text-xs uppercase tracking-wider">
                    Total ({filteredExpenses.length} Records)
                  </td>
                  <td className="px-5 py-2.5 text-right font-black text-rose-600 text-xs">
                    -{money(totalExpenseVal)}
                  </td>
                  <td className="px-5 py-2.5 print:hidden"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* =====================================================
          MOBILE INVOICE CARDS
      ===================================================== */}
      <section className="space-y-3.5 lg:hidden">
        {filteredExpenses.length === 0 ? (
          <div className="bg-[#fff7f9] rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">
            No expense records found.
          </div>
        ) : (
          filteredExpenses.map((e) => (
            <article key={e.transactionId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-rose-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-rose-300 backdrop-blur-md border border-white/10 shadow-inner">
                      <DollarSign size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight line-clamp-1 mb-1">
                        {e.description}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-200 font-mono tracking-wider">{e.account?.accountName || `Acc #${e.accountId}`}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                        <span className="text-[10px] font-medium text-slate-300">
                          {new Date(e.expenseDate || e.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="relative z-10 shrink-0 font-mono font-black text-xs text-rose-300 bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 rounded-full backdrop-blur-md">
                    -{money(e.amount)}
                  </span>
                </div>

                {/* Card Body Details */}
                <div className="p-4 bg-white text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Debit Account:</span>
                    <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{e.account?.accountName || `Account #${e.accountId}`}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/70 divide-x divide-slate-100">
                  <button 
                    onClick={() => handleEdit(e)}
                    disabled={isPeriodClosed}
                    className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                      isPeriodClosed ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50/50'
                    }`}
                  >
                    <Pencil size={15} />
                    <span className="text-[9px] font-bold">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(e.transactionId)}
                    disabled={isPeriodClosed}
                    className={`flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                      isPeriodClosed ? 'text-slate-300 cursor-not-allowed bg-slate-50' : 'text-slate-500 hover:text-rose-600 hover:bg-rose-50/50'
                    }`}
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
                {editingId ? 'Edit Expenses' : 'Record Expenses'}
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.desc}
                  onChange={(e) => setForm({ ...form, desc: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="e.g. Electricity bill"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Debit Account</label>
                <select
                  value={form.accountId}
                  onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="">Select Account</option>
                  {accounts.map(a => <option key={a.accountId} value={a.accountId}>{a.accountName}</option>)}
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
                  <Plus size={14} strokeWidth={3} /> Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
