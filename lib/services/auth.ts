import bcrypt from "bcryptjs";
import crypto from "crypto";
import { cookies } from "next/headers";
import { AuthUser, AUTH_COOKIE_NAME, UserRole } from "@/lib/auth";
import { getMockDb, saveMockDb, checkRateLimit, recordFailedLogin, recordSuccessfulLogin } from "@/lib/mock/db";
import { shouldUseMockData } from "@/lib/data/dashboard";
import { Customer } from "@/types";

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  checks: {
    minLength: boolean;    // > 8 characters
    uppercase: boolean;    // at least 1 uppercase
    lowercase: boolean;    // at least 1 lowercase
    specialChar: boolean;  // at least 1 special char
  };
}

/**
 * Validates password according to strict security specification:
 * - More than 8 characters (min 9)
 * - Contains uppercase letter
 * - Contains lowercase letter
 * - Contains special character
 */
export function validatePassword(password: string): PasswordValidationResult {
  const minLength = typeof password === "string" && password.length > 8;
  const uppercase = /[A-Z]/.test(password || "");
  const lowercase = /[a-z]/.test(password || "");
  const specialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password || "");

  const errors: string[] = [];
  if (!minLength) errors.push("Password must be more than 8 characters");
  if (!uppercase) errors.push("Password must include at least one uppercase letter (A-Z)");
  if (!lowercase) errors.push("Password must include at least one lowercase letter (a-z)");
  if (!specialChar) errors.push("Password must include at least one special character (!@#$%...)");

  return {
    valid: minLength && uppercase && lowercase && specialChar,
    errors,
    checks: {
      minLength,
      uppercase,
      lowercase,
      specialChar,
    },
  };
}

// ── Cookie Helpers ───────────────────────────────────────────────────────────
const USER_ID_COOKIE = "brightloop_user_id";

function setSessionCookies(user: AuthUser) {
  try {
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    cookieStore.set(USER_ID_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  } catch (err) {
    // In test runners or purely server execution without headers, ignore
  }
}

function clearSessionCookies() {
  try {
    const cookieStore = cookies();
    cookieStore.set(AUTH_COOKIE_NAME, "", { maxAge: 0, path: "/" });
    cookieStore.set(USER_ID_COOKIE, "", { maxAge: 0, path: "/" });
  } catch (err) {
    // Ignore in non-HTTP environments
  }
}

// ============================================================================
// 1. SIGNUP
// ============================================================================

export interface SignupInput {
  email: string;
  password: string;
  name?: string;
  company?: string;
}

export async function signup(input: SignupInput): Promise<{ user: AuthUser; customer: Customer }> {
  const emailNorm = (input.email || "").trim().toLowerCase();

  if (!emailNorm) {
    throw new Error("Email address is required.");
  }

  // Validate password
  const validation = validatePassword(input.password);
  if (!validation.valid) {
    throw new Error(validation.errors[0] || "Password does not meet security criteria.");
  }

  if (shouldUseMockData()) {
    const db = getMockDb();

    // Check duplicate email (case-insensitive)
    const existing = db.users.find((u) => u.email.toLowerCase() === emailNorm);
    if (existing) {
      throw new Error(`An account with email "${emailNorm}" already exists.`);
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(input.password, salt);

    const now = new Date().toISOString();
    const newCustId = `cust-${Date.now()}`;
    const newUserId = `usr-cust-${Date.now()}`;

    // Create linked Customer record
    const customer: Customer = {
      id: newCustId,
      name: input.name?.trim() || emailNorm.split("@")[0],
      email: emailNorm,
      company: input.company?.trim() || `${input.name || "Customer"} Enterprises`,
      createdAt: now,
    };

    // Create User record
    const userRecord = {
      id: newUserId,
      email: emailNorm,
      name: customer.name,
      role: "customer" as UserRole,
      passwordHash,
      customerId: newCustId,
      status: "active" as const,
      createdAt: now,
    };

    db.users.push(userRecord);
    db.store.customers.push(customer);
    saveMockDb(db);

    const authUser: AuthUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      customerId: userRecord.customerId,
    };

    setSessionCookies(authUser);
    return { user: authUser, customer };
  }

  // // TODO: Supabase implementation
  // const { data, error } = await supabase.auth.signUp({
  //   email: emailNorm,
  //   password: input.password,
  //   options: { data: { name: input.name, company: input.company, role: 'customer' } }
  // });
  throw new Error("Live Supabase signup not configured. Set USE_MOCK_DATA=true.");
}

// ============================================================================
// 2. LOGIN
// ============================================================================

export interface LoginInput {
  email: string;
  password: string;
}

export async function login(input: LoginInput): Promise<AuthUser> {
  const emailNorm = (input.email || "").trim().toLowerCase();
  const rateLimitKey = `login:${emailNorm}`;

  // Check rate limit
  const rateLimit = checkRateLimit(rateLimitKey);
  if (!rateLimit.allowed) {
    throw new Error(
      `Too many failed attempts. Account temporarily locked. Please try again in ${rateLimit.retryAfterSeconds} seconds.`
    );
  }

  if (shouldUseMockData()) {
    const db = getMockDb();
    const user = db.users.find((u) => u.email.toLowerCase() === emailNorm);

    if (!user) {
      recordFailedLogin(rateLimitKey);
      throw new Error("Invalid email or password.");
    }

    if (user.status === "inactive") {
      throw new Error("Your account has been deactivated. Please contact support.");
    }

    const matches = bcrypt.compareSync(input.password, user.passwordHash);
    if (!matches) {
      recordFailedLogin(rateLimitKey);
      throw new Error("Invalid email or password.");
    }

    // Success
    recordSuccessfulLogin(rateLimitKey);
    user.lastLoginAt = new Date().toISOString();
    saveMockDb(db);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      customerId: user.customerId,
    };

    setSessionCookies(authUser);
    return authUser;
  }

  // // TODO: Supabase implementation
  // const { data, error } = await supabase.auth.signInWithPassword({ email: emailNorm, password: input.password });
  throw new Error("Live Supabase login not configured. Set USE_MOCK_DATA=true.");
}

// ============================================================================
// 3. LOGOUT
// ============================================================================

export async function logout(): Promise<void> {
  if (shouldUseMockData()) {
    clearSessionCookies();
    return;
  }

  // // TODO: Supabase implementation
  // await supabase.auth.signOut();
  clearSessionCookies();
}

// ============================================================================
// 4. FORGOT PASSWORD (RESET REQUEST)
// ============================================================================

export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; message: string; devMailboxUrl?: string; token?: string }> {
  const emailNorm = (email || "").trim().toLowerCase();
  if (!emailNorm) throw new Error("Email is required.");

  if (shouldUseMockData()) {
    const db = getMockDb();
    const user = db.users.find((u) => u.email.toLowerCase() === emailNorm);

    // In production security, return a neutral message even if user not found
    if (!user) {
      return {
        success: true,
        message: "If that email address is registered, a password reset link has been dispatched.",
      };
    }

    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
    const now = new Date().toISOString();

    db.tokens.push({
      id: `tok-${Date.now()}`,
      email: emailNorm,
      token,
      expiresAt,
      used: false,
      createdAt: now,
    });

    const resetUrl = `/reset-password?token=${token}`;

    db.emails.unshift({
      id: `eml-${Date.now()}`,
      to: emailNorm,
      subject: "Reset your Brightloop password",
      body: `Hello ${user.name},\n\nA password reset request was received for your Brightloop account. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 30 minutes. If you did not request this, please ignore this email.`,
      resetUrl,
      createdAt: now,
    });

    saveMockDb(db);
    console.log(`[DevMailbox] ✉️ Sent reset email to ${emailNorm}: ${resetUrl}`);

    return {
      success: true,
      message: "If that email address is registered, a password reset link has been dispatched.",
      devMailboxUrl: "/dev-mailbox",
      token,
    };
  }

  // // TODO: Supabase implementation
  // await supabase.auth.resetPasswordForEmail(emailNorm, { redirectTo: `${origin}/reset-password` });
  return { success: true, message: "Reset email sent." };
}

// ============================================================================
// 5. RESET PASSWORD (WITH TOKEN)
// ============================================================================

export async function resetPassword(token: string, newPassword: string): Promise<{ success: boolean }> {
  if (!token) throw new Error("Reset token is required.");

  const validation = validatePassword(newPassword);
  if (!validation.valid) {
    throw new Error(validation.errors[0] || "New password does not meet security criteria.");
  }

  if (shouldUseMockData()) {
    const db = getMockDb();
    const tokenRecord = db.tokens.find((t) => t.token === token);

    if (!tokenRecord) {
      throw new Error("Invalid or unrecognized password reset link.");
    }

    if (tokenRecord.used) {
      throw new Error("This password reset link has already been used. Please request a new one.");
    }

    if (new Date(tokenRecord.expiresAt).getTime() < Date.now()) {
      throw new Error("This password reset link has expired (links are valid for 30 minutes).");
    }

    const user = db.users.find((u) => u.email.toLowerCase() === tokenRecord.email.toLowerCase());
    if (!user) {
      throw new Error("User associated with this reset link no longer exists.");
    }

    const salt = bcrypt.genSaltSync(10);
    user.passwordHash = bcrypt.hashSync(newPassword, salt);
    tokenRecord.used = true; // Mark as single-use
    saveMockDb(db);

    return { success: true };
  }

  // // TODO: Supabase implementation
  // await supabase.auth.updateUser({ password: newPassword });
  return { success: true };
}
