import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Trash2, Edit2, Search, CalendarDays, ChevronDown, 
  ChevronRight, FileText, CircleDollarSign, WalletCards, 
  TrendingUp, MoreHorizontal, Pencil, Eye, CheckCircle, Download, X
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { downloadCsvCrossPlatform } from '../utils/exportCsv';
import Swal from 'sweetalert2';
import { handlePrint } from '../utils/printHelper';
import { sortLatestFirst, markItemAsUpdated } from '../utils/sortHelper';
import { getCurrentMonthRange, getPresetDateRange, isDateInRange, formatDateDDMMYYYY } from '../utils/dateHelper';
import { sendWhatsAppNotificationToPartners, createSalesWhatsAppMessage } from '../utils/whatsappHelper';
import SearchableCustomerSelect from '../components/SearchableCustomerSelect';
import DateInput from '../components/DateInput';

export default function Sales() {
  const { apiRequest } = useAuth();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);
  const [batches, setBatches] = useState([]);

  // Modal / Form toggle state
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Filters state - Default to Current Month (Auto-resets on 1st of every month)
  const initialDates = getCurrentMonthRange();
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState(initialDates.fromDate);
  const [toDate, setToDate] = useState(initialDates.toDate);
  const [datePreset, setDatePreset] = useState('thisMonth');
  const [balanceFilter, setBalanceFilter] = useState('all');

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ productId: '', batchId: '', quantity: 0, unitPrice: 0 }]);
  const [paidAmount, setPaidAmount] = useState(0);
  const [accountName, setAccountName] = useState('Cash');
  const [editingId, setEditingId] = useState(null);
  const [editingSaleDate, setEditingSaleDate] = useState(null);
  const [adjustment, setAdjustment] = useState(0);

  const loadData = () => {
    apiRequest('/sales').then(res => setSales(sortLatestFirst(res.data, ['saleId', 'id'], 'sales'))).catch(console.error);
    apiRequest('/customer').then(res => setCustomers(sortLatestFirst(res.data, ['customerId', 'id'], 'customer'))).catch(console.error);
    apiRequest('/product').then(res => setProducts(res.data)).catch(console.error);
    apiRequest('/account').then(res => {
      const accs = Array.isArray(res.data) ? res.data : [];
      setAccounts(accs);
      if (accs.length > 0) {
        setAccountName(prev => accs.some(a => a.accountName === prev) ? prev : accs[0].accountName);
      }
    }).catch(console.error);
    apiRequest('/batch').then(res => setBatches(res.data)).catch(console.error);
  };

  useEffect(() => {
    loadData();
  }, []);

  const addItemRow = () => setItems([...items, { productId: '', batchId: '', quantity: 0, unitPrice: 0 }]);
  const removeItemRow = (idx) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx, field, val) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const totalCost = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const finalTotal = totalCost + (parseFloat(adjustment) || 0);
  const balanceDue = finalTotal - (parseFloat(paidAmount) || 0);

  // Filter Sales Logic (latest and recently updated first)
  const filteredSales = sortLatestFirst(
    sales.filter(s => {
      // Search filter
      const matchesSearch = !search || 
        (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
        (s.saleId && `INV-${s.saleId}`.toLowerCase().includes(search.toLowerCase()));

      // Date range filter using clean string comparison
      const matchesDate = isDateInRange(s.saleDate, fromDate, toDate);

      // Balance filter
      let matchesBalance = true;
      if (balanceFilter === 'paid') {
        matchesBalance = (s.balanceAmount <= 0);
      } else if (balanceFilter === 'due') {
        matchesBalance = (s.balanceAmount > 0);
      }

      return matchesSearch && matchesDate && matchesBalance;
    }),
    ['saleId', 'id'],
    'sales'
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      Swal.fire('Warning', 'Please select a customer', 'warning');
      return;
    }
    const payload = {
      customerId: parseInt(customerId),
      saleDate: new Date().toISOString(),
      details: items.map(i => ({
        productId: parseInt(i.productId),
        quantity: parseInt(i.quantity),
        unitPrice: parseFloat(i.unitPrice),
        batchId: parseInt(i.batchId)
      })),
      adjustment: parseFloat(adjustment) || 0,
      paidAmount: parseFloat(paidAmount),
      paymentMethodAccountName: accountName
    };
    try {
      const currentCust = customers.find(c => String(c.customerId) === String(customerId));
      const customerName = currentCust?.customerName || 'Customer';

      if (editingId) {
        await apiRequest(`/sales/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify({
            saleId: editingId,
            customerId: parseInt(customerId),
            saleDate: editingSaleDate || new Date().toISOString(),
            details: items.map(i => ({
              productId: parseInt(i.productId),
              quantity: parseInt(i.quantity),
              unitPrice: parseFloat(i.unitPrice),
              batchId: parseInt(i.batchId)
            })),
            totalAmount: finalTotal,
            paidAmount: parseFloat(paidAmount),
            paymentStatus: parseFloat(paidAmount) >= finalTotal ? 'PAID' : parseFloat(paidAmount) > 0 ? 'PARTIAL' : 'UNPAID',
            status: 'COMPLETED',
            adjustment: parseFloat(adjustment) || 0,
            paymentMethodAccountName: accountName
          })
        });
        markItemAsUpdated('sales', editingId);
        
        // Automated WhatsApp Notification to Partners
        const waMsg = createSalesWhatsAppMessage({
          saleId: editingId,
          customerName,
          totalAmount: finalTotal,
          paidAmount: parseFloat(paidAmount),
          balanceAmount: Math.max(0, finalTotal - parseFloat(paidAmount)),
          paymentStatus: parseFloat(paidAmount) >= finalTotal ? 'PAID' : 'PARTIAL',
          handledBy: 'Admin'
        });
        sendWhatsAppNotificationToPartners(apiRequest, {
          message: waMsg,
          eventType: 'SALES_UPDATE',
          referenceId: String(editingId),
          category: 'SALES',
          actionType: 'UPDATE',
          performedBy: 'Admin'
        });

        Swal.fire('Success', 'Invoice updated & WhatsApp alert sent!', 'success');
      } else {
        const createRes = await apiRequest('/sales/create-sale', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        const createdSaleId = createRes?.data?.saleId || 'New';

        // Automated WhatsApp Notification to Partners
        const waMsg = createSalesWhatsAppMessage({
          saleId: createdSaleId,
          customerName,
          totalAmount: finalTotal,
          paidAmount: parseFloat(paidAmount),
          balanceAmount: Math.max(0, finalTotal - parseFloat(paidAmount)),
          paymentStatus: parseFloat(paidAmount) >= finalTotal ? 'PAID' : 'UNPAID',
          handledBy: 'Admin'
        });
        sendWhatsAppNotificationToPartners(apiRequest, {
          message: waMsg,
          eventType: 'SALES_CREATE',
          referenceId: String(createdSaleId),
          category: 'SALES',
          actionType: 'CREATE',
          performedBy: 'Admin'
        });

        Swal.fire('Success', 'Sale transaction recorded & Partners alerted via WhatsApp!', 'success');
      }
      setItems([{ productId: '', batchId: '', quantity: 0, unitPrice: 0 }]);
      setCustomerId('');
      setPaidAmount(0);
      setAdjustment(0);
      setEditingId(null);
      setEditingSaleDate(null);
      setShowCreateForm(false);
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleEdit = (s) => {
    setEditingId(s.saleId);
    setEditingSaleDate(s.saleDate);
    setCustomerId(s.customerId ? String(s.customerId) : '');
    setPaidAmount(s.paidAmount);
    setAccountName(s.paymentMethodAccountName || s.accountName || (accounts.length > 0 ? accounts[0].accountName : 'Cash'));
    setItems(s.details && s.details.length > 0 ? s.details.map(d => ({
      productId: d.productId ? String(d.productId) : '',
      batchId: d.batchId ? String(d.batchId) : '',
      quantity: d.quantity,
      unitPrice: d.unitPrice
    })) : [{ productId: '', batchId: '', quantity: 0, unitPrice: 0 }]);
    const calcDetailTotal = s.details?.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) || 0;
    setAdjustment(s.totalAmount - calcDetailTotal);
    setShowCreateForm(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You want to delete this invoice?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, delete it!'
    });
    if (!result.isConfirmed) return;
    try {
      await apiRequest(`/sales/${id}`, { method: 'DELETE' });
      Swal.fire('Deleted!', 'Invoice deleted!', 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const handleCollectPayment = async (s) => {
    const defaultAcc = s.paymentMethodAccountName || s.accountName || (accounts.length > 0 ? accounts[0].accountName : 'Cash');
    const optionsHtml = accounts.map(a => `<option value="${a.accountName}" ${a.accountName === defaultAcc ? 'selected' : ''}>${a.accountName}</option>`).join('');

    const { value: chosenAccount, isConfirmed } = await Swal.fire({
      title: 'Collect Full Payment',
      html: `
        <p class="text-xs text-slate-500 mb-3">Mark invoice <b>INV-${s.saleId}</b> as fully paid (${money(s.totalAmount)})?</p>
        <div class="text-left">
          <label class="block text-[10px] font-bold text-slate-500 uppercase mb-1">Deposit Into Account</label>
          <select id="swal-collect-acc" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none">
            ${optionsHtml}
          </select>
        </div>
      `,
      preConfirm: () => {
        return document.getElementById('swal-collect-acc')?.value || defaultAcc;
      },
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Collect Payment!'
    });

    if (!isConfirmed) return;
    try {
      await apiRequest(`/sales/${s.saleId}`, {
        method: 'PUT',
        body: JSON.stringify({
          customerId: s.customerId,
          saleDate: s.saleDate,
          details: s.details ? s.details.map(d => ({
            productId: d.productId,
            quantity: d.quantity,
            unitPrice: d.unitPrice,
            batchId: d.batchId
          })) : [],
          totalAmount: s.totalAmount,
          paidAmount: s.totalAmount,
          paymentStatus: 'PAID',
          status: s.status,
          paymentMethodAccountName: chosenAccount
        })
      });
      markItemAsUpdated('sales', s.saleId);

      // Automated WhatsApp notification for payment received
      const waMsg = createSalesWhatsAppMessage({
        saleId: s.saleId,
        customerName: s.customerName,
        totalAmount: s.totalAmount,
        paidAmount: s.totalAmount,
        balanceAmount: 0,
        paymentStatus: 'PAID',
        handledBy: 'Admin'
      });
      sendWhatsAppNotificationToPartners(apiRequest, {
        message: waMsg,
        eventType: 'SALES_PAYMENT',
        referenceId: String(s.saleId),
        category: 'SALES',
        actionType: 'PAYMENT',
        performedBy: 'Admin'
      });

      Swal.fire('Paid!', `Payment recorded into ${chosenAccount} & WhatsApp notification dispatched!`, 'success');
      loadData();
    } catch (err) {
      Swal.fire('Error', err.message, 'error');
    }
  };

  const money = (value) => {
    const num = Number(value || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // Totals calculations
  const totalSalesVal = filteredSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCollectedVal = filteredSales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalDueVal = filteredSales.reduce((sum, s) => sum + s.balanceAmount, 0);

  const getProductSizeStr = (productId) => {
    const prod = products.find(p => p.productId === productId);
    return prod ? prod.variantName : '';
  };

  const downloadCSV = async () => {
    const rows = [
      ['Date', 'Invoice No', 'Customer', 'Items Count', 'Total Amount', 'Paid Amount', 'Adjustment', 'Due Amount', 'Payment Status'],
      ...filteredSales.map(s => [
        formatDateDDMMYYYY(s.saleDate || s.invoiceDate),
        s.invoiceNumber || '-',
        s.customerName || 'Unknown',
        s.items?.length || 0,
        s.totalAmount || 0,
        s.paidAmount || 0,
        s.adjustment || 0,
        s.dueAmount || 0,
        s.paymentStatus || 'UNKNOWN'
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const filename = `Sales_Report_${new Date().getTime()}.csv`;
    await downloadCsvCrossPlatform(csv, filename);
  };

  return (
    <div className="space-y-4">
      {/* =========================================================
          PREMIUM PRINT ONLY REPORT HEADER (Vinayaga Plates)
      ========================================================= */}
      <div className="hidden print:block mb-2 space-y-1.5">
        <div className="text-center pb-1.5 border-b-2 border-slate-900">
          <div className="flex items-center justify-center gap-3 mb-0.5">
            <div className="h-[1.5px] w-12 bg-blue-900" />
            <h1 className="text-2xl font-black tracking-[0.2em] text-blue-950 uppercase print-brand-title">
              VINAYAGA PLATES
            </h1>
            <div className="h-[1.5px] w-12 bg-blue-900" />
          </div>
          <p className="text-[7.5px] font-bold text-slate-500 uppercase tracking-[0.3em]">
            Manufacturing & Inventory Management System
          </p>
          <div className="mt-1">
            <span className="inline-block px-3 py-0.5 rounded bg-slate-900 text-white font-extrabold text-[10px] uppercase tracking-widest">
              Sales Invoices Report
            </span>
          </div>
        </div>

        {/* Structured KPI Metadata Strip */}
        <div className="grid grid-cols-4 gap-2 border border-slate-300 rounded-lg p-1.5 bg-slate-50 text-left">
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider">Report Date</span>
            <span className="text-[10px] font-black text-slate-900">{formatDateDDMMYYYY(new Date())}</span>
          </div>
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider">Total Invoices</span>
            <span className="text-[10px] font-black text-slate-900">{filteredSales.length} Records</span>
          </div>
          <div className="px-2 py-0.5 border-r border-slate-200">
            <span className="block text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider">Total Sales</span>
            <span className="text-[10px] font-black text-blue-950">{money(totalSalesVal)}</span>
          </div>
          <div className="px-2 py-0.5">
            <span className="block text-[7.5px] font-extrabold text-slate-500 uppercase tracking-wider">Total Due</span>
            <span className="text-[10px] font-black text-rose-600">{money(totalDueVal)}</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          DESKTOP HEADER
      ========================================================= */}
      <section className="flex flex-row justify-between items-center gap-2 print:hidden">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-brand-accent uppercase mb-1">
            <span>Sales</span>
            <ChevronRight size={10} className="shrink-0" />
            <span className="text-slate-400 truncate">Ledger</span>
          </div>
          <h1 className="text-xl sm:text-2xl leading-none font-black tracking-tight text-slate-900 truncate">
            Invoice Management
          </h1>
        </div>
          
        <div className="flex gap-2 shrink-0">
          
            <button
              onClick={downloadCSV}
              className="flex items-center gap-1.5 bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2 sm:px-3 py-2 text-xs font-bold transition shadow-sm"
            >
              <Download size={14} className="text-slate-400" />
              <span className="hidden xs:inline">Download CSV</span>
            </button>
          
          
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-[#fff7f9] hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2 sm:px-3 py-2 text-xs font-bold transition shadow-sm"
            >
              <FileText size={14} className="text-slate-400" />
              <span className="hidden xs:inline">Print Report</span>
            </button>
          
          <button 
            onClick={() => {
              setEditingId(null);
              setCustomerId('');
              setItems([{ productId: '', batchId: '', quantity: 0, unitPrice: 0 }]);
              setPaidAmount(0);
              setAdjustment(0);
              if (accounts.length > 0) setAccountName(accounts[0].accountName);
              setShowCreateForm(true);
            }}
            className="flex items-center gap-1.5 bg-gradient-to-r from-brand-accent to-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-brand-accent/20 hover:shadow-brand-accent/40 hover:-translate-y-0.5 transition-all"
          >
            <Plus size={14} />
            New Invoice
          </button>
        </div>
      </section>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 print:hidden">
        {/* Total Invoices */}
        <div 
          onClick={() => setBalanceFilter('all')}
          role="button"
          tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
          title="Click to show All invoices"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-blue-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-blue-100 text-blue-600">
              <FileText size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Invoices</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{filteredSales.length}</p>
        </div>

        {/* Total Sales */}
        <div 
          onClick={() => setBalanceFilter('all')}
          role="button"
          tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
          title="Click to show All sales"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-emerald-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-emerald-100 text-emerald-600">
              <CircleDollarSign size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Sales</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(totalSalesVal)}</p>
        </div>

        {/* Collected */}
        <div 
          onClick={() => setBalanceFilter(balanceFilter === 'paid' ? 'all' : 'paid')}
          role="button"
          tabIndex={0}
          className="bg-[#fff7f9] rounded-2xl p-2.5 sm:p-4 shadow-sm border border-slate-100 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
          title="Click to filter Paid invoices"
        >
          <div className="absolute -right-4 -top-4 w-10 h-10 sm:w-14 sm:h-14 bg-indigo-50 rounded-full transition-transform group-hover:scale-150" />
          <div className="flex items-center gap-2 mb-1.5 sm:mb-2 relative z-10">
            <div className="flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg sm:rounded-xl bg-indigo-100 text-indigo-600">
              <WalletCards size={14} className="sm:w-4 sm:h-4 w-3.5 h-3.5" />
            </div>
            <p className="text-[8px] sm:text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-tight">Total<br/>Collected</p>
          </div>
          <p className="text-base sm:text-2xl font-black text-slate-900 tracking-tight relative z-10">{money(totalCollectedVal)}</p>
        </div>

        {/* Outstanding */}
        <div 
          onClick={() => setBalanceFilter(balanceFilter === 'due' ? 'all' : 'due')}
          role="button"
          tabIndex={0}
          className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-2xl p-2.5 sm:p-4 shadow-sm border border-rose-400 flex flex-col hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all cursor-pointer relative overflow-hidden group"
          title="Click to filter Pending/Due invoices"
        >
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
      <section className="bg-[#fff7f9] rounded-2xl p-2.5 shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-2 print:hidden items-stretch lg:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoices, customers..."
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
                value={balanceFilter}
                onChange={e => setBalanceFilter(e.target.value)}
                className="h-10 sm:h-9 appearance-none w-full rounded-xl bg-slate-50 border border-slate-100 pl-3 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:border-brand-accent transition-all min-w-[110px] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid Only</option>
                <option value="due">Outstanding Due</option>
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

      {/* =====================================================
          DESKTOP TABLE
      ===================================================== */}
      <section className="hidden lg:block overflow-hidden rounded-2xl bg-[#fff7f9] shadow-sm border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 font-medium">
            <thead className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white uppercase text-[9px] font-bold tracking-widest border-b border-slate-800">
              <tr>
                <th className="px-3 py-3 text-slate-200 w-[10%] whitespace-nowrap">Invoice</th>
                <th className="px-3 py-3 text-slate-200 w-[20%] whitespace-nowrap">Customer</th>
                <th className="px-3 py-3 text-slate-200 w-[21%] whitespace-nowrap">Items</th>
                <th className="px-3 py-3 text-right text-slate-200 w-[12%] whitespace-nowrap">Total</th>
                <th className="px-3 py-3 text-right text-slate-200 w-[12%] whitespace-nowrap">Paid</th>
                <th className="px-3 py-3 text-right text-slate-200 w-[13%] whitespace-nowrap">Balance</th>
                <th className="px-3 py-3 text-center text-slate-200 w-[12%] whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-right text-slate-200 w-[8%] print:hidden whitespace-nowrap">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSales.map((s) => (
                <tr key={s.saleId} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="font-mono text-[11px] text-slate-500 group-hover:text-brand-accent transition-colors block">INV-{s.saleId}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">{formatDateDDMMYYYY(s.saleDate)}</span>
                  </td>
                  <td className="px-3 py-2 font-bold text-slate-900 truncate">{s.customerName}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {s.details?.map((d, i) => {
                        const sizeStr = getProductSizeStr(d.productId);
                        return (
                          <span key={i} className="rounded-md bg-[#fff7f9] border border-slate-200 px-1 py-0.5 text-[9px] font-bold text-slate-600 shadow-sm whitespace-nowrap">
                            {sizeStr ? sizeStr.replace(/[^0-9]/g, '') : '?'}" × {d.quantity}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-black text-slate-900 whitespace-nowrap">{money(s.totalAmount)}</td>
                  <td className="px-3 py-2 text-right text-slate-600 font-bold whitespace-nowrap">
                    <div>{money(s.paidAmount)}</div>
                    {s.paidAmount > 0 && s.accountName && (
                      <span className="text-[9px] font-bold text-blue-600 block leading-tight">({s.accountName})</span>
                    )}
                  </td>
                  <td className={`px-3 py-2 text-right font-black whitespace-nowrap ${s.balanceAmount > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                    {money(s.balanceAmount)}
                  </td>
                  <td className="px-3 py-2 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                      s.balanceAmount <= 0
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                        : s.paidAmount > 0
                          ? "bg-amber-50 text-amber-600 border border-amber-200/60"
                          : "bg-rose-50 text-rose-600 border border-rose-200/60"
                    }`}>
                      {s.balanceAmount <= 0 ? "Paid" : s.paidAmount > 0 ? "Partial" : "Due"}
                    </span>
                  </td>
                  <td className="px-5 py-2 print:hidden">
                    <div className="flex justify-end items-center gap-1">
                      <button 
                        onClick={() => setSelectedSale(s)}
                        className="p-1.5 rounded-lg hover:bg-[#fff7f9] border border-transparent hover:border-slate-200 text-slate-400 hover:text-brand-accent transition-all hover:shadow-sm"
                        title="View details"
                      >
                        <Eye size={12} />
                      </button>
                      <button 
                        onClick={() => handleEdit(s)}
                        className="p-1.5 rounded-lg hover:bg-[#fff7f9] border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-500 transition-all hover:shadow-sm"
                        title="Edit details"
                      >
                        <Pencil size={12} />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.saleId)}
                        className="p-1.5 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 text-slate-400 hover:text-rose-500 transition-all hover:shadow-sm"
                        title="Delete invoice"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredSales.length > 0 && (
              <tfoot className="bg-slate-100 font-bold border-t border-slate-300">
                <tr className="bg-slate-100/90 hover:bg-slate-100">
                  <td colSpan={3} className="px-5 py-2.5 font-black text-slate-900 text-xs uppercase tracking-wider">
                    Total ({filteredSales.length} Invoices)
                  </td>
                  <td className="px-5 py-2.5 text-right font-black text-slate-900 text-xs">
                    {money(totalSalesVal)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-bold text-slate-700 text-xs">
                    {money(filteredSales.reduce((s, x) => s + (Number(x.paidAmount) || 0), 0))}
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
      <section className="space-y-4 lg:hidden pb-10">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Recent Invoices</h3>
            <p className="text-[10px] text-slate-500 font-medium">Showing {filteredSales.length} records</p>
          </div>
        </div>

        {filteredSales.map((invoice) => (
          <article key={invoice.saleId} className="p-[1px] rounded-2xl bg-gradient-to-br from-blue-500/30 via-slate-200 to-indigo-500/30 shadow-md shadow-slate-200/60 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 overflow-hidden">
            <div className="bg-[#fff7f9] rounded-2xl overflow-hidden flex flex-col h-full">
              {/* Effective Colored Card Header */}
              <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3.5 text-white flex items-center justify-between overflow-hidden">
                <div className="absolute -right-6 -top-6 w-20 h-20 bg-blue-500/20 rounded-full blur-xl pointer-events-none" />
                <div className="relative z-10">
                  <p className="font-black text-sm text-white leading-tight mb-1">{invoice.customerName}</p>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] font-bold text-blue-200 bg-white/10 border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-md">INV-{invoice.saleId}</span>
                    <span className="text-[10px] text-slate-300 font-medium">{formatDateDDMMYYYY(invoice.saleDate)}</span>
                  </div>
                </div>
                <span className={`relative z-10 shrink-0 inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wider backdrop-blur-md border ${
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
                  {invoice.paidAmount > 0 && invoice.accountName && (
                    <span className="text-[8px] font-bold text-blue-600 block truncate">({invoice.accountName})</span>
                  )}
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
                        <span className="font-bold text-slate-700">{sizeStr ? sizeStr.replace(/[^0-9]/g, '') : '?'}" Areca Plate</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-medium">{d.quantity} pcs</span>
                          <span className="font-bold text-slate-800">{money(d.quantity * d.unitPrice)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-4 border-t border-slate-100 bg-slate-50/70 divide-x divide-slate-100">
                <button 
                  onClick={() => setSelectedSale(invoice)}
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
                  onClick={() => handleDelete(invoice.saleId)}
                  className="flex flex-col items-center justify-center gap-1 py-3 text-slate-500 hover:text-rose-600 hover:bg-rose-50/50 transition-colors"
                >
                  <Trash2 size={15} />
                  <span className="text-[9px] font-bold">Delete</span>
                </button>

                {invoice.balanceAmount > 0 ? (
                  <button 
                    onClick={() => handleCollectPayment(invoice)}
                    className="flex flex-col items-center justify-center gap-1 py-3 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent hover:text-white transition-colors"
                  >
                    <WalletCards size={15} />
                    <span className="text-[9px] font-bold">Collect</span>
                  </button>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-3 text-emerald-600 bg-emerald-50/50">
                    <CheckCircle size={15} />
                    <span className="text-[9px] font-bold">Settled</span>
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* =====================================================
          RECORD SALE FORM OVERLAY MODAL (Sliding Drawer Layout)
      ===================================================== */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-md max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto">
            
            <div className="flex justify-between items-center border-b border-pink-200/40 pb-3 mb-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                {editingId ? `Edit Invoice INV-${editingId}` : 'Create Sale Invoice'}
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
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Customer</label>
                <SearchableCustomerSelect
                  customers={customers}
                  value={customerId}
                  onChange={(cId) => setCustomerId(cId)}
                  onCustomerCreated={(newCust) => {
                    setCustomers(prev => sortLatestFirst([newCust, ...prev], ['customerId', 'id'], 'customer'));
                  }}
                  placeholder="Search or type customer name to add..."
                  required
                />
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
                      {item.productId && (
                        <div>
                          <select
                            value={item.batchId}
                            onChange={(e) => updateItem(idx, 'batchId', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-xs text-slate-700 font-medium transition-all"
                            required
                          >
                            <option value="">Select Batch (Supplier)</option>
                            {batches
                              .filter(b => b.productId === parseInt(item.productId) && (b.currentQuantity > 0 || b.batchId === parseInt(item.batchId)))
                              .map(b => (
                                <option key={b.batchId} value={b.batchId}>
                                  {b.batchNumber} - {b.supplierName} (Qty: {b.currentQuantity})
                                </option>
                              ))}
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quantity (Pcs)</label>
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                            placeholder="Qty (e.g. 1000)"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Plate Price (₹)</label>
                          <input
                            type="number"
                            step="any"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-3 py-2 text-sm text-slate-900 font-bold transition-all"
                            placeholder="Price (e.g. 5.50)"
                            required
                          />
                        </div>
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

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Adjustment / Round Off (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustment}
                    onChange={(e) => setAdjustment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold transition-all"
                    placeholder="e.g. -50"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-slate-500 pt-2 border-t border-slate-100">
                  <span className="uppercase tracking-widest">Adjusted Total:</span>
                  <span className="text-slate-900 font-black text-base">₹{parseFloat(finalTotal.toFixed(2))?.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs font-bold text-rose-500">
                  <span className="uppercase tracking-widest">Balance :</span>
                  <span className="font-black text-base">₹{parseFloat(balanceDue.toFixed(2))?.toLocaleString()}</span>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Collected Amount (₹)</label>
                    <button
                      type="button"
                      onClick={() => setPaidAmount(parseFloat(finalTotal.toFixed(2)))}
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
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Deposit Account</label>
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
                  {editingId ? <><Edit2 size={14}/> Update</> : <><CheckCircle size={14}/> Post Sale</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          VIEW INVOICE VOUCHER MODAL
      ========================================================= */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-backdrop-in">
          <div className="animate-modal-pop bg-[#ffeef1] border border-pink-200/80 w-full max-w-xl max-h-[90vh] rounded-2xl p-5 shadow-2xl flex flex-col overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-pink-200/40 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                  <FileText size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Sales Invoice Voucher</h3>
                  <span className="text-[10px] font-mono text-slate-500">INV-{selectedSale.saleId}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-slate-800 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#fff7f9] p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Customer:</span>
                <span className="font-black text-slate-900">{selectedSale.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Invoice Date:</span>
                <span className="font-mono text-slate-800">{formatDateDDMMYYYY(selectedSale.saleDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">Payment Status:</span>
                <span className={`font-black uppercase tracking-wider text-[10px] px-2 py-0.5 rounded-md ${
                  selectedSale.paymentStatus === 'PAID' 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : selectedSale.paidAmount > 0 
                      ? 'bg-amber-100 text-amber-700' 
                      : 'bg-rose-100 text-rose-700'
                }`}>
                  {selectedSale.paymentStatus}
                </span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="p-2 text-[10px] uppercase font-bold">Product & Batch</th>
                    <th className="p-2 text-[10px] uppercase font-bold text-right">Qty</th>
                    <th className="p-2 text-[10px] uppercase font-bold text-right">Price</th>
                    <th className="p-2 text-[10px] uppercase font-bold text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedSale.details?.map((d, i) => {
                    const prod = products.find(p => p.productId === d.productId);
                    const batch = batches.find(b => b.batchId === d.batchId);
                    return (
                      <tr key={i}>
                        <td className="p-2">
                          <p className="font-bold text-slate-800">{prod ? `${prod.productName} (${prod.variantName})` : `Product #${d.productId}`}</p>
                          {batch && (
                            <p className="text-[9px] font-mono text-slate-400">
                              Batch: {batch.batchNumber} ({batch.supplierName})
                            </p>
                          )}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-slate-700">{d.quantity}</td>
                        <td className="p-2 text-right font-mono font-bold text-slate-700">{money(d.unitPrice)}</td>
                        <td className="p-2 text-right font-mono font-black text-slate-900">{money(d.quantity * d.unitPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-xs divide-y divide-slate-200">
                  <tr>
                    <td colSpan="3" className="p-2 uppercase text-[10px] text-slate-600">Total Invoice Amount</td>
                    <td className="p-2 text-right font-mono text-slate-900">{money(selectedSale.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="p-2 uppercase text-[10px] text-slate-600">Paid Amount</td>
                    <td className="p-2 text-right font-mono text-emerald-700">{money(selectedSale.paidAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" className="p-2 uppercase text-[10px] text-slate-600">Balance Due</td>
                    <td className={`p-2 text-right font-mono ${selectedSale.balanceAmount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                      {money(selectedSale.balanceAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setSelectedSale(null)}
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
