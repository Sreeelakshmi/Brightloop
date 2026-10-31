import { describe, it, expect, beforeEach } from "vitest";
import {
  validatePassword,
  signup,
  login,
  requestPasswordReset,
  resetPassword,
} from "@/lib/services/auth";
import {
  requireRole,
  listStaff,
  createStaff,
  updateStaffStatus,
} from "@/lib/services/users";
import { resetMockDb, getMockDb } from "@/lib/mock/db";
import { AuthUser } from "@/lib/auth";

describe("Part 1: Authentication, Password Rules & Security Engine", () => {
  beforeEach(() => {
    resetMockDb();
  });

  // ==========================================================================
  // 1. PASSWORD COMPLEXITY VALIDATOR
  // ==========================================================================
  describe("Password Policy (Length > 8, Upper, Lower, Special)", () => {
    it("rejects passwords with 8 or fewer characters", () => {
      const res = validatePassword("Abc!123"); // 7 chars
      expect(res.valid).toBe(false);
      expect(res.checks.minLength).toBe(false);
      expect(res.errors).toContain("Password must be more than 8 characters");

      const res8 = validatePassword("Abcdef!1"); // exactly 8 chars
      expect(res8.valid).toBe(false);
      expect(res8.checks.minLength).toBe(false);
    });

    it("rejects passwords missing an uppercase character", () => {
      const res = validatePassword("password@123");
      expect(res.valid).toBe(false);
      expect(res.checks.uppercase).toBe(false);
      expect(res.errors.some((e) => e.includes("uppercase"))).toBe(true);
    });

    it("rejects passwords missing a lowercase character", () => {
      const res = validatePassword("PASSWORD@123");
      expect(res.valid).toBe(false);
      expect(res.checks.lowercase).toBe(false);
      expect(res.errors.some((e) => e.includes("lowercase"))).toBe(true);
    });

    it("rejects passwords missing a special character", () => {
      const res = validatePassword("Password12345");
      expect(res.valid).toBe(false);
      expect(res.checks.specialChar).toBe(false);
      expect(res.errors.some((e) => e.includes("special character"))).toBe(true);
    });

    it("accepts valid passwords meeting all 4 criteria", () => {
      const res = validatePassword("Admin@Bright2026!");
      expect(res.valid).toBe(true);
      expect(res.errors.length).toBe(0);
      expect(res.checks.minLength).toBe(true);
      expect(res.checks.uppercase).toBe(true);
      expect(res.checks.lowercase).toBe(true);
      expect(res.checks.specialChar).toBe(true);
    });
  });

  // ==========================================================================
  // 2. SIGNUP WORKFLOW
  // ==========================================================================
  describe("Signup Service & Customer Provisioning", () => {
    it("provisions new customer and creates linked customer record", async () => {
      const res = await signup({
        email: "founder@newstartup.in",
        password: "Startup@Launch2026!",
        name: "Dev Sharma",
        company: "New Startup Tech",
      });

      expect(res.user.role).toBe("customer");
      expect(res.user.email).toBe("founder@newstartup.in");
      expect(res.customer.id).toBeDefined();
      expect(res.customer.company).toBe("New Startup Tech");
      expect(res.user.customerId).toBe(res.customer.id);
    });

    it("rejects duplicate email case-insensitively", async () => {
      await signup({
        email: "duplicate@domain.com",
        password: "Pass@Valid2026!",
      });

      // Attempt signup with uppercase variant
      await expect(
        signup({
          email: "DUPLICATE@Domain.com",
          password: "Pass@Valid2026!",
        })
      ).rejects.toThrow(/already exists/i);
    });

    it("rejects weak password on signup", async () => {
      await expect(
        signup({
          email: "weak@domain.com",
          password: "simplepassword",
        })
      ).rejects.toThrow(/Password must/i);
    });
  });

  // ==========================================================================
  // 3. LOGIN & RATE LIMITING
  // ==========================================================================
  describe("Login Authentication & Rate Limiting", () => {
    it("authenticates valid seed admin credentials", async () => {
      const user = await login({
        email: "admin@brightloop.io",
        password: "Admin@Bright2026!",
      });

      expect(user.role).toBe("admin");
      expect(user.name).toBe("Alex V.");
    });

    it("authenticates valid seed staff credentials", async () => {
      const user = await login({
        email: "operations@brightloop.io",
        password: "Staff@Bright2026!",
      });

      expect(user.role).toBe("staff");
      expect(user.name).toBe("Elena R.");
    });

    it("rejects incorrect password", async () => {
      await expect(
        login({
          email: "admin@brightloop.io",
          password: "WrongPassword@999",
        })
      ).rejects.toThrow(/Invalid email or password/i);
    });

    it("rejects deactivated staff account", async () => {
      const db = getMockDb();
      const staffUser = db.users.find((u) => u.email === "operations@brightloop.io");
      expect(staffUser).toBeDefined();
      staffUser!.status = "inactive";

      await expect(
        login({
          email: "operations@brightloop.io",
          password: "Staff@Bright2026!",
        })
      ).rejects.toThrow(/deactivated/i);
    });

    it("locks account after 5 consecutive failed login attempts", async () => {
      const email = "test-rate-limit@brightloop.io";
      // create user
      await signup({
        email,
        password: "Secure@Pass2026!",
      });

      // 4 failed attempts should succeed with invalid creds error
      for (let i = 0; i < 4; i++) {
        await expect(
          login({ email, password: "Incorrect@Password1" })
        ).rejects.toThrow(/Invalid email or password/i);
      }

      // 5th attempt triggers lockout
      await expect(
        login({ email, password: "Incorrect@Password1" })
      ).rejects.toThrow(/Invalid email or password/i);

      // 6th attempt should be blocked by rate limiter with countdown
      await expect(
        login({ email, password: "Secure@Pass2026!" })
      ).rejects.toThrow(/Too many failed attempts.*locked/i);
    });
  });

  // ==========================================================================
  // 4. FORGOT / RESET PASSWORD WORKFLOW
  // ==========================================================================
  describe("Forgot / Reset Password Lifecycle", () => {
    it("generates expiring token and logs email to dev mailbox", async () => {
      const req = await requestPasswordReset("admin@brightloop.io");
      expect(req.success).toBe(true);
      expect(req.token).toBeDefined();

      const db = getMockDb();
      expect(db.emails.length).toBeGreaterThan(0);
      expect(db.emails[0].to).toBe("admin@brightloop.io");
      expect(db.emails[0].resetUrl).toContain(req.token!);
    });

    it("resets password successfully with valid token and invalidates token (single-use)", async () => {
      const req = await requestPasswordReset("admin@brightloop.io");
      const token = req.token!;

      const resetRes = await resetPassword(token, "NewAdmin@Secret2026!");
      expect(resetRes.success).toBe(true);

      // Second attempt with same token must fail (single-use)
      await expect(
        resetPassword(token, "AnotherAdmin@Secret2026!")
      ).rejects.toThrow(/already been used/i);

      // Log in with new password
      const user = await login({
        email: "admin@brightloop.io",
        password: "NewAdmin@Secret2026!",
      });
      expect(user.email).toBe("admin@brightloop.io");
    });

    it("rejects expired reset token", async () => {
      const req = await requestPasswordReset("admin@brightloop.io");
      const token = req.token!;

      // Manually expire token
      const db = getMockDb();
      const tokenObj = db.tokens.find((t) => t.token === token);
      tokenObj!.expiresAt = new Date(Date.now() - 1000).toISOString();

      await expect(
        resetPassword(token, "NewAdmin@Secret2026!")
      ).rejects.toThrow(/expired/i);
    });
  });

  // ==========================================================================
  // 5. RBAC & STAFF MANAGEMENT
  // ==========================================================================
  describe("RBAC & Workforce Management (Admin Only)", () => {
    const adminUser: AuthUser = {
      id: "usr-admin-01",
      email: "admin@brightloop.io",
      name: "Alex V.",
      role: "admin",
    };

    const staffUser: AuthUser = {
      id: "usr-staff-01",
      email: "operations@brightloop.io",
      name: "Elena R.",
      role: "staff",
    };

    const customerUser: AuthUser = {
      id: "usr-cust-01",
      email: "billing@aerogroup.com",
      name: "AeroGroup Billing",
      role: "customer",
      customerId: "cust-001",
    };

    it("requireRole enforces permission gates", async () => {
      // Admin should pass admin check
      await expect(requireRole(["admin"], adminUser)).resolves.toEqual(adminUser);

      // Staff should fail admin check
      await expect(requireRole(["admin"], staffUser)).rejects.toThrow(/Access denied.*STAFF/i);

      // Customer should fail admin check and staff check
      await expect(requireRole(["admin", "staff"], customerUser)).rejects.toThrow(
        /Access denied.*CUSTOMER/i
      );
    });

    it("listStaff allows admin and blocks staff", async () => {
      const staffList = await listStaff(adminUser);
      expect(staffList.length).toBeGreaterThanOrEqual(3);

      await expect(listStaff(staffUser)).rejects.toThrow(/Access denied/i);
    });

    it("createStaff provisions new staff member with valid password", async () => {
      const newStaff = await createStaff(
        {
          name: "Karan Johar",
          email: "karan@brightloop.io",
          temporaryPassword: "Temp@Staff2026!",
        },
        adminUser
      );

      expect(newStaff.role).toBe("staff");
      expect(newStaff.status).toBe("active");

      // Can log in with temporary password
      const loggedIn = await login({
        email: "karan@brightloop.io",
        password: "Temp@Staff2026!",
      });
      expect(loggedIn.role).toBe("staff");
    });

    it("createStaff blocks non-admin callers", async () => {
      await expect(
        createStaff(
          {
            name: "Hacker Staff",
            email: "hacker@brightloop.io",
            temporaryPassword: "Temp@Staff2026!",
          },
          staffUser
        )
      ).rejects.toThrow(/Access denied/i);
    });

    it("updateStaffStatus deactivates and reactivates staff member", async () => {
      const targetStaff = (await listStaff(adminUser)).find((s) => s.role === "staff")!;

      // Deactivate
      const deactivated = await updateStaffStatus(targetStaff.id, "inactive", adminUser);
      expect(deactivated.status).toBe("inactive");

      // Reactivate
      const reactivated = await updateStaffStatus(targetStaff.id, "active", adminUser);
      expect(reactivated.status).toBe("active");
    });

    it("prevents admin from deactivating themselves", async () => {
      await expect(
        updateStaffStatus(adminUser.id, "inactive", adminUser)
      ).rejects.toThrow(/cannot deactivate their own account/i);
    });
  });
});
