import bcrypt from "bcryptjs";
import { UserRole } from "@/lib/auth";

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  customerId?: string;
  status: "active" | "inactive";
  createdAt: string;
  lastLoginAt?: string;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: string; // ISO date
  used: boolean;
  createdAt: string;
}

export interface DevEmail {
  id: string;
  to: string;
  subject: string;
  body: string;
  resetUrl?: string;
  createdAt: string;
}

/**
 * Realistic Default Passwords for Seed Users
 * All satisfy: > 8 chars, 1 uppercase, 1 lowercase, 1 special character
 *
 * Admin:    Admin@Bright2026!
 * Staff:    Staff@Bright2026!
 * Customer: Cust@Bright2026!
 */
export const SEED_CREDENTIALS = {
  admin: {
    email: "admin@brightloop.io",
    password: "Admin@Bright2026!",
    name: "Alex V.",
    role: "admin" as const,
  },
  staff: [
    {
      email: "operations@brightloop.io",
      password: "Staff@Bright2026!",
      name: "Elena R.",
      role: "staff" as const,
    },
    {
      email: "support@brightloop.io",
      password: "Staff@Bright2026!",
      name: "Vikram S.",
      role: "staff" as const,
    },
    {
      email: "sales@brightloop.io",
      password: "Staff@Bright2026!",
      name: "Ananya M.",
      role: "staff" as const,
    },
  ],
  customers: [
    {
      email: "billing@aerogroup.com",
      password: "Cust@Bright2026!",
      name: "AeroGroup Billing",
      customerId: "cust-001",
      role: "customer" as const,
    },
    {
      email: "accounts@nexuslogistics.in",
      password: "Cust@Bright2026!",
      name: "Nexus Logistics Accounts",
      customerId: "cust-002",
      role: "customer" as const,
    },
    {
      email: "finance@starlightmedia.co",
      password: "Cust@Bright2026!",
      name: "Starlight Media Finance",
      customerId: "cust-003",
      role: "customer" as const,
    },
    {
      email: "pay@tatanex.com",
      password: "Cust@Bright2026!",
      name: "TataNex Procurement",
      customerId: "cust-004",
      role: "customer" as const,
    },
    {
      email: "invoicing@mahindratech.in",
      password: "Cust@Bright2026!",
      name: "Mahindra Tech Invoicing",
      customerId: "cust-005",
      role: "customer" as const,
    },
  ],
};

export function generateSeedUsers(): MockUser[] {
  const salt = bcrypt.genSaltSync(10);
  const now = "2026-10-31T09:00:00.000Z";

  const adminUser: MockUser = {
    id: "usr-admin-01",
    email: SEED_CREDENTIALS.admin.email,
    name: SEED_CREDENTIALS.admin.name,
    role: SEED_CREDENTIALS.admin.role,
    passwordHash: bcrypt.hashSync(SEED_CREDENTIALS.admin.password, salt),
    status: "active",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const staffUsers: MockUser[] = SEED_CREDENTIALS.staff.map((s, idx) => ({
    id: `usr-staff-0${idx + 1}`,
    email: s.email,
    name: s.name,
    role: s.role,
    passwordHash: bcrypt.hashSync(s.password, salt),
    status: "active",
    createdAt: "2026-02-15T00:00:00.000Z",
  }));

  const customerUsers: MockUser[] = SEED_CREDENTIALS.customers.map((c, idx) => ({
    id: `usr-cust-0${idx + 1}`,
    email: c.email,
    name: c.name,
    role: c.role,
    customerId: c.customerId,
    passwordHash: bcrypt.hashSync(c.password, salt),
    status: "active",
    createdAt: now,
  }));

  return [adminUser, ...staffUsers, ...customerUsers];
}

