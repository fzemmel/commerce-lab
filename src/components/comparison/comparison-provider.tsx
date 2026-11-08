"use client";

import { createContext, type ReactNode, useContext, useEffect, useReducer, useState } from "react";

import {
  comparisonReducer,
  type CompareAction,
  type CompareProduct,
  sanitizeCompareProducts,
} from "@/lib/comparison";

const STORAGE_KEY = "commerce-lab-comparison";

type ComparisonContextValue = {
  products: CompareProduct[];
  dispatch: (action: CompareAction) => void;
};

const ComparisonContext = createContext<ComparisonContextValue | null>(null);

function restoreStoredProducts(value: unknown): CompareProduct[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return sanitizeCompareProducts(value.map((id) => ({ id })));
}

type ComparisonProviderProps = {
  children: ReactNode;
  initialProducts?: CompareProduct[];
  restoreFromSessionStorage?: boolean;
};

export function ComparisonProvider({
  children,
  initialProducts = [],
  restoreFromSessionStorage = true,
}: ComparisonProviderProps) {
  const [products, dispatch] = useReducer(comparisonReducer, initialProducts, sanitizeCompareProducts);
  const [hasRestored, setHasRestored] = useState(!restoreFromSessionStorage);

  useEffect(() => {
    if (!restoreFromSessionStorage) {
      return;
    }

    try {
      const storedProducts: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
      dispatch({ type: "comparison-restored", products: restoreStoredProducts(storedProducts) });
    } catch {
      dispatch({ type: "comparison-restored", products: [] });
    } finally {
      setHasRestored(true);
    }
  }, [restoreFromSessionStorage]);

  useEffect(() => {
    if (!hasRestored) {
      return;
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(products.map((product) => product.id)));
    } catch {
      // Storage can be unavailable in private browsing contexts.
    }
  }, [hasRestored, products]);

  return <ComparisonContext.Provider value={{ products, dispatch }}>{children}</ComparisonContext.Provider>;
}

export function useComparison(): ComparisonContextValue {
  const context = useContext(ComparisonContext);

  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider.");
  }

  return context;
}
