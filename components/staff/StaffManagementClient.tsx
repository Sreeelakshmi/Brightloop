"use client";

import React, { useState } from "react";
import type { StaffMember } from "@/lib/services/users";
import { handleCreateStaff, handleToggleStaffStatus } from "@/app/actions/auth-actions";
import { PasswordChecklist } from "@/components/auth/PasswordChecklist";
import { StatusBadge } from "@/components/ui-shared/StatusBadge";
import { ConfirmDialog } from "@/components/ui-shared/ConfirmDialog";
import { UserPlus, Shield, UserX, UserCheck, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { formatDate } from "@/lib/formatters";

interface StaffManagementClientProps {
  initialStaff: StaffMember[];
  currentUserId: string;
}

export function StaffManagementClient({ initialStaff, currentUserId }: StaffManagementClientProps) {
  const [staff, setStaff] = useState<StaffMember[]>(initialStaff);
  const [showAddModal, setShowAddModal] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Status toggle confirmation state
  const [targetToggle, setTargetToggle] = useState<{ member: StaffMember; nextStatus: "active" | "inactive" } | null>(
    null
  );

  async function onAddStaff(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const res = await handleCreateStaff(formData);

    setSubmitting(false);
    if (res?.error) {
      setError(res.error);
    } else if (res?.success) {
      setSuccess("New staff member created successfully.");
      setShowAddModal(false);
      setTempPassword("");
      // Refresh page or update local state
      window.location.reload();
    }
  }

  async function confirmToggleStatus() {
    if (!targetToggle) return;
    const { member, nextStatus } = targetToggle;
    setTargetToggle(null);

    const res = await handleToggleStaffStatus(member.id, nextStatus);
    if (res?.success) {
      setStaff((prev) =>
        prev.map((s) => (s.id === member.id ? { ...s, status: nextStatus } : s))
      );
    } else if (res?.error) {
      setError(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Actions & Alerts */}
      {error && (
        <div className="p-3 bg-[#F57B4A]/10 border border-[#F57B4A] rounded-[2px] flex items-center justify-between text-xs text-[#F57B4A] font-mono">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-[10px] font-bold">DISMISS</button>
        </div>
      )}

      {success && (
        <div className="p-3 bg-[#D3E3D3]/60 border border-[#B9CBB9] rounded-[2px] flex items-center justify-between text-xs text-[#2B302B] font-mono">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
          <button onClick={() => setSuccess(null)} className="text-[10px] font-bold">DISMISS</button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#8A968A] font-mono">
            OPERATIONS WORKFORCE // {staff.length} MEMBERS
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddModal(true);
            setError(null);
          }}
          className="inline-flex items-center gap-2 h-9 px-4 bg-[#2B302B] hover:bg-black text-white text-xs font-mono font-bold uppercase tracking-wider rounded-[2px] transition-colors shadow-none"
        >
          <UserPlus className="w-4 h-4" />
          <span>ADD STAFF MEMBER</span>
        </button>
      </div>

      {/* Permissions Explanation Card */}
      <div className="p-4 bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#2B302B] font-mono uppercase">
          <Info className="w-4 h-4 text-[#F57B4A]" />
          <span>Role-Based Access Control (RBAC) Governance Matrix</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#2B302B] font-mono">
              <span className="w-2 h-2 rounded-[1px] bg-[#2B302B]" />
              ADMINISTRATOR
            </div>
            <p className="text-[11px] text-[#8A968A] leading-relaxed">
              Unrestricted system authority. Sole role permitted to provision staff, configure discount rules, alter system settings, and purge demo telemetry.
            </p>
          </div>

          <div className="p-3 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#2B302B] font-mono">
              <span className="w-2 h-2 rounded-[1px] bg-[#8A968A]" />
              STAFF (OPERATIONS)
            </div>
            <p className="text-[11px] text-[#8A968A] leading-relaxed">
              Full visibility into global dashboard telemetry, customer records, quotations, subscriptions, and invoices. Restricted from workforce management and discount rule creation.
            </p>
          </div>

          <div className="p-3 bg-[#E4EEE4]/50 border border-[#B9CBB9] rounded-[2px] space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-[#2B302B] font-mono">
              <span className="w-2 h-2 rounded-[1px] bg-[#D3E3D3] border border-[#B9CBB9]" />
              CUSTOMER (PORTAL)
            </div>
            <p className="text-[11px] text-[#8A968A] leading-relaxed">
              Strictly scoped to their individual enterprise account. Can view active subscriptions, download billing invoices, and review settled transaction history.
            </p>
          </div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#D3E3D3] border-b-[1.5px] border-[#B9CBB9]">
                <th className="px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  STAFF MEMBER
                </th>
                <th className="px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  EMAIL (LOGIN ID)
                </th>
                <th className="px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  ROLE
                </th>
                <th className="px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  STATUS
                </th>
                <th className="px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  DATE ADDED
                </th>
                <th className="px-4 py-2.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#2B302B] font-mono text-right">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B9CBB9]/60">
              {staff.map((member) => {
                const isSelf = member.id === currentUserId;
                const isAdmin = member.role === "admin";

                return (
                  <tr key={member.id} className="hover:bg-[#E4EEE4]/40 transition-colors">
                    <td className="px-4 py-3 text-xs font-bold text-[#2B302B]">
                      {member.name}
                      {isSelf && (
                        <span className="ml-2 text-[9px] font-mono text-[#8A968A] uppercase font-normal">
                          (YOU)
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[#8A968A]">
                      {member.email}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-[2px] ${
                          isAdmin ? "bg-[#2B302B] text-white" : "bg-[#D3E3D3] text-[#2B302B] border border-[#B9CBB9]"
                        }`}
                      >
                        {member.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <StatusBadge
                        status={member.status === "active" ? "active" : "closed"}
                        label={member.status.toUpperCase()}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-mono text-[#8A968A]">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-xs text-right">
                      {isAdmin ? (
                        <span className="text-[10px] font-mono text-[#8A968A] italic">PROTECTED</span>
                      ) : member.status === "active" ? (
                        <button
                          type="button"
                          onClick={() => setTargetToggle({ member, nextStatus: "inactive" })}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#F57B4A] hover:underline"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>DEACTIVATE</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTargetToggle({ member, nextStatus: "active" })}
                          className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-[#2B302B] hover:underline"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>REACTIVATE</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-[#2B302B]/60 flex items-center justify-center p-4">
          <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] max-w-md w-full overflow-hidden shadow-none font-sans">
            <div className="bg-[#2B302B] text-white px-5 py-3 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-widest font-mono">
                PROVISION NEW STAFF CREDENTIALS
              </span>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white hover:text-[#F57B4A] text-xs font-bold font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={onAddStaff} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  Full Name
                </label>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Kavita Rao"
                  className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  Email Address (Login ID)
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="kavita@brightloop.io"
                  className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-[#2B302B] font-mono">
                  Temporary Password
                </label>
                <input
                  name="temporaryPassword"
                  type="password"
                  required
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full h-9 px-3 text-xs bg-white border border-[#B9CBB9] rounded-[2px] text-[#2B302B] focus:border-[#2B302B] focus:outline-none font-mono"
                />
              </div>

              <PasswordChecklist password={tempPassword} />

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 px-3 border border-[#B9CBB9] bg-white hover:bg-[#D3E3D3]/60 text-xs font-mono font-bold text-[#2B302B] rounded-[2px]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-8 px-4 bg-[#2B302B] hover:bg-black text-white text-xs font-mono font-bold uppercase rounded-[2px] transition-colors disabled:opacity-50"
                >
                  {submitting ? "PROVISIONING..." : "PROVISION STAFF"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={targetToggle !== null}
        onOpenChange={(open) => {
          if (!open) setTargetToggle(null);
        }}
        title={`${targetToggle?.nextStatus === "inactive" ? "Deactivate" : "Reactivate"} Staff Member?`}
        description={`Are you sure you want to ${
          targetToggle?.nextStatus === "inactive" ? "deactivate" : "reactivate"
        } ${targetToggle?.member.name} (${targetToggle?.member.email})? ${
          targetToggle?.nextStatus === "inactive"
            ? "They will immediately lose access to all operational dashboards."
            : "Their login credentials will be reinstated immediately."
        }`}
        confirmLabel={targetToggle?.nextStatus === "inactive" ? "DEACTIVATE" : "REACTIVATE"}
        variant={targetToggle?.nextStatus === "inactive" ? "orange" : "charcoal"}
        onConfirm={confirmToggleStatus}
      />
    </div>
  );
}
