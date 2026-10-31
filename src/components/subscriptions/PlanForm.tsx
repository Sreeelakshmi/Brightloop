"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { planSchema } from "@/lib/validations/subscription";
import { THEME } from "./theme";
import { createPlanAction, updatePlanAction } from "@/app/(dashboard)/plans/actions";
import type { PlanWithId } from "@/types/catalog";

type PlanFormInput = z.input<typeof planSchema>;
type PlanFormOutput = z.output<typeof planSchema>;

interface PlanFormProps {
  initialPlan?: PlanWithId | null;
  onSuccess?: () => void;
}

export function PlanForm({ initialPlan, onSuccess }: PlanFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PlanFormInput, unknown, PlanFormOutput>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: initialPlan?.name ?? "",
      price: initialPlan?.price ?? 0,
      billingPeriod: initialPlan?.billingPeriod ?? "monthly",
      minQuantity: initialPlan?.minQuantity ?? 1,
      availableFrom: initialPlan?.availableFrom ?? "",
      availableTo: initialPlan?.availableTo ?? "",
      autoClose: initialPlan?.autoClose ?? false,
      closable: initialPlan?.closable ?? true,
      pausable: initialPlan?.pausable ?? true,
      renewable: initialPlan?.renewable ?? true,
    },
  });

  const onSubmit = async (data: PlanFormOutput) => {
    setLoading(true);
    setServerError(null);
    try {
      const payload = {
        ...data,
        availableFrom: data.availableFrom ? data.availableFrom : undefined,
        availableTo: data.availableTo ? data.availableTo : undefined,
      };

      const res = initialPlan
        ? await updatePlanAction(initialPlan.id, payload)
        : await createPlanAction(payload);

      if (!res.success) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, msgs]) => {
            if (msgs && msgs[0]) {
              setError(field as keyof PlanFormInput, { message: msgs[0] });
            }
          });
        }
        setServerError(res.error ?? "Failed to save plan.");
        return;
      }

      if (onSuccess) onSuccess();
      else router.push("/plans");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${THEME.card} p-6`}>
      <div className="pb-4 border-b border-[#D5DDD2] mb-6">
        <h2 className="text-xl font-bold uppercase tracking-tight text-[#1F2622]">
          {initialPlan ? "Edit Plan" : "New Pricing Plan"}
        </h2>
        <p className="text-xs text-[#657367] uppercase tracking-wider mt-1">
          Recurring billing intervals and lifecycle rules
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-[#FDEEE7] text-[#D95522] border border-[#F27B4B] text-sm rounded-xl">
            {serverError}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Plan Name *</label>
          <input
            {...register("name")}
            className={`w-full ${THEME.input}`}
            placeholder="e.g. Pro Monthly"
          />
          {errors.name && <p className="text-xs text-[#D95522] font-medium">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Price ($) *</label>
            <input
              type="number"
              step="0.01"
              {...register("price", { valueAsNumber: true })}
              className={`w-full ${THEME.input}`}
            />
            {errors.price && <p className="text-xs text-[#D95522] font-medium">{errors.price.message}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Billing Period *</label>
            <select {...register("billingPeriod")} className={`w-full ${THEME.input}`}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Min Quantity *</label>
            <input
              type="number"
              min="1"
              {...register("minQuantity", { valueAsNumber: true })}
              className={`w-full ${THEME.input}`}
            />
            {errors.minQuantity && <p className="text-xs text-[#D95522] font-medium">{errors.minQuantity.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Available From</label>
            <input type="date" {...register("availableFrom")} className={`w-full ${THEME.input}`} />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Available To</label>
            <input type="date" {...register("availableTo")} className={`w-full ${THEME.input}`} />
            {errors.availableTo && <p className="text-xs text-[#D95522] font-medium">{errors.availableTo.message}</p>}
          </div>
        </div>

        <div className="pt-3 border-t border-[#D5DDD2] space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Plan Lifecycle Rules</label>
            <p className="text-xs text-[#657367]">Toggle contract behaviors for automated renewals and client management</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div className="relative inline-flex items-center">
                <input type="checkbox" {...register("autoClose")} className="sr-only peer" />
                <div className="w-8 h-4 bg-[#D5DDD2] rounded-full peer-focus:outline-none peer peer-checked:bg-[#1F2622] transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F2622] group-hover:text-black">Auto Close</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div className="relative inline-flex items-center">
                <input type="checkbox" {...register("closable")} className="sr-only peer" />
                <div className="w-8 h-4 bg-[#D5DDD2] rounded-full peer-focus:outline-none peer peer-checked:bg-[#1F2622] transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F2622] group-hover:text-black">Closable</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div className="relative inline-flex items-center">
                <input type="checkbox" {...register("pausable")} className="sr-only peer" />
                <div className="w-8 h-4 bg-[#D5DDD2] rounded-full peer-focus:outline-none peer peer-checked:bg-[#1F2622] transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F2622] group-hover:text-black">Pausable</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer select-none group">
              <div className="relative inline-flex items-center">
                <input type="checkbox" {...register("renewable")} className="sr-only peer" />
                <div className="w-8 h-4 bg-[#D5DDD2] rounded-full peer-focus:outline-none peer peer-checked:bg-[#1F2622] transition-colors" />
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#1F2622] group-hover:text-black">Renewable</span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D5DDD2]">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            className={`px-4 py-2 ${THEME.secondaryButton} text-xs uppercase tracking-wider`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-5 py-2 ${THEME.primaryDark.button} text-xs uppercase tracking-wider`}
          >
            {loading ? "Saving..." : initialPlan ? "Update Plan" : "Create Plan"}
          </button>
        </div>
      </form>
    </div>
  );
}
