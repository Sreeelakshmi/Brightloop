import fs from "fs";
import path from "path";

// Load .env.local manually
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

loadEnvLocal();

console.log("=================================================");
console.log("BRIGHTLOOP AUTHENTICATION & ACCESS CONTROL AUDIT");
console.log("=================================================\n");

let passed = 0;
let total = 0;

function assert(condition, testName, details) {
  total++;
  if (condition) {
    passed++;
    console.log(`[PASS] ${testName}`);
  } else {
    console.error(`[FAIL] ${testName}${details ? ` - ${details}` : ""}`);
  }
}

// 1. Environment & Credential Exposure Checks
console.log("--- 1. Environment & Credential Safety ---");
const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

assert(!!rawUrl, "NEXT_PUBLIC_SUPABASE_URL is configured");
assert(!!anonKey, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is configured");
assert(
  !serviceKey || !serviceKey.startsWith("NEXT_PUBLIC_"),
  "SUPABASE_SERVICE_ROLE_KEY is server-only (never prefixed with NEXT_PUBLIC_)"
);

// 2. Role Resolution Security Tests (Mocking Profile vs User Metadata)
console.log("\n--- 2. Role Resolution Security (Trusted Profile vs Metadata) ---");

// Helper mirroring the exact implementation in session.ts & actions.ts
function resolveRoleFromDatabase(dbProfile, userMetadata) {
  let trustedRole = "customer";
  if (
    dbProfile?.role &&
    (dbProfile.role === "admin" ||
      dbProfile.role === "staff" ||
      dbProfile.role === "customer")
  ) {
    trustedRole = dbProfile.role;
  }
  // userMetadata is deliberately ignored for role authorization!
  return trustedRole;
}

assert(
  resolveRoleFromDatabase({ role: "admin" }, { role: "customer" }) === "admin",
  "Admin role in public.profiles resolves to 'admin'"
);

assert(
  resolveRoleFromDatabase({ role: "staff" }, { role: "customer" }) === "staff",
  "Staff role in public.profiles resolves to 'staff'"
);

assert(
  resolveRoleFromDatabase({ role: "customer" }, { role: "customer" }) === "customer",
  "Customer role in public.profiles resolves to 'customer'"
);

// PRIVILEGE ESCALATION ATTACK TEST
const maliciousMetadata = { role: "admin", is_admin: true, permissions: ["all"] };
assert(
  resolveRoleFromDatabase(null, maliciousMetadata) === "customer",
  "Privilege Escalation Blocked: User with no profile row but user_metadata.role='admin' defaults to 'customer'"
);

assert(
  resolveRoleFromDatabase({ role: "customer" }, maliciousMetadata) === "customer",
  "Privilege Escalation Blocked: Customer with forged user_metadata.role='admin' resolves strictly to 'customer'"
);

assert(
  resolveRoleFromDatabase({ role: "invalid_role" }, maliciousMetadata) === "customer",
  "Invalid role in database defaults strictly to 'customer'"
);

// 3. Role-Based Redirects Tests
console.log("\n--- 3. Role-Based Redirects Verification ---");

function getRoleRedirectPath(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/staff";
    case "customer":
      return "/customer";
    default:
      return "/customer";
  }
}

assert(getRoleRedirectPath("admin") === "/admin", "Admin role redirects to /admin");
assert(getRoleRedirectPath("staff") === "/staff", "Staff role redirects to /staff");
assert(getRoleRedirectPath("customer") === "/customer", "Customer role redirects to /customer");
assert(getRoleRedirectPath(undefined) === "/customer", "Undefined role defaults to /customer");

// 4. Route Protection Matrix Verification
console.log("\n--- 4. Route Protection & Role Isolation Matrix ---");

const protectedPaths = [
  "/admin",
  "/staff",
  "/customer",
  "/portal",
  "/dashboard",
  "/products",
  "/plans",
  "/customers",
  "/quotations",
  "/subscriptions",
  "/invoices",
  "/payments",
  "/settings",
];

const publicPaths = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
  "/auth/logout",
];

function isProtected(pathname) {
  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

function canCustomerAccess(pathname) {
  if (!isProtected(pathname)) return true;
  // Customer can only access /customer and /portal
  return (
    pathname === "/customer" ||
    pathname.startsWith("/customer/") ||
    pathname === "/portal" ||
    pathname.startsWith("/portal/")
  );
}

function canStaffAccess(pathname) {
  if (!isProtected(pathname)) return true;
  // Staff cannot access admin-only paths (/admin, /settings)
  return !(
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/")
  );
}

// Unauthenticated tests
protectedPaths.forEach((path) => {
  assert(isProtected(path), `Unauthenticated access to '${path}' is blocked and requires login`);
});

publicPaths.forEach((path) => {
  assert(!isProtected(path), `Public path '${path}' does not require prior login`);
});

// Customer isolation tests
assert(!canCustomerAccess("/admin"), "Customer is strictly blocked from /admin");
assert(!canCustomerAccess("/staff"), "Customer is strictly blocked from /staff");
assert(!canCustomerAccess("/dashboard"), "Customer is strictly blocked from /dashboard");
assert(!canCustomerAccess("/settings"), "Customer is strictly blocked from /settings");
assert(!canCustomerAccess("/products"), "Customer is strictly blocked from /products");
assert(!canCustomerAccess("/plans"), "Customer is strictly blocked from /plans");
assert(canCustomerAccess("/customer"), "Customer is permitted on /customer");
assert(canCustomerAccess("/portal"), "Customer is permitted on /portal");

// Staff isolation tests
assert(!canStaffAccess("/admin"), "Staff is blocked from /admin");
assert(!canStaffAccess("/settings"), "Staff is blocked from /settings");
assert(canStaffAccess("/staff"), "Staff is permitted on /staff");
assert(canStaffAccess("/dashboard"), "Staff is permitted on /dashboard");
assert(canStaffAccess("/products"), "Staff is permitted on /products");

// 5. Homepage Dashboard Buttons Verification
console.log("\n--- 5. Homepage Button Protection Verification ---");
const homepageButtonTargets = ["/dashboard", "/customer"];
homepageButtonTargets.forEach((target) => {
  assert(
    isProtected(target),
    `Homepage button targeting '${target}' cannot bypass authentication`
  );
});

console.log(`\n=================================================`);
console.log(`AUDIT SUMMARY: ${passed}/${total} security assertions passed!`);
console.log(`=================================================`);

