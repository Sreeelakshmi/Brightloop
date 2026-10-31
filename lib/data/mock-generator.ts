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
  Product,
  QuotationTemplate,
  TaxRule,
  DiscountRule,
  BillingRun,
} from "@/types";

export interface MockStore {
  customers: Customer[];
  plans: Plan[];
  products: Product[];
  quotationTemplates: QuotationTemplate[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  taxes: TaxRule[];
  discounts: DiscountRule[];
  billingRuns: BillingRun[];
}

let cachedStore: MockStore | null = null;

export function generateFreshMockStore(): MockStore {
  // 1. Generate 8 Products with Variants (including Odoo adding ₹560)
  const products: Product[] = [
    {
      id: "prod-001",
      name: "Cloud Telemetry Engine",
      type: "service",
      salesPrice: 12000,
      costPrice: 4000,
      notes: "Core telemetry streaming and event ingestion service",
      archived: false,
      variants: [
        { id: "var-001-std", productId: "prod-001", attributeName: "Brand", attributeValue: "Standard", extraPrice: 0 },
        { id: "var-001-odoo", productId: "prod-001", attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
        { id: "var-001-ent", productId: "prod-001", attributeName: "Brand", attributeValue: "Enterprise Plus", extraPrice: 2400 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-002",
      name: "Automated Billing Gateway",
      type: "service",
      salesPrice: 8500,
      costPrice: 2500,
      notes: "Recurring invoicing, reconciliation, and payment webhook dispatcher",
      archived: false,
      variants: [
        { id: "var-002-std", productId: "prod-002", attributeName: "Brand", attributeValue: "Standard", extraPrice: 0 },
        { id: "var-002-odoo", productId: "prod-002", attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
        { id: "var-002-multi", productId: "prod-002", attributeName: "Brand", attributeValue: "Multi-Currency", extraPrice: 1500 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-003",
      name: "Database Audit Sentinel",
      type: "service",
      salesPrice: 15000,
      costPrice: 5000,
      notes: "Continuous compliance and transaction auditing monitor",
      archived: false,
      variants: [
        { id: "var-003-std", productId: "prod-003", attributeName: "Brand", attributeValue: "Standard", extraPrice: 0 },
        { id: "var-003-odoo", productId: "prod-003", attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
        { id: "var-003-sec", productId: "prod-003", attributeName: "Brand", attributeValue: "SOC2 Compliance", extraPrice: 4000 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-004",
      name: "Hardware Security Token",
      type: "storable",
      salesPrice: 2500,
      costPrice: 1100,
      notes: "Physical hardware token for two-factor cryptographic signing",
      archived: false,
      variants: [
        { id: "var-004-std", productId: "prod-004", attributeName: "Brand", attributeValue: "USB-C Standard", extraPrice: 0 },
        { id: "var-004-odoo", productId: "prod-004", attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
        { id: "var-004-nfc", productId: "prod-004", attributeName: "Brand", attributeValue: "NFC Wireless", extraPrice: 900 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-005",
      name: "Dedicated Account Manager SLA",
      type: "service",
      salesPrice: 25000,
      costPrice: 8000,
      notes: "Priority 24/7 technical architect SLA and quarterly reviews",
      archived: false,
      variants: [
        { id: "var-005-std", productId: "prod-005", attributeName: "Brand", attributeValue: "Standard 8x5", extraPrice: 0 },
        { id: "var-005-odoo", productId: "prod-005", attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
        { id: "var-005-247", productId: "prod-005", attributeName: "Brand", attributeValue: "24x7 Mission-Critical", extraPrice: 12000 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-006",
      name: "API Rate Limit Multiplier",
      type: "consumable",
      salesPrice: 4000,
      costPrice: 1000,
      notes: "High-frequency throughput packet (+25,000 queries/min)",
      archived: false,
      variants: [
        { id: "var-006-std", productId: "prod-006", attributeName: "Brand", attributeValue: "Standard Pack", extraPrice: 0 },
        { id: "var-006-odoo", productId: "prod-006", attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-007",
      name: "Custom Telemetry Widget Suite",
      type: "service",
      salesPrice: 6500,
      costPrice: 2000,
      notes: "Tailored live telemetry charts and embeddable dashboard frames",
      archived: false,
      variants: [
        { id: "var-007-std", productId: "prod-007", attributeName: "Brand", attributeValue: "Standard", extraPrice: 0 },
        { id: "var-007-odoo", productId: "prod-007", attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "prod-008",
      name: "Disaster Recovery Standby Node",
      type: "service",
      salesPrice: 35000,
      costPrice: 12000,
      notes: "Hot standby secondary cluster with 1-minute automated failover",
      archived: false,
      variants: [
        { id: "var-008-warm", productId: "prod-008", attributeName: "Brand", attributeValue: "Warm Standby", extraPrice: 0 },
        { id: "var-008-odoo", productId: "prod-008", attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 },
        { id: "var-008-multi", productId: "prod-008", attributeName: "Brand", attributeValue: "Multi-Cloud Active", extraPrice: 18000 },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  // 2. Generate 6 Plans with Option Toggles & Windows
  const plans: Plan[] = [
    {
      id: "plan-daily-eval",
      name: "Evaluation Daily Spike",
      code: "DAILY-EVAL",
      billingCycle: "daily",
      billingPeriod: "daily",
      amount: 500,
      price: 500,
      currency: "INR",
      description: "Short-term trial load evaluation cluster",
      active: true,
      minimumQuantity: 1,
      availableFrom: "2026-01-01",
      availableTo: "2026-12-31",
      autoClose: true,
      closableEarly: true,
      pausable: false,
      renewable: false,
      closable: true,
    },
    {
      id: "plan-weekly-sprint",
      name: "Sprint Weekly",
      code: "SPRINT-WK",
      billingCycle: "weekly",
      billingPeriod: "weekly",
      amount: 2500,
      price: 2500,
      currency: "INR",
      description: "Agile 7-day iteration and staging workloads",
      active: true,
      minimumQuantity: 1,
      availableFrom: "2026-01-01",
      availableTo: "2026-12-31",
      autoClose: false,
      closableEarly: true,
      pausable: true,
      renewable: true,
      closable: true,
    },
    {
      id: "plan-std-monthly",
      name: "Standard Monthly",
      code: "STD-MO",
      billingCycle: "monthly",
      billingPeriod: "monthly",
      amount: 8200,
      price: 8200,
      currency: "INR",
      description: "Core subscription management and invoicing",
      active: true,
      minimumQuantity: 1,
      availableFrom: "2026-01-01",
      availableTo: "2026-12-31",
      autoClose: false,
      closableEarly: false,
      pausable: true,
      renewable: true,
      closable: false,
    },
    {
      id: "plan-pro-monthly",
      name: "Pro Growth Monthly",
      code: "PRO-MO",
      billingCycle: "monthly",
      billingPeriod: "monthly",
      amount: 18500,
      price: 18500,
      currency: "INR",
      description: "Advanced analytics and automated recurring billing",
      active: true,
      minimumQuantity: 2,
      availableFrom: "2026-01-01",
      availableTo: "2026-12-31",
      autoClose: false,
      closableEarly: true,
      pausable: true,
      renewable: true,
      closable: true,
    },
    {
      id: "plan-starter",
      name: "Starter Tier",
      code: "STARTER",
      billingCycle: "monthly",
      billingPeriod: "monthly",
      amount: 3500,
      price: 3500,
      currency: "INR",
      description: "Foundational billing operations",
      active: true,
      minimumQuantity: 1,
      availableFrom: "2026-01-01",
      availableTo: "2026-12-31",
      autoClose: false,
      closableEarly: true,
      pausable: false,
      renewable: false,
      closable: true,
    },
    {
      id: "plan-scale-quarterly",
      name: "Scale Quarterly",
      code: "SCALE-QTR",
      billingCycle: "quarterly",
      billingPeriod: "quarterly",
      amount: 54000,
      price: 54000,
      currency: "INR",
      description: "High-volume throughput with priority queue",
      active: true,
      minimumQuantity: 5,
      availableFrom: "2026-01-01",
      availableTo: "2026-12-31",
      autoClose: false,
      closableEarly: false,
      pausable: false,
      renewable: true,
      closable: false,
    },
    {
      id: "plan-ent-annual",
      name: "Enterprise Strategic Annual",
      code: "ENT-ANNUAL",
      billingCycle: "annual",
      billingPeriod: "yearly",
      amount: 240000,
      price: 240000,
      currency: "INR",
      description: "Dedicated account telemetry and SLA guarantees",
      active: true,
      minimumQuantity: 10,
      availableFrom: "2026-01-01",
      availableTo: "2026-12-31",
      autoClose: true,
      closableEarly: true,
      pausable: false,
      renewable: true,
      closable: true,
    },
  ];

  // 3. Generate 3 Quotation Templates
  const quotationTemplates: QuotationTemplate[] = [
    {
      id: "tmpl-starter",
      name: "Startup SaaS Kickstart",
      validityDays: 15,
      planId: "plan-std-monthly",
      lines: [
        { productId: "prod-001", variantId: "var-001-std", quantity: 1, unitPrice: 12000 },
        { productId: "prod-004", variantId: "var-004-std", quantity: 1, unitPrice: 2500 },
      ],
      createdAt: "2026-01-10T00:00:00Z",
    },
    {
      id: "tmpl-odoo-erp",
      name: "Odoo ERP Integrated Suite",
      validityDays: 30,
      planId: "plan-pro-monthly",
      lines: [
        { productId: "prod-001", variantId: "var-001-odoo", quantity: 2, unitPrice: 12560 },
        { productId: "prod-002", variantId: "var-002-odoo", quantity: 2, unitPrice: 9060 },
      ],
      createdAt: "2026-01-15T00:00:00Z",
    },
    {
      id: "tmpl-enterprise",
      name: "Enterprise Dedicated SLA & DR",
      validityDays: 45,
      planId: "plan-ent-annual",
      lines: [
        { productId: "prod-005", variantId: "var-005-247", quantity: 10, unitPrice: 37000 },
        { productId: "prod-008", variantId: "var-008-warm", quantity: 10, unitPrice: 35000 },
      ],
      createdAt: "2026-02-01T00:00:00Z",
    },
  ];

  // 4. Generate 3 Tax Rules
  const taxes: TaxRule[] = [
    {
      id: "tax-gst18",
      name: "GST 18%",
      type: "percentage",
      rate: 18,
      applicableProducts: ["all"],
      isInclusive: false,
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "tax-cess2",
      name: "IT Infrastructure Cess 2%",
      type: "percentage",
      rate: 2,
      applicableProducts: ["prod-001", "prod-002", "prod-003", "prod-005"],
      isInclusive: false,
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "tax-vat5",
      name: "State Technical VAT 5%",
      type: "percentage",
      rate: 5,
      applicableProducts: ["prod-004"],
      isInclusive: false,
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
  ];

  // 5. Generate 4 Discount Rules
  const discounts: DiscountRule[] = [
    {
      id: "disc-diwali20",
      code: "DIWALI20",
      name: "Diwali Festival 20% Off",
      type: "percentage",
      value: 20,
      minPurchaseAmount: 10000,
      startDate: "2026-10-01",
      endDate: "2026-11-30",
      usageLimit: 100,
      usageCount: 14,
      scope: "subscription",
      active: true,
      createdAt: "2026-10-01T00:00:00Z",
    },
    {
      id: "disc-ent5000",
      code: "ENT5000",
      name: "Enterprise Welcome ₹5,000 Flat",
      type: "fixed",
      value: 5000,
      minPurchaseAmount: 50000,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      usageLimit: 50,
      usageCount: 22,
      scope: "subscription",
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "disc-limit-reached",
      code: "FLASH100",
      name: "Flash Launch Maxed Out",
      type: "fixed",
      value: 1000,
      minPurchaseAmount: 5000,
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      usageLimit: 50,
      usageCount: 50,
      scope: "subscription",
      active: true,
      createdAt: "2026-01-01T00:00:00Z",
    },
    {
      id: "disc-expired",
      code: "SUMMER2025",
      name: "Summer 2025 Early Bird",
      type: "percentage",
      value: 15,
      minPurchaseAmount: 5000,
      startDate: "2025-05-01",
      endDate: "2025-06-30",
      usageLimit: 200,
      usageCount: 45,
      scope: "subscription",
      active: false,
      createdAt: "2025-05-01T00:00:00Z",
    },
  ];

  // 6. Generate 50 Diverse Indian Enterprise Customers
  const customerNames = [
    { name: "AeroGroup Aerospace Pvt Ltd", company: "AeroGroup" },
    { name: "Nexus Logistics Worldwide India", company: "Nexus Logistics" },
    { name: "OmniCorp Global Technologies", company: "OmniCorp" },
    { name: "Veloce Systems Private Ltd", company: "Veloce Systems" },
    { name: "Starlight Interactive Media India", company: "Starlight Media" },
    { name: "TataNex Procurement Services", company: "TataNex" },
    { name: "Mahindra Tech Invoicing Hub", company: "Mahindra Tech" },
    { name: "Hyperion Cloud Dynamics India", company: "Hyperion Dynamics" },
    { name: "Zenith Biotech Research Ltd", company: "Zenith Bio" },
    { name: "Quantum Matrix Computing Pvt Ltd", company: "Quantum Matrix" },
    { name: "Apex Global FinTech India", company: "Apex FinTech" },
    { name: "Strata Engineering Works Ltd", company: "Strata Engineering" },
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
      taxId: `07AAAAA${String(1000 + i)}A1Z${i % 9}`,
      createdAt: "2025-01-15T00:00:00Z",
    });
  }

  // Explicit mappings for the 5 demo customer accounts
  customers[0].email = "billing@aerogroup.com";
  customers[1].email = "accounts@nexuslogistics.in";
  customers[2].email = "finance@starlightmedia.co";
  customers[3].email = "pay@tatanex.com";
  customers[4].email = "invoicing@mahindratech.in";

  // 7. Generate 2,240 Subscriptions
  // Target: exactly 1,284 Active subscriptions to align with reference telemetry
  const subscriptions: Subscription[] = [];
  const TOTAL_SUBSCRIPTIONS = 2240;
  const TARGET_ACTIVE = 1284;
  const TARGET_CONFIRMED = 320;
  const TARGET_QUOTATION = 240;
  const TARGET_DRAFT = 160;
  const TARGET_CLOSED = 180;

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

    // Generate subscription lines
    const lineQty = Math.max(plan.minimumQuantity || 1, 1);
    const prod = products[i % products.length];
    const variant = prod.variants[0];
    const lineUnitPrice = prod.salesPrice + (variant?.extraPrice || 0);
    const lineAmount = lineUnitPrice * lineQty;

    const lines: SubscriptionLine[] = [
      {
        id: `line-${id}-1`,
        subscriptionId: id,
        productId: prod.id,
        variantId: variant?.id,
        description: `${prod.name} (${variant?.attributeValue || "Standard"})`,
        quantity: lineQty,
        unitPrice: lineUnitPrice,
        taxRate: 18,
        taxAmount: Math.round(lineAmount * 0.18),
        amount: lineAmount,
      },
    ];

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
      nextBillingDate: "2026-11-01",
      paymentTerms: "Net 15",
      totalAmount: lineAmount,
      currency: "INR",
      lines,
      history: [
        {
          id: `hist-${id}-1`,
          subscriptionId: id,
          fromStatus: "draft",
          toStatus: status,
          changedBy: "System Provisioning",
          changedAt: "2026-01-01T08:00:00Z",
          reason: "Initial baseline ingestion",
        },
      ],
      validUntil: status === "quotation" ? "2026-11-15" : undefined,
      createdAt: "2026-01-01T08:00:00Z",
    });
  }

  // Ensure customer 0 (billing@aerogroup.com) has diverse sample subscriptions without modifying status distribution
  subscriptions[0].customerId = customers[0].id;
  subscriptions[0].customer = customers[0];
  subscriptions[0].status = "active";

  // Pick one quotation and one confirmed subscription for cust-001
  const qSub = subscriptions.find((s) => s.status === "quotation");
  if (qSub) {
    qSub.customerId = customers[0].id;
    qSub.customer = customers[0];
    qSub.validUntil = "2026-11-20";
  }

  const cSub = subscriptions.find((s) => s.status === "confirmed");
  if (cSub) {
    cSub.customerId = customers[0].id;
    cSub.customer = customers[0];
  }

  // 8. Generate Invoices
  // Target: exactly 37 Overdue Invoices
  // Outstanding payments: ₹6,41,200
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
    subtotal: 125593,
    taxTotal: 22607,
    discountTotal: 0,
    totalAmount: 148200,
    balance: 148200,
    paidAmount: 0,
    currency: "INR",
    status: "overdue",
    lines: [
      {
        id: "inv-line-2901-1",
        invoiceId: "inv-2901",
        productId: products[0].id,
        description: "Cloud Telemetry Engine (Enterprise)",
        quantity: 2,
        unitPrice: 62796.5,
        taxAmount: 22607,
        amount: 148200,
      },
    ],
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
    subtotal: 125593,
    taxTotal: 22607,
    discountTotal: 0,
    totalAmount: 148200,
    balance: 148200,
    paidAmount: 0,
    currency: "INR",
    status: "overdue",
    lines: [
      {
        id: "inv-line-2902-1",
        invoiceId: "inv-2902",
        productId: products[1].id,
        description: "Automated Billing Gateway Suite",
        quantity: 2,
        unitPrice: 62796.5,
        taxAmount: 22607,
        amount: 148200,
      },
    ],
    createdAt: "2026-09-30T10:00:00Z",
  });

  // Remaining 35 overdue invoices distributing remaining ₹3,44,800
  const remainingOverdueBalance = 641200 - 148200 * 2; // 344,800
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
      subtotal: Math.round(balance / 1.18),
      taxTotal: balance - Math.round(balance / 1.18),
      discountTotal: 0,
      totalAmount: balance,
      balance,
      paidAmount: 0,
      currency: "INR",
      status: "overdue",
      lines: [
        {
          id: `inv-line-${2900 + i}-1`,
          invoiceId: `inv-${2900 + i}`,
          productId: products[i % products.length].id,
          description: `${products[i % products.length].name} - Recurring Service`,
          quantity: 1,
          unitPrice: balance,
          amount: balance,
        },
      ],
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
      subtotal: Math.round(amount / 1.18),
      taxTotal: amount - Math.round(amount / 1.18),
      discountTotal: 0,
      totalAmount: amount,
      balance: 0,
      paidAmount: amount,
      currency: "INR",
      status: "paid",
      lines: [
        {
          id: `inv-line-paid-${i}-1`,
          invoiceId: `inv-paid-${i}`,
          productId: products[i % products.length].id,
          description: `${products[i % products.length].name} Settlement`,
          quantity: 1,
          unitPrice: amount,
          amount,
        },
      ],
      createdAt: "2026-10-02T10:00:00Z",
    });
  }

  // 9. Generate Payments
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

  // 10. Billing Runs Audit Trail
  const billingRuns: BillingRun[] = [
    {
      id: "brun-baseline",
      runDate: "2026-10-31T06:00:00Z",
      runBy: "System Automation",
      subscriptionsProcessed: TARGET_ACTIVE,
      invoicesCreated: 350,
      invoicesSkipped: TARGET_ACTIVE - 350,
      failedCount: 0,
      errors: [],
    },
  ];

  cachedStore = {
    customers,
    plans,
    products,
    quotationTemplates,
    subscriptions,
    invoices,
    payments,
    taxes,
    discounts,
    billingRuns,
  };

  return cachedStore;
}

export function getMockStore(): MockStore {
  // Always synchronize with MockDb state if available
  try {
        const { getMockDb } = require("../mock/db");
    const db = getMockDb();
    if (db && db.store) {
      return db.store;
    }
  } catch {
    // Fallback to in-memory generator if called outside server context
  }

  if (cachedStore) {
    return cachedStore;
  }
  return (cachedStore = generateFreshMockStore());
}
