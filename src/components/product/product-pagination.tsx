import Link from "next/link";

import { cn } from "@/lib/cn";
import type { ProductQuery } from "@/lib/product-query";

type ProductPaginationProps = {
  query: ProductQuery;
  currentPage: number;
  totalPages: number;
};

type PageItem = number | "ellipsis-start" | "ellipsis-end";

function createProductsHref(query: ProductQuery, page: number) {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.category !== "all") {
    params.set("category", query.category);
  }

  if (query.sort !== "name-asc") {
    params.set("sort", query.sort);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();

  return queryString ? `/products?${queryString}` : "/products";
}

function getPageItems(currentPage: number, totalPages: number): PageItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2]);
  const visiblePages = [...pages].filter((page) => page >= 1 && page <= totalPages).toSorted((a, b) => a - b);
  const items: PageItem[] = [];

  visiblePages.forEach((page, index) => {
    const previousPage = visiblePages[index - 1];

    if (previousPage && page - previousPage > 1) {
      items.push(previousPage === 1 ? "ellipsis-start" : "ellipsis-end");
    }

    items.push(page);
  });

  return items;
}

const pageLinkClass =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-full border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500";

export function ProductPagination({ query, currentPage, totalPages }: ProductPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pageItems = getPageItems(currentPage, totalPages);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Product pagination">
      {hasPreviousPage ? (
        <Link href={createProductsHref(query, currentPage - 1)} className={cn(pageLinkClass, "px-4")}>
          Previous
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-400">
          Previous
        </span>
      )}

      {pageItems.map((item) =>
        typeof item === "number" ? (
          item === currentPage ? (
            <span
              key={item}
              className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-slate-950 px-3 text-sm font-semibold text-white"
              aria-current="page"
            >
              <span className="sr-only">Page </span>
              {item}
            </span>
          ) : (
            <Link key={item} href={createProductsHref(query, item)} className={pageLinkClass} aria-label={`Go to page ${item}`}>
              {item}
            </Link>
          )
        ) : (
          <span key={item} className="px-2 text-sm font-semibold text-slate-500" aria-hidden="true">
            ...
          </span>
        ),
      )}

      {hasNextPage ? (
        <Link href={createProductsHref(query, currentPage + 1)} className={cn(pageLinkClass, "px-4")}>
          Next
        </Link>
      ) : (
        <span className="inline-flex h-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-400">
          Next
        </span>
      )}
    </nav>
  );
}
