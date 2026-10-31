import { requireAuth } from "@/lib/auth";
import { AdminShell } from "@/components/layout/AdminShell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth(["admin", "staff"]);
  return <AdminShell user={user}>{children}</AdminShell>;
}

