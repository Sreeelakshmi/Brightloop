import React from "react";
import { requireAuth } from "@/lib/auth";
import { listStaff } from "@/lib/services/users";
import { PageHeader } from "@/components/ui-shared/PageHeader";
import { StaffManagementClient } from "@/components/staff/StaffManagementClient";

export const dynamic = "force-dynamic";

export default async function StaffPage() {
  // Enforce Admin Only at the route level
  const user = await requireAuth(["admin"]);
  const staff = await listStaff(user);

  return (
    <div className="space-y-6">
      <PageHeader
        title="STAFF MANAGEMENT"
        subtitle="Workforce Administration, Role Assignments & Access Control"
        logDate="31.10.2026"
        showHexagonMark
      />

      <StaffManagementClient initialStaff={staff} currentUserId={user.id} />
    </div>
  );
}
