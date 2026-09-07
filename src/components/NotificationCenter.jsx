import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import {
  Bell, X, RefreshCw, ShoppingCart, ShoppingBag,
  Package, Users, DollarSign, MessageCircle,
  Sparkles, CheckCircle2, AlertCircle, Clock, Trash2
} from 'lucide-react';
import Swal from 'sweetalert2';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { formatDateDDMMYYYY, formatDateTimeDDMMYYYY } from '../utils/dateHelper';

// ── User-scoped storage key (per username) ──
const getStorageKey = (username) => `vpms_cleared_notifs_${username || 'admin'}`;

// ── Reliable WhatsApp opener: Capacitor Share on Android (preserves emojis), wa.me on web ──
async function openWhatsApp(phone, message) {
  if (!message) return;
  const clean = phone ? String(phone).replace(/[^\d]/g, '') : '';
  const finalPhone = clean.length === 10 ? `91${clean}` : clean;

  const isNative = Capacitor.isNativePlatform();

  if (isNative) {
    // On Capacitor Android/iOS: use native Share sheet which preserves emojis perfectly
    try {
      await Share.share({ text: message, dialogTitle: 'Send WhatsApp Notification' });
      return;
    } catch (err) {
      console.warn('Share failed, falling back to intent', err);
    }
    // Fallback: Android WhatsApp intent URL via intent scheme
    const intentUrl = finalPhone
      ? `intent://send?phone=%2B${finalPhone}&text=${encodeURIComponent(message)}#Intent;scheme=whatsapp;package=com.whatsapp;end`
      : `intent://send?text=${encodeURIComponent(message)}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
    window.location.href = intentUrl;
  } else {
    // Web: open wa.me link in new tab
    const encoded = encodeURIComponent(message);
    const url = finalPhone
      ? `https://wa.me/${finalPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  }
}

// ── Inject high-z-index for SweetAlert2 so it shows above the full-screen drawer ──
if (typeof document !== 'undefined') {
  const styleId = 'vpms-swal-zfix';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = '.swal2-container { z-index: 9999999 !important; }';
    document.head.appendChild(style);
  }
}

export default function NotificationCenter({ onNavigate, isMobile = false, isSidebar = false }) {
  const { apiRequest, user } = useAuth();
  const username = user?.username || user?.name || 'admin';

  const [notifications, setNotifications] = useState([]);
  const [partners, setPartners] = useState([]);
  const [entities, setEntities] = useState({
    sales: [], purchases: [], batches: [], customers: [], suppliers: [], expenses: [], products: []
  });
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState({ top: 60, left: 260, right: null });

  // User-scoped cleared IDs (each admin sees their own "cleared" list)
  const [clearedIds, setClearedIds] = useState(() => {
    try {
      const key = getStorageKey(user?.username || user?.name || 'admin');
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const isMobileView = typeof window !== 'undefined' && window.innerWidth < 640;

  const updatePosition = useCallback(() => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      if (isSidebar) {
        setCoords({
          top: Math.max(12, Math.min(window.innerHeight - 500, rect.top)),
          left: Math.min(window.innerWidth - 360, rect.right + 12),
          right: null
        });
      } else {
        setCoords({
          top: rect.bottom + 8,
          left: null,
          right: Math.max(8, window.innerWidth - rect.right)
        });
      }
    }
  }, [isSidebar]);

  const toggleOpen = () => {
    updatePosition();
    setIsOpen(o => {
      if (!o) {
        setTimeout(fetchNotifications, 50);
      }
      return !o;
    });
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const [notifRes, salesRes, purchRes, batchRes, custRes, suppRes, expRes, prodRes, partnerRes] = await Promise.all([
        apiRequest('/notification/recent?limit=50').catch(() =>
          apiRequest('/report/get-audit-history').catch(() => ({ data: [] }))
        ),
        apiRequest('/sales').catch(() => ({ data: [] })),
        apiRequest('/purchase').catch(() => ({ data: [] })),
        apiRequest('/batch').catch(() => ({ data: [] })),
        apiRequest('/customer').catch(() => ({ data: [] })),
        apiRequest('/supplier').catch(() => ({ data: [] })),
        apiRequest('/expense').catch(() => ({ data: [] })),
        apiRequest('/product').catch(() => ({ data: [] })),
        apiRequest('/partner').catch(() => ({ data: [] }))
      ]);

      let notifData = [];
      if (notifRes?.data && Array.isArray(notifRes.data)) {
        const rawItems = notifRes.data
          .filter(a => {
            const act = (a.actionName || a.title || '').toUpperCase();
            const tbl = (a.tableName || a.category || '').toUpperCase();
            const usr = (a.performedBy || a.username || '').toUpperCase();
            return !act.startsWith('WHATSAPP_ALERT') && !act.startsWith('WHATSAPP_BROADCAST') && tbl !== 'PARTNERS' && usr !== 'SYSTEM';
          })
          .map(a => ({
            id: a.id || a.auditId,
            title: a.title || `${a.tableName || 'Activity'} ${a.actionName || 'Update'}`,
            message: a.message || a.newValues || `${a.actionName || ''} on ${a.tableName || ''} #${a.recordId || ''}`,
            category: a.category || a.tableName || 'GENERAL',
            actionType: a.actionType || a.actionName || 'UPDATE',
            performedBy: a.performedBy || a.username || 'Admin',
            timestamp: a.timestamp,
            referenceId: a.referenceId || a.recordId || ''
          }));

        // Robust deduplication: prevent duplicate notifications for same entity & action
        const seenKeys = new Map();
        for (const item of rawItems) {
          const cat = (item.category || '').toUpperCase();
          const ref = String(item.referenceId || item.message || '').replace(/[^\d]/g, '');
          const act = (item.actionType || '').toUpperCase();
          const itemTime = new Date(item.timestamp || Date.now()).getTime();
          
          const dedupeKey = ref ? `${cat}_${ref}_${act}` : `ID_${item.id}`;
          
          if (!seenKeys.has(dedupeKey)) {
            seenKeys.set(dedupeKey, itemTime);
            notifData.push(item);
          } else {
            const lastTime = seenKeys.get(dedupeKey);
            // Allow if separated by more than 3 minutes (separate real-life update)
            if (Math.abs(itemTime - lastTime) > 3 * 60 * 1000) {
              seenKeys.set(dedupeKey, itemTime);
              notifData.push(item);
            }
          }
        }
      }
      setNotifications(notifData);

      setEntities({
        sales: salesRes?.data || [],
        purchases: purchRes?.data || [],
        batches: batchRes?.data || [],
        customers: custRes?.data || [],
        suppliers: suppRes?.data || [],
        expenses: expRes?.data || [],
        products: prodRes?.data || []
      });

      if (partnerRes?.data && Array.isArray(partnerRes.data)) {
        setPartners(partnerRes.data
          .filter(p => !p.isDeleted && p.contactPhone && p.contactPhone.trim().length >= 10)
          .map(p => ({ partnerId: p.partnerId, partnerName: p.partnerName, contactPhone: p.contactPhone }))
        );
      }
    } catch (e) {
      console.warn('Notification fetch warning', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    const handleImmediateUpdate = () => {
      fetchNotifications();
    };
    window.addEventListener('vpms_activity_update', handleImmediateUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('vpms_activity_update', handleImmediateUpdate);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        buttonRef.current && !buttonRef.current.contains(e.target)
      ) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', updatePosition);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, updatePosition]);

  // Visible notifications (not cleared by THIS user)
  const visibleNotifications = notifications.filter(n => !clearedIds.includes(n.id));
  const unreadCount = visibleNotifications.length;

  // Clear only MY notifications (local user-scoped)
  const clearMyNotifications = () => {
    const ids = visibleNotifications.map(n => n.id);
    const updated = [...new Set([...clearedIds, ...ids])];
    setClearedIds(updated);
    try {
      localStorage.setItem(getStorageKey(username), JSON.stringify(updated));
    } catch (e) { console.error(e); }
  };

  const handleNotificationClick = (item) => {
    setIsOpen(false);
    if (!onNavigate) return;
    const cat = (item.category || '').toUpperCase();
    if (cat.includes('SALE')) onNavigate('sales');
    else if (cat.includes('PURCHASE')) onNavigate('purchase');
    else if (cat.includes('STOCK') || cat.includes('BATCH')) onNavigate('batch');
    else if (cat.includes('PRODUCT')) onNavigate('product');
    else if (cat.includes('PARTNER')) onNavigate('partner');
    else if (cat.includes('EXPENSE')) onNavigate('expense');
  };

  // ── Resolve IDs to human-readable details ──
  const resolveNotificationDetails = (item) => {
    const raw = String(item.message || item.referenceId || '').trim();
    const rawDigits = raw.replace(/[^\d]/g, '');
    const cat = (item.category || '').toUpperCase();
    const timeStr = formatDateTimeDDMMYYYY(item.timestamp || Date.now());
    const SEP = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';

    // Sales
    if (cat.includes('SALE')) {
      const match = entities.sales.find(s =>
        String(s.saleId) === rawDigits ||
        `SAL-${s.saleId}` === raw ||
        `INV-${s.saleId}` === raw ||
        (item.referenceId && String(s.saleId) === String(item.referenceId))
      );
      if (match) {
        const cust = match.customerName || entities.customers.find(c => c.customerId === match.customerId)?.customerName || 'Customer';
        const total = match.totalAmount ? `\u20B9${Number(match.totalAmount).toLocaleString('en-IN')}` : '\u20B90';
        const paid = match.paidAmount ? `\u20B9${Number(match.paidAmount).toLocaleString('en-IN')}` : '\u20B90';
        const balance = Math.max(0, (match.totalAmount || 0) - (match.paidAmount || 0));
        const isPaid = (Number(match.paidAmount) >= Number(match.totalAmount)) || match.paymentStatus === 'PAID';
        return {
          title: item.title || `Sales Invoice INV-${match.saleId}`,
          subtitle: `${cust}  \u2022  Total: ${total}  \u2022  ${isPaid ? 'Paid' : `Due \u20B9${balance.toLocaleString('en-IN')}`}`,
          whatsappMsg: [
            `*VINAYAGA PLATES - SALES INVOICE*`,
            SEP,
            `*Invoice No:* INV-${match.saleId}`,
            `*Customer:* ${cust}`,
            `*Total Amount:* ${total}`,
            `*Paid Amount:* ${paid}`,
            `*Balance Due:* \u20B9${balance.toLocaleString('en-IN')}`,
            `*Status:* ${isPaid ? 'PAID' : 'DUE'}`,
            `*Recorded By:* ${item.performedBy || 'Admin'}`,
            `*Time:* ${timeStr}`,
            SEP,
            `_Vinayaga Plates Automated ERP_`
          ].join('\n')
        };
      }
    }

    // Purchase
    if (cat.includes('PURCHASE')) {
      const match = entities.purchases.find(p =>
        String(p.purchaseId) === rawDigits ||
        `PUR-${p.purchaseId}` === raw ||
        (item.referenceId && String(p.purchaseId) === String(item.referenceId))
      );
      if (match) {
        const sup = match.supplierName || entities.suppliers.find(s => s.supplierId === match.supplierId)?.supplierName || 'Supplier';
        const total = match.totalAmount ? `\u20B9${Number(match.totalAmount).toLocaleString('en-IN')}` : '\u20B90';
        const paid = match.paidAmount ? `\u20B9${Number(match.paidAmount).toLocaleString('en-IN')}` : '\u20B90';
        return {
          title: item.title || `Purchase Order PUR-${match.purchaseId}`,
          subtitle: `${sup}  \u2022  Total: ${total}  \u2022  Paid: ${paid}`,
          whatsappMsg: [
            `*VINAYAGA PLATES - PURCHASE ORDER*`,
            SEP,
            `*Purchase No:* PUR-${match.purchaseId}`,
            `*Supplier:* ${sup}`,
            `*Total Cost:* ${total}`,
            `*Paid Amount:* ${paid}`,
            `*Recorded By:* ${item.performedBy || 'Admin'}`,
            `*Time:* ${timeStr}`,
            SEP,
            `_Vinayaga Plates Automated ERP_`
          ].join('\n')
        };
      }
    }

    // Stock/Batch
    if (cat.includes('STOCK') || cat.includes('BATCH')) {
      const match = entities.batches.find(b =>
        String(b.batchId) === rawDigits ||
        b.batchNumber === raw ||
        (item.referenceId && String(b.batchId) === String(item.referenceId))
      );
      if (match) {
        const prod = match.productName || entities.products.find(p => p.productId === match.productId)?.productName || 'Plates Batch';
        const qty = match.currentQuantity ? `${Number(match.currentQuantity).toLocaleString('en-IN')} pcs` : '';
        return {
          title: item.title || `Stock - ${prod}`,
          subtitle: `${prod}  \u2022  Batch: ${match.batchNumber || '#' + match.batchId}  \u2022  ${qty}`,
          whatsappMsg: [
            `*VINAYAGA PLATES - STOCK UPDATE*`,
            SEP,
            `*Product:* ${prod}`,
            `*Batch No:* ${match.batchNumber || '#' + match.batchId}`,
            `*Current Stock:* ${qty}`,
            `*Handled By:* ${item.performedBy || 'Admin'}`,
            `*Time:* ${timeStr}`,
            SEP,
            `_Vinayaga Plates Automated ERP_`
          ].join('\n')
        };
      }
    }

    // Expense
    if (cat.includes('EXPENSE')) {
      const match = entities.expenses.find(e =>
        String(e.transactionId || e.expenseId) === rawDigits ||
        (item.referenceId && String(e.transactionId || e.expenseId) === String(item.referenceId))
      );
      if (match) {
        const amt = match.amount ? `\u20B9${Number(match.amount).toLocaleString('en-IN')}` : '';
        const desc = match.description || 'General Expense';
        return {
          title: item.title || `Expense - ${desc}`,
          subtitle: `${desc}  \u2022  Amount: ${amt}`,
          whatsappMsg: [
            `*VINAYAGA PLATES - EXPENSE RECORDED*`,
            SEP,
            `*Amount:* ${amt}`,
            `*Purpose:* ${desc}`,
            `*Account:* ${match.accountName || 'Cash'}`,
            `*Recorded By:* ${item.performedBy || 'Admin'}`,
            `*Time:* ${timeStr}`,
            SEP,
            `_Vinayaga Plates Automated ERP_`
          ].join('\n')
        };
      }
    }

    // Default fallback
    let fallback = raw;
    if (fallback.includes('*VINAYAGA PLATES') || fallback.includes('━━') || fallback.includes('*Invoice No:*') || fallback.includes('*Purchase No:*')) {
      const custMatch = fallback.match(/\*Customer:\*\s*([^\n\r*]+)/i) || fallback.match(/\*Supplier:\*\s*([^\n\r*]+)/i) || fallback.match(/\*Product:\*\s*([^\n\r*]+)/i);
      const totalMatch = fallback.match(/\*Total Amount:\*\s*([^\n\r*]+)/i) || fallback.match(/\*Total Cost:\*\s*([^\n\r*]+)/i) || fallback.match(/\*Amount:\*\s*([^\n\r*]+)/i);
      const dueMatch = fallback.match(/\*Balance Due:\*\s*([^\n\r*]+)/i) || fallback.match(/\*Balance:\*\s*([^\n\r*]+)/i);
      
      const parts = [];
      if (custMatch) parts.push(custMatch[1].trim());
      if (totalMatch) parts.push(`Total: ${totalMatch[1].trim()}`);
      if (dueMatch) parts.push(`Due ${dueMatch[1].trim()}`);
      
      fallback = parts.length > 0 ? parts.join(' \u2022 ') : (item.title || 'Operational Update');
    } else if (!fallback || fallback.length < 3) {
      fallback = item.title || 'Operational Update';
    }

    return {
      title: item.title || 'Activity Alert',
      subtitle: fallback,
      whatsappMsg: [
        `*VINAYAGA PLATES - ERP NOTIFICATION*`,
        SEP,
        `*Activity:* ${item.title || 'Operational Update'}`,
        `*Details:* ${fallback}`,
        `*Recorded By:* ${item.performedBy || 'Admin'}`,
        `*Time:* ${timeStr}`,
        SEP,
        `_Vinayaga Plates Automated ERP_`
      ].join('\n')
    };
  };

  const handleShareWhatsApp = (e, item) => {
    e.stopPropagation();
    const resolved = resolveNotificationDetails(item);
    const msg = resolved.whatsappMsg;

    if (partners.length === 1) {
      // Close notification drawer first so nothing is behind WhatsApp
      setIsOpen(false);
      setTimeout(() => openWhatsApp(partners[0].contactPhone, msg), 150);
    } else if (partners.length > 1) {
      // Close notification drawer before showing Swal so it renders on top
      setIsOpen(false);
      setTimeout(() => {
        Swal.fire({
          title: 'Send WhatsApp Alert',
          html: `
            <div style="text-align:left">
              <p style="font-size:13px;color:#475569;margin-bottom:10px">Choose partner to send notification to:</p>
              ${partners.map((p, i) => `
                <button id="vpms-wa-btn-${i}"
                  style="width:100%;margin-bottom:8px;background:#16a34a;color:#fff;font-weight:700;padding:14px 16px;border-radius:12px;font-size:14px;border:none;cursor:pointer;display:flex;align-items:center;gap:8px;">
                  <span style="font-size:18px">&#x1F4F2;</span>
                  <span>${p.partnerName} &nbsp;(${p.contactPhone})</span>
                </button>
              `).join('')}
            </div>`,
          showConfirmButton: false,
          showCancelButton: true,
          cancelButtonText: 'Close',
          didOpen: () => {
            partners.forEach((p, i) => {
              const btn = document.getElementById(`vpms-wa-btn-${i}`);
              if (btn) {
                btn.addEventListener('click', () => {
                  Swal.close();
                  setTimeout(() => openWhatsApp(p.contactPhone, msg), 100);
                });
              }
            });
          }
        });
      }, 200);
    } else {
      setIsOpen(false);
      setTimeout(() => openWhatsApp('', msg), 150);
    }
  };

  const getCategoryTheme = (category) => {
    const cat = (category || '').toUpperCase();
    if (cat.includes('SALE')) return { icon: ShoppingCart, color: 'text-emerald-500 bg-emerald-50 border-emerald-200' };
    if (cat.includes('PURCHASE')) return { icon: ShoppingBag, color: 'text-amber-500 bg-amber-50 border-amber-200' };
    if (cat.includes('STOCK') || cat.includes('BATCH')) return { icon: Package, color: 'text-blue-500 bg-blue-50 border-blue-200' };
    if (cat.includes('PRODUCT')) return { icon: Sparkles, color: 'text-pink-500 bg-pink-50 border-pink-200' };
    if (cat.includes('EXPENSE') || cat.includes('FINANCE')) return { icon: DollarSign, color: 'text-rose-500 bg-rose-50 border-rose-200' };
    if (cat.includes('PARTNER')) return { icon: Users, color: 'text-purple-500 bg-purple-50 border-purple-200' };
    return { icon: AlertCircle, color: 'text-slate-500 bg-slate-50 border-slate-200' };
  };

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    const diffSec = Math.floor((Date.now() - new Date(timestamp)) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return formatDateDDMMYYYY(timestamp);
  };

  const filteredNotifications = visibleNotifications.filter(n => {
    if (filter === 'ALL') return true;
    return (n.category || '').toUpperCase().includes(filter);
  });

  // ── Popover sizing: full screen on mobile, fixed panel on desktop ──
  const isActualMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const popoverStyle = isActualMobile
    ? { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, maxHeight: '100dvh', width: '100vw', borderRadius: 0, zIndex: 99999 }
    : {
        position: 'fixed',
        top: `${coords.top}px`,
        left: coords.left !== null ? `${coords.left}px` : 'auto',
        right: coords.right !== null ? `${coords.right}px` : 'auto',
        width: '380px',
        maxHeight: '85vh',
        zIndex: 99999
      };

  return (
    <div className="relative inline-block">
      {/* ── Bell Button ── */}
      {isSidebar ? (
        <button
          ref={buttonRef}
          onClick={toggleOpen}
          className={`relative p-1.5 rounded-lg transition-all duration-200 active:scale-95 flex items-center justify-center ${
            isOpen ? 'bg-brand-accent/20 text-brand-accent' : 'text-slate-300 hover:text-slate-100 hover:bg-brand-sidebar-hover'
          }`}
          title="Admin Activity & Notifications"
          aria-label="Notifications"
        >
          <Bell size={14} className={unreadCount > 0 ? 'text-brand-accent' : ''} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      ) : (
        <button
          ref={buttonRef}
          onClick={toggleOpen}
          className={`relative p-2 rounded-xl transition-all duration-200 active:scale-95 flex items-center justify-center ${
            isOpen ? 'bg-brand-accent/20 text-brand-accent' : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
          }`}
          title="Admin Activity & Notifications"
          aria-label="Notifications"
        >
          <Bell size={17} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white ring-2 ring-slate-900">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* ── Notification Drawer (Portal) ── */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          className="bg-[#fff7f9] border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={popoverStyle}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-4 py-3 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-accent/30 text-brand-accent border border-brand-accent/40">
                <Bell size={15} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white leading-tight flex items-center gap-2">
                  Activity Feed
                  {unreadCount > 0 && (
                    <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </h3>
                <p className="text-[10px] text-slate-400">Live updates for all admins</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={fetchNotifications} disabled={loading} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all">
                <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Filter + Clear My Notifications */}
          <div className="bg-slate-50 border-b border-slate-100 px-2 py-2 flex items-center justify-between gap-1 shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'SALE', label: 'Sales' },
                { id: 'PURCHASE', label: 'Purchase' },
                { id: 'STOCK', label: 'Stock' },
                { id: 'EXPENSE', label: 'Finance' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {visibleNotifications.length > 0 && (
              <button
                onClick={clearMyNotifications}
                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 whitespace-nowrap px-1.5 py-0.5 rounded hover:bg-rose-50 transition flex items-center gap-1 shrink-0"
                title="Clear my notifications"
              >
                <Trash2 size={10} />
                <span>Clear Mine</span>
              </button>
            )}
          </div>

          {/* Feed Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1.5">
            {filteredNotifications.length === 0 ? (
              <div className="py-14 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={22} />
                </div>
                <p className="text-sm font-bold text-slate-700">All clear!</p>
                <p className="text-[11px] text-slate-400 mt-1">No notifications to show.</p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const { icon: Icon, color } = getCategoryTheme(item.category);
                const resolved = resolveNotificationDetails(item);

                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className="p-3 rounded-xl transition-all cursor-pointer group flex items-start gap-3 my-0.5 hover:bg-slate-50 active:scale-[0.99] bg-blue-50/40 border-l-2 border-brand-accent"
                  >
                    {/* Icon */}
                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border ${color} mt-0.5`}>
                      <Icon size={16} />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <span className="text-[12px] font-extrabold text-slate-900 leading-tight">
                          {resolved.title}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap flex items-center gap-0.5 shrink-0 mt-0.5">
                          <Clock size={9} />
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-[11px] font-medium text-slate-600 leading-relaxed mb-1.5 break-words">
                        {resolved.subtitle}
                      </p>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400">
                          By: <strong className="text-slate-600">{item.performedBy}</strong>
                        </span>
                        <button
                          onClick={(e) => handleShareWhatsApp(e, item)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition shrink-0"
                          title="Send on WhatsApp"
                        >
                          <MessageCircle size={11} />
                          <span>WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-slate-500">
              {partners.length > 0 ? `🟢 ${partners.length} partner(s) linked` : '⚡ WhatsApp Ready'}
            </span>
            <span className="text-[9px] text-slate-400">Auto-refreshes every 20s</span>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
