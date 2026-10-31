import {
  Invoice,
  Payment,
  PaymentStatus,
  SubscriptionStatus,
  BillingInterval,
} from "./index";

export type ExtendedInvoiceStatus =
  | "draft"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "overdue";

export type PaymentMethodType =
  | "card"
  | "upi"
  | "net_banking"
  | "bank_transfer"
  | "cash"
  | "manual";

export type BillingFrequency = "day" | "week" | "month" | "quarter" | "year";

export interface TaxRule {
  id: string;
  name: string;
  code: string;
  rate: number; // percentage, e.g. 18.00
  description?: string;
  isActive: boolean;
  country: string;
  state?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Discount {
  id: string;
  code: string;
  name: string;
  type: "percentage" | "fixed";
  value: number; // percentage or fixed amount in Rupees
  minPurchaseAmount?: number;
  minQuantity?: number;
  maxUsage?: number;
  usedCount: number;
  productId?: string;
  subscriptionId?: string;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId?: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  subtotalPaise: number;
  discountAmountPaise: number;
  taxRatePercent: number;
  taxAmountPaise: number;
  totalAmountPaise: number;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface DetailedInvoice extends Invoice {
  invoiceNumber: string;
  extendedStatus: ExtendedInvoiceStatus;
  issueDate: string;
  periodStart?: string;
  periodEnd?: string;
  subtotalPaise: number;
  discountTotalPaise: number;
  taxTotalPaise: number;
  totalAmountPaise: number;
  amountPaidPaise: number;
  amountDuePaise: number;
  notes?: string;
  customerName?: string;
  customerEmail?: string;
  items: InvoiceItem[];
  payments?: DetailedPayment[];
}

export interface DetailedPayment extends Payment {
  customerId: string;
  amountPaise: number;
  paymentDate: string;
  transactionReference?: string;
  notes?: string;
  paymentMethodType: PaymentMethodType;
}

export interface SubscriptionBillingContract {
  subscriptionId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  planName: string;
  quantity: number;
  unitPricePaise: number;
  billingInterval: BillingInterval | BillingFrequency;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  status: SubscriptionStatus;
  taxRuleCode?: string;
  discountCode?: string;
}

export interface BillingAnalyticsSummary {
  totalRevenuePaise: number;
  totalCollectedPaise: number;
  totalOutstandingPaise: number;
  overdueInvoicesCount: number;
  paidInvoicesCount: number;
  openInvoicesCount: number;
  draftInvoicesCount: number;
  cancelledInvoicesCount: number;
  collectionRatePercent: number;
  recentPayments: DetailedPayment[];
}

export interface CreateManualInvoiceInput {
  customerName: string;
  customerEmail: string;
  customerId?: string;
  dueDate: string;
  notes?: string;
  items: {
    description: string;
    quantity: number;
    unitPriceRupees: number;
    taxRatePercent?: number;
    discountCode?: string;
    productId?: string;
  }[];
}
