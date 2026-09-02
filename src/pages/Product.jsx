import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Edit2, Trash2, Search, ChevronRight, ChevronDown, FileText, 
  CircleDollarSign, Layers, Package, Eye, Pencil
} from 'lucide-react';
import Swal from 'sweetalert2';
import { handlePrint } from '../utils/printHelper';
import { sortProductsBySizeAndRecency, sortLatestFirst, markItemAsUpdated } from '../utils/sortHelper';
import { formatDateDDMMYYYY } from '../utils/dateHelper';
import { sendWhatsAppNotificationToPartners, createProductWhatsAppMessage } from '../utils/whatsappHelper';

export default function Product() {
  const { apiRequest } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [units, setUnits] = useState([]);

  const [form, setForm] = useState({ name: '', catId: '', varId: '', unitId: '', alert: 1000 });
  const [editingId, setEditingId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const loadData = () => {
    apiRequest('/product').then(res => setProducts(sortProductsBySizeAndRecency(res.data, 'product'))).catch(console.error);
    
    apiRequest('/category').then(res => {
      const cats = Array.isArray(res.data) ? res.data : [];
      // Sort categories: Domestic first, Export second, then others
      const sortedCats = [...cats].sort((a, b) => {
        const aName = (a.categoryName || a.name || '').toLowerCase();
        const bName = (b.categoryName || b.name || '').toLowerCase();
        const aDom = aName.includes('domestic') ? 1 : 0;
        const bDom = bName.includes('domestic') ? 1 : 0;
        if (aDom !== bDom) return bDom - aDom;
        const aExp = aName.includes('export') ? 1 : 0;
        const bExp = bName.includes('export') ? 1 : 0;
        if (aExp !== bExp) return bExp - aExp;
        return (b.categoryId || b.id || 0) - (a.categoryId || a.id || 0);
      });
      setCategories(sortedCats);

      // Default to Domestic Plates category on initial load
      const domesticCat = sortedCats.find(c => (c.categoryName || c.name || '').toLowerCase().includes('domestic'));
      if (domesticCat) {
        setSelectedCategory(prev => (!prev || prev === 'all' ? String(domesticCat.categoryId || domesticCat.id) : prev));
      } else if (sortedCats.length > 0) {
        setSelectedCategory(prev => (!prev ? String(sortedCats[0].categoryId || sortedCats[0].id) : prev));
      }
    }).catch(console.error);

    apiRequest('/variant').then(res => setVariants(sortLatestFirst(res.data, ['variantId', 'id'], 'variant'))).catch(console.error);
    apiRequest('/unit').then(res => setUnits(sortLatestFirst(res.data, ['unitId', 'id'], 'unit'))).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      productCode: "",
      productName: form.name,
      categoryId: parseInt(form.catId),
      variantId: parseInt(form.varId),
      unitId: parseInt(form.unitId),
      minStockAlert: parseInt(form.alert)
    };
    try {
      if (editingId) {
        await apiRequest(`/product/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        markItemAsUpdated('product', editingId);
        Swal.fire('Success', 'Product updated!', 'success');
      } else {
        await apiRequest('/product', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        const cat = categories.find(c => String(c.categoryId) === String(form.catId));
        const vr = variants.find(v => String(v.variantId) === String(form.varId));
        const waMsg = createProductWhatsAppMessage({
          productName: form.name,
          categoryName: cat?.categoryName || 'Domestic Plates',
          variantName: vr?.variantName || 'Standard',
          handledBy: 'Admin'
        });
        sendWhatsAppNotificationToPartners(apiRequest, {
          message: waMsg,
          eventType: 'PRODUCT_CREATE',
          referenceId: form.name,
          category: 'PRODUCT',
          actionType: 'CREATE',
          performedBy: 'Admin'
        });

        Swal.fire('Success', 'Product created & Partners alerted via WhatsApp!', 'success');
      }
      setForm({ name: '', catId: '', varId: '', unitId: '', alert: 1000 });
      setEditingId(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.productId);
    setForm({
      name: p.productName,
      catId: p.categoryId,
      varId: p.variantId,
      unitId: p.unitId,
      alert: p.minStockAlert
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this product listing?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await apiRequest(`/product/${id}`, { method: 'DELETE' });
      Swal.fire('Deleted!', 'Product deleted!', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  // Products filtered by selected category and ordered by plate size (12" -> 10" -> 8" -> ...)
  const filteredProducts = sortProductsBySizeAndRecency(
    products.filter(p => {
      if (selectedCategory && selectedCategory !== 'all' && String(p.categoryId) !== String(selectedCategory)) {
        return false;
      }
      const term = search.toLowerCase();
      return (
        p.productName?.toLowerCase().includes(term) ||
        p.productCode?.toLowerCase().includes(term) ||
        p.categoryName?.toLowerCase().includes(term) ||
        p.variantName?.toLowerCase().includes(term)
      );
    }),
    'product'
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
              Products Catalog Report
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
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Catalog Products</span>
            <span className="text-[11px] font-black text-slate-900">{filteredProducts.length} Products</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}
      <section className="flex flex-col gap-1.5 sm:gap-2 print:hidden">
        <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-accent uppercase mb-1">
            <span>Products & Stock</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-slate-400 truncate">Products Master</span>
          </div>
        <div className="flex justify-between items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900">
            Products Catalog
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
                setForm({ name: '', catId: '', varId: '', unitId: '', alert: 1000 });
                setShowCreateForm(true);
              }}
              className="flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-brand-accent/25 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
            >
              <Plus size={14} strokeWidth={3} />
              New Product
            </button>
          </div>
        </div>
      </section>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}
      <section className="bg-[#fff7f9] rounded-2xl p-2.5 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-2 print:hidden items-stretch sm:items-center justify-between">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search product code, name, variant or category..."
            className="h-10 sm:h-9 w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
          />
        </div>

        <div className="relative w-full sm:w-56 shrink-0">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="h-10 sm:h-9 w-full rounded-xl bg-slate-50 border border-slate-100 px-3 pr-8 text-xs text-slate-800 font-bold focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all appearance-none cursor-pointer truncate"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.categoryId || c.id} value={c.categoryId || c.id}>
                {c.categoryName || c.name}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Code</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Product Name</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Category</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap">Stock Level</th>
                <th className="px-5 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No product records found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.productId} className={`hover:bg-slate-50/80 transition-colors group ${isLowStock ? 'bg-rose-50/30' : ''}`}>
                      <td className="px-5 py-3 font-mono font-bold text-[10px] text-slate-500">{p.productCode}</td>
                      <td className="px-5 py-3 font-bold text-slate-800 text-xs">
                        {p.productName} <span className="text-slate-400 font-normal">({p.variantName})</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 text-xs">{p.categoryName}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-bold ${
                          isLowStock 
                            ? 'bg-rose-100 text-rose-700' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.currentStock} {p.unitName} {isLowStock && ' (Low)'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right print:hidden">
                        <div className="flex justify-end items-center gap-1">
                          <button 
                            onClick={() => handleEdit(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Edit details"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(p.productId)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =====================================================
          MOBILE INVOICE CARDS
      ===================================================== */}
      <section className="space-y-3.5 lg:hidden">
        {filteredProducts.length === 0 ? (
          <div className="bg-[#fff7f9] rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">
            No product records found.
          </div>
        ) : (
          filteredProducts.map((p) => {
            const isLowStock = p.currentStock <= p.minStockAlert;
            return (
              <article key={p.productId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
                <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                  {/* Effective Colored Card Header */}
                  <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                    <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                    <div className="flex items-center gap-3 relative z-10">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-inner ${isLowStock ? 'text-rose-300' : 'text-blue-300'}`}>
                        <Package size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white leading-tight mb-0.5">
                          {p.productName} <span className="text-slate-300 font-normal text-xs">({p.variantName})</span>
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-200 font-mono tracking-wider">{p.productCode}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`relative z-10 inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider backdrop-blur-md border ${
                      isLowStock 
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>

                  {/* Card Body Details */}
                  <div className="p-4 bg-white text-xs space-y-2 text-slate-600">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-400">Category:</span>
                      <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{p.categoryName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-400">Available Stock:</span>
                      <span className={`font-mono font-bold ${isLowStock ? 'text-rose-600 font-black' : 'text-slate-800'}`}>{p.currentStock} {p.unitName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-400">Min Stock Alert:</span>
                      <span className="font-mono text-slate-500">{p.minStockAlert} {p.unitName}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="grid grid-cols-2 bg-slate-50/70 border-t border-slate-100 divide-x divide-slate-100">
                    <button 
                      onClick={() => handleEdit(p)}
                      className="flex flex-col items-center justify-center gap-1 py-3 transition-colors text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                    >
                      <Pencil size={15} />
                      <span className="text-[9px] font-bold">Edit</span>
                    </button>
                    <button 
                      onClick={() => handleDelete(p.productId)}
                      className="flex flex-col items-center justify-center gap-1 py-3 transition-colors text-slate-500 hover:text-rose-600 hover:bg-rose-50/50"
                    >
                      <Trash2 size={15} />
                      <span className="text-[9px] font-bold">Delete</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })
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
                {editingId ? 'Edit Product Catalog' : 'Create Product Entry'}
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Product Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="e.g. 10 Inch Round"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Category</label>
                <select
                  value={form.catId}
                  onChange={(e) => setForm({ ...form, catId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Variant (Sizing)</label>
                <select
                  value={form.varId}
                  onChange={(e) => setForm({ ...form, varId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="">Select Variant</option>
                  {variants.map(v => <option key={v.variantId} value={v.variantId}>{v.variantName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Unit Measure</label>
                <select
                  value={form.unitId}
                  onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                >
                  <option value="">Select Unit</option>
                  {units.map(u => <option key={u.unitId} value={u.unitId}>{u.unitName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Min Stock Alert Trigger Threshold</label>
                <input
                  type="number"
                  value={form.alert}
                  onChange={(e) => setForm({ ...form, alert: parseInt(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
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
                  {editingId ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
