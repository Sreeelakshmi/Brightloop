"use client";

import * as React from "react";
import { Product, ProductType } from "@/types";
import { PageHeader, DataTable, StatusBadge, ConfirmDialog } from "@/components/ui-shared";
import { calculateEffectivePrice } from "@/lib/business-rules";
import { handleCreateProduct, handleToggleArchiveProduct } from "@/app/actions/billing-actions";
import { Plus, Archive, CheckCircle2, AlertCircle, Package } from "lucide-react";
import { formatMoney } from "@/lib/formatters";

interface ProductsClientProps {
  initialProducts: Product[];
  isAdmin: boolean;
}

export function ProductsClient({ initialProducts, isAdmin }: ProductsClientProps) {
  const [products, setProducts] = React.useState<Product[]>(initialProducts);
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [showArchived, setShowArchived] = React.useState(false);

  // New Product Modal State
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<ProductType>("service");
  const [salesPrice, setSalesPrice] = React.useState("10000");
  const [costPrice, setCostPrice] = React.useState("3000");
  const [notes, setNotes] = React.useState("");
  const [includeOdooVariant, setIncludeOdooVariant] = React.useState(true);
  const [customVariantName, setCustomVariantName] = React.useState("");
  const [customVariantPrice, setCustomVariantPrice] = React.useState("1000");
  const [selectedPreviewVariant, setSelectedPreviewVariant] = React.useState<string>("none");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      if (!showArchived && p.archived) return false;
      if (typeFilter !== "all" && p.type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesVariant = p.variants?.some((v) => v.attributeValue.toLowerCase().includes(q));
        if (!matchesName && !matchesVariant) return false;
      }
      return true;
    });
  }, [products, search, typeFilter, showArchived]);

  // Live Effective Price calculation preview in modal
  const baseNum = Number(salesPrice) || 0;
  const effectivePricePreview = React.useMemo(() => {
    if (selectedPreviewVariant === "odoo") return baseNum + 560;
    if (selectedPreviewVariant === "custom") return baseNum + (Number(customVariantPrice) || 0);
    return baseNum;
  }, [baseNum, selectedPreviewVariant, customVariantPrice]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    setError(null);
    setLoading(true);

    const variants: Array<{ attributeName: string; attributeValue: string; extraPrice: number }> = [
      { attributeName: "Brand", attributeValue: "Standard", extraPrice: 0 },
    ];
    if (includeOdooVariant) {
      variants.push({ attributeName: "Brand", attributeValue: "Odoo", extraPrice: 560 });
    }
    if (customVariantName.trim()) {
      variants.push({
        attributeName: "Custom",
        attributeValue: customVariantName.trim(),
        extraPrice: Number(customVariantPrice) || 0,
      });
    }

    const res = await handleCreateProduct({
      name,
      type,
      salesPrice: Number(salesPrice),
      costPrice: Number(costPrice),
      notes,
      variants,
    });

    setLoading(false);
    if (res.success && res.product) {
      setProducts([res.product, ...products]);
      setIsModalOpen(false);
      setName("");
      setNotes("");
    } else {
      setError(res.error || "Failed to create product");
    }
  };

  const handleToggleArchive = async (prod: Product) => {
    const res = await handleToggleArchiveProduct(prod.id, !prod.archived);
    if (res.success) {
      setProducts(
        products.map((p) => (p.id === prod.id ? { ...p, archived: !p.archived } : p))
      );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <PageHeader
          title="PRODUCT CATALOG"
          subtitle="Products, Brand Variants & Pricing Rules"
          logDate="31.10.2026"
        />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] px-4 py-2 text-xs font-mono tracking-wider uppercase border border-[#2B302B] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#CBD5CB] p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search products or variants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-[#CBD5CB] px-3 py-1.5 w-64 text-[#2B302B] focus:outline-none focus:border-[#F57B4A]"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-[#CBD5CB] px-3 py-1.5 bg-white text-[#2B302B] focus:outline-none focus:border-[#F57B4A]"
          >
            <option value="all">ALL TYPES</option>
            <option value="service">SERVICE</option>
            <option value="consumable">CONSUMABLE</option>
            <option value="storable">STORABLE</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="accent-[#2B302B]"
          />
          <span className="text-[#8A968A] uppercase">Show Archived</span>
        </label>
      </div>

      {/* Products Table */}
      <div className="bg-white border border-[#CBD5CB] overflow-hidden">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#E4EEE4] border-b border-[#CBD5CB] text-[#2B302B] uppercase">
            <tr>
              <th className="p-3">Product Name</th>
              <th className="p-3">Type</th>
              <th className="p-3">Base Price</th>
              <th className="p-3">Variants & Effective Prices</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4EEE4]">
            {filteredProducts.map((prod) => (
              <tr key={prod.id} className="hover:bg-[#F8FAF8] transition-colors">
                <td className="p-3">
                  <div className="font-semibold text-[#2B302B]">{prod.name}</div>
                  <div className="text-[10px] text-[#8A968A]">{prod.notes || "No notes"}</div>
                </td>
                <td className="p-3 uppercase">
                  <span className="bg-[#E4EEE4] px-2 py-0.5 text-[11px] text-[#2B302B] font-medium">
                    {prod.type}
                  </span>
                </td>
                <td className="p-3 font-semibold text-[#2B302B]">
                  {formatMoney(prod.salesPrice)}
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {prod.variants?.map((v) => (
                      <span
                        key={v.id}
                        className={`text-[10px] px-2 py-0.5 border ${
                          v.attributeValue === "Odoo"
                            ? "bg-[#FFF4EE] border-[#F57B4A] text-[#F57B4A] font-semibold"
                            : "bg-[#F4F7F4] border-[#CBD5CB] text-[#2B302B]"
                        }`}
                      >
                        {v.attributeValue}: {formatMoney(calculateEffectivePrice(prod, v.id))}
                        {v.extraPrice > 0 && ` (+${v.extraPrice})`}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  {prod.archived ? (
                    <span className="text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] uppercase font-semibold">
                      Archived
                    </span>
                  ) : (
                    <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 text-[10px] uppercase font-semibold">
                      Active
                    </span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleToggleArchive(prod)}
                    className="text-[#8A968A] hover:text-[#2B302B] underline text-[11px]"
                  >
                    {prod.archived ? "Restore" : "Archive"}
                  </button>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[#8A968A]">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Product Modal with Live Effective Price Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#2B302B] w-full max-w-lg p-6 space-y-4 font-mono shadow-2xl">
            <div className="flex justify-between items-center border-b border-[#CBD5CB] pb-3">
              <h3 className="font-semibold text-sm text-[#2B302B] uppercase tracking-wider">
                Create New Product
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#8A968A] hover:text-[#2B302B]"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Telemetry Ingestion Node"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as ProductType)}
                    className="w-full border border-[#CBD5CB] p-2 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  >
                    <option value="service">Service</option>
                    <option value="consumable">Consumable</option>
                    <option value="storable">Storable</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Sales Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={salesPrice}
                    onChange={(e) => setSalesPrice(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#8A968A] uppercase mb-1">Cost Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Variants Section */}
              <div className="border border-[#CBD5CB] p-3 bg-[#F8FAF8] space-y-3">
                <div className="font-semibold text-[#2B302B] uppercase text-[11px]">
                  Variants & Attribute Pricing
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeOdooVariant}
                    onChange={(e) => setIncludeOdooVariant(e.target.checked)}
                    className="accent-[#F57B4A]"
                  />
                  <span className="text-[#2B302B]">
                    Include Brand variant: <strong>Odoo</strong> (+₹560 extra)
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#CBD5CB]/50">
                  <input
                    type="text"
                    placeholder="Custom variant (e.g. Enterprise)"
                    value={customVariantName}
                    onChange={(e) => setCustomVariantName(e.target.value)}
                    className="border border-[#CBD5CB] p-1.5 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Extra price (₹)"
                    value={customVariantPrice}
                    onChange={(e) => setCustomVariantPrice(e.target.value)}
                    className="border border-[#CBD5CB] p-1.5 bg-white text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                  />
                </div>
              </div>

              {/* LIVE EFFECTIVE PRICE PREVIEW CARD */}
              <div className="border border-[#CBD5CB] p-3 bg-[#E4EEE4]/50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[#8A968A] uppercase text-[10px] font-semibold">
                    Live Effective Price Preview
                  </span>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedPreviewVariant("none")}
                      className={`px-2 py-0.5 border ${
                        selectedPreviewVariant === "none"
                          ? "bg-[#2B302B] text-white border-[#2B302B]"
                          : "bg-white text-[#2B302B] border-[#CBD5CB]"
                      }`}
                    >
                      Standard
                    </button>
                    {includeOdooVariant && (
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewVariant("odoo")}
                        className={`px-2 py-0.5 border ${
                          selectedPreviewVariant === "odoo"
                            ? "bg-[#F57B4A] text-white border-[#F57B4A]"
                            : "bg-white text-[#2B302B] border-[#CBD5CB]"
                        }`}
                      >
                        Odoo (+₹560)
                      </button>
                    )}
                    {customVariantName && (
                      <button
                        type="button"
                        onClick={() => setSelectedPreviewVariant("custom")}
                        className={`px-2 py-0.5 border ${
                          selectedPreviewVariant === "custom"
                            ? "bg-[#2B302B] text-white border-[#2B302B]"
                            : "bg-white text-[#2B302B] border-[#CBD5CB]"
                        }`}
                      >
                        {customVariantName}
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-xl font-bold text-[#2B302B] flex items-baseline gap-2">
                  <span>{formatMoney(effectivePricePreview)}</span>
                  <span className="text-[11px] font-normal text-[#8A968A]">
                    (Base {formatMoney(baseNum)}{" "}
                    {selectedPreviewVariant === "odoo" ? "+ ₹560 Odoo" : ""}{" "}
                    {selectedPreviewVariant === "custom" ? `+ ₹${customVariantPrice}` : ""})
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[#8A968A] uppercase mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Operational notes or internal specs..."
                  className="w-full border border-[#CBD5CB] p-2 text-[#2B302B] focus:border-[#F57B4A] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-[#CBD5CB]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-[#CBD5CB] text-[#2B302B] hover:bg-[#F4F7F4]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#2B302B] hover:bg-black text-[#E4EEE4] disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
