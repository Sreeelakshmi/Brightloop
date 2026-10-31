import { createClient } from "@supabase/supabase-js";

// Read environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("Error: NEXT_PUBLIC_SUPABASE_URL is not defined in environment.");
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error("Error: SUPABASE_SERVICE_ROLE_KEY is not defined in environment.");
  process.exit(1);
}

console.log("--------------------------------------------------");
console.log("Brightloop Dev Test Users Provisioning Script");
console.log("--------------------------------------------------");
console.log(`Target Supabase URL: ${supabaseUrl}`);

// Safety Check: Detect Remote Project
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
  console.error("  node --env-file=.env.local scripts/seed-test-users.mjs --confirm-remote");
  console.error("Or set CONFIRM_REMOTE_SEED=yes in your environment.");
  process.exit(2);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Dev Accounts Specification
const accounts = [
  {
    role: "admin",
    email: process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_TEST_EMAIL || "admin@brightloop.test",
    password: process.env.ADMIN_TEST_PASSWORD || process.env.SEED_ADMIN_PASSWORD,
    fullName: "Brightloop Administrator",
  },
  {
    role: "staff",
    email: process.env.SEED_STAFF_EMAIL || process.env.STAFF_TEST_EMAIL || "staff@brightloop.test",
    password: process.env.STAFF_TEST_PASSWORD || process.env.SEED_STAFF_PASSWORD,
    fullName: "Brightloop Operations Staff",
  },
  {
    role: "customer",
    email: process.env.SEED_CUSTOMER_EMAIL || process.env.CUSTOMER_TEST_EMAIL || "customer@brightloop.test",
    password: process.env.CUSTOMER_TEST_PASSWORD || process.env.SEED_CUSTOMER_PASSWORD,
    fullName: "Test Enterprise Customer",
  },
];

// Password rule validation check
function validatePassword(pwd) {
  const appRulePass = pwd.length >= 6;
  const specRulePass =
    pwd.length > 8 &&
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd);

  return { appRulePass, specRulePass };
}

async function seedUser(account) {
  const { role, email, password, fullName } = account;
  const validation = validatePassword(password);

  if (!validation.appRulePass) {
    throw new Error(
      `Password for ${email} violates application policy (minimum 6 characters).`
    );
  }

  console.log(`\nProcessing ${role.toUpperCase()} account (${email})...`);
  console.log(
    `  Password compliance: App rule (>=6 chars): ${validation.appRulePass ? "PASS" : "FAIL"} | Spec rule (>8 chars, upper, lower, special): ${validation.specRulePass ? "PASS" : "FAIL"}`
  );

  // List existing users to check if this user already exists
  const { data: listData, error: listError } =
    await supabase.auth.admin.listUsers();
  if (listError) {
    throw new Error(`Failed to list existing auth users: ${listError.message}`);
  }

  const existingUser = listData.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  let userId;

  if (existingUser) {
    console.log(`  User already exists (ID: ${existingUser.id}). Updating credentials...`);
    const { data: updateData, error: updateError } =
      await supabase.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });

    if (updateError) {
      throw new Error(`Failed to update auth user: ${updateError.message}`);
    }
    userId = updateData.user.id;
  } else {
    console.log(`  Creating new auth user with email_confirm = true...`);
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName, role },
      });

    if (createError) {
      throw new Error(`Failed to create auth user: ${createError.message}`);
    }
    userId = createData.user.id;
  }

  // Upsert profile in public.profiles table
  console.log(`  Upserting profile in public.profiles (role: ${role})...`);
  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      id: userId,
      email,
      full_name: fullName,
      role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (profileError) {
    throw new Error(`Failed to upsert profile record: ${profileError.message}`);
  }

  return { email, role, password, status: "READY" };
}

async function run() {
  const results = [];
  for (const account of accounts) {
    try {
      const res = await seedUser(account);
      results.push(res);
    } catch (err) {
      console.error(`  [ERROR] ${err.message}`);
      results.push({
        email: account.email,
        role: account.role,
        password: account.password,
        status: `FAILED: ${err.message}`,
      });
    }
  }

  console.log("\n==================================================");
  console.log("PROVISIONED TEST ACCOUNTS SUMMARY");
  console.log("==================================================");
  console.table(
    results.map((r) => ({
      Role: r.role,
      Email: r.email,
      Password: r.password,
      Status: r.status,
    }))
  );
  console.log("==================================================\n");
}

run().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});

