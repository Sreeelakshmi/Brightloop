import { listSubscriptions } from "@/lib/services/subscriptions";
import { getCurrentUser } from "@/lib/auth";
import { QuotationsClient } from "@/components/admin/QuotationsClient";

export const dynamic = "force-dynamic";

export default async function QuotationsPage() {
  const user = await getCurrentUser();
  // Fetch quotations and draft subscriptions
  const quotes = await listSubscriptions({ status: "quotation", pageSize: 50 });
  const drafts = await listSubscriptions({ status: "draft", pageSize: 50 });

  const allQuotations = [...quotes.data, ...drafts.data];

  return <QuotationsClient initialQuotations={allQuotations} isAdmin={user?.role === "admin"} />;
}
