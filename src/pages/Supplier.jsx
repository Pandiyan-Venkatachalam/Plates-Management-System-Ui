import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, Search, ChevronRight, Pencil } from 'lucide-react';
import Swal from 'sweetalert2';
import { handlePrint } from '../utils/printHelper';
import { sortLatestFirst, markItemAsUpdated } from '../utils/sortHelper';
import { formatDateDDMMYYYY } from '../utils/dateHelper';

export default function Supplier() {
  const { apiRequest } = useAuth();
  const [suppliers, setSuppliers] = useState([]);
  const [form, setForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [editingId, setEditingId] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');

  const loadData = () => {
    apiRequest('/supplier').then(res => setSuppliers(sortLatestFirst(res.data, ['supplierId', 'id'], 'supplier'))).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      supplierName: form.name,
      phone: form.phone,
      email: form.email,
      address: form.address
    };
    try {
      if (editingId) {
        await apiRequest(`/supplier/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        markItemAsUpdated('supplier', editingId);
        Swal.fire('Success', 'Supplier updated!', 'success');
      } else {
        await apiRequest('/supplier/create-supplier', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        Swal.fire('Success', 'Supplier registered!', 'success');
      }
      setForm({ name: '', phone: '', email: '', address: '' });
      setEditingId(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.supplierId);
    setForm({
      name: s.supplierName,
      phone: s.phone || '',
      email: s.email || '',
      address: s.address || ''
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this supplier profile?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await apiRequest(`/supplier/${id}`, { method: 'DELETE' });
      Swal.fire('Deleted!', 'Supplier deleted!', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const filteredSuppliers = sortLatestFirst(
    suppliers.filter(s => 
      s.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
      s.phone?.includes(search)
    ),
    ['supplierId', 'id'],
    'supplier'
  );

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
              Suppliers Directory Report
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
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Registered Suppliers</span>
            <span className="text-[11px] font-black text-slate-900">{filteredSuppliers.length} Suppliers</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}
      <section className="flex flex-col gap-1.5 sm:gap-2 print:hidden">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-accent uppercase mb-1">
            <span>Customers & Suppliers</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-slate-400 truncate">Suppliers Directory</span>
          </div>
        <div className="flex justify-between items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900">
            Supplier Profiles
          </h1>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-3 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              <span className="hidden sm:inline">Print Report</span>
            </button>
            <button 
              onClick={() => {
                setEditingId(null);
                setForm({ name: '', phone: '', email: '', address: '' });
                setShowCreateForm(true);
              }}
              className="flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-brand-accent/25 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
            >
              <Plus size={14} strokeWidth={3} />
              New Supplier
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
            placeholder="Search supplier name or phone number..."
            className="h-9 w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
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
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-1/4">Name</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-1/4">Phone</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Address</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No supplier records found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s) => (
                  <tr key={s.supplierId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3 font-bold text-slate-800 text-xs">{s.supplierName}</td>
                    <td className="px-5 py-3 font-mono text-[11px] text-slate-600">{s.phone || 'N/A'}</td>
                    <td className="px-5 py-3 text-slate-600 text-xs">{s.address || 'N/A'}</td>
                    <td className="px-5 py-3 text-right print:hidden">
                      <div className="flex justify-end items-center gap-1">
                        <button 
                          onClick={() => handleEdit(s)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Edit details"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(s.supplierId)}
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
      <section className="space-y-3.5 lg:hidden">
        {filteredSuppliers.length === 0 ? (
          <div className="bg-[#fff7f9] rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">
            No supplier records found.
          </div>
        ) : (
          filteredSuppliers.map((s) => (
            <article key={s.supplierId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-inner">
                      <span className="font-black text-base text-blue-300 font-mono">{(s.supplierName || 'S')[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight mb-0.5">
                        {s.supplierName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-200 font-mono tracking-wider">SPLR-{s.supplierId}</span>
                      </div>
                    </div>
                  </div>
                  <span className="relative z-10 inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
                    Vendor
                  </span>
                </div>

                {/* Card Body Details */}
                <div className="p-4 bg-white text-xs space-y-2 text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Phone:</span> 
                    <span className="font-mono font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{s.phone || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-400">Address:</span> 
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">{s.address || 'N/A'}</span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="grid grid-cols-2 bg-slate-50/70 border-t border-slate-100 divide-x divide-slate-100">
                  <button 
                    onClick={() => handleEdit(s)}
                    className="flex flex-col items-center justify-center gap-1 py-3 transition-colors text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    <Pencil size={15} />
                    <span className="text-[9px] font-bold">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(s.supplierId)}
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
                {editingId ? 'Edit Supplier Profile' : 'Register Supplier'}
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Supplier Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="e.g. Organic Raw Suppliers"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Contact Phone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="e.g. supplier@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Business Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all h-20"
                  placeholder="e.g. Coimbatore, Tamil Nadu"
                />
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
                  {editingId ? 'Save' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
