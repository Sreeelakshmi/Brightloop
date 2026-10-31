// LOCAL ONLY
import { createClient } from "@supabase/supabase-js";

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Error: Supabase credentials missing in environment.");
  process.exit(1);
}

console.log("--------------------------------------------------");
console.log("Brightloop Mock Data Seeding Engine");
console.log("--------------------------------------------------");
console.log(`Target Supabase URL: ${supabaseUrl}`);

const isLocalhost =
  supabaseUrl.includes("localhost") || supabaseUrl.includes("127.0.0.1");
const isConfirmed =
  process.argv.includes("--confirm-remote") ||
  process.env.CONFIRM_REMOTE_SEED === "yes" ||
  process.env.CONFIRM_REMOTE_SEED === "true";

if (!isLocalhost && !isConfirmed) {
  console.error("\n[SAFETY BLOCK] Remote Supabase project detected!");
  console.error("You are targeting a shared/remote cloud database:");
  console.error(`  URL: ${supabaseUrl}`);
  console.error("\nTo execute on this remote project, run with confirmation flag:");
  console.error("  node --env-file=.env.local scripts/seed-mock-data.mjs --confirm-remote");
  console.error("Or set CONFIRM_REMOTE_SEED=yes in your environment.");
  process.exit(2);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper for relative timestamps
const NOW = new Date();
function daysAgo(n) {
  const d = new Date(NOW.getTime() - n * 86400000);
  return d.toISOString();
}
function daysFromNow(n) {
  const d = new Date(NOW.getTime() + n * 86400000);
  return d.toISOString();
}

async function runSeed() {
  console.log("\nStarting idempotent data seeding...");
  const counts = {};

  // 1. Customers (customer@brightloop.test + 11 fake customers)
  console.log("\n1. Provisioning Customer Profiles...");
  const customers = [
    {
      email: "customer@brightloop.test",
      fullName: "Test Enterprise Customer",
      phone: "+91 98765 43210",
      company: "Acme Global Solutions",
    },
  ];
  for (let i = 2; i <= 12; i++) {
    const pad = String(i).padStart(2, "0");
    customers.push({
      email: `customer${pad}@example.test`,
      fullName: `Enterprise Customer ${pad}`,
      phone: `+91 98765 000${pad}`,
      company: `Apex Tier ${pad} Technologies`,
    });
  }

  const customerProfiles = [];
  const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 100 });
  const userMap = new Map((existingUsers?.users || []).map((u) => [u.email?.toLowerCase(), u]));

  for (const c of customers) {
    let user = userMap.get(c.email.toLowerCase());
    if (!user) {
      const { data: created, error } = await supabase.auth.admin.createUser({
        email: c.email,
        password: "Customer@12345",
        email_confirm: true,
        user_metadata: { full_name: c.fullName, role: "customer" },
      });
      if (error) {
        console.error(`Failed to create auth user ${c.email}:`, error.message);
        continue;
      }
      user = created.user;
    }

    // Upsert profile
    const { error: pErr } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: c.email,
        full_name: c.fullName,
        role: "customer",
        phone: c.phone,
        billing_address: { company: c.company, country: "India" },
        updated_at: NOW.toISOString(),
      },
      { onConflict: "id" }
    );
    if (pErr) console.error("Profile upsert error:", pErr.message);

    customerProfiles.push({ id: user.id, email: c.email, company: c.company });
  }
  counts["customers"] = customerProfiles.length;
  console.log(`  -> ${customerProfiles.length} customer profiles ready.`);

  // 2. Catalog: Products & Variants
  console.log("\n2. Seeding Products & Product Variants...");
  const products = [
    {
      id: "00000000-0000-0000-0001-000000000001",
      name: "Brightloop CRM Suite",
      slug: "brightloop-crm",
      description: "End-to-end customer relationship and quotation pipeline",
      active: true,
    },
    {
      id: "00000000-0000-0000-0001-000000000002",
      name: "Revenue Intelligence Engine",
      slug: "revenue-intelligence",
      description: "Predictive recurring telemetry, churn risk, and AI insights",
      active: true,
    },
    {
      id: "00000000-0000-0000-0001-000000000003",
      name: "24/7 Enterprise Dedicated TAM",
      slug: "enterprise-tam",
      description: "Technical account management and guaranteed 15-minute SLA",
      active: true,
    },
  ];

  const { error: prodErr } = await supabase.from("products").upsert(products, { onConflict: "id" });
  if (prodErr) console.error("Products error:", prodErr.message);
  counts["products"] = products.length;

  const variants = [
    {
      id: "00000000-0000-0000-0002-000000000001",
      product_id: products[0].id,
      name: "Standard Edition",
      sku: "BL-CRM-STD",
      description: "Core sales and pipeline management",
      active: true,
    },
    {
      id: "00000000-0000-0000-0002-000000000002",
      product_id: products[0].id,
      name: "Odoo Integration Addon",
      sku: "BL-CRM-ODOO",
      description: "Live two-way synchronization with Odoo ERP",
      active: true,
    },
    {
      id: "00000000-0000-0000-0002-000000000003",
      product_id: products[1].id,
      name: "Real-time Telemetry",
      sku: "BL-REV-RT",
      description: "Second-by-second transaction tracking",
      active: true,
    },
    {
      id: "00000000-0000-0000-0002-000000000004",
      product_id: products[1].id,
      name: "Gemini Copilot Analytics",
      sku: "BL-REV-AI",
      description: "Generative forecasting and churn propensity modeling",
      active: true,
    },
    {
      id: "00000000-0000-0000-0002-000000000005",
      product_id: products[2].id,
      name: "Standard Business Hours TAM",
      sku: "BL-TAM-STD",
      description: "8x5 direct engineering contact",
      active: true,
    },
    {
      id: "00000000-0000-0000-0002-000000000006",
      product_id: products[2].id,
      name: "Mission Critical Dedicated TAM",
      sku: "BL-TAM-CRIT",
      description: "24x7 priority incident desk",
      active: true,
    },
  ];

  const { error: varErr } = await supabase.from("product_variants").upsert(variants, { onConflict: "id" });
  if (varErr) console.error("Variants error:", varErr.message);
  counts["product_variants"] = variants.length;
  console.log(`  -> ${products.length} products and ${variants.length} variants ready.`);

  // 3. Plans
  console.log("\n3. Seeding Subscription Plans...");
  const plans = [
    {
      id: "00000000-0000-0000-0003-000000000001",
      product_id: products[0].id,
      name: "Monthly Standard Plan",
      code: "PLAN-MONTHLY-STD",
      description: "Billed every month with standard features",
      interval: "month",
      interval_count: 1,
      amount: 4999.00,
      currency: "USD",
      trial_days: 14,
      active: true,
    },
    {
      id: "00000000-0000-0000-0003-000000000002",
      product_id: products[0].id,
      name: "Quarterly Growth Plan",
      code: "PLAN-QUARTERLY-GRW",
      description: "Quarterly billing with multi-seat volume discount",
      interval: "quarter",
      interval_count: 1,
      amount: 13999.00,
      currency: "USD",
      trial_days: 0,
      active: true,
    },
    {
      id: "00000000-0000-0000-0003-000000000003",
      product_id: products[1].id,
      name: "Annual Enterprise Tier",
      code: "PLAN-ANNUAL-ENT",
      description: "Full platform license billed annually",
      interval: "year",
      interval_count: 1,
      amount: 49999.00,
      currency: "USD",
      trial_days: 30,
      active: true,
    },
    {
      id: "00000000-0000-0000-0003-000000000004",
      product_id: products[2].id,
      name: "Dedicated Operations Support",
      code: "PLAN-MONTHLY-TAM",
      description: "Dedicated account oversight billed monthly",
      interval: "month",
      interval_count: 1,
      amount: 2499.00,
      currency: "USD",
      trial_days: 0,
      active: true,
    },
  ];

  const { error: planErr } = await supabase.from("plans").upsert(plans, { onConflict: "id" });
  if (planErr) console.error("Plans error:", planErr.message);
  counts["plans"] = plans.length;
  console.log(`  -> ${plans.length} plans ready.`);

  // 4. Tax Rules & Discount Rules
  console.log("\n4. Seeding Tax Rules & Discount Rules...");
  const taxRules = [
    {
      id: "00000000-0000-0000-0004-000000000001",
      name: "GST Standard 18%",
      percentage: 18.00,
      country: "IN",
      active: true,
    },
    {
      id: "00000000-0000-0000-0004-000000000002",
      name: "GST Reduced 12%",
      percentage: 12.00,
      country: "IN",
      active: true,
    },
    {
      id: "00000000-0000-0000-0004-000000000003",
      name: "Zero Tax (Export)",
      percentage: 0.00,
      country: "US",
      active: true,
    },
  ];

  const { error: taxErr } = await supabase.from("tax_rules").upsert(taxRules, { onConflict: "id" });
  if (taxErr) console.error("Tax rules error:", taxErr.message);
  counts["tax_rules"] = taxRules.length;

  const discountRules = [
    {
      id: "00000000-0000-0000-0005-000000000001",
      code: "WELCOME20",
      description: "20% off introductory enterprise subscription",
      discount_type: "percentage",
      discount_value: 20.00,
      times_redeemed: 5,
      active: true,
    },
    {
      id: "00000000-0000-0000-0005-000000000002",
      code: "FLAT500",
      description: "Flat $500 discount on recurring contract",
      discount_type: "fixed_amount",
      discount_value: 500.00,
      currency: "USD",
      times_redeemed: 8,
      active: true,
    },
    {
      id: "00000000-0000-0000-0005-000000000003",
      code: "EXPIRED15",
      description: "Expired flash campaign voucher",
      discount_type: "percentage",
      discount_value: 15.00,
      expires_at: daysAgo(30),
      active: false,
    },
  ];

  const { error: discErr } = await supabase.from("discount_rules").upsert(discountRules, { onConflict: "id" });
  if (discErr) console.error("Discount rules error:", discErr.message);
  counts["discount_rules"] = discountRules.length;
  console.log(`  -> ${taxRules.length} tax rules and ${discountRules.length} discounts ready.`);

  // 5. Subscriptions (Total 60 subscriptions, 8 belonging to customer@brightloop.test)
  console.log("\n5. Seeding Subscriptions...");
  const testCustomerId = customerProfiles[0].id;
  const otherCustomerIds = customerProfiles.slice(1).map((c) => c.id);

  // Statuses valid under initial_schema check constraint: 'active', 'paused', 'canceled', 'past_due', 'unpaid', 'trialing'
  const subStatuses = ["active", "active", "active", "paused", "past_due", "canceled", "unpaid", "trialing"];

  const subscriptions = [];
  let subIndex = 1;

  // 8 assigned to test customer
  const testSubStatuses = ["active", "active", "active", "paused", "canceled", "past_due", "unpaid", "trialing"];
  for (let i = 0; i < 8; i++) {
    const id = `00000000-0000-0000-0010-${String(subIndex).padStart(12, "0")}`;
    const plan = plans[i % plans.length];
    subscriptions.push({
      id,
      customer_id: testCustomerId,
      plan_id: plan.id,
      status: testSubStatuses[i],
      current_period_start: daysAgo(60 - i * 5),
      current_period_end: daysFromNow(30 + i * 5),
      cancel_at_period_end: i === 4,
    });
    subIndex++;
  }

  // 52 assigned across other customers
  for (let i = 0; i < 52; i++) {
    const id = `00000000-0000-0000-0010-${String(subIndex).padStart(12, "0")}`;
    const custId = otherCustomerIds[i % otherCustomerIds.length];
    const plan = plans[i % plans.length];
    const status = subStatuses[i % subStatuses.length];
    subscriptions.push({
      id,
      customer_id: custId,
      plan_id: plan.id,
      status,
      current_period_start: daysAgo(90 - (i % 30)),
      current_period_end: daysFromNow(30 + (i % 60)),
      cancel_at_period_end: status === "canceled",
    });
    subIndex++;
  }

  const { error: subsErr } = await supabase.from("subscriptions").upsert(subscriptions, { onConflict: "id" });
  if (subsErr) console.error("Subscriptions upsert error:", subsErr.message);
  counts["subscriptions"] = subscriptions.length;
  console.log(`  -> ${subscriptions.length} subscriptions created (${8} for test customer).`);

  // 6. Invoices and Payments (~150 invoices, ~15 overdue, payments summing to total)
  console.log("\n6. Seeding Invoices & Settled Payments...");
  const invoices = [];
  const payments = [];
  const invoiceItems = [];
  let invIndex = 1;
  let payIndex = 1;

  const paymentMethods = ["credit_card", "upi", "wire_transfer", "direct_debit"];

  for (const sub of subscriptions) {
    const numCycles = sub.id.endsWith("1") || sub.id.endsWith("3") || sub.id.endsWith("7") ? 3 : 2;

    for (let c = 0; c < numCycles; c++) {
      const invId = `00000000-0000-0000-0020-${String(invIndex).padStart(12, "0")}`;
      const periodStart = daysAgo(150 - c * 45);
      const periodEnd = daysAgo(120 - c * 45);
      const isOverdueTarget = invIndex <= 15;
      const isTestCustomer = sub.customer_id === testCustomerId;

      let status = "paid";
      let dueDate;
      let paidAt = null;

      if (isOverdueTarget) {
        status = "open";
        dueDate = daysAgo(5 + (invIndex % 55));
      } else if (invIndex % 10 === 0) {
        status = "draft";
        dueDate = daysFromNow(15);
      } else if (invIndex % 15 === 0) {
        status = "open";
        dueDate = daysFromNow(10);
      } else {
        status = "paid";
        dueDate = daysAgo(90 - c * 30);
        paidAt = daysAgo(92 - c * 30);
      }

      if (isTestCustomer && c === 0) {
        status = "open";
        dueDate = daysAgo(14);
      }

      const unitPrice = 4999.00;
      const taxAmount = 899.82;
      const discountAmount = c === 1 ? 500.00 : 0.00;
      const totalAmount = unitPrice + taxAmount - discountAmount;
      const amountPaid = status === "paid" ? totalAmount : 0.00;
      const amountDue = totalAmount - amountPaid;

      invoices.push({
        id: invId,
        invoice_number: `INV-2026-${String(invIndex).padStart(5, "0")}`,
        customer_id: sub.customer_id,
        subscription_id: sub.id,
        billing_period_start: periodStart,
        billing_period_end: periodEnd,
        status,
        currency: "USD",
        subtotal: unitPrice,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        amount_due: amountDue,
        amount_paid: amountPaid,
        due_date: dueDate,
        paid_at: paidAt,
      });

      invoiceItems.push({
        id: `00000000-0000-0000-0021-${String(invIndex).padStart(12, "0")}`,
        invoice_id: invId,
        product_variant_id: variants[0].id,
        description: "Brightloop Core Subscription Seat + Telemetry Engine",
        quantity: 1,
        unit_price: unitPrice,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
      });

      if (status === "paid") {
        const method = paymentMethods[payIndex % paymentMethods.length];
        payments.push({
          id: `00000000-0000-0000-0030-${String(payIndex).padStart(12, "0")}`,
          invoice_id: invId,
          customer_id: sub.customer_id,
          transaction_reference: `TXN-BL-${Date.now().toString(36).toUpperCase()}-${payIndex}`,
          payment_method: method,
          amount: totalAmount,
          currency: "USD",
          status: "succeeded",
          created_at: paidAt || periodEnd,
        });
        payIndex++;
      }

      invIndex++;
      if (invoices.length >= 150) break;
    }
    if (invoices.length >= 150) break;
  }

  // Batch upsert in chunks of 50
  for (let i = 0; i < invoices.length; i += 50) {
    const chunk = invoices.slice(i, i + 50);
    const { error: invErr } = await supabase.from("invoices").upsert(chunk, { onConflict: "id" });
    if (invErr) console.error("Invoices chunk error:", invErr.message);
  }
  counts["invoices"] = invoices.length;

  for (let i = 0; i < invoiceItems.length; i += 50) {
    const chunk = invoiceItems.slice(i, i + 50);
    const { error: itemErr } = await supabase.from("invoice_items").upsert(chunk, { onConflict: "id" });
    if (itemErr) console.error("Invoice items chunk error:", itemErr.message);
  }
  counts["invoice_items"] = invoiceItems.length;

  for (let i = 0; i < payments.length; i += 50) {
    const chunk = payments.slice(i, i + 50);
    const { error: payErr } = await supabase.from("payments").upsert(chunk, { onConflict: "id" });
    if (payErr) console.error("Payments chunk error:", payErr.message);
  }
  counts["payments"] = payments.length;

  console.log(`  -> ${invoices.length} invoices and ${payments.length} payment records created.`);

  console.log("\n==================================================");
  console.log("MOCK DATA SEEDING SUMMARY (ROW COUNTS)");
  console.log("==================================================");
  console.table(
    Object.entries(counts).map(([Table, Count]) => ({
      Table,
      Count,
      Status: "Provisioned",
    }))
  );
  console.log("==================================================\n");
}

runSeed().catch((err) => {
  console.error("Fatal mock seeding error:", err);
  process.exit(1);
});
