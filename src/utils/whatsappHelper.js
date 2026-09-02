// WhatsApp Notification & Alert Helper for Vinayaga Plates Partners
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';

export const formatCurrency = (val) => {
  const num = Number(val) || 0;
  return `\u20B9${num.toLocaleString('en-IN')}`;
};

export const getCleanDateTime = () => {
  return new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const SEP = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';

// ── Pre-formatted Template Builders (emoji-free for universal compatibility) ──

export const createSalesWhatsAppMessage = ({ saleId, customerName, totalAmount, paidAmount, balanceAmount, paymentStatus, handledBy }) => {
  const time = getCleanDateTime();
  const isPaid = (Number(paidAmount) >= Number(totalAmount)) || paymentStatus === 'PAID';

  return [
    `*VINAYAGA PLATES - SALES INVOICE*`,
    SEP,
    `*Invoice No:* INV-${saleId}`,
    `*Customer:* ${customerName || 'Direct Sale'}`,
    `*Total Amount:* ${formatCurrency(totalAmount)}`,
    `*Paid Amount:* ${formatCurrency(paidAmount)}`,
    `*Balance Due:* ${formatCurrency(balanceAmount || Math.max(0, totalAmount - paidAmount))}`,
    `*Status:* ${isPaid ? 'PAID' : 'DUE'}`,
    `*Recorded By:* ${handledBy || 'Admin'}`,
    `*Time:* ${time}`,
    SEP,
    `_Vinayaga Plates Automated ERP_`
  ].join('\n');
};

export const createPurchaseWhatsAppMessage = ({ purchaseId, supplierName, totalAmount, paidAmount, balanceAmount, handledBy }) => {
  const time = getCleanDateTime();
  return [
    `*VINAYAGA PLATES - PURCHASE ORDER*`,
    SEP,
    `*Purchase No:* PUR-${purchaseId}`,
    `*Supplier:* ${supplierName || 'General Supplier'}`,
    `*Total Cost:* ${formatCurrency(totalAmount)}`,
    `*Paid:* ${formatCurrency(paidAmount)}`,
    `*Balance:* ${formatCurrency(balanceAmount || Math.max(0, totalAmount - paidAmount))}`,
    `*Recorded By:* ${handledBy || 'Admin'}`,
    `*Time:* ${time}`,
    SEP,
    `_Vinayaga Plates Automated ERP_`
  ].join('\n');
};

export const createStockAdjustWhatsAppMessage = ({ batchNumber, productName, oldQuantity, newQuantity, reason, handledBy }) => {
  const time = getCleanDateTime();
  const diff = (Number(newQuantity) || 0) - (Number(oldQuantity) || 0);
  const diffText = diff >= 0 ? `+${diff} pcs` : `${diff} pcs`;

  return [
    `*VINAYAGA PLATES - STOCK ADJUSTMENT*`,
    SEP,
    `*Product:* ${productName}`,
    `*Batch No:* ${batchNumber}`,
    `*New Stock:* ${Number(newQuantity).toLocaleString()} pcs (${diffText})`,
    `*Reason:* ${reason || 'Physical Stock Verification'}`,
    `*Handled By:* ${handledBy || 'Admin'}`,
    `*Time:* ${time}`,
    SEP,
    `_Vinayaga Plates Automated ERP_`
  ].join('\n');
};

export const createNewBatchWhatsAppMessage = ({ batchNumber, productName, quantity, unitCost, handledBy }) => {
  const time = getCleanDateTime();
  return [
    `*VINAYAGA PLATES - NEW STOCK INTAKE*`,
    SEP,
    `*Product:* ${productName}`,
    `*Batch No:* ${batchNumber}`,
    `*Quantity:* ${Number(quantity).toLocaleString()} pcs`,
    `*Unit Landed Cost:* ${formatCurrency(unitCost)}`,
    `*Recorded By:* ${handledBy || 'Admin'}`,
    `*Time:* ${time}`,
    SEP,
    `_Vinayaga Plates Automated ERP_`
  ].join('\n');
};

export const createProductWhatsAppMessage = ({ productName, categoryName, variantName, handledBy }) => {
  const time = getCleanDateTime();
  return [
    `*VINAYAGA PLATES - NEW PRODUCT CATALOG*`,
    SEP,
    `*Product:* ${productName}`,
    `*Category:* ${categoryName || 'Domestic Plates'}`,
    `*Variant:* ${variantName || 'Standard'}`,
    `*Created By:* ${handledBy || 'Admin'}`,
    `*Time:* ${time}`,
    SEP,
    `_Vinayaga Plates Automated ERP_`
  ].join('\n');
};

export const createExpenseWhatsAppMessage = ({ desc, amount, accountName, handledBy }) => {
  const time = getCleanDateTime();
  return [
    `*VINAYAGA PLATES - EXPENSE RECORDED*`,
    SEP,
    `*Amount:* ${formatCurrency(amount)}`,
    `*Purpose:* ${desc}`,
    `*Account:* ${accountName || 'Cash'}`,
    `*Recorded By:* ${handledBy || 'Admin'}`,
    `*Time:* ${time}`,
    SEP,
    `_Vinayaga Plates Automated ERP_`
  ].join('\n');
};

// ── WhatsApp Notification Dispatcher (Silent Background API Delivery) ──

export const sendWhatsAppNotificationToPartners = async (apiRequest, { message, eventType, referenceId, category, actionType, performedBy }) => {
  try {
    if (!apiRequest || !message) return;

    // 1. Silent Background API Broadcast to all active partners
    apiRequest('/notification/broadcast-whatsapp', {
      method: 'POST',
      body: JSON.stringify({ message, eventType: eventType || 'GENERAL' })
    }).catch(err => console.warn('Silent WhatsApp API broadcast warning:', err));

    // 2. Log activity entry for notification feed
    apiRequest('/notification/record-activity', {
      method: 'POST',
      body: JSON.stringify({
        category: category || 'GENERAL',
        actionType: actionType || 'UPDATE',
        referenceId: String(referenceId || ''),
        message,
        performedBy: performedBy || 'Admin'
      })
    }).catch(err => console.warn('Activity record warning:', err));

  } catch (e) {
    console.error('Error in sendWhatsAppNotificationToPartners', e);
  }
};

// ── Universal WhatsApp Opener ──
// Native Android: Capacitor Share sheet (text as-is, no encoding issues)
// Web browser: wa.me anchor click
export const openWhatsAppDirectUrl = async (phoneNumber, message) => {
  if (!message) return;
  const cleanPhone = phoneNumber ? String(phoneNumber).replace(/[^\d]/g, '') : '';
  const finalPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({ text: message, dialogTitle: 'Send WhatsApp Notification' });
      return;
    } catch (err) {
      console.warn('Capacitor Share failed, using intent fallback', err);
    }
    const intentUrl = finalPhone
      ? `intent://send?phone=%2B${finalPhone}&text=${encodeURIComponent(message)}#Intent;scheme=whatsapp;package=com.whatsapp;end`
      : `intent://send?text=${encodeURIComponent(message)}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
    window.location.href = intentUrl;
  } else {
    const encoded = encodeURIComponent(message);
    const url = finalPhone
      ? `https://wa.me/${finalPhone}?text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
