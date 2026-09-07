import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Trash2, Edit2, Search, CalendarDays, ChevronDown, 
  ChevronRight, FileText, ShoppingCart, TrendingUp, MoreHorizontal, 
  Pencil, Eye, CheckCircle2, Download, Clock, AlertCircle, 
  ArrowRight, Printer, Sparkles, CheckCheck, X, FileEdit, 
  ClipboardCheck, ArrowRightLeft
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import Swal from 'sweetalert2';
import { downloadCsvCrossPlatform } from '../utils/exportCsv';
import { handlePrint } from '../utils/printHelper';
import { sortLatestFirst, markItemAsUpdated } from '../utils/sortHelper';
import { getCurrentMonthRange, getPresetDateRange, isDateInRange, formatDateDDMMYYYY } from '../utils/dateHelper';
import SearchableCustomerSelect from '../components/SearchableCustomerSelect';
import DateInput from '../components/DateInput';

const fmt = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const money = (val) => `₹${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function SalesOrder({ onNavigateToSale }) {
  const { apiRequest } = useAuth();
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [batches, setBatches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  // Selected Order for View Modal or Convert Modal
  const [viewOrder, setViewOrder] = useState(null);
  const [convertModalOrder, setConvertModalOrder] = useState(null);
  const [convertAllocations, setConvertAllocations] = useState([]);
  const [convertPaidAmount, setConvertPaidAmount] = useState(0);
  const [convertAccountName, setConvertAccountName] = useState('Cash');
  const [converting, setConverting] = useState(false);

  // Modal / Form toggle state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Filters state
  const initialDates = getCurrentMonthRange();
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState(initialDates.fromDate);
  const [toDate, setToDate] = useState(initialDates.toDate);
  const [datePreset, setDatePreset] = useState('thisMonth');
  const [statusFilter, setStatusFilter] = useState('DRAFT');

  // Form State
  const [form, setForm] = useState({
    customerId: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    priority: 'NORMAL',
    status: 'DRAFT',
    notes: '',
    details: [{ productId: '', orderedQuantity: 1, sellingPrice: 0 }]
  });

  const loadData = () => {
    apiRequest('/order').then(res => setOrders(sortLatestFirst(res.data, ['orderId', 'id'], 'order'))).catch(console.error);
    apiRequest('/customer').then(res => setCustomers(sortLatestFirst(res.data, ['customerId', 'id'], 'customer'))).catch(console.error);
    apiRequest('/product').then(res => setProducts(res.data)).catch(console.error);
    apiRequest('/batch').then(res => setBatches(res.data || [])).catch(console.error);
    apiRequest('/account').then(res => {
      const accs = Array.isArray(res.data) ? res.data : [];
      setAccounts(accs);
      if (accs.length > 0) {
        setConvertAccountName(prev => accs.some(a => a.accountName === prev) ? prev : accs[0].accountName);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProductSizeStr = (productId) => {
    const prod = products.find(p => p.productId === productId);
    return prod ? (prod.variantName || prod.productName) : '';
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm({
      customerId: customers.length > 0 ? customers[0].customerId : '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      priority: 'NORMAL',
      status: 'DRAFT',
      notes: '',
      details: [{ productId: products.length > 0 ? products[0].productId : '', orderedQuantity: 1, sellingPrice: 0 }]
    });
    setShowCreateForm(true);
  };

  const handleEdit = (order) => {
    if (order.status === 'CONVERTED') {
      Swal.fire('Info', 'This order has already been converted to a finalized sale and cannot be edited.', 'info');
      return;
    }
    setEditingId(order.orderId);
    setForm({
      customerId: order.customerId,
      orderDate: order.orderDate ? order.orderDate.split('T')[0] : new Date().toISOString().split('T')[0],
      expectedDate: order.expectedDate ? order.expectedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      priority: order.priority || 'NORMAL',
      status: order.status || 'DRAFT',
      notes: order.notes || '',
      details: order.details && order.details.length > 0 
        ? order.details.map(d => ({ productId: d.productId, orderedQuantity: d.orderedQuantity, sellingPrice: d.sellingPrice }))
        : [{ productId: products[0]?.productId || '', orderedQuantity: 1, sellingPrice: 0 }]
    });
    setShowCreateForm(true);
  };

  const addItemRow = () => {
    setForm(prev => ({
      ...prev,
      details: [...prev.details, { productId: products[0]?.productId || '', orderedQuantity: 1, sellingPrice: 0 }]
    }));
  };

  const removeItemRow = (idx) => {
    setForm(prev => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== idx)
    }));
  };

  const updateItem = (idx, field, val) => {
    setForm(prev => ({
      ...prev,
      details: prev.details.map((item, i) => i === idx ? { ...item, [field]: val } : item)
    }));
  };

  const calculateFormTotal = () => {
    return form.details.reduce((sum, item) => sum + ((parseFloat(item.orderedQuantity) || 0) * (parseFloat(item.sellingPrice) || 0)), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customerId) {
      Swal.fire('Warning', 'Please select a customer', 'warning');
      return;
    }
    if (form.details.some(d => !d.productId || parseFloat(d.orderedQuantity) <= 0)) {
      Swal.fire('Warning', 'Please provide valid products and quantities (greater than 0).', 'warning');
      return;
    }

    try {
      const payload = {
        customerId: parseInt(form.customerId),
        orderDate: new Date(form.orderDate).toISOString(),
        expectedDate: new Date(form.expectedDate).toISOString(),
        priority: form.priority,
        status: form.status,
        notes: form.notes,
        details: form.details.map(d => ({
          productId: parseInt(d.productId),
          orderedQuantity: parseInt(d.orderedQuantity),
          sellingPrice: parseFloat(d.sellingPrice) || 0
        }))
      };

      if (editingId) {
        await apiRequest(`/order/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        markItemAsUpdated('order', editingId);
        Swal.fire('Success', 'Order updated successfully!', 'success');
      } else {
        await apiRequest('/order', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        Swal.fire('Success', 'Order draft created successfully!', 'success');
      }
      setShowCreateForm(false);
      setEditingId(null);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleDelete = async (orderId) => {
    const res = await Swal.fire({
      title: 'Delete Sales Order?',
      text: 'Are you sure you want to cancel and remove this booking order?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#ef4444'
    });

    if (res.isConfirmed) {
      try {
        await apiRequest(`/order/${orderId}`, { method: 'DELETE' });
        Swal.fire('Deleted', 'Order has been removed.', 'success');
        loadData();
      } catch (err) {
        Swal.fire('Error', err.message || 'Failed to delete order', 'error');
      }
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await apiRequest(`/order/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      markItemAsUpdated('order', orderId);
      Swal.fire('Updated', `Order status updated to ${newStatus}`, 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message || 'Failed to update order status', 'error');
    }
  };

  const openConvertModal = (order) => {
    setConvertModalOrder(order);
    setConvertPaidAmount(order.totalAmount || 0);
    if (accounts.length > 0 && !convertAccountName) {
      setConvertAccountName(accounts[0].accountName);
    }
    const initialAllocations = order.details ? order.details.map(d => {
      const availBatches = batches.filter(b => b.productId === d.productId && b.currentQuantity > 0);
      return {
        orderDetailId: d.orderDetailId,
        productId: d.productId,
        productName: d.productName,
        quantity: d.orderedQuantity,
        unitPrice: d.sellingPrice,
        batchId: availBatches.length === 1 ? String(availBatches[0].batchId) : ''
      };
    }) : [];
    setConvertAllocations(initialAllocations);
  };

  const handleConvertToSaleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!convertModalOrder) return;

    for (const alloc of convertAllocations) {
      if (!alloc.batchId) {
        const prod = products.find(p => p.productId === alloc.productId);
        const name = prod ? `${prod.productName} (${prod.variantName})` : (alloc.productName || 'product');
        Swal.fire('Batch Required', `Please select a Batch (Supplier) for "${name}".`, 'warning');
        return;
      }
    }

    setConverting(true);
    try {
      const payload = {
        orderId: convertModalOrder.orderId,
        paidAmount: parseFloat(convertPaidAmount) || 0,
        paymentMethodAccountName: convertAccountName || (accounts.length > 0 ? accounts[0].accountName : 'Cash'),
        notes: convertModalOrder.notes || '',
        itemAllocations: convertAllocations.map(a => ({
          productId: parseInt(a.productId),
          quantity: parseInt(a.quantity),
          unitPrice: parseFloat(a.unitPrice),
          batchId: parseInt(a.batchId)
        }))
      };

      const res = await apiRequest(`/order/${convertModalOrder.orderId}/convert-to-sale`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      Swal.fire({
        title: 'Converted to Sale!',
        text: `Sales Order ${convertModalOrder.orderNo} has been successfully converted into Invoice: ${res?.data?.saleNumber || `INV-${res?.data?.saleId || 'NEW'}`}`,
        icon: 'success',
        confirmButtonColor: '#059669'
      });
      setConvertModalOrder(null);
      loadData();
      if (onNavigateToSale) {
        onNavigateToSale();
      }
    } catch (err) {
      Swal.fire('Conversion Failed', err.message || 'Could not convert order to sale invoice.', 'error');
    } finally {
      setConverting(false);
    }
  };

  const handlePresetChange = (preset) => {
    setDatePreset(preset);
    const range = getPresetDateRange(preset);
    if (range) {
      setFromDate(range.fromDate);
      setToDate(range.toDate);
    }
  };

  const filteredOrders = sortLatestFirst(
    orders.filter(o => {
      const matchesSearch = !search ||
        (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (o.orderNo && o.orderNo.toLowerCase().includes(search.toLowerCase())) ||
        (o.notes && o.notes.toLowerCase().includes(search.toLowerCase()));

      const matchesDate = isDateInRange(o.orderDate, fromDate, toDate);
      const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;

      return matchesSearch && matchesDate && matchesStatus;
    }),
    ['orderId', 'id'],
    'order'
  );

  const totalOrderValue = filteredOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const draftOrdersCount = orders.filter(o => o.status === 'DRAFT').length;
  const confirmedOrdersCount = orders.filter(o => o.status === 'CONFIRMED').length;
  const convertedOrdersCount = orders.filter(o => o.status === 'CONVERTED').length;

  const downloadCSV = async () => {
    const rows = [
      ['Order No', 'Customer', 'Phone', 'Order Date', 'Expected Date', 'Priority', 'Status', 'Total Value (Rs)', 'Notes'],
      ...filteredOrders.map(o => [
        o.orderNo, o.customerName, o.customerPhone || '-',
        formatDateDDMMYYYY(o.orderDate),
        formatDateDDMMYYYY(o.expectedDate),
        o.priority, o.status, o.totalAmount, o.notes || '-'
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    await downloadCsvCrossPlatform(csv, `Sales_Orders_${new Date().getTime()}.csv`);
  };

  return (
    <div className="space-y-4">
      {/* =========================================================
          PRINT ONLY REPORT HEADER (Vinayaga Plates)
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
              Sales Orders & Booking Statement
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
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Orders</span>
            <span className="text-[11px] font-black text-slate-900">{filteredOrders.length} Bookings</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">Total Order Amount</span>
            <span className="text-[11px] font-black text-blue-950">{fmt(totalOrderValue)}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          PAGE HEADER
      ========================================================= */}
      <section className="flex flex-row justify-between items-center gap-2 print:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-accent uppercase mb-1">
            <span>Sales & Distribution</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-slate-400 truncate">Order Taking (Drafts)</span>
          </div>
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900 truncate">
            Sales Orders
          </h1>
        </div>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={downloadCSV}
            className="flex items-center gap-1.5 bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2 sm:px-3 py-2 text-xs font-bold transition shadow-sm"
          >
            <Download size={14} className="text-slate-400" />
            <span className="hidden xs:inline">Export</span>
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2 sm:px-3 py-2 text-xs font-bold transition shadow-sm"
          >
            <Printer size={14} className="text-slate-400" />
            <span className="hidden xs:inline">Print Report</span>
          </button>

          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-gradient-to-r from-brand-accent to-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={14} />
            Take Order
          </button>
        </div>
      </section>

      {/* =========================================================
          KPI SUMMARY STATS CARDS
      ========================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 print:hidden">
        {/* Draft Orders */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'DRAFT' ? 'ALL' : 'DRAFT')}
          role="button"
          tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
          title="Click to filter Draft orders"
        >
          <div className="absolute -right-4 -top-4 w-12 h-12 sm:w-14 sm:h-14 bg-amber-50 rounded-full transition-transform group-hover:scale-150 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
              <FileEdit size={16} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Draft<br className="sm:hidden"/> Orders</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10 truncate">{draftOrdersCount}</p>
        </div>

        {/* Confirmed */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'CONFIRMED' ? 'ALL' : 'CONFIRMED')}
          role="button"
          tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
          title="Click to filter Confirmed orders"
        >
          <div className="absolute -right-4 -top-4 w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 rounded-full transition-transform group-hover:scale-150 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600 shadow-sm">
              <ClipboardCheck size={16} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Confirmed<br className="sm:hidden"/> Orders</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10 truncate">{confirmedOrdersCount}</p>
        </div>

        {/* Converted */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'CONVERTED' ? 'ALL' : 'CONVERTED')}
          role="button"
          tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-3 sm:p-4 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
          title="Click to filter Converted orders"
        >
          <div className="absolute -right-4 -top-4 w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-full transition-transform group-hover:scale-150 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 shadow-sm">
              <ArrowRightLeft size={16} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider leading-tight">Converted<br className="sm:hidden"/> To Sale</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10 truncate">{convertedOrdersCount}</p>
        </div>

        {/* Total Value */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          role="button"
          tabIndex={0}
          className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 rounded-2xl p-3 sm:p-4 shadow-md flex flex-col justify-between hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group text-white"
          title="Click to show All orders"
        >
          <div className="absolute -right-4 -top-4 w-12 h-12 sm:w-14 sm:h-14 bg-white/5 rounded-full transition-transform group-hover:scale-150 pointer-events-none" />
          <div className="flex items-center gap-2 mb-2 relative z-10">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-300 border border-white/10 shadow-inner">
              <TrendingUp size={16} />
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider leading-tight">Total<br className="sm:hidden"/> Value</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-white tracking-tight relative z-10 truncate">{fmt(totalOrderValue)}</p>
        </div>
      </section>

      {/* =========================================================
          FILTERS & STATUS SELECTOR BAR
      ========================================================= */}
      <section className="bg-[#fff7f9] rounded-2xl p-2.5 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 print:hidden items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search customer, order #, notes..."
            className="h-10 sm:h-9 w-full rounded-xl bg-slate-50 border border-slate-100 pl-9 pr-3 text-xs text-slate-800 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
          <div className="grid grid-cols-2 sm:flex gap-2">
            {/* Period Preset Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={datePreset}
                onChange={e => {
                  const val = e.target.value;
                  setDatePreset(val);
                  if (val !== 'custom') {
                    const range = getPresetDateRange(val);
                    setFromDate(range.fromDate);
                    setToDate(range.toDate);
                  }
                }}
                className="h-10 sm:h-9 appearance-none w-full rounded-xl bg-slate-50 border border-slate-100 pl-3 pr-8 text-xs font-bold text-slate-700 focus:outline-none focus:border-brand-accent transition-all min-w-[120px] cursor-pointer"
              >
                <option value="thisMonth">This Month</option>
                <option value="today">Today</option>
                <option value="lastMonth">Last Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
                <option value="all">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Status Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-10 sm:h-9 appearance-none w-full rounded-xl bg-slate-50 border border-slate-100 pl-3 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-accent transition-all min-w-[110px] cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="CONVERTED">Converted</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Date Picker Range Inputs */}
          <div className="flex items-center justify-between sm:justify-start gap-1.5 rounded-xl bg-slate-50 border border-slate-100 px-3 h-10 sm:h-9 w-full sm:w-auto">
            <CalendarDays size={13} className="text-slate-400 hidden sm:block shrink-0" />
            <DateInput 
              value={fromDate}
              onChange={e => {
                setFromDate(e.target.value);
                setDatePreset('custom');
              }}
              className="flex-1 min-w-[90px] sm:w-[105px] sm:flex-none"
            />
            <span className="text-slate-300 text-[10px] shrink-0">-</span>
            <DateInput 
              value={toDate}
              onChange={e => {
                setToDate(e.target.value);
                setDatePreset('custom');
              }}
              className="flex-1 min-w-[90px] sm:w-[105px] sm:flex-none"
            />
          </div>
        </div>
      </section>

      {/* =========================================================
          DESKTOP ORDERS TABLE
      ========================================================= */}
      <section className="hidden lg:block print:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden print:border-none print:shadow-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left border-collapse print:table-fixed">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
              <tr className="border-b border-slate-800">
                <th className="px-4 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[14%] print:w-[15%]">Order #</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[20%] print:w-[22%]">Customer</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[12%] print:w-[13%]">Order Date</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap w-[12%] print:w-[13%]">Expected</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap text-center w-[12%] print:w-[12%]">Status</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap text-right w-[14%] print:w-[15%]">Amount</th>
                <th className="px-4 py-3 text-[10px] font-bold text-slate-200 uppercase tracking-widest whitespace-nowrap text-center w-[16%] print:hidden">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-slate-400">
                    No orders found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => (
                  <tr key={o.orderId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900">
                      {o.orderNo}
                    </td>
                    <td className="px-4 py-3 font-bold text-slate-800">
                      <div>{o.customerName}</div>
                      {o.customerPhone && <div className="text-[10px] font-mono text-slate-400 font-normal">{o.customerPhone}</div>}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {formatDateDDMMYYYY(o.orderDate)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600">
                      {formatDateDDMMYYYY(o.expectedDate)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        o.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        o.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        o.status === 'CANCELLED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                      {fmt(o.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-center print:hidden">
                      <div className="flex items-center justify-center gap-1">
                        {o.status !== 'CONVERTED' && (
                          <button
                            onClick={() => openConvertModal(o)}
                            title="Convert to Finalized Sale"
                            className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition flex items-center gap-1 shadow-xs"
                          >
                            <Sparkles size={11} className="text-emerald-600" />
                            <span>Convert</span>
                          </button>
                        )}
                        <button
                          onClick={() => setViewOrder(o)}
                          title="View Order Slip"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Eye size={13} />
                        </button>
                        {o.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleEdit(o)}
                            title="Edit Order"
                            className="p-1.5 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {o.status !== 'CONVERTED' && (
                          <button
                            onClick={() => handleDelete(o.orderId)}
                            title="Delete Draft"
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                <tr className="bg-slate-100/90">
                  <td colSpan={5} className="px-4 py-2.5 font-black text-slate-900 text-xs uppercase tracking-wider">
                    Total ({filteredOrders.length} Orders)
                  </td>
                  <td className="px-4 py-2.5 text-right font-black text-slate-900 text-xs font-mono">
                    {fmt(totalOrderValue)}
                  </td>
                  <td className="px-4 py-2.5 print:hidden"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* =========================================================
          MOBILE ORDER CARDS (Sales Ledger Style)
      ========================================================= */}
      <section className="space-y-4 lg:hidden pb-10 print:hidden">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Recent Orders</h3>
            <p className="text-[10px] text-slate-500 font-medium">Showing {filteredOrders.length} records</p>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-sm border border-slate-100">
            No orders found matching the filter criteria.
          </div>
        ) : (
          filteredOrders.map(o => (
            <article key={o.orderId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
              <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
                {/* Effective Colored Card Header */}
                <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                  <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                  <div className="relative z-10">
                    <p className="font-black text-sm text-white leading-tight mb-1">{o.customerName}</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] font-bold text-blue-200 bg-white/10 border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">{o.orderNo}</span>
                      <span className="text-[10px] text-slate-300 font-medium">{formatDateDDMMYYYY(o.orderDate)}</span>
                    </div>
                  </div>
                  <span className={`relative z-10 shrink-0 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider backdrop-blur-md border ${
                    o.status === 'CONVERTED'
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                      : o.status === 'CONFIRMED'
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/30"
                        : o.status === 'CANCELLED'
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/30"
                  }`}>
                    {o.status === 'CONVERTED' ? 'Converted' : o.status === 'CONFIRMED' ? 'Confirmed' : o.status === 'CANCELLED' ? 'Cancelled' : 'Draft'}
                  </span>
                </div>

                {/* Financial & Delivery Summary */}
                <div className="grid grid-cols-3 gap-2 px-4 py-3.5 bg-white">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Total Value</p>
                    <p className="mt-0.5 text-sm font-black text-slate-900 font-mono">{fmt(o.totalAmount)}</p>
                  </div>
                  <div className="border-l border-slate-100 pl-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Priority</p>
                    <p className={`mt-0.5 text-xs font-bold uppercase ${
                      o.priority === 'URGENT' ? 'text-rose-600' : o.priority === 'HIGH' ? 'text-amber-600' : 'text-slate-700'
                    }`}>{o.priority || 'Normal'}</p>
                  </div>
                  <div className="border-l border-slate-100 pl-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Delivery</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-800">{formatDateDDMMYYYY(o.expectedDate)}</p>
                  </div>
                </div>

                {/* Items Summary (Sales Ledger Style) */}
                <div className="mx-4 mb-3.5 rounded-xl bg-slate-50 border border-slate-100 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Order Items</p>
                    <p className="text-[9px] font-bold text-slate-500">
                      {o.details?.reduce((sum, d) => sum + (Number(d.orderedQuantity) || Number(d.quantity) || 0), 0) || o.totalItems || 0} Total Qty
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {o.details && o.details.length > 0 ? (
                      o.details.map((d, idx) => {
                        const sizeStr = getProductSizeStr(d.productId);
                        const qty = Number(d.orderedQuantity) || Number(d.quantity) || 0;
                        const price = Number(d.sellingPrice) || Number(d.unitPrice) || 0;
                        const plateName = sizeStr 
                          ? `${sizeStr.replace(/[^0-9]/g, '')}" Areca Plate` 
                          : (d.productName || 'Areca Plate');
                        return (
                          <div key={idx} className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-700">{plateName}</span>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400 font-medium">{qty} pcs</span>
                              <span className="font-bold text-slate-800">{fmt(qty * price)}</span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">No item details recorded</div>
                    )}
                  </div>
                </div>

                {/* Actions (Sales Ledger Style 4-Column Grid) */}
                <div className="grid grid-cols-4 border-t border-slate-100 bg-slate-50/70 divide-x divide-slate-100">
                  <button 
                    onClick={() => setViewOrder(o)}
                    className="flex flex-col items-center justify-center gap-1 py-3 text-slate-500 hover:text-brand-accent hover:bg-blue-50/50 transition-colors"
                  >
                    <Eye size={15} />
                    <span className="text-[9px] font-bold">View</span>
                  </button>
                  
                  <button 
                    onClick={() => handleEdit(o)}
                    disabled={o.status === 'CONVERTED'}
                    className={`flex flex-col items-center justify-center gap-1 py-3 text-slate-500 transition-colors ${
                      o.status === 'CONVERTED' ? 'opacity-40 cursor-not-allowed' : 'hover:text-blue-600 hover:bg-blue-50/50'
                    }`}
                  >
                    <Pencil size={15} />
                    <span className="text-[9px] font-bold">Edit</span>
                  </button>

                  <button 
                    onClick={() => handleDelete(o.orderId)}
                    disabled={o.status === 'CONVERTED'}
                    className={`flex flex-col items-center justify-center gap-1 py-3 text-slate-500 transition-colors ${
                      o.status === 'CONVERTED' ? 'opacity-40 cursor-not-allowed' : 'hover:text-rose-600 hover:bg-rose-50/50'
                    }`}
                  >
                    <Trash2 size={15} />
                    <span className="text-[9px] font-bold">Delete</span>
                  </button>

                  {o.status !== 'CONVERTED' ? (
                    <button 
                      onClick={() => openConvertModal(o)}
                      className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-colors"
                    >
                      <Sparkles size={15} />
                      <span className="text-[9px] font-bold">Convert</span>
                    </button>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 py-3 text-emerald-600 bg-emerald-50/50">
                      <CheckCircle2 size={15} />
                      <span className="text-[9px] font-bold">Converted</span>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))
        )}
      </section>

      {/* =========================================================
          CREATE / EDIT ORDER MODAL (Sales Ledger Style)
      ========================================================= */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-md max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-pink-200/40 pb-3 mb-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingId ? `Edit Sales Order Draft` : 'Take New Sales Order'}
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Customer</label>
                <SearchableCustomerSelect
                  customers={customers}
                  value={form.customerId}
                  onChange={(cId) => setForm({ ...form, customerId: cId })}
                  onCustomerCreated={(newCust) => {
                    setCustomers(prev => sortLatestFirst([newCust, ...prev], ['customerId', 'id'], 'customer'));
                  }}
                  placeholder="Search or type customer name to add..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Order Date</label>
                  <DateInput
                    value={form.orderDate}
                    onChange={e => setForm({ ...form, orderDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/20 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold transition-all h-9"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Delivery Date</label>
                  <DateInput
                    value={form.expectedDate}
                    onChange={e => setForm({ ...form, expectedDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 focus-within:border-brand-accent focus-within:ring-2 focus-within:ring-brand-accent/20 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold transition-all h-9"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Priority Level</label>
                <select
                  value={form.priority}
                  onChange={e => setForm({ ...form, priority: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2 text-xs text-slate-900 font-bold focus:outline-none transition-all"
                >
                  <option value="NORMAL">Normal Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="URGENT">Urgent Rush Delivery</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ordered Plate Products</label>
                  <button type="button" onClick={addItemRow} className="text-[10px] flex items-center gap-1 text-brand-accent hover:text-blue-600 font-bold px-2 py-1 bg-blue-50 rounded-lg transition-colors">
                    <Plus size={12} /> Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {form.details.map((item, idx) => (
                    <div key={idx} className="bg-[#fff7f9] border border-slate-200 p-3.5 rounded-xl space-y-3 relative shadow-sm">
                      {form.details.length > 1 && (
                        <button type="button" onClick={() => removeItemRow(idx)} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                          <Trash2 size={14} />
                        </button>
                      )}
                      <div>
                        <select
                          value={item.productId}
                          onChange={e => updateItem(idx, 'productId', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                          required
                        >
                          <option value="">Select Plate</option>
                          {products.map(p => (
                            <option key={p.productId} value={p.productId}>
                              {p.productName} ({p.variantName || 'Standard'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plate Price (₹)</label>
                          <input
                            type="number"
                            step="any"
                            value={item.sellingPrice}
                            onChange={e => updateItem(idx, 'sellingPrice', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                            placeholder="e.g. 5.50"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity (Pcs)</label>
                          <input
                            type="number"
                            step="any"
                            min="1"
                            value={item.orderedQuantity}
                            onChange={e => updateItem(idx, 'orderedQuantity', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                            placeholder="e.g. 1000"
                            required
                          />
                        </div>
                      </div>
                      <div className="text-right text-[10px] font-mono font-bold text-slate-500 border-t border-slate-100 pt-1">
                        Subtotal: <span className="text-slate-900">{fmt((parseFloat(item.orderedQuantity) || 0) * (parseFloat(item.sellingPrice) || 0))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span className="uppercase tracking-widest">Total Booking Value:</span>
                  <span className="text-slate-900 font-black text-base font-mono">{fmt(calculateFormTotal())}</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Notes / Instructions</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm({ ...form, notes: e.target.value })}
                    placeholder="Special customization, packaging, or delivery remarks..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 transition-all"
                  />
                </div>
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
                  {editingId ? <><Edit2 size={14}/> Update</> : <><Plus size={14}/> Save Order Draft</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          ONE-CLICK CONVERT TO FINALIZED SALE MODAL
      ========================================================= */}
      {convertModalOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-md max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto space-y-4">
            <div className="flex justify-between items-center border-b border-pink-200/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Finalize & Convert to Sale</h3>
                  <span className="text-[10px] font-mono text-slate-500">{convertModalOrder.orderNo}</span>
                </div>
              </div>
              <button
                onClick={() => setConvertModalOrder(null)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#fff7f9] p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Customer:</span>
                <span className="font-black text-slate-900">{convertModalOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Total Order Value:</span>
                <span className="font-black text-slate-900 font-mono">{fmt(convertModalOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Items count:</span>
                <span className="font-bold text-slate-700">{convertModalOrder.details?.length || 0} Products ({convertModalOrder.totalItems} Plates)</span>
              </div>
            </div>

            <form onSubmit={handleConvertToSaleSubmit} className="space-y-3">
              {/* Supplier / Batch Selection per Item */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Select Batch (Supplier) for Items
                </label>
                {convertAllocations.map((alloc, idx) => {
                  const prod = products.find(p => p.productId === alloc.productId);
                  const prodTitle = prod ? `${prod.productName} (${prod.variantName})` : (alloc.productName || `Product #${alloc.productId}`);
                  const availableBatchesForProd = batches.filter(b => b.productId === alloc.productId && (b.currentQuantity > 0 || String(b.batchId) === String(alloc.batchId)));

                  return (
                    <div key={idx} className="bg-[#fff7f9] border border-slate-200 p-3.5 rounded-xl space-y-2.5 relative shadow-sm">
                      <div>
                        <select
                          value={alloc.productId}
                          disabled
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold opacity-95 cursor-not-allowed"
                        >
                          <option value={alloc.productId}>{prodTitle}</option>
                        </select>
                      </div>
                      <div>
                        <select
                          value={alloc.batchId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setConvertAllocations(prev => prev.map((item, i) => i === idx ? { ...item, batchId: val } : item));
                          }}
                          className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium transition-all"
                          required
                        >
                          <option value="">Select Batch (Supplier)</option>
                          {availableBatchesForProd.map(b => (
                            <option key={b.batchId} value={b.batchId}>
                              {b.batchNumber} - {b.supplierName} (Qty: {b.currentQuantity})
                            </option>
                          ))}
                        </select>
                        {availableBatchesForProd.length === 0 && (
                          <p className="text-[10px] text-rose-500 font-bold mt-1">
                            ⚠️ No available stock batches for this product.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 px-1 pt-0.5">
                        <span>Qty: {alloc.quantity} pcs</span>
                        <span>Price: {fmt(alloc.unitPrice)}</span>
                        <span className="font-black text-slate-900">Total: {fmt(alloc.quantity * alloc.unitPrice)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Payment Received (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={convertPaidAmount}
                  onChange={e => setConvertPaidAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm font-black font-mono text-slate-900 transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Receiving Business Account</label>
                <select
                  value={convertAccountName}
                  onChange={e => setConvertAccountName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                  required
                >
                  {accounts.map(a => (
                    <option key={a.accountId} value={a.accountName}>
                      {a.accountName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[10px] leading-relaxed">
                ℹ️ Converting this order will deduct stock from the selected batch(es) and credit <strong>{fmt(convertPaidAmount)}</strong> into <strong>{convertAccountName}</strong>.
              </div>

              <div className="flex gap-3 pt-3.5 border-t border-pink-200/40">
                <button
                  type="button"
                  onClick={() => setConvertModalOrder(null)}
                  className="w-1/2 bg-[#fff7f9] text-slate-700 hover:text-slate-900 rounded-xl py-3 text-xs font-bold transition-all border border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={converting}
                  className="w-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 rounded-xl py-3 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 hover:shadow-emerald-600/40 hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {converting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Converting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      <span>Confirm & Convert</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW ORDER SLIP / QUOTATION MODAL
      ========================================================= */}
      {viewOrder && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-xl max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-pink-200/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  <ShoppingCart size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Sales Order Voucher</h3>
                  <span className="text-[10px] font-mono text-slate-500">{viewOrder.orderNo}</span>
                </div>
              </div>
              <button
                onClick={() => setViewOrder(null)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#fff7f9] p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Customer:</span>
                <span className="font-black text-slate-900">{viewOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Phone:</span>
                <span className="font-mono text-slate-800">{viewOrder.customerPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Order Date:</span>
                <span className="font-mono text-slate-800">{formatDateDDMMYYYY(viewOrder.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Expected Delivery:</span>
                <span className="font-mono text-slate-800">{formatDateDDMMYYYY(viewOrder.expectedDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Status:</span>
                <span className="font-black uppercase text-blue-900">{viewOrder.status} ({viewOrder.priority})</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-2 text-[10px] uppercase font-bold">Product</th>
                    <th className="p-2 text-[10px] uppercase font-bold text-right">Qty</th>
                    <th className="p-2 text-[10px] uppercase font-bold text-right">Price</th>
                    <th className="p-2 text-[10px] uppercase font-bold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewOrder.details?.map((d, i) => (
                    <tr key={i}>
                      <td className="p-2 font-bold text-slate-800">{d.productName}</td>
                      <td className="p-2 text-right font-mono font-bold text-slate-700">{d.orderedQuantity}</td>
                      <td className="p-2 text-right font-mono text-slate-700">{fmt(d.sellingPrice)}</td>
                      <td className="p-2 text-right font-mono font-black text-slate-900">{fmt(d.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-black">
                  <tr>
                    <td colSpan="3" className="p-2 uppercase text-[10px]">Total Order Value</td>
                    <td className="p-2 text-right font-mono text-blue-950">{fmt(viewOrder.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {viewOrder.notes && (
              <div className="p-2.5 rounded-xl bg-[#fff7f9] border border-slate-200 text-xs text-slate-600">
                <strong className="block text-[10px] uppercase text-slate-400 font-bold mb-0.5">Notes:</strong>
                {viewOrder.notes}
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewOrder(null)}
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
