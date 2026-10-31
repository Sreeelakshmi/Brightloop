"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "@/lib/validations/subscription";
import { THEME } from "./theme";
import { VariantsEditor, type VariantItem } from "./VariantsEditor";
import { createProductAction, updateProductAction } from "@/app/(dashboard)/products/actions";
import type { Product, ProductWithVariants } from "@/types/catalog";

interface ProductFormProps {
  initialProduct?: ProductWithVariants | null;
  onSuccess?: () => void;
}

export function ProductForm({ initialProduct, onSuccess }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [variants, setVariants] = useState<VariantItem[]>(
    initialProduct?.variants?.map((v) => ({
      id: v.id,
      attribute: v.attribute,
      value: v.value,
      extraPrice: v.extraPrice,
    })) ?? []
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Product>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialProduct?.name ?? "",
      type: initialProduct?.type ?? "goods",
      salesPrice: initialProduct?.salesPrice ?? 0,
      costPrice: initialProduct?.costPrice ?? 0,
      notes: initialProduct?.notes ?? "",
    },
  });

  const onSubmit = async (data: Product) => {
    setLoading(true);
    setServerError(null);
    try {
      const payload = { ...data, variants };
      const res = initialProduct
        ? await updateProductAction(initialProduct.id, payload)
        : await createProductAction(payload);

      if (!res.success) {
        if (res.fieldErrors) {
          Object.entries(res.fieldErrors).forEach(([field, msgs]) => {
            if (msgs && msgs[0]) setError(field as keyof Product, { message: msgs[0] });
          });
        }
        setServerError(res.error ?? "Failed to save product.");
        return;
      }

      if (onSuccess) onSuccess();
      else router.push("/products");
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
          {initialProduct ? "Edit Product" : "New Product"}
        </h2>
        <p className="text-xs text-[#657367] uppercase tracking-wider mt-1">
          Catalog item specifications and surcharge variants
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <div className="p-3 bg-[#FDEEE7] text-[#D95522] border border-[#F27B4B] text-sm rounded-xl">
            {serverError}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Product Name *</label>
          <input
            {...register("name")}
            className={`w-full ${THEME.input}`}
            placeholder="e.g. Enterprise Router"
          />
          {errors.name && <p className="text-xs text-[#D95522] font-medium">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Type</label>
            <select {...register("type")} className={`w-full ${THEME.input}`}>
              <option value="goods">Goods</option>
              <option value="service">Service</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Sales Price ($)</label>
            <input
              type="number"
              step="0.01"
              {...register("salesPrice", { valueAsNumber: true })}
              className={`w-full ${THEME.input}`}
            />
            {errors.salesPrice && <p className="text-xs text-[#D95522] font-medium">{errors.salesPrice.message}</p>}
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Cost Price ($)</label>
            <input
              type="number"
              step="0.01"
              {...register("costPrice", { valueAsNumber: true })}
              className={`w-full ${THEME.input}`}
            />
            {errors.costPrice && <p className="text-xs text-[#D95522] font-medium">{errors.costPrice.message}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold uppercase tracking-wider text-[#1F2622]">Notes</label>
          <textarea
            rows={2}
            {...register("notes")}
            className={`w-full p-2.5 rounded-lg border border-[#D5DDD2] bg-white text-[#1F2622] text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-[#1F2622]`}
            placeholder="Internal catalog description"
          />
        </div>

        <div className="pt-2 border-t border-[#D5DDD2]">
          <VariantsEditor variants={variants} onChange={setVariants} />
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
            {loading ? "Saving..." : initialProduct ? "Update Product" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
