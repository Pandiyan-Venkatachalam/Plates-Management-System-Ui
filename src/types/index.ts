// TypeScript Enterprise Type Definitions for VPMS (MNC Standard)

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
  errors?: string[];
  [key: string]: any;
}

export interface BusinessAccount {
  accountId: number;
  accountName: string;
  accountType?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface AccountTransaction {
  transactionId: number;
  accountId: number;
  transactionType: 'CREDIT' | 'DEBIT';
  amount: number;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  transactionDate?: string;
  [key: string]: any;
}

export interface BusinessAccountLedgerSummary {
  accountId: number;
  accountName: string;
  accountType: string;
  partnerName: string;
  openingBalance: number;
  salesCollected: number;
  purchasesPaid: number;
  expensesPaid: number;
  invested: number;
  withdrawn: number;
  netInHand: number;
  periodCredits: number;
  periodDebits: number;
  transactionCount: number;
  [key: string]: any;
}

export interface Partner {
  partnerId: number;
  partnerName: string;
  phone?: string;
  email?: string;
  sharePercentage?: number;
  [key: string]: any;
}

export interface PartnerLedger {
  ledgerId: number;
  partnerId: number;
  partnerName?: string;
  transactionType: 'INVESTMENT' | 'WITHDRAWAL';
  amount: number;
  description?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface SaleDetail {
  saleDetailId: number;
  saleId: number;
  productId: number;
  productName?: string;
  batchId?: number;
  quantity: number;
  unitPrice: number;
  [key: string]: any;
}

export interface SalePayment {
  paymentId: number;
  saleId: number;
  accountId: number;
  accountName?: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Sale {
  saleId: number;
  saleNumber: string;
  customerId: number;
  customerName?: string;
  saleDate: string;
  subTotal: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount?: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | string;
  status: string;
  details?: SaleDetail[];
  payments?: SalePayment[];
  accountName?: string;
  paymentMethodAccountName?: string;
  accountId?: number;
  [key: string]: any;
}

export interface PurchaseDetail {
  purchaseDetailId: number;
  purchaseId: number;
  productId: number;
  productName?: string;
  batchId?: number;
  quantity: number;
  unitPrice: number;
  [key: string]: any;
}

export interface PurchasePayment {
  paymentId: number;
  purchaseId: number;
  accountId: number;
  accountName?: string;
  amount: number;
  paymentMethod: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface Purchase {
  purchaseId: number;
  purchaseNumber: string;
  supplierId: number;
  supplierName?: string;
  purchaseDate: string;
  totalAmount: number;
  paidAmount: number;
  balanceAmount?: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' | string;
  status: string;
  details?: PurchaseDetail[];
  payments?: PurchasePayment[];
  [key: string]: any;
}

export interface InventoryBatch {
  batchId: number;
  batchNumber: string;
  productId: number;
  locationId?: number;
  initialQuantity: number;
  currentQuantity: number;
  unitCost: number;
  landedUnitCost?: number;
  [key: string]: any;
}
