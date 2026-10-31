import type { PlanWithId } from "@/types/catalog";
import type {
  PaymentTerms,
  SubscriptionStatus,
} from "@/types/subscription";

export interface TemplateLineWithId {
  id: string;
  templateId?: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  taxId?: string;
  amount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface QuotationTemplateWithDetails {
  id: string;
  name: string;
  planId: string;
  validityDays: number;
  createdAt: string;
  updatedAt: string;
  plan?: PlanWithId | null;
  lines: TemplateLineWithId[];
}

export interface SubscriptionLineWithId {
  id: string;
  subscriptionId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  taxId?: string;
  amount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionStatusHistoryItem {
  id: string;
  subscriptionId: string;
  fromStatus: SubscriptionStatus | null;
  toStatus: SubscriptionStatus;
  changedBy: string | null;
  changedAt: string;
  createdAt?: string;
}

export interface SubscriptionWithDetails {
  id: string;
  number: string;
  customerId: string;
  planId: string;
  templateId?: string | null;
  startDate: string;
  expiryDate: string;
  paymentTerms: PaymentTerms;
  status: SubscriptionStatus;
  nextBillingDate?: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: PlanWithId | null;
  lines: SubscriptionLineWithId[];
  history: SubscriptionStatusHistoryItem[];
  customer?: {
    id: string;
    email?: string;
    name?: string;
  } | null;
}

