import { describe, expect, it } from "vitest";

import {
  comparisonReducer,
  MAX_COMPARISON_PRODUCTS,
  NOT_AVAILABLE,
  normalizeComparisonRows,
  sanitizeCompareProducts,
} from "@/lib/comparison";
import { apiProductFixture, localProductFixture } from "@/test/fixtures/products";

describe("comparisonReducer", () => {
  it("adds a product and prevents duplicates", () => {
    const state = comparisonReducer([], { type: "product-added", product: { id: "p-001" } });

    expect(state).toEqual([{ id: "p-001" }]);
    expect(comparisonReducer(state, { type: "product-added", product: { id: "p-001" } })).toEqual(state);
  });

  it("does not add more than four products", () => {
    const state = Array.from({ length: MAX_COMPARISON_PRODUCTS }, (_, index) => ({ id: `p-00${index + 1}` }));

    expect(comparisonReducer(state, { type: "product-added", product: { id: "p-005" } })).toEqual(state);
  });

  it("removes a selected product", () => {
    expect(comparisonReducer([{ id: "p-001" }, { id: "p-002" }], { type: "product-removed", productId: "p-001" })).toEqual([{ id: "p-002" }]);
  });

  it("clears the comparison", () => {
    expect(comparisonReducer([{ id: "p-001" }], { type: "comparison-cleared" })).toEqual([]);
  });

  it("restores only unique, valid products up to the maximum", () => {
    const restored = comparisonReducer([], {
      type: "comparison-restored",
      products: [
        { id: "p-001" },
        { id: "p-001" },
        { id: "p-002" },
        { id: "p-003" },
        { id: "p-004" },
        { id: "p-005" },
      ],
    });

    expect(restored).toEqual([{ id: "p-001" }, { id: "p-002" }, { id: "p-003" }, { id: "p-004" }]);
  });
});

describe("sanitizeCompareProducts", () => {
  it("rejects malformed persisted data", () => {
    expect(sanitizeCompareProducts([null, { id: "" }, { id: "p-001" }])).toEqual([{ id: "p-001" }]);
    expect(sanitizeCompareProducts("p-001")).toEqual([]);
  });
});

describe("normalizeComparisonRows", () => {
  it("includes fixed rows and sorted attributes with missing values normalized", () => {
    const productWithMissingValues = {
      ...localProductFixture,
      brand: "",
      attributes: { color: "", weight: "200g" },
    };

    expect(normalizeComparisonRows([productWithMissingValues, apiProductFixture])).toEqual([
      { label: "Brand", values: [NOT_AVAILABLE, "Essence"] },
      { label: "Category", values: ["Apparel", "Beauty"] },
      { label: "Price", values: ["€39", "€10"] },
      { label: "Rating", values: ["4.7 / 5", "4.6 / 5"] },
      { label: "availability", values: [NOT_AVAILABLE, "In Stock"] },
      { label: "color", values: [NOT_AVAILABLE, NOT_AVAILABLE] },
      { label: "sku", values: [NOT_AVAILABLE, "BEA-ESS-ESS-001"] },
      { label: "stock", values: [NOT_AVAILABLE, "99"] },
      { label: "weight", values: ["200g", NOT_AVAILABLE] },
    ]);
  });
});
