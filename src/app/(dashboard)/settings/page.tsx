import { requireRole } from "@/lib/auth/session";
import { PlaceholderModule } from "@/components/shared/placeholder-module";

export const metadata = {
  title: "Settings — Brightloop",
  description: "System & Organization Settings for Brightloop",
};

export default async function SettingsPage() {
  // Server-side RBAC guard: Admin only
  await requireRole(["admin"]);

  return (
    <PlaceholderModule
      title="System & Organization Settings"
      description="Configure workspace details, currency settings, API keys, webhook endpoints, and branding."
      assignedMember="Member 1 — Admin & Backend"
      branch="feature/admin-backend"
      plannedFeatures={[
        "Organization profile and default billing currency",
        "Supabase credentials and service connection statuses",
        "API key generation for external integrations and SDK access",
        "Webhook endpoint configurations for subscription events",
        "Gemini AI model preferences and feature toggles",
      ]}
    />
  );
}
