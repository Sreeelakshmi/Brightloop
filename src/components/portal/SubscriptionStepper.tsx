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
    <div className="bg-white border border-[#D5DDD2] rounded-xl p-5 shadow-none">
      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#8C9B8E] mb-4">
        LIFECYCLE STATUS // STEPPER
      </div>

      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute left-6 right-6 top-[15px] h-[1.5px] bg-[#D5DDD2] -z-0" />
        <div
          className="absolute left-6 top-[15px] h-[1.5px] bg-[#1F2622] transition-all -z-0"
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
                    isCompleted && "fill-[#1F2622] stroke-[#1F2622]",
                    isCurrent && "fill-[#F27B4B] stroke-[#F27B4B]",
                    isFuture && "fill-white stroke-[#D5DDD2]"
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
                    <span className="text-[#8C9B8E] text-[10px]">{idx + 1}</span>
                  )}
                </div>
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider mt-2 transition-colors",
                  isCurrent
                    ? "text-[#F27B4B]"
                    : isCompleted
                    ? "text-[#1F2622]"
                    : "text-[#8C9B8E]"
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
