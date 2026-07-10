"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { CategorySelect } from "@/components/filters/category-select";
import { SearchInput } from "@/components/filters/search-input";
import { SortSelect } from "@/components/filters/sort-select";
import { Button } from "@/components/ui/button";
import type { ProductQuery, ProductSort } from "@/lib/product-query";
import type { ProductCategory } from "@/types/product";

type ProductFiltersProps = {
  query: ProductQuery;
  categoryOptions: Array<{ value: ProductCategory; label: string }>;
};

export function ProductFilters({ query, categoryOptions }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(query.q);
  const [isPending, beginTransition] = useTransition();

  function updateUrl(updates: Partial<Record<keyof ProductQuery, string>>) {
    beginTransition(() => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === "all" || (key === "sort" && value === "name-asc")) {
          params.delete(key);
          return;
        }

        params.set(key, value);
      });

      if (updates.q !== undefined || updates.category !== undefined || updates.sort !== undefined) {
        params.delete("page");
      }

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  function handleSearchChange(value: string) {
    setSearch(value);
    updateUrl({ q: value.trim() });
  }

  function resetFilters() {
    setSearch("");
    beginTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto] lg:items-end">
        <SearchInput value={search} onChange={(event) => handleSearchChange(event.target.value)} />
        <CategorySelect
          value={query.category}
          options={categoryOptions}
          onChange={(event) => updateUrl({ category: event.target.value as ProductCategory | "all" })}
        />
        <SortSelect value={query.sort} onChange={(event) => updateUrl({ sort: event.target.value as ProductSort })} />
        <Button type="button" variant="outline" onClick={resetFilters} className="w-full lg:w-auto">
          Reset
        </Button>
      </div>
      {isPending ? (
        <p className="mt-3 text-sm text-slate-500" aria-live="polite">
          Updating results...
        </p>
      ) : null}
    </div>
  );
}
