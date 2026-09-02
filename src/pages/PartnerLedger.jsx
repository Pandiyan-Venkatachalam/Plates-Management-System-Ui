import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, X, Search, FileText, ChevronRight, Download, Users, Eye, Pencil, Trash2, CheckCircle2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import { Capacitor } from '@capacitor/core';
import { downloadCsvCrossPlatform } from '../utils/exportCsv';
import { handlePrint } from '../utils/printHelper';
import { sortLatestFirst, markItemAsUpdated } from '../utils/sortHelper';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../utils/dateHelper';

const fmt = (val) => `\u20B9${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PartnerLedger() {
  const { apiRequest } = useAuth();
  const [ledgers, setLedgers] = useState([]);
  const [partners, setPartners] = useState([]);
  const [accounts, setAccounts] = useState([]);

  // Form State
  const [form, setForm] = useState({
    partnerId: '',
    transactionType: 'INVESTMENT',
    amount: '',
    description: '',
    accountName: '',
    approvedByPartner: false
  });
  
  const [editingId, setEditingId] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    apiRequest('/partnerledger').then(res => setLedgers(sortLatestFirst(res.data, ['ledgerId', 'id'], 'partnerledger'))).catch(console.error);
    apiRequest('/partner').then(res => setPartners(sortLatestFirst(res.data, ['partnerId', 'id'], 'partner'))).catch(console.error);
    apiRequest('/account').then(res => {
      const accs = Array.isArray(res.data) ? res.data : [];
      setAccounts(accs);
      if (accs.length > 0) {
        setForm(prev => ({
          ...prev,
          accountName: prev.accountName && accs.some(a => a.accountName === prev.accountName) ? prev.accountName : accs[0].accountName
        }));
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      partnerId: partners.length > 0 ? partners[0].partnerId : '',
      transactionType: 'INVESTMENT',
      amount: '',
      description: '',
      accountName: accounts.length > 0 ? accounts[0].accountName : '',
      approvedByPartner: false
    });
    setShowCreateForm(true);
  };

  const handleEdit = (item) => {
    setEditingId(item.ledgerId);
    setForm({
      partnerId: item.partnerId || '',
      transactionType: item.transactionType || 'INVESTMENT',
      amount: item.amount || '',
      description: item.description || '',
      accountName: accounts.length > 0 ? accounts[0].accountName : '',
      approvedByPartner: true
    });
    if (viewItem) setViewItem(null);
    setShowCreateForm(true);
  };

  const handleView = (item) => {
    setViewItem(item);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete this partner transaction record?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;

    try {
      await apiRequest(`/partnerledger/${id}`, { method: 'DELETE' });
      Swal.fire('Deleted!', 'Transaction deleted successfully.', 'success');
      if (viewItem?.ledgerId === id) setViewItem(null);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.partnerId) {
      Swal.fire('Warning', 'Please select a partner', 'warning');
      return;
    }
    if (form.transactionType === 'WITHDRAWAL' && !form.approvedByPartner) {
      Swal.fire('Warning', "Withdrawals require partner's approval. Please confirm and check the approval checkbox.", 'warning');
      return;
    }

    try {
      if (editingId) {
        const payload = {
          partnerId: parseInt(form.partnerId),
          transactionType: form.transactionType,
          amount: parseFloat(form.amount),
          description: form.description
        };
        await apiRequest(`/partnerledger/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        markItemAsUpdated('partnerledger', editingId);
        Swal.fire('Success', 'Partner transaction updated successfully!', 'success');
      } else {
        const payload = {
          partnerId: parseInt(form.partnerId),
          transactionType: form.transactionType,
          amount: parseFloat(form.amount),
          description: form.description,
          accountName: form.accountName
        };
        await apiRequest('/partnerledger/create-transaction', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        Swal.fire('Success', 'Partner transaction posted successfully!', 'success');
      }

      setForm({
        partnerId: partners.length > 0 ? partners[0].partnerId : '',
        transactionType: 'INVESTMENT',
        amount: '',
        description: '',
        accountName: accounts.length > 0 ? accounts[0].accountName : '',
        approvedByPartner: false
      });
      setEditingId(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const filteredLedgers = sortLatestFirst(
    ledgers.filter(l => 
      l.partnerName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      l.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    ['ledgerId', 'id'],
    'partnerledger'
  );

  const downloadCSV = async () => {
    const rows = [
      ['Date', 'Partner', 'Type', 'Amount', 'Description'],
      ...filteredLedgers.map(l => [
        formatDateDDMMYYYY(l.createdAt),
        l.partnerName || `Partner #${l.partnerId}`,
        l.transactionType || 'UNKNOWN',
        l.amount || 0,
        l.description || '-'
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `PartnerLedger_Report_${new Date().getTime()}.csv`;
    await downloadCsvCrossPlatform(csv, filename);
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
              Partners Capital Ledger Report
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
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Transactions</span>
            <span className="text-[11px] font-black text-slate-900">{filteredLedgers.length} Records</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Ledger Amount</span>
            <span className="text-[11px] font-black text-blue-950">₹{filteredLedgers.reduce((s, l) => s + (Number(l.amount) || 0), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}
      {/* =========================================================
          HEADER
      ========================================================= */}
      <section className="flex flex-row justify-between items-center gap-2 print:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-accent uppercase mb-1">
            <span>Partner Management</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-slate-400 truncate">Capital Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900 truncate">
            Partners Capital Ledger
          </h1>
        </div>
        <div className="flex gap-2 shrink-0">
          
            <button
              onClick={downloadCSV}
              className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-2 sm:px-3 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download size={14} className="text-slate-400" />
              <span className="hidden xs:inline">Download CSV</span>
            </button>
          
          
            <button
              onClick={handlePrint}
              className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-2 sm:px-3 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              <span className="hidden xs:inline">Print Report</span>
            </button>
          
          <button 
              onClick={openCreateModal}
              className="flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-brand-accent/25 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
            >
              <Plus size={14} strokeWidth={3} />
              Post Transaction
            </button>
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
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search partner name or description..."
            className="h-9 w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
          />
        </div>
      </section>

      {/* =====================================================
      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}
      <section className="hidden lg:block print:block bg-[#fff7f9] rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:border-none print:shadow-none print:bg-transparent">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:table-fixed">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
              <tr className="border-b border-slate-800">
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[24%] print:w-[24%] print:text-left">Partner</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[12%] print:w-[14%] print:text-center">Type</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap text-right w-[16%] print:w-[18%] print:text-right">Amount</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[24%] print:w-[30%] print:text-left">Description</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap text-right w-[12%] print:w-[14%] print:text-right">Date</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap text-center w-[12%] print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLedgers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                filteredLedgers.map((l) => (
                  <tr key={l.ledgerId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3 font-bold text-slate-800 text-xs print:text-left">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-black shrink-0 print:hidden">
                          {(l.partnerName || 'P')[0]?.toUpperCase()}
                        </div>
                        <span className="truncate">{l.partnerName || `Partner #${l.partnerId}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 print:text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-bold print:border print:px-1.5 print:py-0.5 ${
                        l.transactionType === 'INVESTMENT' ? 'bg-emerald-50 text-emerald-600 print:text-emerald-700 print:border-emerald-200' : 'bg-rose-50 text-rose-600 print:text-rose-700 print:border-rose-200'
                      }`}>
                        {l.transactionType}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-800 text-xs text-right print:text-right">{fmt(l.amount)}</td>
                    <td className="px-5 py-3 text-xs text-slate-600 print:text-left">{l.description || '-'}</td>
                    <td className="px-5 py-3 font-mono text-[10px] font-bold text-slate-500 text-right print:text-right">{formatDateDDMMYYYY(l.createdAt)}</td>
                    <td className="px-5 py-3 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleView(l)}
                          title="View Details"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          onClick={() => handleEdit(l)}
                          title="Edit Transaction"
                          className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(l.ledgerId)}
                          title="Delete Transaction"
                          className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredLedgers.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                <tr className="bg-slate-100/90 hover:bg-slate-100">
                  <td colSpan={2} className="px-5 py-2.5 font-black text-slate-900 text-xs uppercase tracking-wider print:text-left">
                    Total ({filteredLedgers.length} Transactions)
                  </td>
                  <td className="px-5 py-2.5 text-right font-black text-slate-900 text-xs font-mono print:text-right">
                    {fmt(filteredLedgers.reduce((s, l) => s + (Number(l.amount) || 0), 0))}
                  </td>
                  <td className="px-5 py-2.5 print:text-left"></td>
                  <td className="px-5 py-2.5 print:text-right"></td>
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
      <section className="space-y-3.5 lg:hidden print:hidden">
        {filteredLedgers.length === 0 ? (
          <div className="bg-[#fff7f9] rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">
            No transactions found.
          </div>
        ) : (
          filteredLedgers.map((l) => (
            <article key={l.ledgerId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-300 backdrop-blur-md border border-white/10 shadow-inner">
                      <Users size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight mb-0.5">
                        {l.partnerName || `Partner #${l.partnerId}`}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-300 font-mono tracking-wider">{formatDateDDMMYYYY(l.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`relative z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border ${
                    l.transactionType === 'INVESTMENT' 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {l.transactionType}
                  </span>
                </div>

                {/* Card Body Details */}
                <div className="p-4 bg-white text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Transaction Amount:</span> 
                    <span className="font-mono font-black text-sm text-slate-900">{fmt(l.amount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Description:</span> 
                    <span className="font-semibold text-slate-700">{l.description || '-'}</span>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="border-t border-slate-100 px-3 py-2 bg-slate-50/80 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Actions</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleView(l)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60 transition flex items-center gap-1"
                    >
                      <Eye size={11} />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => handleEdit(l)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60 transition flex items-center gap-1"
                    >
                      <Pencil size={11} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(l.ledgerId)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 transition flex items-center gap-1"
                    >
                      <Trash2 size={11} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* =====================================================
          VIEW TRANSACTION MODAL
      ===================================================== */}
      {viewItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-5 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white/10 text-blue-300 flex items-center justify-center font-black text-lg">
                  {(viewItem.partnerName || 'P')[0]?.toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-white leading-tight">
                    {viewItem.partnerName || `Partner #${viewItem.partnerId}`}
                  </h3>
                  <div className="text-xs text-blue-300 font-medium">Transaction #{viewItem.ledgerId}</div>
                </div>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="text-slate-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Amount Highlight */}
              <div className={`rounded-xl p-4 text-center border ${
                viewItem.transactionType === 'INVESTMENT' 
                  ? 'bg-emerald-50/70 border-emerald-200/70' 
                  : 'bg-rose-50/70 border-rose-200/70'
              }`}>
                <span className={`text-[10px] font-black uppercase tracking-widest block mb-1 ${
                  viewItem.transactionType === 'INVESTMENT' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {viewItem.transactionType}
                </span>
                <div className={`text-2xl font-black font-mono ${
                  viewItem.transactionType === 'INVESTMENT' ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {fmt(viewItem.amount)}
                </div>
              </div>

              {/* Details List */}
              <div className="bg-slate-50 rounded-xl p-3.5 space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-bold">Partner Name</span>
                  <span className="text-slate-800 font-black">{viewItem.partnerName || `Partner #${viewItem.partnerId}`}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-bold">Transaction Type</span>
                  <span className={`font-black ${viewItem.transactionType === 'INVESTMENT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {viewItem.transactionType}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                  <span className="text-slate-400 font-bold">Date & Time</span>
                  <span className="text-slate-700 font-mono font-bold">{formatDateTimeDDMMYYYY(viewItem.createdAt)}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-400 font-bold block mb-1">Description / Memo</span>
                  <p className="text-slate-700 font-medium bg-white rounded-lg p-2.5 border border-slate-200/70 text-xs">
                    {viewItem.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleEdit(viewItem)}
                  className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Pencil size={13} />
                  <span>Edit Transaction</span>
                </button>
                <button
                  onClick={() => handleDelete(viewItem.ledgerId)}
                  className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          RECORD / EDIT TRANSACTION MODAL
      ===================================================== */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-md max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-pink-200/40 pb-3 mb-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                {editingId ? <Pencil size={16} className="text-amber-600" /> : <Plus size={16} className="text-brand-accent" />}
                <span>{editingId ? 'Edit Partner Transaction' : 'Post Equity Transaction'}</span>
              </h3>
              <button 
                onClick={() => { setShowCreateForm(false); setEditingId(null); }}
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Partner</label>
                <select
                  value={form.partnerId}
                  onChange={(e) => setForm({ ...form, partnerId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="">Select Partner</option>
                  {partners.map(p => <option key={p.partnerId} value={p.partnerId}>{p.partnerName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Action Type</label>
                <select
                  value={form.transactionType}
                  onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="INVESTMENT">INVESTMENT</option>
                  <option value="WITHDRAWAL">WITHDRAWAL</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="e.g. 50000"
                  required
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Physical Account Mapping</label>
                  <select
                    value={form.accountName}
                    onChange={(e) => setForm({ ...form, accountName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                    required
                  >
                    {accounts.map(a => <option key={a.accountId} value={a.accountName}>{a.accountName}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Memo / Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="Initial Capital investment..."
                  required
                />
              </div>

              {form.transactionType === 'WITHDRAWAL' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="approvedByPartner"
                    checked={form.approvedByPartner}
                    onChange={(e) => setForm({ ...form, approvedByPartner: e.target.checked })}
                    className="w-4 h-4 bg-[#fff7f9] border border-slate-200 rounded focus:ring-brand-accent cursor-pointer"
                    required
                  />
                  <label htmlFor="approvedByPartner" className="text-[10px] text-slate-500 font-bold select-none cursor-pointer uppercase tracking-widest">
                    Confirm Partners' Approval Received
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-3.5 border-t border-pink-200/40">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); setEditingId(null); }}
                  className="w-1/2 bg-[#fff7f9] text-slate-700 hover:text-slate-900 rounded-xl py-3 text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-gradient-to-r from-brand-accent to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
                >
                  {editingId ? <CheckCircle2 size={14} /> : <Plus size={14} strokeWidth={3} />}
                  <span>{editingId ? 'Save Changes' : 'Submit Transaction'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW PARTNER TRANSACTION VOUCHER MODAL
      ========================================================= */}
      {viewItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-lg max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-pink-200/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Partner Capital Voucher</h3>
                  <span className="text-[10px] font-mono text-slate-500">TXN-{viewItem.ledgerId}</span>
                </div>
              </div>
              <button
                onClick={() => setViewItem(null)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#fff7f9] p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Partner Name:</span>
                <span className="font-black text-slate-900">{viewItem.partnerName || `Partner #${viewItem.partnerId}`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Transaction Date:</span>
                <span className="font-mono text-slate-800">{formatDateDDMMYYYY(viewItem.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Transaction Type:</span>
                <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md ${
                  viewItem.transactionType === 'INVESTMENT'
                    ? 'bg-emerald-100 text-emerald-700'
                    : viewItem.transactionType === 'WITHDRAWAL'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-blue-700'
                }`}>
                  {viewItem.transactionType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Amount:</span>
                <span className="font-mono font-black text-sm text-slate-900">{fmt(viewItem.amount)}</span>
              </div>
            </div>

            {viewItem.description && (
              <div className="p-3 rounded-xl bg-[#fff7f9] border border-slate-200 text-xs text-slate-600">
                <strong className="block text-[10px] uppercase text-slate-400 font-bold mb-1">Description / Memo:</strong>
                {viewItem.description}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewItem(null)}
                className="px-6 py-2 bg-[#fff7f9] text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-xl font-bold text-xs border border-slate-200 transition-colors shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
