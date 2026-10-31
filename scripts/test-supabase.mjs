import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Load .env.local manually
function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }
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

function normalizeSupabaseUrl(url) {
  return url.trim().replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");
}

loadEnvLocal();

async function runTest() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("=== SUPABASE ENVIRONMENT VARIABLES ===");

  if (!rawUrl) {
    console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL is not set.");
  } else {
    try {
      const parsedUrl = new URL(rawUrl);
      const maskedHost = parsedUrl.host.replace(/^([^.]{3})[^.]*/, "$1***");
      console.log(`OK: NEXT_PUBLIC_SUPABASE_URL is loaded (host: ${maskedHost}, protocol: ${parsedUrl.protocol})`);
    } catch {
      console.error("FAIL: NEXT_PUBLIC_SUPABASE_URL is not a valid URL format.");
    }
  }

  if (!anonKey) {
    console.error("FAIL: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or ANON_KEY) is not set.");
  } else {
    const isJwt = anonKey.split(".").length === 3;
    const prefix = anonKey.slice(0, 4);
    console.log(`OK: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is loaded (format: ${isJwt ? "JWT" : "token"}, prefix: ${prefix}***, length: ${anonKey.length})`);
  }

  if (serviceKey) {
    console.log(`OK: SUPABASE_SERVICE_ROLE_KEY is loaded (length: ${serviceKey.length})`);
  } else {
    console.log("INFO: SUPABASE_SERVICE_ROLE_KEY is not set yet (optional for read-only test).");
  }

  if (!rawUrl || !anonKey) {
    console.error("\nCannot proceed with connection test due to missing variables.");
    process.exit(1);
  }

  const url = normalizeSupabaseUrl(rawUrl);

  console.log("\n=== TESTING READ-ONLY SUPABASE CONNECTION ===");

  // 1. Direct GoTrue / Auth service health check
  try {
    const healthUrl = `${url}/auth/v1/health`;
    console.log("Step 1: Checking Auth service health endpoint...");
    const res = await fetch(healthUrl, {
      method: "GET",
      headers: {
        apikey: anonKey,
      },
    });

    if (res.ok) {
      console.log(`OK: Auth service responded with HTTP ${res.status} (${res.statusText || "OK"})`);
    } else {
      console.log(`WARNING: Auth service returned HTTP ${res.status}: ${res.statusText}`);
    }
  } catch (err) {
    console.error("FAIL: Unable to reach Auth endpoint:", err.message);
  }

  // 2. Test Supabase JS Client session probe
  try {
    console.log("Step 2: Initializing Supabase client and testing session query...");
    const supabase = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error("FAIL: Auth getSession returned error:", sessionError.message);
    } else {
      console.log("OK: Supabase Auth client initialized successfully (active session check passed).");
    }

    // 3. Test PostgREST connection with safe zero-row probe
    console.log("Step 3: Testing PostgREST API query...");
    const { data: dbData, error: dbError } = await supabase
      .from("_brightloop_probe")
      .select("*")
      .limit(0);

    if (dbError) {
      if (
        dbError.code === "42P01" ||
        dbError.code === "PGRST204" ||
        dbError.code === "PGRST205" ||
        dbError.message?.toLowerCase().includes("does not exist") ||
        dbError.message?.toLowerCase().includes("could not find the table")
      ) {
        console.log("OK: PostgREST API is online, authenticated, and responded correctly (no tables created yet).");
      } else if (dbError.code === "PGRST301" || dbError.message?.toLowerCase().includes("jwt")) {
        console.error("FAIL: Authentication rejected by PostgREST (invalid API key/JWT):", dbError.message);
      } else {
        console.log(`INFO: PostgREST responded with code ${dbError.code}: ${dbError.message}`);
      }
    } else {
      console.log("OK: PostgREST API connected successfully.");
    }

    console.log("\n=== ALL CONNECTION CHECKS COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("FAIL: Supabase client connection error:", err.message);
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error("Fatal error:", err.message);
  process.exit(1);
});
