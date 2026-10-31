import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function StaffPage() {
  return (
    <PlaceholderModule
      title="Staff & Role Management"
      description="Manage internal team members, assign role-based permissions (RBAC), and manage invites."
      assignedMember="Member 1 — Admin & Backend"
      branch="feature/admin-backend"
      plannedFeatures={[
        "Staff member roster with assigned roles (Owner, Admin, Finance, Support)",
        "Invite new team members via Supabase Auth invitations",
        "Granular permission matrix for billing and subscription modifications",
        "Staff activity audit logs and status toggles",
      ]}
    />
  );
}
