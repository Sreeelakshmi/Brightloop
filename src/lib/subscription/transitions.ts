/**
 * Brightloop Subscription Lifecycle Transition Rules
 *
 * NOTE: The PostgreSQL function `change_subscription_status` is the REAL authoritative
 * enforcer of valid lifecycle transitions and plan capabilities inside an atomic
 * transaction with row-level locks.
 *
 * These client/application helpers are strictly used for UI state evaluation,
 * deciding which action buttons to render, and client-side guards.
 */

import type { SubscriptionStatus } from "@/types/subscription";

export const ALLOWED_TRANSITIONS: Record<
  SubscriptionStatus,
  readonly SubscriptionStatus[]
> = {
  draft: ["quotation"],
  quotation: ["confirmed", "draft"],
  confirmed: ["active"],
  active: ["closed", "paused"],
  paused: ["active", "closed"],
  closed: [],
};

/**
 * Checks whether moving from `fromStatus` to `toStatus` is syntactically permitted
 * by the state machine matrix.
 */
export function canTransition(
  fromStatus: SubscriptionStatus,
  toStatus: SubscriptionStatus
): boolean {
  const allowed = ALLOWED_TRANSITIONS[fromStatus];
  if (!allowed) return false;
  return allowed.includes(toStatus);
}

export interface PlanTransitionCapabilities {
  pausable?: boolean;
  closable?: boolean;
}

/**
 * Returns the list of next statuses reachable from the current status,
 * taking into account plan capability flags (pausable, closable).
 */
export function getAllowedTransitions(
  status: SubscriptionStatus,
  plan?: PlanTransitionCapabilities | null
): SubscriptionStatus[] {
  const baseAllowed = ALLOWED_TRANSITIONS[status] ?? [];

  return baseAllowed.filter((nextStatus) => {
    if (nextStatus === "paused") {
      // If plan specifies pausable = false, exclude pause
      if (plan && plan.pausable === false) {
        return false;
      }
    }

    if (nextStatus === "closed") {
      // If closing from active or paused and plan specifies closable = false, exclude close
      if ((status === "active" || status === "paused") && plan && plan.closable === false) {
        return false;
      }
    }

    return true;
  });
}

