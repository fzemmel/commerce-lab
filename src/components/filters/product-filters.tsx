"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition, type KeyboardEvent } from "react";

import { FacetFilter } from "@/components/filters/facet-filter";
import { SearchInput } from "@/components/filters/search-input";
import { SortSelect } from "@/components/filters/sort-select";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/format-price";
import {
  applyProductQueryToSearchParams,
  type PriceBounds,
  type PriceRange,
  type ProductQuery,
  type ProductSort,
} from "@/lib/product-query";
import type { ProductCategory } from "@/types/product";

type ProductFiltersProps = {
  query: ProductQuery;
  brandOptions: Array<{ value: string; label: string }>;
  categoryOptions: Array<{ value: ProductCategory; label: string }>;
  priceBounds: PriceBounds;
};

export function ProductFilters({ query, brandOptions, categoryOptions, priceBounds }: ProductFiltersProps) {
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
        key={`${query.price?.min ?? ""}-${query.price?.max ?? ""}-${priceBounds.min}-${priceBounds.max}-${priceBounds.step}`}
        bounds={priceBounds}
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
  bounds: PriceBounds;
  initialPrice: PriceRange | undefined;
  onApply: (price: PriceRange | undefined) => void;
  onClear: () => void;
};

function countStepFractionDigits(step: number) {
  const [coefficient, exponentText] = String(step).toLowerCase().split("e");
  const fractionDigits = coefficient.split(".")[1]?.length ?? 0;
  const exponent = exponentText ? Number.parseInt(exponentText, 10) : 0;

  return Math.min(6, Math.max(0, fractionDigits - exponent));
}

function clampPrice(value: number, bounds: PriceBounds) {
  return Math.min(bounds.max, Math.max(bounds.min, value));
}

function snapPrice(value: number, bounds: PriceBounds) {
  if (!Number.isFinite(value)) {
    return bounds.min;
  }

  if (bounds.step <= 0) {
    return clampPrice(value, bounds);
  }

  const steps = Math.round((value - bounds.min) / bounds.step);

  return clampPrice(Number((bounds.min + steps * bounds.step).toFixed(10)), bounds);
}

function PriceRangeControl({ bounds, initialPrice, onApply, onClear }: PriceRangeControlProps) {
  const id = useId();
  const minimumId = `${id}-minimum-price`;
  const maximumId = `${id}-maximum-price`;
  const helpId = `${id}-price-range-help`;
  const summaryId = `${id}-price-range-summary`;
  const hasRange = bounds.max > bounds.min;
  const initialMinimum = clampPrice(initialPrice?.min ?? bounds.min, bounds);
  const initialMaximum = clampPrice(initialPrice?.max ?? bounds.max, bounds);
  const [minimumPrice, setMinimumPrice] = useState(initialMinimum);
  const [maximumPrice, setMaximumPrice] = useState(Math.max(initialMinimum, initialMaximum));
  const fractionDigits = countStepFractionDigits(bounds.step);
  const formattedMinimum = formatPrice(minimumPrice, fractionDigits);
  const formattedMaximum = formatPrice(maximumPrice, fractionDigits);
  const range = bounds.max - bounds.min;
  const minimumPercent = hasRange ? ((minimumPrice - bounds.min) / range) * 100 : 0;
  const maximumPercent = hasRange ? ((maximumPrice - bounds.min) / range) * 100 : 100;

  function updateMinimum(value: number) {
    setMinimumPrice(Math.min(snapPrice(value, bounds), maximumPrice));
  }

  function updateMaximum(value: number) {
    setMaximumPrice(Math.max(snapPrice(value, bounds), minimumPrice));
  }

  function handleKeyDown(handle: "minimum" | "maximum", event: KeyboardEvent<HTMLInputElement>) {
    const currentValue = handle === "minimum" ? minimumPrice : maximumPrice;
    const increment = event.shiftKey ? bounds.step * 10 : bounds.step;
    let nextValue: number | undefined;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        nextValue = currentValue + increment;
        break;
      case "ArrowLeft":
      case "ArrowDown":
        nextValue = currentValue - increment;
        break;
      case "PageUp":
        nextValue = currentValue + bounds.step * 10;
        break;
      case "PageDown":
        nextValue = currentValue - bounds.step * 10;
        break;
      case "Home":
        nextValue = bounds.min;
        break;
      case "End":
        nextValue = bounds.max;
        break;
      default:
        return;
    }

    event.preventDefault();

    if (handle === "minimum") {
      updateMinimum(nextValue);
    } else {
      updateMaximum(nextValue);
    }
  }

  function applyPriceRange() {
    const price: PriceRange = {
      ...(minimumPrice > bounds.min ? { min: minimumPrice } : {}),
      ...(maximumPrice < bounds.max ? { max: maximumPrice } : {}),
    };

    onApply(price.min === undefined && price.max === undefined ? undefined : price);
  }

  function clearPriceRange() {
    setMinimumPrice(bounds.min);
    setMaximumPrice(bounds.max);
    onClear();
  }

  return (
    <fieldset className="mt-5 min-w-0" aria-describedby={`${helpId} ${summaryId}`}>
      <legend className="text-sm font-semibold text-slate-950">Price range</legend>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p id={helpId} className="text-sm text-slate-600">
          {hasRange
            ? `Catalog prices ${formatPrice(bounds.min, fractionDigits)} to ${formatPrice(bounds.max, fractionDigits)}`
            : "No product prices available."}
        </p>
        <output id={summaryId} aria-live="polite" className="text-sm font-semibold tabular-nums text-slate-950">
          {hasRange ? `${formattedMinimum} to ${formattedMaximum}` : "Price filter unavailable"}
        </output>
      </div>
      <div className="mt-2 min-w-0">
        <div className="relative h-11 w-full min-w-0">
          <span aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-200" />
          <span
            aria-hidden="true"
            className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-slate-950"
            style={{ left: `${minimumPercent}%`, right: `${100 - maximumPercent}%` }}
          />
          <input
            id={minimumId}
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={bounds.step}
            value={minimumPrice}
            disabled={!hasRange}
            aria-valuetext={`${formattedMinimum}, minimum price`}
            aria-describedby={`${helpId} ${summaryId}`}
            onChange={(event) => updateMinimum(Number(event.target.value))}
            onKeyDown={(event) => handleKeyDown("minimum", event)}
            className="price-range-input absolute inset-0 h-11 w-full"
          />
          <input
            id={maximumId}
            type="range"
            min={bounds.min}
            max={bounds.max}
            step={bounds.step}
            value={maximumPrice}
            disabled={!hasRange}
            aria-valuetext={`${formattedMaximum}, maximum price`}
            aria-describedby={`${helpId} ${summaryId}`}
            onChange={(event) => updateMaximum(Number(event.target.value))}
            onKeyDown={(event) => handleKeyDown("maximum", event)}
            className="price-range-input absolute inset-0 h-11 w-full"
          />
        </div>
        <div className="mt-1 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor={minimumId} className="block text-sm font-medium text-slate-700">
              Minimum price
            </label>
            <output htmlFor={minimumId} className="mt-0.5 block text-sm font-semibold tabular-nums text-slate-950">
              {formattedMinimum}
            </output>
          </div>
          <div className="text-right">
            <label htmlFor={maximumId} className="block text-sm font-medium text-slate-700">
              Maximum price
            </label>
            <output htmlFor={maximumId} className="mt-0.5 block text-sm font-semibold tabular-nums text-slate-950">
              {formattedMaximum}
            </output>
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={applyPriceRange} disabled={!hasRange}>
          Apply
        </Button>
        <Button type="button" variant="ghost" onClick={clearPriceRange}>
          Clear
        </Button>
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
