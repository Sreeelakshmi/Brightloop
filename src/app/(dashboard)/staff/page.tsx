import { requireRole } from "@/lib/auth/session";
import { PlaceholderModule } from "@/components/shared/placeholder-module";

export const metadata = {
  title: "Staff Management — Brightloop",
  description: "Team member roles, access permissions, and staff directory",
};

export default async function StaffPage() {
  // Server-side RBAC guard: Admin and Staff only
  await requireRole(["admin", "staff"]);

  return (
    <PlaceholderModule
      title="Staff & Role Management"
      description="Manage internal team members, assign role-based permissions (RBAC), and manage invites."
      assignedMember="Member 1 — Admin & Backend"
      branch="feature/admin-backend"
      plannedFeatures={[
        "Staff member roster with assigned roles (Admin, Staff, Support)",
        "Invite new team members via Supabase Auth invitations",
        "Granular permission matrix for billing and subscription modifications",
        "Staff activity audit logs and status toggles",
      ]}
    />
  );
}
