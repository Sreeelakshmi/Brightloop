import { describe, expect, it } from "vitest";
import {
  mapPlanRowToPlan,
  mapPlanToRow,
  mapProductRowToProduct,
  mapProductToRow,
  mapVariantRowToVariant,
  mapVariantToRow,
} from "./catalog-mappers";
import type {
  Plan,
  PlanRow,
  Product,
  ProductRow,
  ProductVariant,
  ProductVariantRow,
} from "@/types/catalog";

describe("Catalog Mappers", () => {
  describe("Product Mappers", () => {
    it("maps product DB row with variants to camelCase domain model", () => {
      const row: ProductRow = {
        id: "prod-123",
        name: "Enterprise Firewall",
        type: "goods",
        sales_price: "299.99",
        cost_price: 150,
        notes: "Includes hardware warranty",
        created_at: "2026-10-31T00:00:00Z",
        updated_at: "2026-10-31T12:00:00Z",
      };

      const variantRows: ProductVariantRow[] = [
        {
          id: "var-1",
          product_id: "prod-123",
          attribute: "RAM",
          value: "32GB",
          extra_price: "50.00",
          created_at: "2026-10-31T00:00:00Z",
          updated_at: "2026-10-31T12:00:00Z",
        },
      ];

      const domain = mapProductRowToProduct(row, variantRows);

      expect(domain.id).toBe("prod-123");
      expect(domain.name).toBe("Enterprise Firewall");
      expect(domain.type).toBe("goods");
      expect(domain.salesPrice).toBe(299.99);
      expect(domain.costPrice).toBe(150);
      expect(domain.notes).toBe("Includes hardware warranty");
      expect(domain.variants).toHaveLength(1);
      expect(domain.variants[0].attribute).toBe("RAM");
      expect(domain.variants[0].value).toBe("32GB");
      expect(domain.variants[0].extraPrice).toBe(50);
    });

    it("maps camelCase product to snake_case DB row columns", () => {
      const product: Partial<Product> = {
        name: "Cloud Hosting Pro",
        type: "service",
        salesPrice: 49.99,
        costPrice: 20,
        notes: "Monthly compute node",
      };

      const row = mapProductToRow(product);

      expect(row.name).toBe("Cloud Hosting Pro");
      expect(row.type).toBe("service");
      expect(row.sales_price).toBe(49.99);
      expect(row.cost_price).toBe(20);
      expect(row.notes).toBe("Monthly compute node");
    });
  });

  describe("Variant Mappers", () => {
    it("maps variant DB row to camelCase variant model", () => {
      const row: ProductVariantRow = {
        id: "var-456",
        product_id: "prod-123",
        attribute: "Color",
        value: "Midnight Blue",
        extra_price: 15.5,
        created_at: "2026-10-31T00:00:00Z",
        updated_at: "2026-10-31T12:00:00Z",
      };

      const variant = mapVariantRowToVariant(row);

      expect(variant.id).toBe("var-456");
      expect(variant.productId).toBe("prod-123");
      expect(variant.attribute).toBe("Color");
      expect(variant.value).toBe("Midnight Blue");
      expect(variant.extraPrice).toBe(15.5);
    });

    it("maps camelCase variant to snake_case DB row columns", () => {
      const variant: Partial<ProductVariant> = {
        productId: "prod-123",
        attribute: "Storage",
        value: "1TB SSD",
        extraPrice: 100,
      };

      const row = mapVariantToRow(variant);

      expect(row.product_id).toBe("prod-123");
      expect(row.attribute).toBe("Storage");
      expect(row.value).toBe("1TB SSD");
      expect(row.extra_price).toBe(100);
    });
  });

  describe("Plan Mappers", () => {
    it("maps plan DB row to camelCase domain model", () => {
      const row: PlanRow = {
        id: "plan-789",
        name: "Enterprise Annual",
        price: "1200.00",
        billing_period: "yearly",
        min_quantity: 5,
        available_from: "2026-01-01",
        available_to: "2026-12-31",
        auto_close: false,
        closable: true,
        pausable: false,
        renewable: true,
        created_at: "2026-10-31T00:00:00Z",
        updated_at: "2026-10-31T12:00:00Z",
      };

      const plan = mapPlanRowToPlan(row);

      expect(plan.id).toBe("plan-789");
      expect(plan.name).toBe("Enterprise Annual");
      expect(plan.price).toBe(1200);
      expect(plan.billingPeriod).toBe("yearly");
      expect(plan.minQuantity).toBe(5);
      expect(plan.availableFrom).toBe("2026-01-01");
      expect(plan.availableTo).toBe("2026-12-31");
      expect(plan.autoClose).toBe(false);
      expect(plan.closable).toBe(true);
      expect(plan.pausable).toBe(false);
      expect(plan.renewable).toBe(true);
    });

    it("maps camelCase plan to snake_case DB row columns", () => {
      const plan: Partial<Plan> = {
        name: "Starter Monthly",
        price: 29.99,
        billingPeriod: "monthly",
        minQuantity: 1,
        availableFrom: "2026-01-01",
        availableTo: "2026-06-30",
        autoClose: true,
        closable: false,
        pausable: true,
        renewable: true,
      };

      const row = mapPlanToRow(plan);

      expect(row.name).toBe("Starter Monthly");
      expect(row.price).toBe(29.99);
      expect(row.billing_period).toBe("monthly");
      expect(row.min_quantity).toBe(1);
      expect(row.available_from).toBe("2026-01-01");
      expect(row.available_to).toBe("2026-06-30");
      expect(row.auto_close).toBe(true);
      expect(row.closable).toBe(false);
      expect(row.pausable).toBe(true);
      expect(row.renewable).toBe(true);
    });
  });
});
