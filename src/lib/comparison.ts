import { formatPrice } from "@/lib/format-price";
import { formatCategoryLabel } from "@/lib/product-query";
import type { Product } from "@/types/product";

export const MAX_COMPARISON_PRODUCTS = 4;
export const NOT_AVAILABLE = "Not available";

export type CompareProduct = {
  id: string;
};

export type CompareAction =
  | { type: "product-added"; product: CompareProduct }
  | { type: "product-removed"; productId: string }
  | { type: "comparison-cleared" }
  | { type: "comparison-restored"; products: CompareProduct[] };

export type ComparisonRow = {
  label: string;
  values: string[];
};

function isCompareProduct(value: unknown): value is CompareProduct {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    value.id.trim().length > 0
  );
}

export function sanitizeCompareProducts(value: unknown): CompareProduct[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const productIds = new Set<string>();

  for (const product of value) {
    if (isCompareProduct(product) && productIds.size < MAX_COMPARISON_PRODUCTS) {
      productIds.add(product.id);
    }
  }

  return [...productIds].map((id) => ({ id }));
}

export function comparisonReducer(state: CompareProduct[], action: CompareAction): CompareProduct[] {
  switch (action.type) {
    case "product-added":
      if (
        !isCompareProduct(action.product) ||
        state.length >= MAX_COMPARISON_PRODUCTS ||
        state.some((product) => product.id === action.product.id)
      ) {
        return state;
      }

      return [...state, { id: action.product.id }];
    case "product-removed":
      return state.filter((product) => product.id !== action.productId);
    case "comparison-cleared":
      return [];
    case "comparison-restored":
      return sanitizeCompareProducts(action.products);
    default: {
      const exhaustiveAction: never = action;
      return exhaustiveAction;
    }
  }
}

function valueOrNotAvailable(value: string | undefined): string {
  return value?.trim() || NOT_AVAILABLE;
}

export function normalizeComparisonRows(products: Product[]): ComparisonRow[] {
  const attributeNames = [...new Set(products.flatMap((product) => Object.keys(product.attributes)))].toSorted((a, b) => a.localeCompare(b));

  return [
    { label: "Brand", values: products.map((product) => valueOrNotAvailable(product.brand)) },
    { label: "Category", values: products.map((product) => valueOrNotAvailable(formatCategoryLabel(product.category))) },
    { label: "Price", values: products.map((product) => Number.isFinite(product.price) ? formatPrice(product.price) : NOT_AVAILABLE) },
    { label: "Rating", values: products.map((product) => Number.isFinite(product.rating) ? `${product.rating.toFixed(1)} / 5` : NOT_AVAILABLE) },
    ...attributeNames.map((name) => ({
      label: name,
      values: products.map((product) => valueOrNotAvailable(product.attributes[name])),
    })),
  ];
}
