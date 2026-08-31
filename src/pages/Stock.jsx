import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus } from 'lucide-react';

export default function Stock() {
  const { apiRequest } = useAuth();
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [variants, setVariants] = useState([]);
  const [units, setUnits] = useState([]);
  const [activeTab, setActiveTab] = useState('products');

  const [prodForm, setProdForm] = useState({ code: '', name: '', catId: '', varId: '', unitId: '', alert: 500 });
  const [catForm, setCatForm] = useState({ name: '' });

  const loadData = () => {
    apiRequest('/product').then(res => setProducts(res.data)).catch(console.error);
    apiRequest('/batch').then(res => setBatches(res.data)).catch(console.error);
    apiRequest('/category').then(res => setCategories(res.data)).catch(console.error);
    apiRequest('/variant').then(res => setVariants(res.data)).catch(console.error);
    apiRequest('/unit').then(res => setUnits(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/product/create-product', {
        method: 'POST',
        body: JSON.stringify({
          productCode: "",
          productName: prodForm.name,
          categoryId: parseInt(prodForm.catId),
          variantId: parseInt(prodForm.varId),
          unitId: parseInt(prodForm.unitId),
          minStockAlert: parseInt(prodForm.alert)
        })
      });
      alert('Product created!');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/product/create-category', {
        method: 'POST',
        body: JSON.stringify({ categoryName: catForm.name })
      });
      alert('Category added.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
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
              Stock & Master Inventory Report
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
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Products Configured</span>
            <span className="text-[11px] font-black text-slate-900">{products.length} Products</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Batches Active</span>
            <span className="text-[11px] font-black text-blue-950">{batches.length} Batches</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center print:hidden">
        <div>
          <h2 className="font-serif text-3xl font-extrabold text-slate-800">Stock & Master Config</h2>
          <p className="text-slate-500 text-sm mt-1">Batch Tracking and Dimensions Setup</p>
        </div>
        <div className="flex bg-brand-card shadow-sm border border-slate-200 rounded-xl p-1 text-xs">
          <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'products' ? 'bg-brand-accent text-white' : 'text-slate-500 hover:text-slate-800'}`}>Products</button>
          <button onClick={() => setActiveTab('batches')} className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'batches' ? 'bg-brand-accent text-white' : 'text-slate-500 hover:text-slate-800'}`}>Batches</button>
          <button onClick={() => setActiveTab('masters')} className={`px-4 py-2 rounded-lg font-semibold transition ${activeTab === 'masters' ? 'bg-brand-accent text-white' : 'text-slate-500 hover:text-slate-800'}`}>Masters Config</button>
        </div>
      </div>

      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Products Catalog</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-900">
                <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white uppercase text-xs font-bold tracking-wider">
                  <tr className="border-b border-slate-800">
                    <th className="p-3.5 text-slate-200">Code</th>
                    <th className="p-3.5 text-slate-200">Name</th>
                    <th className="p-3.5 text-slate-200">Category</th>
                    <th className="p-3.5 text-slate-200">Stock</th>
                    <th className="p-3.5 text-right text-slate-200">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {products.map((p) => (
                    <tr key={p.productId} className="hover:bg-slate-200/40">
                      <td className="p-3.5 font-mono text-xs">{p.productCode}</td>
                      <td className="p-3.5 font-semibold text-slate-800">{p.productName} ({p.variantName})</td>
                      <td className="p-3.5 text-xs text-slate-500">{p.categoryName}</td>
                      <td className="p-3.5 font-semibold">
                        <span className={p.currentStock <= p.minStockAlert ? 'text-rose-400' : 'text-brand-accent'}>
                          {p.currentStock} {p.unitName}
                        </span>
                      </td>
                      <td className="p-3.5 text-right text-xs">
                        <span className={`px-2 py-1 rounded-full ${p.isActive ? 'bg-brand-accent text-white' : 'bg-slate-500/10 text-slate-500'}`}>
                          {p.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form onSubmit={handleCreateProduct} className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 h-fit">
            <h3 className="text-lg font-semibold text-slate-800">Add Product</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Product Name</label>
              <input type="text" value={prodForm.name} onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" placeholder="e.g. 10 Inch Round" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category</label>
              <select value={prodForm.catId} onChange={(e) => setProdForm({ ...prodForm, catId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" required>
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Variant</label>
              <select value={prodForm.varId} onChange={(e) => setProdForm({ ...prodForm, varId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" required>
                <option value="">Select Variant</option>
                {variants.map(v => <option key={v.variantId} value={v.variantId}>{v.variantName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Unit Measure</label>
              <select value={prodForm.unitId} onChange={(e) => setProdForm({ ...prodForm, unitId: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" required>
                <option value="">Select Unit</option>
                {units.map(u => <option key={u.unitId} value={u.unitId}>{u.unitName}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Min Stock Alert</label>
              <input type="number" value={prodForm.alert} onChange={(e) => setProdForm({ ...prodForm, alert: parseInt(e.target.value) })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" required />
            </div>
            <button type="submit" className="w-full bg-brand-accent hover:bg-blue-500 text-slate-800 rounded-xl py-3 font-semibold transition">
              Create Product
            </button>
          </form>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Traceable Inventory Batches</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-900">
              <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white uppercase text-xs font-bold tracking-wider">
                <tr className="border-b border-slate-800">
                  <th className="p-3.5 text-slate-200">Batch Number</th>
                  <th className="p-3.5 text-slate-200">Product</th>
                  <th className="p-3.5 text-center text-slate-200">Initial Qty</th>
                  <th className="p-3.5 text-center text-slate-200">Current Qty</th>
                  <th className="p-3.5 text-right text-slate-200">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {batches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-200/40">
                    <td className="p-3.5 font-mono text-xs text-indigo-400">{b.batchNumber}</td>
                    <td className="p-3.5 font-semibold text-slate-800">{b.productName}</td>
                    <td className="p-3.5 text-center">{b.initialQuantity}</td>
                    <td className="p-3.5 text-center font-bold text-slate-900">{b.currentQuantity}</td>
                    <td className="p-3.5 text-right">₹{b.unitCost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'masters' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <form onSubmit={handleCreateCategory} className="bg-brand-card shadow-sm border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-md font-bold text-slate-800">Create Category</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Category Name</label>
              <input type="text" value={catForm.name} onChange={(e) => setCatForm({ name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800" placeholder="Areca Plates" required />
            </div>
            <button type="submit" className="w-full bg-brand-accent hover:bg-blue-500 text-slate-800 rounded-xl py-2 text-sm font-semibold transition">
              Add Category
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
