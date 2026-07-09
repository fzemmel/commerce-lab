import { Suspense } from "react";
import Link from "next/link";

import { ProductFilters } from "@/components/filters/product-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductPagination } from "@/components/product/product-pagination";
import { buttonVariants } from "@/components/ui/button";
import { getCategoryOptions, paginateProducts, parseProductQuery, queryProducts, type ProductSearchParams } from "@/lib/product-query";
import { getProductCatalog } from "@/lib/products-api";

type ProductsPageProps = {
  searchParams: Promise<ProductSearchParams>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const catalog = await getProductCatalog();
  const categoryOptions = getCategoryOptions(catalog.products);
  const query = parseProductQuery(
    await searchParams,
    categoryOptions.map((option) => option.value),
  );
  const results = queryProducts(query, catalog.products);
  const pagination = paginateProducts(results, query.page);
  const hasFilters = query.q.length > 0 || query.category !== "all" || query.sort !== "name-asc" || pagination.page > 1;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-8 rounded-[2rem] bg-slate-950 p-6 text-white sm:p-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-200">Product listing</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">Searchable commerce catalog</h1>
          <p className="mt-4 text-slate-300">
            Search, category filtering, and sorting are reflected in the URL so the listing is shareable, reload-safe, and server-rendered from route state.
          </p>
        </div>
      </section>

      <Suspense fallback={<FilterSkeleton />}>
        <ProductFilters query={query} categoryOptions={categoryOptions} />
      </Suspense>

      {catalog.source === "fallback" ? (
        <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950" role="status">
          Using local fallback catalog because the external product API is currently unavailable.
        </p>
      ) : null}

      <div className="my-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="text-sm font-medium text-slate-600">
          {results.length === 0 ? (
            <>Showing <span className="text-slate-950">0</span> products</>
          ) : results.length === 1 ? (
            <>
              Showing <span className="text-slate-950">1</span> product
            </>
          ) : (
            <>
              Showing <span className="text-slate-950">{pagination.startItem}-{pagination.endItem}</span> of{" "}
              <span className="text-slate-950">{pagination.totalItems}</span> products
            </>
          )}
        </p>
        {hasFilters ? (
          <p className="rounded-full bg-amber-100 px-4 py-2 text-sm font-medium text-amber-900">
            URL state active: {query.q ? `q=${query.q}` : "catalog"}
          </p>
        ) : null}
      </div>

      {results.length > 0 ? (
        <>
          <ProductGrid products={pagination.items} />
          <ProductPagination query={query} currentPage={pagination.page} totalPages={pagination.totalPages} />
        </>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">No products found</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            Try a broader search term, remove the category filter, or reset the listing to the default catalog view.
          </p>
          <Link href="/products" className={buttonVariants({ variant: "primary", className: "mt-6" })}>
            Reset product listing
          </Link>
        </div>
      )}
    </main>
  );
}

function FilterSkeleton() {
  return <div className="h-36 animate-pulse rounded-3xl border border-slate-200 bg-white shadow-sm" />;
}
