"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema } from "@/lib/validations/subscription";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className="w-full max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">{initialProduct ? "Edit Product" : "New Product"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md">{serverError}</div>}
          <div className="space-y-1">
            <label className="text-sm font-medium">Product Name *</label>
            <input {...register("name")} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" placeholder="e.g. Enterprise Router" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Type</label>
              <select {...register("type")} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm">
                <option value="goods">Goods</option>
                <option value="service">Service</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Sales Price ($)</label>
              <input type="number" step="0.01" {...register("salesPrice", { valueAsNumber: true })} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
              {errors.salesPrice && <p className="text-xs text-red-500">{errors.salesPrice.message}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Cost Price ($)</label>
              <input type="number" step="0.01" {...register("costPrice", { valueAsNumber: true })} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" />
              {errors.costPrice && <p className="text-xs text-red-500">{errors.costPrice.message}</p>}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Notes</label>
            <textarea rows={2} {...register("notes")} className="w-full p-2 rounded-md border border-input bg-background text-sm" placeholder="Internal catalog description" />
          </div>
          <div className="pt-2 border-t">
            <VariantsEditor variants={variants} onChange={setVariants} />
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? "Saving..." : initialProduct ? "Update Product" : "Create Product"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
