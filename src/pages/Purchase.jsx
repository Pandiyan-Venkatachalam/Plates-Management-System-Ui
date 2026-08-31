import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Trash2, Edit2, Search, CalendarDays, ChevronDown, 
  ChevronRight, FileText, CircleDollarSign, WalletCards, 
  TrendingUp, Eye, Pencil, CheckCircle
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function Purchase() {
  const { apiRequest } = useAuth();
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  // Modal / Form toggle state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filter State
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');

  // Form State
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 0, unitCost: 0 }]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [accountName, setAccountName] = useState('Cash');
  const [editingId, setEditingId] = useState(null);

  const loadData = () => {
    apiRequest('/purchase').then(res => setPurchases(res.data)).catch(console.error);
    apiRequest('/supplier').then(res => setSuppliers(res.data)).catch(console.error);
    apiRequest('/product').then(res => setProducts(res.data)).catch(console.error);
    apiRequest('/account').then(res => setAccounts(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItemRow = () => setItems([...items, { productId: '', quantity: 0, unitCost: 0 }]);
  const removeItemRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, val) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  // Filter Logic
  const filteredPurchases = purchases.filter(p => {
    const matchesSearch = !search ||
      (p.supplierName && p.supplierName.toLowerCase().includes(search.toLowerCase())) ||
      (p.purchaseId && `PUR-${p.purchaseId}`.toLowerCase().includes(search.toLowerCase()));

    const purchaseDate = new Date(p.purchaseDate).setHours(0, 0, 0, 0);
    const matchesFrom = !fromDate || purchaseDate >= new Date(fromDate).setHours(0, 0, 0, 0);
    const matchesTo = !toDate || purchaseDate <= new Date(toDate).setHours(0, 0, 0, 0);

    // Balance filters: 'all', 'paid' (balance == 0), 'due' (balance > 0)
    let matchesBalance = true;
    if (balanceFilter === 'paid') {
      matchesBalance = (p.balanceAmount <= 0);
    } else if (balanceFilter === 'due') {
      matchesBalance = (p.balanceAmount > 0);
    }

    return matchesSearch && matchesFrom && matchesTo && matchesBalance;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      Swal.fire('Warning', 'Please select a supplier', 'warning');
      return;
    }
    const payload = {
      supplierId: parseInt(supplierId),
      purchaseDate: new Date().toISOString(),
      details: items.map(i => ({
        productId: parseInt(i.productId),
        quantity: parseInt(i.quantity),
        unitCost: parseFloat(i.unitCost)
      })),
      expenses: [],
      paidAmount: parseFloat(paidAmount),
      paymentMethodAccountName: accountName
    };
    try {
      if (editingId) {
        await apiRequest(`/purchase/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            purchaseId: editingId,
            supplierId: parseInt(supplierId),
            purchaseDate: new Date().toISOString(),
            details: items.map(i => ({
              productId: parseInt(i.productId),
              quantity: parseInt(i.quantity),
              unitCost: parseFloat(i.unitCost)
            })),
            totalAmount: totalCost,
            paidAmount: parseFloat(paidAmount),
            paymentStatus: parseFloat(paidAmount) >= totalCost ? 'PAID' : parseFloat(paidAmount) > 0 ? 'PARTIAL' : 'UNPAID',
            status: 'COMPLETED'
          })
        });
        Swal.fire('Success', 'Purchase updated!', 'success');
      } else {
        await apiRequest('/purchase/create-purchase', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        Swal.fire('Success', 'Purchase recorded and stock added!', 'success');
      }
      setItems([{ productId: '', quantity: 0, unitCost: 0 }]);
      setSupplierId('');
      setPaidAmount(0);
      setEditingId(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.purchaseId);
    setSupplierId(p.supplierId ? String(p.supplierId) : '');
    setPaidAmount(p.paidAmount);
    setItems(p.details && p.details.length > 0 ? p.details.map(d => ({
      productId: d.productId ? String(d.productId) : '',
      quantity: d.quantity,
      unitCost: d.unitCost
    })) : [{ productId: '', quantity: 0, unitCost: 0 }]);
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this purchase?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await apiRequest(`/purchase/${id}`, { method: 'DELETE' });
      Swal.fire('Success', 'Purchase deleted successfully!', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const money = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  // Totals calculations
  const totalPurchasesVal = filteredPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPaidVal = filteredPurchases.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalDueVal = filteredPurchases.reduce((sum, p) => sum + p.balanceAmount, 0);

  const getProductSizeStr = (productId) => {
    const prod = products.find(p => p.productId === productId);
    return prod ? prod.variantName : '';
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
              Purchases & Inward Orders Report
            </span>
          </div>
        </div>

        {/* Structured KPI Metadata Strip */}
        <div className="grid grid-cols-4 gap-2 border border-slate-300 rounded-lg p-2 bg-slate-50 text-left">
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Report Date</span>
            <span className="text-[11px] font-black text-slate-900">{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Purchases</span>
            <span className="text-[11px] font-black text-slate-900">{filteredPurchases.length} Records</span>
          </div>
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Cost</span>
            <span className="text-[11px] font-black text-blue-950">{money(totalPurchasesVal)}</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Due</span>
            <span className="text-[11px] font-black text-rose-600">{money(totalDueVal)}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}
      <section className="flex flex-col gap-1.5 sm:gap-2 print:hidden">
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-widest">
          <span>Operations</span>
          <ChevronRight size={12} className="text-slate-400" />
          <span className="text-brand-accent">Purchase Ledger</span>
        </div>
        <div className="flex justify-between items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900">
            Purchase Management
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
              onClick={() => {
                setEditingId(null);
                setSupplierId('');
                setItems([{ productId: '', quantity: 0, unitCost: 0 }]);
                setPaidAmount(0);
                setShowCreateForm(true);
              }}
              className="flex shrink-0 items-center justify-center gap-1.5 bg-gradient-to-r from-brand-accent to-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-brand-accent/25 hover:shadow-brand-accent/40 hover:-translate-y-0.5 transition-all"
            >
              <Plus size={14} strokeWidth={3} />
              New Purchase
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Total Purchases Count */}
        <div className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-100 text-blue-600">
              <FileText size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Purchases</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{filteredPurchases.length}</p>
        </div>

        {/* Total Purchases Cost */}
        <div className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-emerald-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600">
              <CircleDollarSign size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Cost</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(totalPurchasesVal)}</p>
        </div>

        {/* Paid */}
        <div className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-indigo-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-100 text-indigo-600">
              <WalletCards size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Paid</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(totalPaidVal)}</p>
        </div>

        {/* Due */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-2.5 sm:p-4 shadow-sm border border-rose-400 flex flex-col hover:shadow-md hover:-translate-y-0.5 transition-all relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-white/10 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-white/20 text-white">
              <TrendingUp size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-white/80 uppercase tracking-widest leading-tight">Outstanding<br/>Due</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-white tracking-tight relative z-10">{money(totalDueVal)}</p>
        </div>
      </section>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}
      <section className="bg-[#fff7f9] rounded-2xl p-2 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 print:hidden">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers, PUR codes..."
            className="h-9 w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {/* Date Picker Range Inputs */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-3 h-9 w-full sm:w-auto">
            <CalendarDays size={13} className="text-slate-400 hidden sm:block" />
            <input
              type="date"
              value={fromDate}
              onChange={e => setFromDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none flex-1 min-w-[110px] sm:w-[125px] sm:flex-none pl-1"
            />
            <span className="text-slate-300 text-[10px] shrink-0">-</span>
            <input
              type="date"
              value={toDate}
              onChange={e => setToDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none flex-1 min-w-[110px] sm:w-[125px] sm:flex-none pl-1"
            />
          </div>

          {/* Status Dropdown */}
          <div className="relative w-full sm:w-auto">
            <select
              value={balanceFilter}
              onChange={e => setBalanceFilter(e.target.value)}
              className="h-9 appearance-none w-full rounded-xl bg-slate-50 border border-slate-100 pl-3 pr-8 text-[11px] font-medium text-slate-700 focus:outline-none focus:border-brand-accent transition-all min-w-[110px]"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid Only</option>
              <option value="due">Outstanding Due</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
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
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[10%]">Invoice #</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[20%]">Supplier</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[21%]">Items</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[12%]">Total Cost</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[12%]">Paid</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[13%]">Balance</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-center whitespace-nowrap w-[12%]">Status</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[8%] print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No purchases found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.purchaseId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-mono text-[10px] font-medium whitespace-nowrap">
                        PUR-{p.purchaseId}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-bold text-slate-800 text-xs truncate">{p.supplierName}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {p.details?.map((d, i) => {
                          const sizeStr = getProductSizeStr(d.productId);
                          return (
                            <span key={i} className="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-600 whitespace-nowrap">
                              {sizeStr ? sizeStr.replace(/[^0-9]/g, '') : '?'}" × {d.quantity}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-black text-slate-900 text-xs whitespace-nowrap">{money(p.totalAmount)}</td>
                    <td className="px-3 py-2 text-right font-bold text-slate-600 text-xs whitespace-nowrap">{money(p.paidAmount)}</td>
                    <td className={`px-3 py-2 text-right font-black text-xs whitespace-nowrap ${p.balanceAmount > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                      {money(p.balanceAmount)}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider whitespace-nowrap ${
                        p.balanceAmount <= 0
                          ? "bg-emerald-100 text-emerald-700"
                          : p.paidAmount > 0
                            ? "bg-amber-100 text-amber-700"
                            : "bg-rose-100 text-rose-700"
                      }`}>
                        {p.balanceAmount <= 0 ? "Paid" : p.paidAmount > 0 ? "Partial" : "Due"}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-right print:hidden">
                      <div className="flex justify-end items-center gap-1">
                        <button onClick={() => setSelectedPurchase(p)} className="p-1.5 text-slate-400 hover:text-brand-accent hover:bg-slate-100 rounded-lg transition-colors" title="View details">
                          <Eye size={14} />
                        </button>
                        <button onClick={() => handleEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors" title="Edit details">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => handleDelete(p.purchaseId)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors" title="Delete purchase">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredPurchases.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                <tr className="bg-slate-100/90 hover:bg-slate-100">
                  <td colSpan={3} className="px-5 py-2.5 font-black text-slate-900 text-xs uppercase tracking-wider">
                    Total ({filteredPurchases.length} Purchases)
                  </td>
                  <td className="px-5 py-2.5 text-right font-black text-slate-900 text-xs">
                    {money(totalPurchasesVal)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-slate-700 text-xs">
                    {money(filteredPurchases.reduce((s, x) => s + (Number(x.paidAmount) || 0), 0))}
                  </td>
                  <td className={`px-5 py-2.5 text-right font-black text-xs ${totalDueVal > 0 ? "text-rose-600" : "text-emerald-700"}`}>
                    {money(totalDueVal)}
                  </td>
                  <td className="px-5 py-2.5 text-center font-bold text-slate-600 text-xs">
                    -
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
      <section className="space-y-3 lg:hidden">
        {filteredPurchases.length === 0 ? (
          <div className="bg-[#fff7f9] rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">
            No purchases found.
          </div>
        ) : (
          filteredPurchases.map((invoice) => (
            <article key={invoice.purchaseId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-inner">
                      <FileText size={18} className="text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-none mb-1">
                        {invoice.supplierName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-200 font-mono tracking-wider">PUR-{invoice.purchaseId}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                        <span className="text-[10px] font-medium text-slate-300">
                          {new Date(invoice.purchaseDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`relative z-10 inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border ${
                    invoice.balanceAmount <= 0
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : invoice.paidAmount > 0
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                  }`}>
                    {invoice.balanceAmount <= 0 ? "Paid" : invoice.paidAmount > 0 ? "Partial" : "Due"}
                  </span>
                </div>

                {/* Financial Summary */}
                <div className="grid grid-cols-3 gap-2 px-4 py-3.5 bg-white">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total</p>
                    <p className="mt-0.5 text-sm font-black text-slate-900">{money(invoice.totalAmount)}</p>
                  </div>
                  <div className="border-l border-slate-100 pl-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Paid</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-600">{money(invoice.paidAmount)}</p>
                  </div>
                  <div className="border-l border-slate-100 pl-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Balance</p>
                    <p className={`mt-0.5 text-sm font-black ${invoice.balanceAmount > 0 ? "text-rose-500" : "text-emerald-500"}`}>{money(invoice.balanceAmount)}</p>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="mx-4 mb-3.5 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Order Items</p>
                    <p className="text-[9px] font-bold text-slate-500">
                      {invoice.details?.reduce((sum, d) => sum + d.quantity, 0) || 0} Total Qty
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {invoice.details?.map((d, idx) => {
                      const sizeStr = getProductSizeStr(d.productId);
                      return (
                        <div key={idx} className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">{sizeStr ? sizeStr.replace(/[^0-9]/g, '') : '?'}" Plate</span>
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 font-medium">{d.quantity} pcs</span>
                            <span className="font-bold text-slate-800">{money(d.quantity * d.unitCost)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/70 divide-x divide-slate-100">
                <button 
                  onClick={() => setSelectedPurchase(invoice)}
                  className="flex flex-col items-center justify-center gap-1 py-3 text-slate-500 hover:text-brand-accent hover:bg-blue-50/50 transition-colors"
                >
                  <Eye size={15} />
                  <span className="text-[9px] font-bold">View</span>
                </button>
                
                <button 
                  onClick={() => handleEdit(invoice)}
                  className="flex flex-col items-center justify-center gap-1 py-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 transition-colors"
                >
                  <Pencil size={15} />
                  <span className="text-[9px] font-bold">Edit</span>
                </button>

                <button 
                  onClick={() => handleDelete(invoice.purchaseId)}
                  className="flex flex-col items-center justify-center gap-1 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
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
          RECORD PURCHASE OVERLAY MODAL (Sliding Drawer Layout)
      ===================================================== */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-md max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-pink-200/40 pb-3 mb-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingId ? `Edit Purchase PUR-${editingId}` : 'Record Purchase'}
              </h3>
              <button 
                onClick={() => setShowCreateForm(false)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Supplier</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none transition-all"
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.supplierName}</option>)}
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Items</label>
                  <button type="button" onClick={addItemRow} className="text-[10px] flex items-center gap-1 text-brand-accent hover:text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded-lg transition-colors">
                    <Plus size={12} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {items.map((item, idx) => (
                    <div key={idx} className="bg-[#fff7f9] border border-slate-200 p-3.5 rounded-xl space-y-3 relative shadow-sm">
                      {items.length > 1 && (
                        <button type="button" onClick={() => removeItemRow(idx)} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div>
                        <select
                          value={item.productId}
                          onChange={(e) => updateItem(idx, 'productId', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.productId} value={p.productId}>{p.productName} ({p.variantName})</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                          placeholder="Qty"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => updateItem(idx, 'unitCost', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                          placeholder="Cost (₹)"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-widest">Total Price:</span>
                  <span className="text-slate-900">₹{totalCost?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                  <span className="uppercase tracking-widest">Balance Amt:</span>
                  <span className="font-black text-base">₹{parseFloat((totalCost - (parseFloat(paidAmount) || 0)).toFixed(2))?.toLocaleString()}</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paid Amount (₹)</label>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(totalCost)}
                      className="text-[10px] font-bold text-brand-accent hover:text-blue-600 transition-colors"
                    >
                      [ Full Pay ]
                    </button>
                  </div>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Payment Account</label>
                  <select
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                    required
                  >
                    {accounts.map(a => <option key={a.accountId} value={a.accountName}>{a.accountName}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-3.5 border-t border-pink-200/40">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="w-1/2 bg-[#fff7f9] text-slate-700 hover:text-slate-900 rounded-xl py-3 text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="w-1/2 bg-gradient-to-r from-brand-accent to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
                >
                  {editingId ? <><Edit2 size={14}/> Update</> : <><CheckCircle size={14}/> Post</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details View Modal */}
      {selectedPurchase && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#ffeef1] border border-pink-200/80 max-w-md w-full rounded-2xl p-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedPurchase(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
            >
              ✕
            </button>
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-4 flex items-center gap-2">
              <FileText size={18} className="text-brand-accent" /> 
              Purchase Details: PUR-{selectedPurchase.purchaseId}
            </h3>
            
            <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4 mb-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mb-1">Supplier</p>
                <p className="text-slate-900 font-bold">{selectedPurchase.supplierName}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mb-1">Purchase Date</p>
                <p className="text-slate-900 font-bold">{new Date(selectedPurchase.purchaseDate).toLocaleDateString()}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mb-1">Status</p>
                <p className={`font-black uppercase tracking-widest text-[10px] ${
                  selectedPurchase.balanceAmount <= 0
                    ? "text-emerald-600"
                    : selectedPurchase.paidAmount > 0
                      ? "text-amber-600"
                      : "text-rose-600"
                }`}>
                  {selectedPurchase.balanceAmount <= 0 ? "Paid" : selectedPurchase.paidAmount > 0 ? "Partial" : "Due"}
                </p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="text-slate-400 text-[9px] uppercase font-bold tracking-widest mb-1">Balance </p>
                <p className={`font-black ${selectedPurchase.balanceAmount > 0 ? "text-rose-500" : "text-slate-900"}`}>
                  {money(selectedPurchase.balanceAmount)}
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <h4 className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Order Items</h4>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {selectedPurchase.details?.map((d, i) => {
                  const prod = products.find(prodItem => prodItem.productId === d.productId);
                  return (
                    <div key={i} className="bg-[#fff7f9] border border-slate-100 p-3 rounded-xl flex justify-between items-center text-xs shadow-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                        <p className="text-slate-700 font-bold">{prod ? `${prod.productName} (${prod.variantName})` : `Product #${d.productId}`}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="text-slate-400 font-medium">{d.quantity} units</span>
                        <span className="text-slate-900 font-black">{money(d.quantity * d.unitCost)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex justify-between items-center">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Total Amount:</span>
              <span className="text-slate-900 font-black text-lg">{money(selectedPurchase.totalAmount)}</span>
            </div>
            
            <div className="flex justify-end pt-4 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedPurchase(null)}
                className="px-6 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-xl font-bold text-xs transition-colors"
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
