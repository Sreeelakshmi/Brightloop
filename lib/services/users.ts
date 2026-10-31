import bcrypt from "bcryptjs";
import { AuthUser, getCurrentUser, UserRole } from "@/lib/auth";
import { getMockDb, saveMockDb } from "@/lib/mock/db";
import { shouldUseMockData } from "@/lib/data/dashboard";
import { validatePassword } from "./auth";

/**
 * Universal RBAC Guard
 * Enforces role permissions across services, server actions, and route handlers.
 * Throws an explicit Error with descriptive messages.
 */
export async function requireRole(
  allowedRoles: UserRole[],
  explicitUser?: AuthUser | null
): Promise<AuthUser> {
  const user = explicitUser !== undefined ? explicitUser : await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required. Please log in.");
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `Access denied. Role "${user.role.toUpperCase()}" is not authorized for this operation. Required: ${allowedRoles.join(
        ", "
      )}.`
    );
  }

  return user;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: "staff" | "admin";
  status: "active" | "inactive";
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  temporaryPassword: string;
}

// ============================================================================
// STAFF MANAGEMENT (Admin Only)
// ============================================================================

export async function listStaff(currentUser?: AuthUser | null): Promise<StaffMember[]> {
  await requireRole(["admin"], currentUser);

  if (shouldUseMockData()) {
    const db = getMockDb();
    return db.users
      .filter((u) => u.role === "staff" || u.role === "admin")
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role as "staff" | "admin",
        status: u.status,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      }));
  }

  // // TODO: Supabase implementation
  // const { data, error } = await supabase.from('profiles').select('*').in('role', ['admin', 'staff']);
  return [];
}

export async function createStaff(
  input: CreateStaffInput,
  currentUser?: AuthUser | null
): Promise<StaffMember> {
  // Only Admin can create staff
  await requireRole(["admin"], currentUser);

  const emailNorm = (input.email || "").trim().toLowerCase();
  if (!emailNorm) throw new Error("Staff email is required.");
  if (!input.name?.trim()) throw new Error("Staff name is required.");

  const validation = validatePassword(input.temporaryPassword);
  if (!validation.valid) {
    throw new Error(`Invalid temporary password: ${validation.errors[0]}`);
  }

  if (shouldUseMockData()) {
    const db = getMockDb();
    const existing = db.users.find((u) => u.email.toLowerCase() === emailNorm);
    if (existing) {
      throw new Error(`An account with email "${emailNorm}" already exists.`);
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(input.temporaryPassword, salt);
    const now = new Date().toISOString();

    const newStaff = {
      id: `usr-staff-${Date.now()}`,
      email: emailNorm,
      name: input.name.trim(),
      role: "staff" as const,
      passwordHash,
      status: "active" as const,
      createdAt: now,
    };

    db.users.push(newStaff);
    saveMockDb(db);

    return {
      id: newStaff.id,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      status: newStaff.status,
      createdAt: newStaff.createdAt,
    };
  }

  // // TODO: Supabase implementation
  // const { data, error } = await supabase.auth.admin.createUser({ ... });
  throw new Error("Live Supabase staff creation not configured.");
}

export async function updateStaffStatus(
  staffId: string,
  status: "active" | "inactive",
  currentUser?: AuthUser | null
): Promise<StaffMember> {
  const actor = await requireRole(["admin"], currentUser);

  if (shouldUseMockData()) {
    const db = getMockDb();
    const target = db.users.find((u) => u.id === staffId);

    if (!target) {
      throw new Error("Staff member not found.");
    }

    if (target.id === actor.id) {
      throw new Error("Administrators cannot deactivate their own account.");
    }

    target.status = status;
    saveMockDb(db);

    return {
      id: target.id,
      name: target.name,
      email: target.email,
      role: target.role as "staff" | "admin",
      status: target.status,
      createdAt: target.createdAt,
      lastLoginAt: target.lastLoginAt,
    };
  }

  // // TODO: Supabase implementation
  // await supabase.from('profiles').update({ status }).eq('id', staffId);
  throw new Error("Live Supabase staff status update not configured.");
}

