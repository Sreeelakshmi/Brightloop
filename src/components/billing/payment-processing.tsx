"use client";

import React, { useEffect, useState } from "react";
import { Loader2, ShieldCheck, Cpu } from "lucide-react";
import { formatINR } from "@/lib/billing/math";

interface PaymentProcessingProps {
  amountRupees: number;
  paymentMethod: string;
  isSimulatingFailure?: boolean;
}

export function PaymentProcessing({
  amountRupees,
  paymentMethod,
  isSimulatingFailure,
}: PaymentProcessingProps) {
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    "Establishing secure TLS channel with Brightloop test node...",
    `Initiating simulated ${paymentMethod.replace("_", " ").toUpperCase()} handshake...`,
    isSimulatingFailure
      ? "Simulating bank network decline response..."
      : "Verifying simulated bank authorization...",
    "Finalizing ledger update and generating demo receipt...",
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setStepIndex(1), 600);
    const timer2 = setTimeout(() => setStepIndex(2), 1200);
    const timer3 = setTimeout(() => setStepIndex(3), 1700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isSimulatingFailure]);

  const methodLabel = paymentMethod.replace("_", " ").toUpperCase();

  return (
    <div className="py-10 px-4 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in duration-300">
      {/* Animated Gateway Pulse */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        </div>
        <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-background border border-border shadow-sm">
          <Cpu className="w-4 h-4 text-primary" />
        </div>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <h4 className="text-lg font-semibold tracking-tight">
          Processing {methodLabel} Payment
        </h4>
        <p className="text-2xl font-black text-foreground">
          {formatINR(Math.round(amountRupees * 100))}
        </p>
        <p className="text-xs text-muted-foreground transition-all duration-300 min-h-[1.5rem] font-medium">
          {steps[stepIndex]}
        </p>
      </div>

      {/* Demo Warning Banner */}
      <div className="w-full max-w-xs p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2 text-left">
        <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span>
          <strong>DEMO SIMULATION:</strong> Safe sandbox environment. No real funds or banking credentials are used.
        </span>
      </div>
    </div>
  );
}

