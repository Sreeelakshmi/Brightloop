"use client";

import React from "react";
import { getStatusPillClasses } from "./theme";
import type { SubscriptionStatus } from "@/types/subscription";

interface StatusBadgeProps {
  status: SubscriptionStatus;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const pillClasses = getStatusPillClasses(status);
  return (
    <span className={`${pillClasses} ${className}`.trim()}>
      {status}
    </span>
  );
}
