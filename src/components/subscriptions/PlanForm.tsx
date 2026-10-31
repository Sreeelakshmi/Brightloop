"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { planSchema } from "@/lib/validations/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{initialPlan ? "Edit Plan" : "New Pricing Plan"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{serverError}</div>}
          <div className="space-y-1">
            <label className="text-sm font-medium">Plan Name *</label>
            <input {...register("name")} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" placeholder="e.g. Pro Monthly" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Price ($) *</label>
              <input type="number" step="0.01" {...register("price", { valueAsNumber: true })} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
              {errors.price && <p className="text-xs text-red-500">{errors.price.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Billing Period *</label>
              <select {...register("billingPeriod")} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Min Quantity *</label>
              <input type="number" min="1" {...register("minQuantity", { valueAsNumber: true })} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
              {errors.minQuantity && <p className="text-xs text-red-500">{errors.minQuantity.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Available From</label>
              <input type="date" {...register("availableFrom")} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Available To</label>
              <input type="date" {...register("availableTo")} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
              {errors.availableTo && <p className="text-xs text-red-500">{errors.availableTo.message}</p>}
            </div>
          </div>
          <div className="pt-2 border-t space-y-2">
            <label className="text-sm font-medium">Plan Lifecycle Toggles</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("autoClose")} className="rounded border-input text-primary" /> Auto Close
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("closable")} className="rounded border-input text-primary" /> Closable
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("pausable")} className="rounded border-input text-primary" /> Pausable
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register("renewable")} className="rounded border-input text-primary" /> Renewable
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : initialPlan ? "Update Plan" : "Create Plan"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
