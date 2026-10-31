"use client";

import * as React from "react";
import { SubscriptionStatus } from "@/types";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const STEPS: { status: SubscriptionStatus; label: string }[] = [
  { status: "draft", label: "DRAFT" },
  { status: "quotation", label: "QUOTATION" },
  { status: "confirmed", label: "CONFIRMED" },
  { status: "active", label: "ACTIVE" },
  { status: "closed", label: "CLOSED" },
];

interface SubscriptionStepperProps {
  currentStatus: SubscriptionStatus;
}

export function SubscriptionStepper({ currentStatus }: SubscriptionStepperProps) {
  const currentIndex = STEPS.findIndex((s) => s.status === currentStatus);
  const normalizedIndex = currentIndex >= 0 ? currentIndex : 3; // Default to active if unknown

  return (
    <div className="bg-white border-[1.5px] border-[#B9CBB9] rounded-[3px] p-5 shadow-none">
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8A968A] mb-4">
        LIFECYCLE STATUS // STEPPER
      </div>

      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute left-6 right-6 top-[15px] h-[1.5px] bg-[#B9CBB9] -z-0" />
        <div
          className="absolute left-6 top-[15px] h-[1.5px] bg-[#2B302B] transition-all -z-0"
          style={{
            width: `${(normalizedIndex / (STEPS.length - 1)) * 100}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isCompleted = idx < normalizedIndex;
          const isCurrent = idx === normalizedIndex;
          const isFuture = idx > normalizedIndex;

          return (
            <div
              key={step.status}
              className="flex flex-col items-center relative z-10 select-none"
            >
              {/* Hexagon Node */}
              <div
                className={cn(
                  "w-8 h-8 flex items-center justify-center transition-all",
                  isCurrent && "animate-pulse"
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={cn(
                    "w-8 h-8 transition-colors",
                    isCompleted && "fill-[#2B302B] stroke-[#2B302B]",
                    isCurrent && "fill-[#F57B4A] stroke-[#F57B4A]",
                    isFuture && "fill-white stroke-[#B9CBB9]"
                  )}
                  strokeWidth="1.5"
                >
                  {/* Hexagon Path */}
                  <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" />
                </svg>

                {/* Content inside hexagon */}
                <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold">
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  ) : (
                    <span className="text-[#8A968A] text-[10px]">{idx + 1}</span>
                  )}
                </div>
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider mt-2 transition-colors",
                  isCurrent
                    ? "text-[#F57B4A]"
                    : isCompleted
                    ? "text-[#2B302B]"
                    : "text-[#8A968A]"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
