import {
  DetailedInvoice,
  InvoiceItem,
  ExtendedInvoiceStatus,
  InvoiceStatus,
  BillingAnalyticsSummary,
} from "@/types";
import {
  rupeesToPaise,
  paiseToRupees,
  calculateInvoiceTotals,
  LineItemCalculationInput,
} from "@/lib/billing/math";
import { evaluateDiscountEligibility, getDiscountByCode, incrementDiscountUsage } from "./discounts";

export function toBaseInvoiceStatus(extended: ExtendedInvoiceStatus): InvoiceStatus {
  switch (extended) {
    case "paid":
      return "paid";
    case "draft":
      return "draft";
    case "cancelled":
      return "void";
    case "confirmed":
    case "overdue":
    default:
      return "open";
  }
}

// Helper to determine derived status (e.g. overdue)
export function resolveInvoiceStatus(
  status: ExtendedInvoiceStatus,
  dueDateStr: string,
  amountDuePaise: number
): ExtendedInvoiceStatus {
  if (status === "paid" || status === "cancelled" || status === "draft") {
    return status;
  }
  const isPastDue = new Date(dueDateStr) < new Date();
  if (isPastDue && amountDuePaise > 0) {
    return "overdue";
  }
  return status;
}

// 20 Deterministic seed invoices matching database seed
let invoicesStore: DetailedInvoice[] = [
  {
    id: "33333333-3333-4000-8000-000000000001",
    invoiceNumber: "INV-2026-0001",
    customerId: "a0000000-0000-4000-8000-000000000001",
    customerName: "Astra Tech Solutions",
    customerEmail: "billing@astratech.in",
    subscriptionId: "b0000000-0000-4000-8000-000000000001",
    status: "paid",
    extendedStatus: "paid",
    currency: "INR",
    issueDate: "2026-10-01T00:00:00Z",
    dueDate: "2026-10-15T00:00:00Z",
    periodStart: "2026-10-01T00:00:00Z",
    periodEnd: "2026-10-31T23:59:59Z",
    subtotalPaise: 499900,
    discountTotalPaise: 0,
    taxTotalPaise: 89982,
    totalAmountPaise: 589882,
    amountPaidPaise: 589882,
    amountDuePaise: 0,
    amountDue: 0.0,
    amountPaid: 5898.82,
    createdAt: "2026-10-01T00:00:00Z",
    notes: "Enterprise Cloud Tier - Monthly cycle",
    items: [
      {
        id: "item-001",
        invoiceId: "33333333-3333-4000-8000-000000000001",
        description: "Enterprise Cloud Subscription (Monthly)",
        quantity: 1,
        unitPricePaise: 499900,
        subtotalPaise: 499900,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 89982,
        totalAmountPaise: 589882,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000002",
    invoiceNumber: "INV-2026-0002",
    customerId: "a0000000-0000-4000-8000-000000000002",
    customerName: "Nexora Analytics",
    customerEmail: "finance@nexora.io",
    subscriptionId: "b0000000-0000-4000-8000-000000000002",
    status: "paid",
    extendedStatus: "paid",
    currency: "INR",
    issueDate: "2026-10-02T00:00:00Z",
    dueDate: "2026-10-16T00:00:00Z",
    periodStart: "2026-10-02T00:00:00Z",
    periodEnd: "2026-11-01T23:59:59Z",
    subtotalPaise: 299900,
    discountTotalPaise: 59980,
    taxTotalPaise: 43186,
    totalAmountPaise: 283106,
    amountPaidPaise: 283106,
    amountDuePaise: 0,
    amountDue: 0.0,
    amountPaid: 2831.06,
    createdAt: "2026-10-02T00:00:00Z",
    notes: "Pro Business Plan with WELCOME20 applied",
    items: [
      {
        id: "item-002",
        invoiceId: "33333333-3333-4000-8000-000000000002",
        description: "Pro Business Plan (Monthly)",
        quantity: 1,
        unitPricePaise: 299900,
        subtotalPaise: 299900,
        discountAmountPaise: 59980,
        taxRatePercent: 18,
        taxAmountPaise: 43186,
        totalAmountPaise: 283106,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000003",
    invoiceNumber: "INV-2026-0003",
    customerId: "a0000000-0000-4000-8000-000000000003",
    customerName: "Kite Fintech Labs",
    customerEmail: "accounts@kitefintech.com",
    subscriptionId: "b0000000-0000-4000-8000-000000000003",
    status: "paid",
    extendedStatus: "paid",
    currency: "INR",
    issueDate: "2026-09-15T00:00:00Z",
    dueDate: "2026-09-30T00:00:00Z",
    periodStart: "2026-09-15T00:00:00Z",
    periodEnd: "2027-09-14T23:59:59Z",
    subtotalPaise: 2499900,
    discountTotalPaise: 374985,
    taxTotalPaise: 382485,
    totalAmountPaise: 2507400,
    amountPaidPaise: 2507400,
    amountDuePaise: 0,
    amountDue: 0.0,
    amountPaid: 25074.0,
    createdAt: "2026-09-15T00:00:00Z",
    notes: "Annual Developer Platform Subscription with ANNUAL15",
    items: [
      {
        id: "item-003",
        invoiceId: "33333333-3333-4000-8000-000000000003",
        description: "Annual Developer Platform License",
        quantity: 1,
        unitPricePaise: 2499900,
        subtotalPaise: 2499900,
        discountAmountPaise: 374985,
        taxRatePercent: 18,
        taxAmountPaise: 382485,
        totalAmountPaise: 2507400,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000004",
    invoiceNumber: "INV-2026-0004",
    customerId: "a0000000-0000-4000-8000-000000000004",
    customerName: "CloudScale Systems",
    customerEmail: "ops@cloudscale.net",
    subscriptionId: "b0000000-0000-4000-8000-000000000004",
    status: "open",
    extendedStatus: "confirmed",
    currency: "INR",
    issueDate: "2026-10-20T00:00:00Z",
    dueDate: "2026-11-05T00:00:00Z",
    periodStart: "2026-10-20T00:00:00Z",
    periodEnd: "2026-11-19T23:59:59Z",
    subtotalPaise: 1200000,
    discountTotalPaise: 0,
    taxTotalPaise: 216000,
    totalAmountPaise: 1416000,
    amountPaidPaise: 500000,
    amountDuePaise: 916000,
    amountDue: 9160.0,
    amountPaid: 5000.0,
    createdAt: "2026-10-20T00:00:00Z",
    notes: "Partial payment received via UPI, balance pending",
    items: [
      {
        id: "item-004",
        invoiceId: "33333333-3333-4000-8000-000000000004",
        description: "Enterprise Cluster Nodes (x4)",
        quantity: 4,
        unitPricePaise: 300000,
        subtotalPaise: 1200000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 216000,
        totalAmountPaise: 1416000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000005",
    invoiceNumber: "INV-2026-0005",
    customerId: "a0000000-0000-4000-8000-000000000005",
    customerName: "Zenith Retail Tech",
    customerEmail: "pay@zenithretail.in",
    subscriptionId: "b0000000-0000-4000-8000-000000000005",
    status: "open",
    extendedStatus: "confirmed",
    currency: "INR",
    issueDate: "2026-10-25T00:00:00Z",
    dueDate: "2026-11-08T00:00:00Z",
    periodStart: "2026-10-25T00:00:00Z",
    periodEnd: "2026-11-24T23:59:59Z",
    subtotalPaise: 850000,
    discountTotalPaise: 50000,
    taxTotalPaise: 144000,
    totalAmountPaise: 944000,
    amountPaidPaise: 444000,
    amountDuePaise: 500000,
    amountDue: 5000.0,
    amountPaid: 4440.0,
    createdAt: "2026-10-25T00:00:00Z",
    notes: "First installment received, final tranche due on 8th Nov",
    items: [
      {
        id: "item-005",
        invoiceId: "33333333-3333-4000-8000-000000000005",
        description: "Retail POS Backend Integration Hub",
        quantity: 1,
        unitPricePaise: 850000,
        subtotalPaise: 850000,
        discountAmountPaise: 50000,
        taxRatePercent: 18,
        taxAmountPaise: 144000,
        totalAmountPaise: 944000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000006",
    invoiceNumber: "INV-2026-0006",
    customerId: "a0000000-0000-4000-8000-000000000006",
    customerName: "Bytecraft Software",
    customerEmail: "contact@bytecraft.dev",
    subscriptionId: "b0000000-0000-4000-8000-000000000006",
    status: "open",
    extendedStatus: "overdue",
    currency: "INR",
    issueDate: "2026-09-01T00:00:00Z",
    dueDate: "2026-09-15T00:00:00Z",
    periodStart: "2026-09-01T00:00:00Z",
    periodEnd: "2026-09-30T23:59:59Z",
    subtotalPaise: 750000,
    discountTotalPaise: 0,
    taxTotalPaise: 135000,
    totalAmountPaise: 885000,
    amountPaidPaise: 0,
    amountDuePaise: 885000,
    amountDue: 8850.0,
    amountPaid: 0.0,
    createdAt: "2026-09-01T00:00:00Z",
    notes: "Payment reminder sent - past due date",
    items: [
      {
        id: "item-006",
        invoiceId: "33333333-3333-4000-8000-000000000006",
        description: "Custom API Integration Gateway",
        quantity: 1,
        unitPricePaise: 750000,
        subtotalPaise: 750000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 135000,
        totalAmountPaise: 885000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000007",
    invoiceNumber: "INV-2026-0007",
    customerId: "a0000000-0000-4000-8000-000000000007",
    customerName: "Orbit Logistics",
    customerEmail: "accounts@orbitlogistics.co",
    subscriptionId: "b0000000-0000-4000-8000-000000000007",
    status: "open",
    extendedStatus: "overdue",
    currency: "INR",
    issueDate: "2026-09-10T00:00:00Z",
    dueDate: "2026-09-25T00:00:00Z",
    periodStart: "2026-09-10T00:00:00Z",
    periodEnd: "2026-10-09T23:59:59Z",
    subtotalPaise: 1500000,
    discountTotalPaise: 0,
    taxTotalPaise: 270000,
    totalAmountPaise: 1770000,
    amountPaidPaise: 770000,
    amountDuePaise: 1000000,
    amountDue: 10000.0,
    amountPaid: 7700.0,
    createdAt: "2026-09-10T00:00:00Z",
    notes: "Overdue remainder from September cycle",
    items: [
      {
        id: "item-007",
        invoiceId: "33333333-3333-4000-8000-000000000007",
        description: "Logistics Tracking Enterprise Connector",
        quantity: 1,
        unitPricePaise: 1500000,
        subtotalPaise: 1500000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 270000,
        totalAmountPaise: 1770000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000008",
    invoiceNumber: "INV-2026-0008",
    customerId: "a0000000-0000-4000-8000-000000000008",
    customerName: "Synthex Health",
    customerEmail: "billing@synthexhealth.in",
    status: "draft",
    extendedStatus: "draft",
    currency: "INR",
    issueDate: "2026-10-30T00:00:00Z",
    dueDate: "2026-11-14T00:00:00Z",
    periodStart: "2026-11-01T00:00:00Z",
    periodEnd: "2026-11-30T23:59:59Z",
    subtotalPaise: 350000,
    discountTotalPaise: 0,
    taxTotalPaise: 63000,
    totalAmountPaise: 413000,
    amountPaidPaise: 0,
    amountDuePaise: 413000,
    amountDue: 4130.0,
    amountPaid: 0.0,
    createdAt: "2026-10-30T00:00:00Z",
    notes: "Draft quotation conversion invoice",
    items: [
      {
        id: "item-008",
        invoiceId: "33333333-3333-4000-8000-000000000008",
        description: "HIPAA Compliant Cloud Node",
        quantity: 1,
        unitPricePaise: 350000,
        subtotalPaise: 350000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 63000,
        totalAmountPaise: 413000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000009",
    invoiceNumber: "INV-2026-0009",
    customerId: "a0000000-0000-4000-8000-000000000009",
    customerName: "Quantum AI Dynamics",
    customerEmail: "accounts@quantumai.org",
    subscriptionId: "b0000000-0000-4000-8000-000000000009",
    status: "void",
    extendedStatus: "cancelled",
    currency: "INR",
    issueDate: "2026-10-05T00:00:00Z",
    dueDate: "2026-10-19T00:00:00Z",
    periodStart: "2026-10-05T00:00:00Z",
    periodEnd: "2026-11-04T23:59:59Z",
    subtotalPaise: 600000,
    discountTotalPaise: 0,
    taxTotalPaise: 108000,
    totalAmountPaise: 708000,
    amountPaidPaise: 0,
    amountDuePaise: 708000,
    amountDue: 7080.0,
    amountPaid: 0.0,
    createdAt: "2026-10-05T00:00:00Z",
    notes: "Cancelled due to customer subscription tier downgrade",
    items: [
      {
        id: "item-009",
        invoiceId: "33333333-3333-4000-8000-000000000009",
        description: "GPU Workload Accelerator Unit",
        quantity: 1,
        unitPricePaise: 600000,
        subtotalPaise: 600000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 108000,
        totalAmountPaise: 708000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000010",
    invoiceNumber: "INV-2026-0010",
    customerId: "a0000000-0000-4000-8000-000000000010",
    customerName: "Solaris Green Energy",
    customerEmail: "ops@solarisenergy.in",
    subscriptionId: "b0000000-0000-4000-8000-000000000010",
    status: "paid",
    extendedStatus: "paid",
    currency: "INR",
    issueDate: "2026-10-12T00:00:00Z",
    dueDate: "2026-10-26T00:00:00Z",
    periodStart: "2026-10-12T00:00:00Z",
    periodEnd: "2026-11-11T23:59:59Z",
    subtotalPaise: 199900,
    discountTotalPaise: 0,
    taxTotalPaise: 35982,
    totalAmountPaise: 235882,
    amountPaidPaise: 235882,
    amountDuePaise: 0,
    amountDue: 0.0,
    amountPaid: 2358.82,
    createdAt: "2026-10-12T00:00:00Z",
    notes: "Starter Team Subscription",
    items: [
      {
        id: "item-010",
        invoiceId: "33333333-3333-4000-8000-000000000010",
        description: "Starter Team Tier Plan",
        quantity: 1,
        unitPricePaise: 199900,
        subtotalPaise: 199900,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 35982,
        totalAmountPaise: 235882,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000011",
    invoiceNumber: "INV-2026-0011",
    customerId: "a0000000-0000-4000-8000-000000000001",
    customerName: "Astra Tech Solutions",
    customerEmail: "billing@astratech.in",
    subscriptionId: "b0000000-0000-4000-8000-000000000011",
    status: "paid",
    extendedStatus: "paid",
    currency: "INR",
    issueDate: "2026-09-01T00:00:00Z",
    dueDate: "2026-09-15T00:00:00Z",
    periodStart: "2026-09-01T00:00:00Z",
    periodEnd: "2026-09-30T23:59:59Z",
    subtotalPaise: 499900,
    discountTotalPaise: 0,
    taxTotalPaise: 89982,
    totalAmountPaise: 589882,
    amountPaidPaise: 589882,
    amountDuePaise: 0,
    amountDue: 0.0,
    amountPaid: 5898.82,
    createdAt: "2026-09-01T00:00:00Z",
    notes: "September cycle billing",
    items: [
      {
        id: "item-011",
        invoiceId: "33333333-3333-4000-8000-000000000011",
        description: "Enterprise Cloud Subscription (September)",
        quantity: 1,
        unitPricePaise: 499900,
        subtotalPaise: 499900,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 89982,
        totalAmountPaise: 589882,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000012",
    invoiceNumber: "INV-2026-0012",
    customerId: "a0000000-0000-4000-8000-000000000002",
    customerName: "Nexora Analytics",
    customerEmail: "finance@nexora.io",
    subscriptionId: "b0000000-0000-4000-8000-000000000012",
    status: "open",
    extendedStatus: "confirmed",
    currency: "INR",
    issueDate: "2026-10-28T00:00:00Z",
    dueDate: "2026-11-12T00:00:00Z",
    periodStart: "2026-10-28T00:00:00Z",
    periodEnd: "2026-11-27T23:59:59Z",
    subtotalPaise: 299900,
    discountTotalPaise: 0,
    taxTotalPaise: 53982,
    totalAmountPaise: 353882,
    amountPaidPaise: 0,
    amountDuePaise: 353882,
    amountDue: 3538.82,
    amountPaid: 0.0,
    createdAt: "2026-10-28T00:00:00Z",
    notes: "Awaiting payment via Bank Transfer",
    items: [
      {
        id: "item-012",
        invoiceId: "33333333-3333-4000-8000-000000000012",
        description: "Pro Business Renewal",
        quantity: 1,
        unitPricePaise: 299900,
        subtotalPaise: 299900,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 53982,
        totalAmountPaise: 353882,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000013",
    invoiceNumber: "INV-2026-0013",
    customerId: "a0000000-0000-4000-8000-000000000003",
    customerName: "Kite Fintech Labs",
    customerEmail: "accounts@kitefintech.com",
    subscriptionId: "b0000000-0000-4000-8000-000000000013",
    status: "paid",
    extendedStatus: "paid",
    currency: "INR",
    issueDate: "2026-10-18T00:00:00Z",
    dueDate: "2026-11-01T00:00:00Z",
    periodStart: "2026-10-18T00:00:00Z",
    periodEnd: "2026-11-17T23:59:59Z",
    subtotalPaise: 999900,
    discountTotalPaise: 99990,
    taxTotalPaise: 161984,
    totalAmountPaise: 1061894,
    amountPaidPaise: 1061894,
    amountDuePaise: 0,
    amountDue: 0.0,
    amountPaid: 10618.94,
    createdAt: "2026-10-18T00:00:00Z",
    notes: "Enterprise Scale Plan with HACKATHON10 coupon",
    items: [
      {
        id: "item-013",
        invoiceId: "33333333-3333-4000-8000-000000000013",
        description: "Enterprise Scale Plan with HACKATHON10 coupon",
        quantity: 1,
        unitPricePaise: 999900,
        subtotalPaise: 999900,
        discountAmountPaise: 99990,
        taxRatePercent: 18,
        taxAmountPaise: 161984,
        totalAmountPaise: 1061894,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000014",
    invoiceNumber: "INV-2026-0014",
    customerId: "a0000000-0000-4000-8000-000000000004",
    customerName: "CloudScale Systems",
    customerEmail: "ops@cloudscale.net",
    subscriptionId: "b0000000-0000-4000-8000-000000000014",
    status: "open",
    extendedStatus: "overdue",
    currency: "INR",
    issueDate: "2026-08-15T00:00:00Z",
    dueDate: "2026-08-30T00:00:00Z",
    periodStart: "2026-08-15T00:00:00Z",
    periodEnd: "2026-09-14T23:59:59Z",
    subtotalPaise: 450000,
    discountTotalPaise: 0,
    taxTotalPaise: 81000,
    totalAmountPaise: 531000,
    amountPaidPaise: 0,
    amountDuePaise: 531000,
    amountDue: 5310.0,
    amountPaid: 0.0,
    createdAt: "2026-08-15T00:00:00Z",
    notes: "Past due - Account marked for dunning follow-up",
    items: [
      {
        id: "item-014",
        invoiceId: "33333333-3333-4000-8000-000000000014",
        description: "Backup Storage Addon 5TB",
        quantity: 1,
        unitPricePaise: 450000,
        subtotalPaise: 450000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 81000,
        totalAmountPaise: 531000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000015",
    invoiceNumber: "INV-2026-0015",
    customerId: "a0000000-0000-4000-8000-000000000005",
    customerName: "Zenith Retail Tech",
    customerEmail: "pay@zenithretail.in",
    subscriptionId: "b0000000-0000-4000-8000-000000000015",
    status: "paid",
    extendedStatus: "paid",
    currency: "INR",
    issueDate: "2026-10-10T00:00:00Z",
    dueDate: "2026-10-24T00:00:00Z",
    periodStart: "2026-10-10T00:00:00Z",
    periodEnd: "2026-11-09T23:59:59Z",
    subtotalPaise: 150000,
    discountTotalPaise: 0,
    taxTotalPaise: 27000,
    totalAmountPaise: 177000,
    amountPaidPaise: 177000,
    amountDuePaise: 0,
    amountDue: 0.0,
    amountPaid: 1770.0,
    createdAt: "2026-10-10T00:00:00Z",
    notes: "Basic Developer Addon",
    items: [
      {
        id: "item-015",
        invoiceId: "33333333-3333-4000-8000-000000000015",
        description: "Basic Developer Addon",
        quantity: 1,
        unitPricePaise: 150000,
        subtotalPaise: 150000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 27000,
        totalAmountPaise: 177000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000016",
    invoiceNumber: "INV-2026-0016",
    customerId: "a0000000-0000-4000-8000-000000000006",
    customerName: "Bytecraft Software",
    customerEmail: "contact@bytecraft.dev",
    subscriptionId: "b0000000-0000-4000-8000-000000000016",
    status: "open",
    extendedStatus: "confirmed",
    currency: "INR",
    issueDate: "2026-10-29T00:00:00Z",
    dueDate: "2026-11-13T00:00:00Z",
    periodStart: "2026-10-29T00:00:00Z",
    periodEnd: "2026-11-28T23:59:59Z",
    subtotalPaise: 599900,
    discountTotalPaise: 0,
    taxTotalPaise: 107982,
    totalAmountPaise: 707882,
    amountPaidPaise: 0,
    amountDuePaise: 707882,
    amountDue: 7078.82,
    amountPaid: 0.0,
    createdAt: "2026-10-29T00:00:00Z",
    notes: "Automated renewal pending collection",
    items: [
      {
        id: "item-016",
        invoiceId: "33333333-3333-4000-8000-000000000016",
        description: "Cloud Architecture Pro Suite",
        quantity: 1,
        unitPricePaise: 599900,
        subtotalPaise: 599900,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 107982,
        totalAmountPaise: 707882,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000017",
    invoiceNumber: "INV-2026-0017",
    customerId: "a0000000-0000-4000-8000-000000000007",
    customerName: "Orbit Logistics",
    customerEmail: "accounts@orbitlogistics.co",
    subscriptionId: "b0000000-0000-4000-8000-000000000017",
    status: "open",
    extendedStatus: "confirmed",
    currency: "INR",
    issueDate: "2026-10-15T00:00:00Z",
    dueDate: "2026-10-31T00:00:00Z",
    periodStart: "2026-10-15T00:00:00Z",
    periodEnd: "2026-11-14T23:59:59Z",
    subtotalPaise: 800000,
    discountTotalPaise: 0,
    taxTotalPaise: 144000,
    totalAmountPaise: 944000,
    amountPaidPaise: 472000,
    amountDuePaise: 472000,
    amountDue: 4720.0,
    amountPaid: 4720.0,
    createdAt: "2026-10-15T00:00:00Z",
    notes: "50% payment upfront received via Net Banking",
    items: [
      {
        id: "item-017",
        invoiceId: "33333333-3333-4000-8000-000000000017",
        description: "Fleet Management Integration Tier",
        quantity: 1,
        unitPricePaise: 800000,
        subtotalPaise: 800000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 144000,
        totalAmountPaise: 944000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000018",
    invoiceNumber: "INV-2026-0018",
    customerId: "a0000000-0000-4000-8000-000000000008",
    customerName: "Synthex Health",
    customerEmail: "billing@synthexhealth.in",
    status: "draft",
    extendedStatus: "draft",
    currency: "INR",
    issueDate: "2026-10-31T00:00:00Z",
    dueDate: "2026-11-15T00:00:00Z",
    periodStart: "2026-11-01T00:00:00Z",
    periodEnd: "2026-11-30T23:59:59Z",
    subtotalPaise: 1000000,
    discountTotalPaise: 100000,
    taxTotalPaise: 162000,
    totalAmountPaise: 1062000,
    amountPaidPaise: 0,
    amountDuePaise: 1062000,
    amountDue: 10620.0,
    amountPaid: 0.0,
    createdAt: "2026-10-31T00:00:00Z",
    notes: "Custom enterprise migration quote",
    items: [
      {
        id: "item-018",
        invoiceId: "33333333-3333-4000-8000-000000000018",
        description: "Enterprise Migration Consultation & Node",
        quantity: 1,
        unitPricePaise: 1000000,
        subtotalPaise: 1000000,
        discountAmountPaise: 100000,
        taxRatePercent: 18,
        taxAmountPaise: 162000,
        totalAmountPaise: 1062000,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000019",
    invoiceNumber: "INV-2026-0019",
    customerId: "a0000000-0000-4000-8000-000000000009",
    customerName: "Quantum AI Dynamics",
    customerEmail: "accounts@quantumai.org",
    subscriptionId: "b0000000-0000-4000-8000-000000000019",
    status: "paid",
    extendedStatus: "paid",
    currency: "INR",
    issueDate: "2026-10-22T00:00:00Z",
    dueDate: "2026-11-05T00:00:00Z",
    periodStart: "2026-10-22T00:00:00Z",
    periodEnd: "2026-11-21T23:59:59Z",
    subtotalPaise: 399900,
    discountTotalPaise: 0,
    taxTotalPaise: 71982,
    totalAmountPaise: 471882,
    amountPaidPaise: 471882,
    amountDuePaise: 0,
    amountDue: 0.0,
    amountPaid: 4718.82,
    createdAt: "2026-10-22T00:00:00Z",
    notes: "Standard Business Tier - Auto-debit successful",
    items: [
      {
        id: "item-019",
        invoiceId: "33333333-3333-4000-8000-000000000019",
        description: "Standard Business Tier",
        quantity: 1,
        unitPricePaise: 399900,
        subtotalPaise: 399900,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 71982,
        totalAmountPaise: 471882,
      },
    ],
  },
  {
    id: "33333333-3333-4000-8000-000000000020",
    invoiceNumber: "INV-2026-0020",
    customerId: "a0000000-0000-4000-8000-000000000010",
    customerName: "Solaris Green Energy",
    customerEmail: "ops@solarisenergy.in",
    subscriptionId: "b0000000-0000-4000-8000-000000000020",
    status: "open",
    extendedStatus: "overdue",
    currency: "INR",
    issueDate: "2026-09-20T00:00:00Z",
    dueDate: "2026-10-05T00:00:00Z",
    periodStart: "2026-09-20T00:00:00Z",
    periodEnd: "2026-10-19T23:59:59Z",
    subtotalPaise: 650000,
    discountTotalPaise: 0,
    taxTotalPaise: 117000,
    totalAmountPaise: 767000,
    amountPaidPaise: 0,
    amountDuePaise: 767000,
    amountDue: 7670.0,
    amountPaid: 0.0,
    createdAt: "2026-09-20T00:00:00Z",
    notes: "Overdue notification dispatched",
    items: [
      {
        id: "item-020",
        invoiceId: "33333333-3333-4000-8000-000000000020",
        description: "Industrial IoT Telemetry Hub",
        quantity: 1,
        unitPricePaise: 650000,
        subtotalPaise: 650000,
        discountAmountPaise: 0,
        taxRatePercent: 18,
        taxAmountPaise: 117000,
        totalAmountPaise: 767000,
      },
    ],
  },
];

export interface InvoiceFilters {
  status?: string;
  search?: string;
  customerId?: string;
  subscriptionId?: string;
}

export async function getInvoices(filters?: InvoiceFilters): Promise<DetailedInvoice[]> {
  let results = [...invoicesStore];

  if (filters?.customerId) {
    results = results.filter((inv) => inv.customerId === filters.customerId);
  }

  if (filters?.subscriptionId) {
    results = results.filter((inv) => inv.subscriptionId === filters.subscriptionId);
  }

  if (filters?.status && filters.status !== "all") {
    results = results.filter((inv) => {
      const resolved = resolveInvoiceStatus(inv.extendedStatus, inv.dueDate, inv.amountDuePaise);
      return resolved.toLowerCase() === filters.status?.toLowerCase();
    });
  }

  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.toLowerCase().trim();
    results = results.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.customerName?.toLowerCase().includes(q) ||
        inv.customerEmail?.toLowerCase().includes(q)
    );
  }

  // Sort newest first by issueDate
  results.sort(
    (a, b) =>
      new Date(b.issueDate || b.createdAt).getTime() -
      new Date(a.issueDate || a.createdAt).getTime()
  );

  return results.map((inv) => {
    const resolvedExtended = resolveInvoiceStatus(inv.extendedStatus, inv.dueDate, inv.amountDuePaise);
    return {
      ...inv,
      extendedStatus: resolvedExtended,
      status: toBaseInvoiceStatus(resolvedExtended),
    };
  });
}

export async function getInvoiceById(id: string): Promise<DetailedInvoice | null> {
  const inv = invoicesStore.find((i) => i.id === id || i.invoiceNumber === id);
  if (!inv) return null;

  const resolvedExtended = resolveInvoiceStatus(inv.extendedStatus, inv.dueDate, inv.amountDuePaise);
  return {
    ...inv,
    extendedStatus: resolvedExtended,
    status: toBaseInvoiceStatus(resolvedExtended),
  };
}

export interface CreateInvoiceItemInput {
  productId?: string;
  description: string;
  quantity: number;
  unitPricePaise: number;
  taxRatePercent?: number;
  discountCode?: string;
}

export interface CreateInvoiceParams {
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  subscriptionId?: string;
  dueDate: string;
  periodStart?: string;
  periodEnd?: string;
  notes?: string;
  items: CreateInvoiceItemInput[];
  status?: ExtendedInvoiceStatus;
}

export function generateNextInvoiceNumber(): string {
  const currentMax = invoicesStore.reduce((max, inv) => {
    const match = inv.invoiceNumber.match(/INV-2026-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return Math.max(max, num);
    }
    return max;
  }, 20);

  const nextNum = (currentMax + 1).toString().padStart(4, "0");
  return `INV-2026-${nextNum}`;
}

export async function createInvoice(params: CreateInvoiceParams): Promise<DetailedInvoice> {
  const invoiceId = crypto.randomUUID();
  const invoiceNumber = generateNextInvoiceNumber();

  if (params.subscriptionId && params.periodStart) {
    const existing = invoicesStore.find(
      (inv) =>
        inv.subscriptionId === params.subscriptionId &&
        inv.periodStart === params.periodStart &&
        inv.extendedStatus !== "cancelled"
    );
    if (existing) {
      throw new Error(
        `Invoice already exists for subscription ${params.subscriptionId} for period ${params.periodStart} (${existing.invoiceNumber}).`
      );
    }
  }

  const calcInputs: LineItemCalculationInput[] = [];
  const processedItems: InvoiceItem[] = [];

  for (const item of params.items) {
    let discountType: "percentage" | "fixed" | undefined;
    let discountValue: number | undefined;

    if (item.discountCode) {
      const discount = await getDiscountByCode(item.discountCode);
      if (discount) {
        const itemSubtotal = item.quantity * item.unitPricePaise;
        const evalResult = evaluateDiscountEligibility(discount, itemSubtotal, item.quantity);
        if (evalResult.valid) {
          discountType = discount.type;
          discountValue = discount.type === "percentage" ? discount.value : evalResult.discountPaise;
          await incrementDiscountUsage(discount.code);
        }
      }
    }

    const input: LineItemCalculationInput = {
      quantity: item.quantity,
      unitPricePaise: item.unitPricePaise,
      discountType,
      discountValue,
      taxRatePercent: item.taxRatePercent ?? 18,
    };
    calcInputs.push(input);
  }

  const totals = calculateInvoiceTotals(calcInputs, 0);

  totals.items.forEach((calc, idx) => {
    const original = params.items[idx];
    processedItems.push({
      id: crypto.randomUUID(),
      invoiceId,
      productId: original.productId,
      description: original.description,
      quantity: calc.quantity,
      unitPricePaise: calc.unitPricePaise,
      subtotalPaise: calc.subtotalPaise,
      discountAmountPaise: calc.discountPaise,
      taxRatePercent: calc.taxRatePercent,
      taxAmountPaise: calc.taxPaise,
      totalAmountPaise: calc.totalPaise,
      createdAt: new Date().toISOString(),
    });
  });

  const extendedStatus: ExtendedInvoiceStatus = params.status || "confirmed";
  const baseStatus = toBaseInvoiceStatus(extendedStatus);

  const newInvoice: DetailedInvoice = {
    id: invoiceId,
    invoiceNumber,
    customerId: params.customerId,
    customerName: params.customerName || "Customer Account",
    customerEmail: params.customerEmail || "customer@brightloop.io",
    subscriptionId: params.subscriptionId,
    status: baseStatus,
    extendedStatus,
    currency: "INR",
    issueDate: new Date().toISOString(),
    dueDate: params.dueDate,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    subtotalPaise: totals.subtotalPaise,
    discountTotalPaise: totals.discountTotalPaise,
    taxTotalPaise: totals.taxTotalPaise,
    totalAmountPaise: totals.totalPaise,
    amountPaidPaise: 0,
    amountDuePaise: totals.totalPaise,
    amountDue: paiseToRupees(totals.totalPaise),
    amountPaid: 0,
    notes: params.notes,
    createdAt: new Date().toISOString(),
    items: processedItems,
    payments: [],
  };

  invoicesStore.unshift(newInvoice);
  return { ...newInvoice };
}

export async function updateInvoiceStatus(
  id: string,
  status: ExtendedInvoiceStatus
): Promise<DetailedInvoice> {
  const inv = invoicesStore.find((i) => i.id === id);
  if (!inv) {
    throw new Error(`Invoice ${id} not found.`);
  }

  if (inv.extendedStatus === "paid" && status !== "paid") {
    throw new Error("Cannot change status of an already paid invoice.");
  }
  if (inv.extendedStatus === "cancelled") {
    throw new Error("Cannot reopen a cancelled invoice.");
  }

  inv.extendedStatus = status;
  inv.status = toBaseInvoiceStatus(status);

  return { ...inv };
}

export async function applyPaymentToInvoice(
  invoiceId: string,
  paymentPaise: number,
  paymentRecord?: any
): Promise<DetailedInvoice> {
  const inv = invoicesStore.find((i) => i.id === invoiceId);
  if (!inv) {
    throw new Error(`Invoice with id ${invoiceId} not found.`);
  }

  if (paymentPaise > inv.amountDuePaise) {
    throw new Error(
      `Overpayment rejected: payment of ₹${paiseToRupees(paymentPaise).toFixed(
        2
      )} exceeds amount due of ₹${paiseToRupees(inv.amountDuePaise).toFixed(2)}.`
    );
  }

  inv.amountPaidPaise += paymentPaise;
  inv.amountDuePaise = Math.max(0, inv.totalAmountPaise - inv.amountPaidPaise);
  inv.amountPaid = paiseToRupees(inv.amountPaidPaise);
  inv.amountDue = paiseToRupees(inv.amountDuePaise);

  if (inv.amountDuePaise === 0) {
    inv.extendedStatus = "paid";
    inv.status = "paid";
  }

  if (paymentRecord) {
    if (!inv.payments) inv.payments = [];
    inv.payments.unshift(paymentRecord);
  }

  return { ...inv };
}

export async function getBillingAnalyticsSummary(): Promise<BillingAnalyticsSummary> {
  const allInvoices = await getInvoices();

  let totalRevenuePaise = 0;
  let totalCollectedPaise = 0;
  let totalOutstandingPaise = 0;
  let overdueInvoicesCount = 0;
  let paidInvoicesCount = 0;
  let openInvoicesCount = 0;
  let draftInvoicesCount = 0;
  let cancelledInvoicesCount = 0;

  for (const inv of allInvoices) {
    if (inv.extendedStatus !== "cancelled") {
      totalRevenuePaise += inv.totalAmountPaise;
      totalCollectedPaise += inv.amountPaidPaise;
      totalOutstandingPaise += inv.amountDuePaise;
    }

    switch (inv.extendedStatus) {
      case "paid":
        paidInvoicesCount++;
        break;
      case "overdue":
        overdueInvoicesCount++;
        break;
      case "confirmed":
        openInvoicesCount++;
        break;
      case "draft":
        draftInvoicesCount++;
        break;
      case "cancelled":
        cancelledInvoicesCount++;
        break;
    }
  }

  const collectionRatePercent =
    totalRevenuePaise > 0
      ? Number(((totalCollectedPaise / totalRevenuePaise) * 100).toFixed(1))
      : 0;

  let recentPayments: any[] = [];
  try {
    const { getPayments } = await import("./payments");
    const paymentsList = await getPayments();
    recentPayments = paymentsList.slice(0, 10);
  } catch {
    recentPayments = [];
  }

  return {
    totalRevenuePaise,
    totalCollectedPaise,
    totalOutstandingPaise,
    overdueInvoicesCount,
    paidInvoicesCount,
    openInvoicesCount,
    draftInvoicesCount,
    cancelledInvoicesCount,
    collectionRatePercent,
    recentPayments,
  };
}
