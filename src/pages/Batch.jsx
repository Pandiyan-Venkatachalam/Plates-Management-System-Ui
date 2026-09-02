import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Sliders, Edit2, Trash2, Search, ArrowLeft, ArrowRight, Download, CalendarDays, PackageCheck, AlertCircle, TrendingUp, CheckCircle, Truck, FileText, Package, Pencil, ChevronRight, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { downloadCsvCrossPlatform } from '../utils/exportCsv';
import Swal from 'sweetalert2';
import { handlePrint } from '../utils/printHelper';
import { sortLatestFirst, markItemAsUpdated, sortBatchesBySizeAndRecency } from '../utils/sortHelper';
import { formatDateDDMMYYYY } from '../utils/dateHelper';
import { sendWhatsAppNotificationToPartners, createStockAdjustWhatsAppMessage, createNewBatchWhatsAppMessage } from '../utils/whatsappHelper';
import DateInput from '../components/DateInput';

export default function Batch() {
  const { apiRequest } = useAuth();
  const [batches, setBatches] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Sliding drawer toggle state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Pagination & Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [stockFilter, setStockFilter] = useState('instock');

  // Batch Form
  const [form, setForm] = useState({
    batchNumber: '',
    items: [{ productId: '', initialQuantity: '', unitCost: '' }],
    locationId: '',
    receivedDate: new Date().toISOString().substring(0, 10),
    status: 'FINALIZED'
  });

  const addFormItem = () => setForm({
    ...form,
    items: [...form.items, { productId: '', initialQuantity: '', unitCost: '' }]
  });

  const removeFormItem = (idx) => setForm({
    ...form,
    items: form.items.filter((_, i) => i !== idx)
  });

  const updateFormItem = (idx, field, val) => {
    setForm({
      ...form,
      items: form.items.map((item, i) => i === idx ? { ...item, [field]: val } : item)
    });
  };

  // Adjust Form
  const [adjustForm, setAdjustForm] = useState({ batchId: '', newQuantity: '', description: '' });
  const [showAdjustModal, setShowAdjustModal] = useState(false);

  const loadData = () => {
    apiRequest('/batch').then(res => setBatches(sortBatchesBySizeAndRecency(res.data || [], 'batch'))).catch(console.error);
    apiRequest('/product').then(res => setProducts(sortLatestFirst(res.data || [], ['productId', 'id'], 'product'))).catch(console.error);
    
    apiRequest('/category').then(res => {
      const cats = Array.isArray(res.data) ? res.data : [];
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

      // Default to Domestic Plates category on initial load (not all categories)
      const domesticCat = sortedCats.find(c => (c.categoryName || c.name || '').toLowerCase().includes('domestic'));
      if (domesticCat) {
        setSelectedCategory(prev => (!prev || prev === 'all' ? String(domesticCat.categoryId || domesticCat.id) : prev));
      } else if (sortedCats.length > 0) {
        setSelectedCategory(prev => (!prev ? String(sortedCats[0].categoryId || sortedCats[0].id) : prev));
      }
    }).catch(console.error);

    apiRequest('/location')
      .catch(() => apiRequest('/location/get-all-locations'))
      .then(res => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setLocations(res.data);
        } else if (Array.isArray(res) && res.length > 0) {
          setLocations(res);
        } else {
          setLocations([{ locationId: 1, locationName: 'Main Godown' }]);
        }
      })
      .catch(() => setLocations([{ locationId: 1, locationName: 'Main Godown' }]));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBatch = async (e) => {
    e.preventDefault();
    try {
      const locId = parseInt(form.locationId || locations[0]?.locationId || 1);
      if (editingId) {
        const item = form.items[0];
        const qty = parseInt(item.initialQuantity);
        const cost = parseFloat(item.unitCost);
        const originalBatch = batches.find(b => b.batchId === editingId);
        let finalInitialQty = originalBatch ? originalBatch.initialQuantity : qty;
        if (originalBatch && originalBatch.initialQuantity === originalBatch.currentQuantity) {
          finalInitialQty = qty;
        }
        const payload = {
          batchNumber: form.batchNumber,
          productId: parseInt(item.productId),
          initialQuantity: finalInitialQty,
          currentQuantity: qty,
          unitCost: cost,
          locationId: locId,
          receivedDate: new Date(form.receivedDate).toISOString(),
          landedUnitCost: cost,
          totalLandedCost: finalInitialQty * cost,
          status: form.status
        };
        await apiRequest(`/batch/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        markItemAsUpdated('batch', editingId);
        Swal.fire('Success', 'Batch updated successfully!', 'success');
      } else {
        // Create multiple batches sharing same batch number
        for (const item of form.items) {
          const initQty = parseInt(item.initialQuantity);
          const cost = parseFloat(item.unitCost);
          const payload = {
            batchNumber: form.batchNumber,
            productId: parseInt(item.productId),
            initialQuantity: initQty,
            currentQuantity: initQty,
            unitCost: cost,
            locationId: locId,
            receivedDate: new Date(form.receivedDate).toISOString(),
            landedUnitCost: cost,
            totalLandedCost: initQty * cost,
            status: form.status
          };
          await apiRequest('/batch', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        }
        
        // Automated WhatsApp Notification for new stock batches
        form.items.forEach(item => {
          const prod = products.find(p => String(p.productId) === String(item.productId));
          const prodName = prod?.productName || 'Plate Batch';
          const waMsg = createNewBatchWhatsAppMessage({
            batchNumber: form.batchNumber,
            productName: prodName,
            quantity: item.initialQuantity,
            unitCost: item.unitCost,
            handledBy: 'Admin'
          });
          sendWhatsAppNotificationToPartners(apiRequest, {
            message: waMsg,
            eventType: 'STOCK_CREATE',
            referenceId: form.batchNumber,
            category: 'STOCK',
            actionType: 'CREATE',
            performedBy: 'Admin'
          });
        });

        Swal.fire('Success', 'Stock batches created & Partners notified via WhatsApp!', 'success');
      }
      setForm({
        batchNumber: '',
        items: [{ productId: '', initialQuantity: '', unitCost: '' }],
        locationId: '',
        receivedDate: new Date().toISOString().substring(0, 10),
        status: 'FINALIZED'
      });
      setEditingId(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (b) => {
    setEditingId(b.batchId);
    setForm({
      batchNumber: b.batchNumber,
      items: [{
        productId: b.productId ? String(b.productId) : '',
        initialQuantity: b.currentQuantity,
        unitCost: b.unitCost
      }],
      locationId: b.locationId ? String(b.locationId) : '',
      receivedDate: new Date(b.receivedDate).toISOString().substring(0, 10),
      status: b.status
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This batch will be permanently deleted!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await apiRequest(`/batch/${id}`, { method: 'DELETE' });
      Swal.fire('Deleted!', 'Batch has been deleted successfully.', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/batch/adjust', {
        method: 'POST',
        body: JSON.stringify({
          batchId: parseInt(adjustForm.batchId),
          newQuantity: parseInt(adjustForm.newQuantity),
          description: adjustForm.description
        })
      });
      markItemAsUpdated('batch', adjustForm.batchId);

      // Automated WhatsApp notification for stock adjustment
      const currentBatch = batches.find(b => String(b.batchId) === String(adjustForm.batchId));
      const waMsg = createStockAdjustWhatsAppMessage({
        batchNumber: currentBatch?.batchNumber || `Batch #${adjustForm.batchId}`,
        productName: currentBatch?.productName || 'Plate Item',
        oldQuantity: currentBatch?.currentQuantity || 0,
        newQuantity: adjustForm.newQuantity,
        reason: adjustForm.description,
        handledBy: 'Admin'
      });
      sendWhatsAppNotificationToPartners(apiRequest, {
        message: waMsg,
        eventType: 'STOCK_ADJUST',
        referenceId: String(adjustForm.batchId),
        category: 'STOCK',
        actionType: 'ADJUST',
        performedBy: 'Admin'
      });

      Swal.fire('Success', 'Stock adjusted & Partners notified via WhatsApp!', 'success');
      setShowAdjustModal(false);
      setAdjustForm({ batchId: '', newQuantity: '', description: '' });
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const filteredBatches = sortBatchesBySizeAndRecency(
    batches.filter(b => {
      if (stockFilter === 'instock' && b.currentQuantity <= 0) return false;
      if (stockFilter === 'outofstock' && b.currentQuantity > 0) return false;
      
      if (selectedCategory && selectedCategory !== 'all') {
        const prod = products.find(p => p.productId === b.productId);
        const batchCatId = b.categoryId || prod?.categoryId;
        const batchCatName = b.categoryName || prod?.categoryName;
        const targetCat = categories.find(c => String(c.categoryId || c.id) === String(selectedCategory));
        const targetCatName = targetCat?.categoryName || targetCat?.name;
        
        const matchesCatId = batchCatId && String(batchCatId) === String(selectedCategory);
        const matchesCatName = targetCatName && batchCatName && batchCatName.toLowerCase() === targetCatName.toLowerCase();
        
        if (!matchesCatId && !matchesCatName) {
          return false;
        }
      }

      const term = searchTerm.toLowerCase();
      return (
        (b.batchNumber && b.batchNumber.toLowerCase().includes(term)) ||
        (b.productName && b.productName.toLowerCase().includes(term)) ||
        (b.supplierName && b.supplierName.toLowerCase().includes(term))
      );
    }),
    ['batchId', 'id'],
    'batch'
  );

  const totalPages = Math.ceil(filteredBatches.length / 10) || 1;
  const paginatedBatches = filteredBatches.slice((currentPage - 1) * 10, currentPage * 10);

  const handlePrintPDF = () => {
    handlePrint();
  };

  const downloadCSV = async () => {
    const rows = [
      ['Date', 'Batch No', 'Product', 'Supplier', 'Initial Qty', 'Current Qty', 'Unit Cost', 'Status'],
      ...filteredBatches.map(b => [
        formatDateDDMMYYYY(b.receivedDate),
        b.batchNumber || '-',
        b.productName || 'Unknown',
        b.supplierName || 'Unknown',
        b.initialQuantity || 0,
        b.currentQuantity || 0,
        b.unitCost || 0,
        b.status || 'UNKNOWN'
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `Batch_Report_${new Date().getTime()}.csv`;
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
              Stock Batches Inventory Report
            </span>
          </div>
        </div>

        {/* Structured KPI Metadata Strip */}
        <div className="grid grid-cols-4 gap-2 border border-slate-300 rounded-lg p-2 bg-slate-50 text-left">
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Report Date</span>
            <span className="text-[11px] font-black text-slate-900">{formatDateDDMMYYYY(new Date())}</span>
          </div>
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Batches</span>
            <span className="text-[11px] font-black text-slate-900">{filteredBatches.length} Records</span>
          </div>
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">In-Stock Batches</span>
            <span className="text-[11px] font-black text-blue-950">{filteredBatches.filter(b => b.currentQuantity > 0).length} Batches</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Units Stocked</span>
            <span className="text-[11px] font-black text-emerald-700">{filteredBatches.reduce((s, b) => s + (b.currentQuantity || 0), 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          HEADER
      ========================================================= */}
      <section className="flex flex-row justify-between items-center gap-2 print:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-accent uppercase mb-1">
            <span>Products & Stock</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-slate-400 truncate">Stock Batches</span>
          </div>
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900 truncate">
            Inventory Ledger
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
              onClick={handlePrintPDF}
              className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl px-2 sm:px-3 py-2 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 9V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v5"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>
              <span className="hidden xs:inline">Print Report</span>
            </button>
          
          <button 
              onClick={() => {
                setEditingId(null);
                setForm({
                  batchNumber: '',
                  items: [{ productId: '', initialQuantity: '', unitCost: '' }],
                  locationId: '',
                  receivedDate: new Date().toISOString().substring(0, 10),
                  status: 'FINALIZED'
                });
                setShowCreateForm(true);
              }}
              className="flex shrink-0 items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg bg-gradient-to-r from-brand-accent to-blue-600 text-white shadow-brand-accent/25 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
            >
              <Plus size={14} strokeWidth={3} />
              New Batch
            </button>
          </div>
      </section>

      {/* =====================================================
          FILTER BAR
      ===================================================== */}
      <section className="bg-[#fff7f9] rounded-2xl p-2.5 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 print:hidden items-stretch lg:items-center justify-between">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search batch number, product name, supplier..."
            className="h-10 sm:h-9 w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-row gap-2 w-full lg:w-auto">
          {/* Category Dropdown Filter - Default to Domestic Plates */}
          <div className="relative w-full lg:w-56">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
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

          {/* Stock Filter Dropdown */}
          <div className="relative w-full lg:w-44">
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 sm:h-9 w-full rounded-xl bg-slate-50 border border-slate-100 px-3 pr-8 text-xs text-slate-800 font-medium focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Batches</option>
              <option value="instock">In Stock Only</option>
              <option value="outofstock">Out of Stock Only</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[15%]">Batch No</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[32%]">Product Name</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[15%]">Landed Cost</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[30%]">Current / Initial</th>
                <th className="px-3 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest text-right whitespace-nowrap w-[8%] print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedBatches.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-8 text-center text-slate-400 text-sm">
                    No batches found.
                  </td>
                </tr>
              ) : (
                paginatedBatches.map((b) => (
                  <tr key={b.batchId} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-[10px] text-slate-500 block">{b.batchNumber}</span>
                      <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{formatDateDDMMYYYY(b.receivedDate)}</span>
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-800 text-xs">{b.productName}</td>
                    <td className="px-5 py-3 text-right text-xs text-slate-600 font-mono">₹{b.landedUnitCost?.toFixed(2)}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md font-mono text-[10px] font-bold ${
                        b.currentQuantity === 0 
                          ? 'bg-slate-100 text-slate-400' 
                          : 'bg-emerald-50 text-emerald-600'
                      }`}>
                        {b.currentQuantity} / {b.initialQuantity}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right print:hidden">
                      <div className="flex justify-end items-center gap-1">
                        <button
                          onClick={() => {
                            setAdjustForm({ batchId: b.batchId, newQuantity: b.currentQuantity, description: '' });
                            setShowAdjustModal(true);
                          }}
                          className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors mr-2"
                          title="Adjust Stock"
                        >
                          Adjust
                        </button>
                        <button 
                          onClick={() => handleEdit(b)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Edit details"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(b.batchId)}
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
            {paginatedBatches.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                <tr className="bg-slate-100/90 hover:bg-slate-100">
                  <td colSpan={2} className="px-5 py-2.5 font-black text-slate-900 text-xs uppercase tracking-wider">
                    Total ({filteredBatches.length} Batches)
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-slate-600 text-xs">
                    In Stock:
                  </td>
                  <td className="px-5 py-2.5 text-right font-black text-emerald-700 text-xs font-mono">
                    {filteredBatches.reduce((s, b) => s + (Number(b.currentQuantity) || 0), 0).toLocaleString()} / {filteredBatches.reduce((s, b) => s + (Number(b.initialQuantity) || 0), 0).toLocaleString()} pcs
                  </td>
                  <td className="px-5 py-2.5 print:hidden"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-xs bg-slate-50/50">
            <span className="text-slate-500 font-medium">
              Page <strong className="text-slate-800 font-bold">{currentPage}</strong> of <strong className="text-slate-800 font-bold">{totalPages}</strong> ({filteredBatches.length} items)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg p-1.5 transition-colors shadow-sm disabled:opacity-40"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg p-1.5 transition-colors shadow-sm disabled:opacity-40"
              >
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =====================================================
          MOBILE INVOICE CARDS
      ===================================================== */}
      <section className="space-y-3.5 lg:hidden">
        {paginatedBatches.length === 0 ? (
          <div className="bg-[#fff7f9] rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100 shadow-sm">
            No batches found.
          </div>
        ) : (
          paginatedBatches.map((b) => (
            <article 
              key={b.batchId} 
              className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden"
            >
              <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-inner">
                      <Package size={20} className="text-blue-300" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white leading-tight mb-0.5">
                        {b.productName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-blue-200 font-mono tracking-wider">{b.batchNumber}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                        <span className="text-[10px] font-medium text-slate-300">{formatDateDDMMYYYY(b.receivedDate)}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`relative z-10 inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md border ${
                    b.currentQuantity > 0 
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {b.currentQuantity > 0 ? `${b.currentQuantity.toLocaleString()} pcs` : 'Depleted'}
                  </span>
                </div>

                {/* Card Body Details */}
                <div className="p-4 bg-white text-xs space-y-2.5 text-slate-600">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Location:</span>
                    <span className="font-bold text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{b.locationName || 'Main Godown'}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-400">Landed Cost:</span>
                    <span className="font-mono font-bold text-slate-800">₹{b.landedUnitCost?.toFixed(2)} / pc</span>
                  </div>

                  {/* Stock Level Indicator */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">Inventory Level</span>
                      <span className={`font-mono ${b.currentQuantity <= 0 ? 'text-rose-500 font-black' : 'text-slate-800'}`}>
                        {b.currentQuantity} / {b.initialQuantity} pcs
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          b.currentQuantity / (b.initialQuantity || 1) > 0.4 
                            ? 'bg-gradient-to-r from-blue-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-amber-500 to-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(0, (b.currentQuantity / (b.initialQuantity || 1)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="grid grid-cols-3 bg-slate-50/70 border-t border-slate-100 divide-x divide-slate-100">
                  <button
                    onClick={() => {
                      setAdjustForm({ batchId: b.batchId, newQuantity: b.currentQuantity, description: '' });
                      setShowAdjustModal(true);
                    }}
                    className="flex flex-col items-center justify-center gap-1 py-3 transition-colors text-slate-500 hover:text-emerald-600 hover:bg-emerald-50/50"
                  >
                    <Sliders size={15} />
                    <span className="text-[9px] font-bold">Adjust</span>
                  </button>
                  <button 
                    onClick={() => handleEdit(b)}
                    className="flex flex-col items-center justify-center gap-1 py-3 transition-colors text-slate-500 hover:text-blue-600 hover:bg-blue-50/50"
                  >
                    <Pencil size={15} />
                    <span className="text-[9px] font-bold">Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(b.batchId)}
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
          RECORD BATCH OVERLAY MODAL (Sliding Drawer Layout)
      ===================================================== */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-md max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-pink-200/40 pb-3 mb-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingId ? 'Edit Stock Batch' : 'Direct Batch Intake'}
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

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Batch Number</label>
                <input
                  type="text"
                  value={form.batchNumber}
                  onChange={(e) => setForm({ ...form, batchNumber: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  placeholder="e.g. BATCH-12"
                  required
                />
              </div>

              {editingId && (() => {
                const ob = batches.find(b => b.batchId === editingId);
                return ob ? (
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 my-2">
                    <div className="text-xs">
                      <span className="text-slate-500 font-medium">Current Stock:</span>
                      <span className="text-slate-900 font-bold ml-1">{ob.currentQuantity}</span>
                    </div>
                    <div className="w-px h-3 bg-slate-300"></div>
                    <div className="text-xs">
                      <span className="text-slate-500 font-medium">Initial:</span>
                      <span className="text-slate-900 font-bold ml-1">{ob.initialQuantity}</span>
                    </div>
                  </div>
                ) : null;
              })()}

              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Items</label>
                  {!editingId && (
                    <button type="button" onClick={addFormItem} className="text-[10px] text-brand-accent hover:text-blue-700 font-bold uppercase tracking-wider">
                      + Add Item
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  {form.items.map((item, idx) => (
                    <div key={idx} className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl space-y-2 relative">
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeFormItem(idx)} className="absolute top-2 right-2 text-slate-400 hover:text-rose-500">
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div>
                        <select
                          value={item.productId}
                          onChange={(e) => updateFormItem(idx, 'productId', e.target.value)}
                          className="w-full bg-[#fff7f9] border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.productId} value={p.productId}>{p.productName} ({p.variantName})</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={item.initialQuantity}
                          onChange={(e) => updateFormItem(idx, 'initialQuantity', e.target.value)}
                          className="w-full bg-[#fff7f9] border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                          placeholder="Qty"
                          required
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitCost}
                          onChange={(e) => updateFormItem(idx, 'unitCost', e.target.value)}
                          className="w-full bg-[#fff7f9] border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                          placeholder="Cost (₹)"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Godown Location</label>
                <select
                  value={form.locationId}
                  onChange={(e) => setForm({ ...form, locationId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                >
                  <option value="">Select Location</option>
                  {locations.map(l => <option key={l.locationId} value={l.locationId}>{l.locationName}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Received Date</label>
                <DateInput
                  value={form.receivedDate}
                  onChange={(e) => setForm({ ...form, receivedDate: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/20 rounded-xl px-4 py-2.5 transition-all h-11"
                  textClassName="text-sm font-bold text-slate-900"
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
                  {editingId ? 'Save' : 'Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Dialog Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <form onSubmit={handleAdjustSubmit} className="bg-[#ffeef1] border border-pink-200/80 max-w-sm w-full rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">Adjust Stock Quantity</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">New Physical Quantity</label>
              <input
                type="number"
                value={adjustForm.newQuantity}
                onChange={(e) => setAdjustForm({ ...adjustForm, newQuantity: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Adjustment Description</label>
              <input
                type="text"
                value={adjustForm.description}
                onChange={(e) => setAdjustForm({ ...adjustForm, description: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                placeholder="e.g. Damage count update"
                required
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustModal(false)}
                className="w-1/2 bg-[#fff7f9] text-slate-700 hover:text-slate-900 rounded-xl py-3 text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-gradient-to-r from-brand-accent to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 hover:-translate-y-0.5"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
