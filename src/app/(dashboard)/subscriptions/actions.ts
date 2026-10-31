"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/require-user";
import { subscriptionCreateSchema } from "@/lib/validations/subscription";
import {
  changeSubscriptionStatus,
  createSubscriptionDraft,
  createSubscriptionFromTemplate,
  renewSubscription,
} from "@/services/subscriptions.service";
import type { SubscriptionWithDetails } from "@/types/subscription-services";
import type { SubscriptionStatus } from "@/types/subscription";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

const templateSubscriptionInputSchema = z.object({
  templateId: z.string().trim().min(1, "Template is required"),
  customerId: z.string().trim().min(1, "Customer is required"),
  startDate: z.string().trim().min(1, "Start date is required"),
  expiryDate: z.string().trim().min(1, "Expiry date is required"),
  paymentTerms: z.string().trim().min(1, "Payment terms are required"),
}).refine(
  (data) => Date.parse(data.expiryDate) > Date.parse(data.startDate),
  {
    message: "expiryDate must be after startDate",
    path: ["expiryDate"],
  }
);

function safeRevalidate(path: string): void {
  try {
    revalidatePath(path);
  } catch {
    // ignore outside RSC
  }
}

/**
 * Maps database exception messages to user-friendly messages for the UI.
 */
function mapDatabaseTransitionError(err: unknown): string {
  if (!(err instanceof Error)) return "Failed to execute subscription action.";
  const msg = err.message;

  if (msg.includes("Invalid transition")) {
    return msg;
  }
  if (msg.includes("Plan does not allow pausing")) {
    return "This subscription's plan does not allow pausing contracts.";
  }
  if (msg.includes("Plan does not allow closing")) {
    return "This subscription's plan does not allow premature cancellation or closing.";
  }
  if (msg.includes("Plan does not allow renewals")) {
    return "This subscription's plan does not permit renewals.";
  }
  if (msg.includes("Only active subscriptions can be renewed")) {
    return "Only active subscriptions can be renewed.";
  }
  return msg;
}

/**
 * Server action to create a subscription from a quotation template.
 */
export async function createSubscriptionFromTemplateAction(
  rawInput: unknown
): Promise<ActionResponse<SubscriptionWithDetails>> {
  try {
    const user = await requireUser();
    if (user.role === "customer") {
      return {
        success: false,
        error: "Forbidden: Customers cannot create subscriptions.",
      };
    }

    const parsed = templateSubscriptionInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: please check subscription details.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const created = await createSubscriptionFromTemplate(parsed.data);
    safeRevalidate("/subscriptions");

    return { success: true, data: created };
  } catch (err: unknown) {
    return { success: false, error: mapDatabaseTransitionError(err) };
  }
}

/**
 * Server action to create a custom subscription draft without a template.
 */
export async function createSubscriptionDraftAction(
  rawInput: unknown
): Promise<ActionResponse<SubscriptionWithDetails>> {
  try {
    const user = await requireUser();
    if (user.role === "customer") {
      return {
        success: false,
        error: "Forbidden: Customers cannot create subscriptions.",
      };
    }

    const parsed = subscriptionCreateSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        error: "Validation failed: please check line items and contract dates.",
        fieldErrors: parsed.error.flatten().fieldErrors,
      };
    }

    const created = await createSubscriptionDraft(parsed.data);
    safeRevalidate("/subscriptions");

    return { success: true, data: created };
  } catch (err: unknown) {
    return { success: false, error: mapDatabaseTransitionError(err) };
  }
}

/**
 * Server action to transition subscription status.
 */
export async function changeSubscriptionStatusAction(
  id: string,
  newStatus: SubscriptionStatus
): Promise<ActionResponse<SubscriptionWithDetails>> {
  try {
    const user = await requireUser();
    if (user.role === "customer") {
      return {
        success: false,
        error: "Forbidden: Customers cannot change subscription status.",
      };
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Subscription ID is required." };
    }

    const updated = await changeSubscriptionStatus(id, newStatus);
    safeRevalidate("/subscriptions");
    safeRevalidate(`/subscriptions/${id}`);

    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: mapDatabaseTransitionError(err) };
  }
}

/**
 * Server action to renew an active subscription.
 */
export async function renewSubscriptionAction(
  id: string
): Promise<ActionResponse<SubscriptionWithDetails>> {
  try {
    const user = await requireUser();
    if (user.role === "customer") {
      return {
        success: false,
        error: "Forbidden: Customers cannot renew subscriptions.",
      };
    }

    if (!id || typeof id !== "string") {
      return { success: false, error: "Subscription ID is required." };
    }

    const updated = await renewSubscription(id);
    safeRevalidate("/subscriptions");
    safeRevalidate(`/subscriptions/${id}`);

    return { success: true, data: updated };
  } catch (err: unknown) {
    return { success: false, error: mapDatabaseTransitionError(err) };
  }
}
