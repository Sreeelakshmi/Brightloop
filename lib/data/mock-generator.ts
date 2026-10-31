import {
  Customer,
  Plan,
  Subscription,
  SubscriptionLine,
  Invoice,
  InvoiceLine,
  Payment,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentMethod,
} from "@/types";

// Deterministic seed random generator for repeatable mock datasets
let seed = 42;
function pseudoRandom(): number {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

export interface MockStore {
  customers: Customer[];
  plans: Plan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
}

let cachedStore: MockStore | null = null;

export function getMockStore(): MockStore {
  if (cachedStore) {
    return cachedStore;
  }

  // 1. Generate Plans
  const plans: Plan[] = [
    {
      id: "plan-ent-annual",
      name: "Enterprise Annual",
      code: "ENT-ANNUAL",
      billingCycle: "annual",
      amount: 240000,
      currency: "INR",
      description: "Dedicated account telemetry and SLA guarantees",
      active: true,
      renewable: true,
      pausable: false,
      closable: true,
    },
    {
      id: "plan-pro-monthly",
      name: "Pro Monthly",
      code: "PRO-MO",
      billingCycle: "monthly",
      amount: 18500,
      currency: "INR",
      description: "Advanced analytics and automated recurring billing",
      active: true,
      renewable: true,
      pausable: true,
      closable: true,
    },
    {
      id: "plan-std-monthly",
      name: "Standard Tier",
      code: "STD-MO",
      billingCycle: "monthly",
      amount: 8200,
      currency: "INR",
      description: "Core subscription management and invoicing",
      active: true,
      renewable: true,
      pausable: true,
      closable: false,
    },
    {
      id: "plan-starter",
      name: "Starter Tier",
      code: "STARTER",
      billingCycle: "monthly",
      amount: 3500,
      currency: "INR",
      description: "Foundational billing operations",
      active: true,
      renewable: false,
      pausable: false,
      closable: true,
    },
    {
      id: "plan-scale-quarterly",
      name: "Scale Quarterly",
      code: "SCALE-QTR",
      billingCycle: "quarterly",
      amount: 54000,
      currency: "INR",
      description: "High-volume throughput with priority queue",
      active: true,
      renewable: true,
      pausable: false,
      closable: false,
    },
  ];

  // 2. Generate 50 Diverse Customers
  const customerNames = [
    { name: "AeroGroup Aerospace", company: "AeroGroup" },
    { name: "Nexus Logistics Worldwide", company: "Nexus Logistics" },
    { name: "OmniCorp Global Ltd", company: "OmniCorp" },
    { name: "Veloce Systems Private Ltd", company: "Veloce Systems" },
    { name: "Starlight Interactive Media", company: "Starlight Media" },
    { name: "Hyperion Cloud Dynamics", company: "Hyperion Dynamics" },
    { name: "Zenith Biotech Research", company: "Zenith Bio" },
    { name: "Quantum Matrix Computing", company: "Quantum Matrix" },
    { name: "Apex Global FinTech", company: "Apex FinTech" },
    { name: "Strata Engineering Works", company: "Strata Engineering" },
  ];

  const customers: Customer[] = [];
  for (let i = 0; i < 50; i++) {
    const base = customerNames[i % customerNames.length];
    const suffix = i >= customerNames.length ? ` Div ${Math.floor(i / customerNames.length) + 1}` : "";
    const id = `cust-${String(i + 1).padStart(3, "0")}`;
    customers.push({
      id,
      name: `${base.name}${suffix}`,
      company: `${base.company}${suffix}`,
      email: `billing@${base.company.toLowerCase().replace(/\s+/g, "")}${i}.com`,
      phone: `+91 98${String(10000000 + i * 12345).slice(0, 8)}`,
      address: `Tower ${((i % 5) + 1)}, Cyber City, Gurugram, India`,
      taxId: `07AAAAA${String(1000 + i)}A1Z${(i % 9)}`,
      createdAt: "2025-01-15T00:00:00Z",
    });
  }

  // 3. Generate 2,200+ Subscriptions
  // Target: exactly 1,284 Active subscriptions to align with reference telemetry
  const subscriptions: Subscription[] = [];
  const TOTAL_SUBSCRIPTIONS = 2240;
  const TARGET_ACTIVE = 1284;
  const TARGET_CONFIRMED = 320;
  const TARGET_QUOTATION = 240;
  const TARGET_DRAFT = 160;
  const TARGET_CLOSED = 180;
  const TARGET_CANCELLED = TOTAL_SUBSCRIPTIONS - (TARGET_ACTIVE + TARGET_CONFIRMED + TARGET_QUOTATION + TARGET_DRAFT + TARGET_CLOSED);

  let activeCount = 0;
  let confirmedCount = 0;
  let quotationCount = 0;
  let draftCount = 0;
  let closedCount = 0;

  for (let i = 0; i < TOTAL_SUBSCRIPTIONS; i++) {
    let status: SubscriptionStatus = "cancelled";
    if (activeCount < TARGET_ACTIVE) {
      status = "active";
      activeCount++;
    } else if (confirmedCount < TARGET_CONFIRMED) {
      status = "confirmed";
      confirmedCount++;
    } else if (quotationCount < TARGET_QUOTATION) {
      status = "quotation";
      quotationCount++;
    } else if (draftCount < TARGET_DRAFT) {
      status = "draft";
      draftCount++;
    } else if (closedCount < TARGET_CLOSED) {
      status = "closed";
      closedCount++;
    }

    const customer = customers[i % customers.length];
    const plan = plans[i % plans.length];
    const id = `sub-${String(i + 1).padStart(5, "0")}`;
    const subNumber = `SUB-${String(10000 + i)}`;

    subscriptions.push({
      id,
      subscriptionNumber: subNumber,
      customerId: customer.id,
      customer,
      planId: plan.id,
      plan,
      status,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      renewalDate: "2026-11-01",
      totalAmount: plan.amount,
      currency: "INR",
      createdAt: "2026-01-01T08:00:00Z",
    });
  }

  // 4. Generate Invoices
  // Target: exactly 37 Overdue Invoices
  // Outstanding payments: ~₹6,41,200
  // Reference items: INV-2901 (AeroGroup, ₹1,48,200, 16d overdue), INV-2902 (AeroGroup, ₹1,48,200, 16d overdue)
  const invoices: Invoice[] = [];

  // Overdue Invoice 1: INV-2901
  invoices.push({
    id: "inv-2901",
    invoiceNo: "INV-2901",
    customerId: customers[0].id,
    customer: customers[0],
    issueDate: "2026-09-30",
    dueDate: "2026-10-15",
    daysOverdue: 16,
    totalAmount: 148200,
    balance: 148200,
    currency: "INR",
    status: "overdue",
    createdAt: "2026-09-30T10:00:00Z",
  });

  // Overdue Invoice 2: INV-2902
  invoices.push({
    id: "inv-2902",
    invoiceNo: "INV-2902",
    customerId: customers[0].id,
    customer: customers[0],
    issueDate: "2026-09-30",
    dueDate: "2026-10-15",
    daysOverdue: 16,
    totalAmount: 148200,
    balance: 148200,
    currency: "INR",
    status: "overdue",
    createdAt: "2026-09-30T10:00:00Z",
  });

  // Remaining 35 overdue invoices distributing the remaining ~₹3,44,800 to hit exact ₹6,41,200
  const remainingOverdueBalance = 641200 - (148200 * 2); // 344,800
  const avgPerOverdue = Math.floor(remainingOverdueBalance / 35);

  for (let i = 3; i <= 37; i++) {
    const cust = customers[(i + 1) % customers.length];
    const isLast = i === 37;
    const balance = isLast
      ? remainingOverdueBalance - avgPerOverdue * 34
      : avgPerOverdue;
    const daysOverdue = Math.min(15, (i % 15) + 1);

    invoices.push({
      id: `inv-${2900 + i}`,
      invoiceNo: `INV-${2900 + i}`,
      customerId: cust.id,
      customer: cust,
      issueDate: "2026-10-01",
      dueDate: "2026-10-15",
      daysOverdue,
      totalAmount: balance,
      balance,
      currency: "INR",
      status: "overdue",
      createdAt: "2026-10-01T10:00:00Z",
    });
  }

  // Standard Paid Invoices (totaling collected revenue ₹48,92,500)
  const paidTarget = 4892500;
  const numPaid = 350;
  const avgPaid = Math.floor(paidTarget / numPaid);

  for (let i = 1; i <= numPaid; i++) {
    const cust = customers[i % customers.length];
    const isLast = i === numPaid;
    const amount = isLast ? paidTarget - avgPaid * (numPaid - 1) : avgPaid;

    invoices.push({
      id: `inv-paid-${i}`,
      invoiceNo: `INV-${1000 + i}`,
      customerId: cust.id,
      customer: cust,
      issueDate: "2026-10-02",
      dueDate: "2026-10-20",
      daysOverdue: 0,
      totalAmount: amount,
      balance: 0,
      currency: "INR",
      status: "paid",
      createdAt: "2026-10-02T10:00:00Z",
    });
  }

  // 5. Generate Payments
  const paymentMethods: PaymentMethod[] = [
    "direct_debit",
    "credit_card",
    "wire_transfer",
    "upi",
  ];
  const payments: Payment[] = [];

  for (let i = 1; i <= numPaid; i++) {
    const inv = invoices[37 + i - 1]; // corresponding paid invoice
    const method = paymentMethods[i % paymentMethods.length];

    payments.push({
      id: `pay-${i}`,
      paymentNo: `PAY-${5000 + i}`,
      invoiceId: inv.id,
      invoiceNo: inv.invoiceNo,
      customerId: inv.customerId,
      customer: inv.customer,
      amount: inv.totalAmount,
      currency: "INR",
      method,
      status: "succeeded",
      reference: `TXN-REF-${98000 + i}`,
      paymentDate: "2026-10-18T14:30:00Z",
      createdAt: "2026-10-18T14:30:00Z",
    });
  }

  cachedStore = {
    customers,
    plans,
    subscriptions,
    invoices,
    payments,
  };

  return cachedStore;
}
