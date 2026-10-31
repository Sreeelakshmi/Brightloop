import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL is not defined in environment.");
  process.exit(1);
}

if (!anonKey) {
  console.error(
    "Error: NEXT_PUBLIC_SUPABASE_ANON_KEY (or PUBLISHABLE_KEY) is not defined in environment."
  );
  process.exit(1);
}

console.log("==================================================");
console.log("Brightloop Authentication & RBAC Verification");
console.log("==================================================");
console.log(`Endpoint: ${supabaseUrl}`);

const testAccounts = [
  {
    role: "admin",
    email: process.env.ADMIN_TEST_EMAIL || process.env.SEED_ADMIN_EMAIL || "admin@brightloop.test",
    password: process.env.ADMIN_TEST_PASSWORD || process.env.SEED_ADMIN_PASSWORD,
  },
  {
    role: "staff",
    email: process.env.STAFF_TEST_EMAIL || process.env.SEED_STAFF_EMAIL || "staff@brightloop.test",
    password: process.env.STAFF_TEST_PASSWORD || process.env.SEED_STAFF_PASSWORD,
  },
  {
    role: "customer",
    email: process.env.CUSTOMER_TEST_EMAIL || process.env.SEED_CUSTOMER_EMAIL || "customer@brightloop.test",
    password: process.env.CUSTOMER_TEST_PASSWORD || process.env.SEED_CUSTOMER_PASSWORD,
  },
];

async function verifyAccount(account) {
  const { role, email, password } = account;
  console.log(`\n--------------------------------------------------`);
  console.log(`Testing account: ${email} (Expected Role: ${role.toUpperCase()})`);
  console.log(`--------------------------------------------------`);

  // Create isolated client for this session (simulating browser client with anon key)
  const client = createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const verificationResults = {
    email,
    expectedRole: role,
    loginCheck: "FAIL",
    roleCheck: "FAIL",
    allowedQueryCheck: "FAIL",
    forbiddenQueryCheck: "FAIL",
  };

  // 1. Sign in with password using anon key
  const { data: authData, error: authError } =
    await client.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    console.log(`  [FAIL] Sign-in failed: ${authError?.message || "No user returned"}`);
    return verificationResults;
  }

  console.log(`  [PASS] Sign-in successful (User ID: ${authData.user.id})`);
  verificationResults.loginCheck = "PASS";

  // 2. Read public.profiles and confirm role
  const { data: profile, error: profileError } = await client
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", authData.user.id)
    .single();

  if (profileError || !profile) {
    console.log(
      `  [FAIL] Failed to fetch profile: ${profileError?.message || "Profile row missing"}`
    );
  } else if (profile.role === role) {
    console.log(
      `  [PASS] Verified database profile role: '${profile.role}' matches expected '${role}'`
    );
    verificationResults.roleCheck = "PASS";
  } else {
    console.log(
      `  [FAIL] Role mismatch: database has '${profile.role}', expected '${role}'`
    );
  }

  // 3. Allowed query test
  if (role === "admin") {
    // Admin allowed: Read products catalog
    const { data, error } = await client.from("products").select("id, name").limit(1);
    if (!error) {
      console.log(`  [PASS] Allowed query (Admin reading products): Succeeded`);
      verificationResults.allowedQueryCheck = "PASS";
    } else {
      console.log(`  [FAIL] Allowed query failed: ${error.message}`);
    }

    // Admin forbidden: Attempt unauthorized direct modification of system profiles table
    // or test that admin cannot insert invalid subscription status
    const { error: invalidError } = await client
      .from("profiles")
      .insert({ id: "00000000-0000-0000-0000-000000000000", email: "invalid", role: "superadmin" });
    if (invalidError) {
      console.log(
        `  [PASS] Forbidden query (Inserting invalid role 'superadmin' into profiles blocked): Succeeded (${invalidError.message})`
      );
      verificationResults.forbiddenQueryCheck = "PASS";
    } else {
      console.log(`  [FAIL] Forbidden query was unexpectedly allowed`);
    }
  } else if (role === "staff") {
    // Staff allowed: Read products catalog
    const { data, error } = await client.from("products").select("id, name").limit(1);
    if (!error) {
      console.log(`  [PASS] Allowed query (Staff reading products catalog): Succeeded`);
      verificationResults.allowedQueryCheck = "PASS";
    } else {
      console.log(`  [FAIL] Allowed query failed: ${error.message}`);
    }

    // Staff forbidden: Insert into products catalog (RLS requires role='admin')
    const { error: insertError } = await client.from("products").insert({
      name: "Staff Unauthorized Product",
      type: "service",
      sales_price: 1000,
      cost_price: 500,
    });

    if (insertError) {
      console.log(
        `  [PASS] Forbidden query (Staff inserting into products blocked by RLS): Succeeded (${insertError.message})`
      );
      verificationResults.forbiddenQueryCheck = "PASS";
    } else {
      console.log(`  [FAIL] Forbidden query was unexpectedly allowed (Staff inserted product)`);
    }
  } else if (role === "customer") {
    // Customer allowed: Read public pricing plans
    const { data, error } = await client.from("plans").select("id, name").limit(1);
    if (!error) {
      console.log(`  [PASS] Allowed query (Customer reading plans catalog): Succeeded`);
      verificationResults.allowedQueryCheck = "PASS";
    } else {
      console.log(`  [FAIL] Allowed query failed: ${error.message}`);
    }

    // Customer forbidden: Insert into products catalog
    const { error: insertError } = await client.from("products").insert({
      name: "Customer Unauthorized Product",
      type: "service",
      sales_price: 1000,
      cost_price: 500,
    });

    if (insertError) {
      console.log(
        `  [PASS] Forbidden query (Customer inserting into products blocked by RLS): Succeeded (${insertError.message})`
      );
      verificationResults.forbiddenQueryCheck = "PASS";
    } else {
      console.log(`  [FAIL] Forbidden query was unexpectedly allowed (Customer inserted product)`);
    }
  }

  // Sign out cleanly
  await client.auth.signOut();
  return verificationResults;
}

async function run() {
  const allResults = [];
  for (const acc of testAccounts) {
    const res = await verifyAccount(acc);
    allResults.push(res);
  }

  console.log("\n==================================================");
  console.log("FINAL AUTHENTICATION & ACCESS VERIFICATION SUMMARY");
  console.log("==================================================");
  console.table(
    allResults.map((r) => ({
      Account: r.email,
      Role: r.expectedRole.toUpperCase(),
      Login: r.loginCheck,
      ProfileRole: r.roleCheck,
      AllowedQuery: r.allowedQueryCheck,
      ForbiddenBlocked: r.forbiddenQueryCheck,
    }))
  );
  console.log("==================================================\n");
}

run().catch((err) => {
  console.error("Fatal verification error:", err);
  process.exit(1);
});

