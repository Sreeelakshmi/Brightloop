import { requireAuth } from "@/lib/auth";
import { PortalHeader } from "@/components/layout/PortalHeader";

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth(["customer"]);

  return (
    <div className="min-h-screen bg-[#E4EEE4] flex flex-col">
      <PortalHeader user={user} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

