"use client";

import { ComparisonTable } from "@/components/comparison/comparison-table";
import { useComparison } from "@/components/comparison/comparison-provider";
import { buttonVariants } from "@/components/ui/button";
import type { Product } from "@/types/product";

type ComparisonViewProps = {
  products: Product[];
};

export function ComparisonView({ products }: ComparisonViewProps) {
  const { products: selectedProducts, dispatch } = useComparison();
  const catalogById = new Map(products.map((product) => [product.id, product]));
  const comparedProducts = selectedProducts.flatMap((selectedProduct) => {
    const product = catalogById.get(selectedProduct.id);
    return product ? [product] : [];
  });

  if (comparedProducts.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">No products selected</h1>
        <p className="mt-3 text-slate-600">Add up to four products from the catalog to compare their attributes here.</p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Compare products</h1>
          <p className="mt-2 text-slate-600">Review the most important attributes side by side.</p>
        </div>
        <button
          type="button"
          className={buttonVariants({ variant: "outline" })}
          onClick={() => dispatch({ type: "comparison-cleared" })}
        >
          Clear comparison
        </button>
      </div>
      <ComparisonTable products={comparedProducts} onRemove={(productId) => dispatch({ type: "product-removed", productId })} />
    </section>
  );
}
