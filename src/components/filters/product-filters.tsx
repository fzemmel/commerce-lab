"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useId, useState, useTransition, type KeyboardEvent } from "react";

import { FacetFilter } from "@/components/filters/facet-filter";
import { SearchInput } from "@/components/filters/search-input";
import { SortSelect } from "@/components/filters/sort-select";
import { Button } from "@/components/ui/button";
import { countDecimalPlaces } from "@/lib/decimal";
import { formatPrice } from "@/lib/format-price";
import {
  applyProductQueryToSearchParams,
  normalizePriceRange,
  type PriceBounds,
  type PriceRange,
  type ProductQuery,
  type ProductSort,
} from "@/lib/product-query";
import {
  clampPricePosition,
  positionToPrice,
  priceToPosition,
  PRICE_POSITION_MAX,
  PRICE_POSITION_MIN,
  PRICE_POSITION_STEP,
} from "@/lib/price-scale";
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
  const [resetCount, setResetCount] = useState(0);

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
    setResetCount((count) => count + 1);
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
        key={`${query.price?.min ?? ""}-${query.price?.max ?? ""}-${priceBounds.min}-${priceBounds.max}-${priceBounds.step}-${resetCount}`}
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

type PriceHandle = "minimum" | "maximum";

function PriceRangeControl({ bounds, initialPrice, onApply, onClear }: PriceRangeControlProps) {
  const id = useId();
  const minimumId = `${id}-minimum-price`;
  const maximumId = `${id}-maximum-price`;
  const helpId = `${id}-price-range-help`;
  const summaryId = `${id}-price-range-summary`;
  const hasRange = bounds.max > bounds.min;
  const fractionDigits = countDecimalPlaces(bounds.step);
  const normalizedPrice = normalizePriceRange(initialPrice, bounds);
  const initialDisplay = normalizedPrice.display;
  const initialMinimumPosition = hasRange ? priceToPosition(initialDisplay?.min ?? bounds.min, bounds) : PRICE_POSITION_MIN;
  const initialMaximumPosition = hasRange ? priceToPosition(initialDisplay?.max ?? bounds.max, bounds) : PRICE_POSITION_MIN;
  const [minimumPosition, setMinimumPosition] = useState(initialMinimumPosition);
  const [maximumPosition, setMaximumPosition] = useState(Math.max(initialMinimumPosition, initialMaximumPosition));
  const [activeHandle, setActiveHandle] = useState<PriceHandle | null>(null);
  const minimumPrice = positionToPrice(minimumPosition, bounds);
  const maximumPrice = positionToPrice(maximumPosition, bounds);
  const formattedMinimum = formatPrice(minimumPrice, fractionDigits);
  const formattedMaximum = formatPrice(maximumPrice, fractionDigits);
  const minimumPercent = hasRange ? (minimumPosition / PRICE_POSITION_MAX) * 100 : 0;
  const maximumPercent = hasRange ? (maximumPosition / PRICE_POSITION_MAX) * 100 : 100;
  const handlesAtBounds = minimumPosition === PRICE_POSITION_MIN && maximumPosition === PRICE_POSITION_MAX;
  const hasAppliedPrice = initialPrice !== undefined;
  const canClear = hasAppliedPrice || (hasRange && !handlesAtBounds);
  const coincidentAtMaximum = hasRange && minimumPosition === maximumPosition && maximumPosition === PRICE_POSITION_MAX;
  const coincidentAtMinimum = hasRange && minimumPosition === maximumPosition && minimumPosition === PRICE_POSITION_MIN;

  function updateMinimumPosition(nextPosition: number) {
    const position = clampPricePosition(nextPosition);

    setMinimumPosition(position);

    if (position > maximumPosition) {
      setMaximumPosition(position);
    }
  }

  function updateMaximumPosition(nextPosition: number) {
    const position = clampPricePosition(nextPosition);

    setMaximumPosition(position);

    if (position < minimumPosition) {
      setMinimumPosition(position);
    }
  }

  function handleZIndex(handle: PriceHandle) {
    if (activeHandle === handle) {
      return 30;
    }

    if (activeHandle) {
      return 20;
    }

    if (coincidentAtMaximum) {
      return handle === "minimum" ? 30 : 20;
    }

    if (coincidentAtMinimum) {
      return handle === "maximum" ? 30 : 20;
    }

    return handle === "maximum" ? 30 : 20;
  }

  function handleKeyDown(handle: PriceHandle, event: KeyboardEvent<HTMLInputElement>) {
    const currentPosition = handle === "minimum" ? minimumPosition : maximumPosition;
    const pageIncrement = PRICE_POSITION_MAX / 10;
    let nextPosition: number | undefined;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp":
        nextPosition = currentPosition + (event.shiftKey ? pageIncrement : PRICE_POSITION_STEP);
        break;
      case "ArrowLeft":
      case "ArrowDown":
        nextPosition = currentPosition - (event.shiftKey ? pageIncrement : PRICE_POSITION_STEP);
        break;
      case "PageUp":
        nextPosition = currentPosition + pageIncrement;
        break;
      case "PageDown":
        nextPosition = currentPosition - pageIncrement;
        break;
      case "Home":
        nextPosition = PRICE_POSITION_MIN;
        break;
      case "End":
        nextPosition = PRICE_POSITION_MAX;
        break;
      default:
        return;
    }

    event.preventDefault();

    if (handle === "minimum") {
      updateMinimumPosition(nextPosition);
    } else {
      updateMaximumPosition(nextPosition);
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
    setMinimumPosition(PRICE_POSITION_MIN);
    setMaximumPosition(PRICE_POSITION_MAX);
    setActiveHandle(null);

    if (hasAppliedPrice) {
      onClear();
    }
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
      {normalizedPrice.outOfBounds ? (
        <p className="mt-1 text-sm font-medium text-amber-800">
          The requested price range is outside the available catalog prices.
        </p>
      ) : null}
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
            min={PRICE_POSITION_MIN}
            max={PRICE_POSITION_MAX}
            step={PRICE_POSITION_STEP}
            value={minimumPosition}
            disabled={!hasRange}
            aria-valuetext={`${formattedMinimum}, minimum price`}
            aria-describedby={helpId}
            onChange={(event) => updateMinimumPosition(Number(event.target.value))}
            onKeyDown={(event) => handleKeyDown("minimum", event)}
            onPointerDown={() => setActiveHandle("minimum")}
            onFocus={() => setActiveHandle("minimum")}
            className="price-range-input absolute inset-0 h-11 w-full"
            style={{ zIndex: handleZIndex("minimum") }}
          />
          <input
            id={maximumId}
            type="range"
            min={PRICE_POSITION_MIN}
            max={PRICE_POSITION_MAX}
            step={PRICE_POSITION_STEP}
            value={maximumPosition}
            disabled={!hasRange}
            aria-valuetext={`${formattedMaximum}, maximum price`}
            aria-describedby={helpId}
            onChange={(event) => updateMaximumPosition(Number(event.target.value))}
            onKeyDown={(event) => handleKeyDown("maximum", event)}
            onPointerDown={() => setActiveHandle("maximum")}
            onFocus={() => setActiveHandle("maximum")}
            className="price-range-input absolute inset-0 h-11 w-full"
            style={{ zIndex: handleZIndex("maximum") }}
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
        <Button type="button" variant="ghost" onClick={clearPriceRange} disabled={!canClear}>
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
