"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

import { FacetFilter } from "@/components/filters/facet-filter";
import { SearchInput } from "@/components/filters/search-input";
import { SortSelect } from "@/components/filters/sort-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyProductQueryToSearchParams, parsePositivePrice, parsePriceRange, type PriceRange, type ProductQuery, type ProductSort } from "@/lib/product-query";
import type { ProductCategory } from "@/types/product";

type ProductFiltersProps = {
  query: ProductQuery;
  brandOptions: Array<{ value: string; label: string }>;
  categoryOptions: Array<{ value: ProductCategory; label: string }>;
};

export function ProductFilters({ query, brandOptions, categoryOptions }: ProductFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, beginTransition] = useTransition();

  function updateUrl(updates: Partial<ProductQuery>) {
    beginTransition(() => {
      const hasFilterUpdate = "q" in updates || "brands" in updates || "categories" in updates || "price" in updates || "sort" in updates;
      const params = applyProductQueryToSearchParams(searchParams, {
        ...query,
        ...updates,
        page: hasFilterUpdate ? 1 : query.page,
      });

      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    });
  }

  function toggleFacetValue(facet: "brands" | "categories", value: string) {
    const selectedValues = query[facet];
    const values = selectedValues.includes(value) ? selectedValues.filter((entry) => entry !== value) : [...selectedValues, value];

    updateUrl({ [facet]: values });
  }

  function resetFilters() {
    beginTransition(() => router.replace(pathname, { scroll: false }));
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto] lg:items-end">
        <SearchControl key={query.q} initialValue={query.q} onChange={(value) => updateUrl({ q: value.trim() })} />
        <SortSelect value={query.sort} onChange={(event) => updateUrl({ sort: event.target.value as ProductSort })} />
        <Button type="button" variant="outline" onClick={resetFilters} className="w-full lg:w-auto">
          Reset
        </Button>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <FacetFilter
          label="Brand"
          name="brand"
          options={brandOptions}
          selectedValues={query.brands}
          onChange={(value) => toggleFacetValue("brands", value)}
          onClear={() => updateUrl({ brands: [] })}
        />
        <FacetFilter
          label="Category"
          name="category"
          options={categoryOptions}
          selectedValues={query.categories}
          onChange={(value) => toggleFacetValue("categories", value)}
          onClear={() => updateUrl({ categories: [] })}
        />
      </div>
      <PriceRangeControl
        key={`${query.price?.min ?? ""}-${query.price?.max ?? ""}`}
        initialPrice={query.price}
        onApply={(price) => updateUrl({ price })}
        onClear={() => updateUrl({ price: undefined })}
      />
      {isPending ? (
        <p className="mt-3 text-sm text-slate-500" aria-live="polite">
          Updating results...
        </p>
      ) : null}
    </div>
  );
}

type PriceRangeControlProps = {
  initialPrice: PriceRange | undefined;
  onApply: (price: PriceRange | undefined) => void;
  onClear: () => void;
};

function PriceRangeControl({ initialPrice, onApply, onClear }: PriceRangeControlProps) {
  const [minimumPrice, setMinimumPrice] = useState(initialPrice?.min?.toString() ?? "");
  const [maximumPrice, setMaximumPrice] = useState(initialPrice?.max?.toString() ?? "");
  const [error, setError] = useState("");

  function applyPriceRange() {
    const min = parsePositivePrice(minimumPrice);
    const max = parsePositivePrice(maximumPrice);

    if (min !== undefined && max !== undefined && min > max) {
      setError("Minimum price cannot be greater than maximum price.");
      return;
    }

    setError("");
    onApply(parsePriceRange(minimumPrice, maximumPrice));
  }

  return (
    <fieldset className="mt-5" aria-describedby={error ? "price-range-error" : undefined}>
      <legend className="text-sm font-semibold text-slate-950">Price range</legend>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="minimum-price" className="mb-1.5 block text-sm font-medium text-slate-700">Minimum price</label>
          <Input
            id="minimum-price"
            type="number"
            min="0"
            step="any"
            value={minimumPrice}
            onChange={(event) => {
              setMinimumPrice(event.target.value);
              setError("");
            }}
          />
        </div>
        <div>
          <label htmlFor="maximum-price" className="mb-1.5 block text-sm font-medium text-slate-700">Maximum price</label>
          <Input
            id="maximum-price"
            type="number"
            min="0"
            step="any"
            value={maximumPrice}
            onChange={(event) => {
              setMaximumPrice(event.target.value);
              setError("");
            }}
          />
        </div>
      </div>
      {error ? <p id="price-range-error" className="mt-2 text-sm font-medium text-red-700" role="alert">{error}</p> : null}
      <div className="mt-3 flex gap-3">
        <Button type="button" variant="outline" onClick={applyPriceRange}>Apply</Button>
        <Button type="button" variant="ghost" onClick={onClear}>Clear</Button>
      </div>
    </fieldset>
  );
}

type SearchControlProps = {
  initialValue: string;
  onChange: (value: string) => void;
};

function SearchControl({ initialValue, onChange }: SearchControlProps) {
  const [search, setSearch] = useState(initialValue);

  return (
    <SearchInput
      value={search}
      onChange={(event) => {
        setSearch(event.target.value);
        onChange(event.target.value);
      }}
    />
  );
}
