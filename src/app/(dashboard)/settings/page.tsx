import { PlaceholderModule } from "@/components/shared/placeholder-module";

export default function SettingsPage() {
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
