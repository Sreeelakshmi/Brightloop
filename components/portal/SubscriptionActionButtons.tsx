"use client";

import * as React from "react";
import { Subscription } from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui-shared";
import { RotateCw, PauseCircle, XCircle, CheckCircle2 } from "lucide-react";

interface SubscriptionActionButtonsProps {
  subscription: Subscription;
}

export function SubscriptionActionButtons({
  subscription,
}: SubscriptionActionButtonsProps) {
  const plan = subscription.plan;
  const isRenewable = plan?.renewable !== false;
  const isPausable = Boolean(plan?.pausable);
  const isClosable = plan?.closable !== false;

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [pauseDialogOpen, setPauseDialogOpen] = React.useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // =========================================================================
  // TODO: Member 2 / Subscription Lifecycle Lead
  // Connect these actions to Member 2's backend subscription transition API
  // =========================================================================

  const handleRenew = async () => {
    // TODO: Member 2 Service Call - POST /api/subscriptions/:id/renew
    // await member2SubscriptionService.renew(subscription.id);
    showToast(`✓ Renewal request queued for ${subscription.subscriptionNumber}`);
  };

  const handlePause = async () => {
    // TODO: Member 2 Service Call - POST /api/subscriptions/:id/pause
    // await member2SubscriptionService.pause(subscription.id);
    showToast(`✓ Subscription ${subscription.subscriptionNumber} paused successfully`);
  };

  const handleClose = async () => {
    // TODO: Member 2 Service Call - POST /api/subscriptions/:id/close
    // await member2SubscriptionService.close(subscription.id);
    showToast(`✓ Subscription ${subscription.subscriptionNumber} marked for closure`);
  };

  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none space-y-4">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2B302B] text-white text-xs px-4 py-3 rounded-[3px] font-mono shadow-xl border border-[#8A968A]/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#F57B4A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between pb-2 border-b border-[#B9CBB9]">
        <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A]">
          CONTRACT ACTIONS // PERMITTED OPERATIONS
        </div>
        <span className="text-[10px] font-mono text-[#8A968A]">
          Plan: {plan?.name || "Standard Tier"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* 1. RENEW BUTTON */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            disabled={!isRenewable}
            onClick={handleRenew}
            className={`h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider gap-1.5 rounded-[2px] transition-all ${
              isRenewable
                ? "bg-[#F57B4A] hover:bg-[#e06b3c] text-white border-none shadow-none"
                : "bg-[#D3E3D3]/40 text-[#8A968A] cursor-not-allowed border border-[#B9CBB9]"
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Renew Subscription
          </Button>
          {!isRenewable && (
            <span className="text-[10px] font-mono text-[#8A968A]">
              Manual renewal unavailable on this plan
            </span>
          )}
        </div>

        {/* 2. PAUSE BUTTON (with ConfirmDialog) */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            disabled={!isPausable}
            onClick={() => setPauseDialogOpen(true)}
            variant="outline"
            className={`h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider gap-1.5 rounded-[2px] border-[1.5px] ${
              isPausable
                ? "border-[#B9CBB9] text-[#2B302B] hover:bg-[#D3E3D3]/50 hover:border-[#2B302B]"
                : "border-[#B9CBB9]/60 text-[#8A968A] cursor-not-allowed bg-[#D3E3D3]/20"
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            Pause Subscription
          </Button>
          {!isPausable && (
            <span className="text-[10px] font-mono text-[#8A968A]">
              Pause not permitted on this plan tier
            </span>
          )}
        </div>

        {/* 3. CLOSE BUTTON (Destructive action with ConfirmDialog) */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            disabled={!isClosable}
            onClick={() => setCloseDialogOpen(true)}
            variant="outline"
            className={`h-9 px-4 text-xs font-mono font-bold uppercase tracking-wider gap-1.5 rounded-[2px] border-[1.5px] ${
              isClosable
                ? "border-[#B9CBB9] text-[#2B302B] hover:text-[#F57B4A] hover:border-[#F57B4A] hover:bg-[#F57B4A]/10"
                : "border-[#B9CBB9]/60 text-[#8A968A] cursor-not-allowed bg-[#D3E3D3]/20"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Close Subscription
          </Button>
          {!isClosable && (
            <span className="text-[10px] font-mono text-[#8A968A]">
              Contract term requires completion
            </span>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for PAUSE action */}
      <ConfirmDialog
        open={pauseDialogOpen}
        onOpenChange={setPauseDialogOpen}
        title="PAUSE RECURRING BILLING"
        description={`Are you sure you want to pause billing for ${subscription.subscriptionNumber}? Services will remain active until the current billing cycle ends.`}
        confirmLabel="Confirm Pause"
        cancelLabel="Keep Active"
        variant="charcoal"
        onConfirm={handlePause}
      />

      {/* Confirmation Dialog for CLOSE action */}
      <ConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title="TERMINATE SUBSCRIPTION CONTRACT"
        description={`This action will close ${subscription.subscriptionNumber} (${subscription.plan?.name || "Plan"}). Service access will terminate immediately upon contract conclusion. Are you sure?`}
        confirmLabel="Confirm Closure"
        cancelLabel="Abort"
        variant="orange"
        onConfirm={handleClose}
      />
    </div>
  );
}
