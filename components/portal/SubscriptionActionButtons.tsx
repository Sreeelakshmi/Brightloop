"use client";

import * as React from "react";
import { Subscription } from "@/types";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui-shared";
import { RotateCw, PauseCircle, XCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  handleRenewSubscription,
  handlePauseSubscription,
  handleCloseEarlySubscription,
} from "@/app/actions/billing-actions";
import { useRouter } from "next/navigation";

interface SubscriptionActionButtonsProps {
  subscription: Subscription;
}

export function SubscriptionActionButtons({
  subscription,
}: SubscriptionActionButtonsProps) {
  const router = useRouter();
  const plan = subscription.plan;
  const isRenewable = Boolean(plan?.renewable);
  const isPausable = Boolean(plan?.pausable);
  const isClosable = Boolean(plan?.closableEarly || plan?.closable);

  const [toastMessage, setToastMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [pauseDialogOpen, setPauseDialogOpen] = React.useState(false);
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4500);
  };

  const handleRenew = async () => {
    setLoading(true);
    const res = await handleRenewSubscription(subscription.id);
    setLoading(false);
    if (res.success) {
      showToast(`✓ Contract extended through ${res.subscription?.endDate}`);
      router.refresh();
    } else {
      showError(res.error || "Failed to renew subscription");
    }
  };

  const handlePause = async () => {
    setLoading(true);
    const res = await handlePauseSubscription(subscription.id);
    setLoading(false);
    if (res.success) {
      showToast(`✓ Subscription ${res.subscription?.paused ? "paused" : "resumed"} successfully`);
      router.refresh();
    } else {
      showError(res.error || "Failed to pause subscription");
    }
  };

  const handleClose = async () => {
    setLoading(true);
    const res = await handleCloseEarlySubscription(subscription.id);
    setLoading(false);
    if (res.success) {
      showToast(`✓ Subscription ${subscription.subscriptionNumber} closed`);
      router.refresh();
    } else {
      showError(res.error || "Failed to close subscription");
    }
  };

  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none space-y-4 font-mono">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2B302B] text-white text-xs px-4 py-3 rounded-[3px] shadow-xl border border-[#8A968A]/40 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-[#F57B4A]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-red-800 text-white text-xs px-4 py-3 rounded-[3px] shadow-xl border border-red-500 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <AlertTriangle className="w-4 h-4 text-white" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center justify-between pb-2 border-b border-[#B9CBB9]">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#8A968A]">
          CONTRACT ACTIONS // PERMITTED OPERATIONS
        </div>
        <span className="text-[10px] text-[#8A968A]">
          Plan: {plan?.name || "Standard Tier"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        {/* 1. RENEW BUTTON */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            disabled={!isRenewable || loading}
            onClick={handleRenew}
            className={`h-9 px-4 text-xs font-bold uppercase tracking-wider gap-1.5 rounded-[2px] transition-all ${
              isRenewable
                ? "bg-[#F57B4A] hover:bg-[#e06b3c] text-white border-none shadow-none"
                : "bg-[#D3E3D3]/40 text-[#8A968A] cursor-not-allowed border border-[#B9CBB9]"
            }`}
          >
            <RotateCw className="w-3.5 h-3.5" />
            Renew Subscription
          </Button>
          {!isRenewable && (
            <span className="text-[10px] text-[#8A968A]">
              Manual renewal unavailable on this plan
            </span>
          )}
        </div>

        {/* 2. PAUSE BUTTON (with ConfirmDialog) */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            disabled={!isPausable || loading}
            onClick={() => setPauseDialogOpen(true)}
            variant="outline"
            className={`h-9 px-4 text-xs font-bold uppercase tracking-wider gap-1.5 rounded-[2px] border-[1.5px] ${
              isPausable
                ? "border-[#B9CBB9] text-[#2B302B] hover:bg-[#D3E3D3]/50 hover:border-[#2B302B]"
                : "border-[#B9CBB9]/60 text-[#8A968A] cursor-not-allowed bg-[#D3E3D3]/20"
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5" />
            {subscription.paused ? "Resume Subscription" : "Pause Subscription"}
          </Button>
          {!isPausable && (
            <span className="text-[10px] text-[#8A968A]">
              Pause not permitted on this plan tier
            </span>
          )}
        </div>

        {/* 3. CLOSE BUTTON (Destructive action with ConfirmDialog) */}
        <div className="flex flex-col gap-1">
          <Button
            type="button"
            disabled={!isClosable || loading}
            onClick={() => setCloseDialogOpen(true)}
            variant="outline"
            className={`h-9 px-4 text-xs font-bold uppercase tracking-wider gap-1.5 rounded-[2px] border-[1.5px] ${
              isClosable
                ? "border-[#B9CBB9] text-[#2B302B] hover:text-[#F57B4A] hover:border-[#F57B4A] hover:bg-[#F57B4A]/10"
                : "border-[#B9CBB9]/60 text-[#8A968A] cursor-not-allowed bg-[#D3E3D3]/20"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Close Subscription
          </Button>
          {!isClosable && (
            <span className="text-[10px] text-[#8A968A]">
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
        description={`Are you sure you want to toggle pause for ${subscription.subscriptionNumber}? Services will remain active until the current billing cycle ends.`}
        confirmLabel="Confirm Action"
        cancelLabel="Keep Active"
        variant="charcoal"
        onConfirm={handlePause}
      />

      {/* Confirmation Dialog for CLOSE action */}
      <ConfirmDialog
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        title="TERMINATE SUBSCRIPTION CONTRACT"
        description={`This action will close ${subscription.subscriptionNumber} (${subscription.plan?.name || "Plan"}). Are you sure?`}
        confirmLabel="Confirm Closure"
        cancelLabel="Abort"
        variant="orange"
        onConfirm={handleClose}
      />
    </div>
  );
}
