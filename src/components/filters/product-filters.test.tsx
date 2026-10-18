// @vitest-environment jsdom

import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductFilters } from "@/components/filters/product-filters";
import type { ProductQuery } from "@/lib/product-query";

const replace = vi.fn();
let currentSearchParams = "q=shirt&sort=price-desc&page=3&ref=campaign";

vi.mock("next/navigation", () => ({
  usePathname: () => "/products",
  useRouter: () => ({ replace }),
  useSearchParams: () => new URLSearchParams(currentSearchParams),
}));

const options = {
  brandOptions: [
    { value: "Northline", label: "Northline" },
    { value: "Motion Lab", label: "Motion Lab" },
  ],
  categoryOptions: [
    { value: "apparel", label: "Apparel" },
    { value: "footwear", label: "Footwear" },
  ],
};

function renderFilters(query: ProductQuery) {
  return render(<ProductFilters query={query} {...options} />);
}

describe("ProductFilters", () => {
  beforeEach(() => {
    replace.mockReset();
    currentSearchParams = "q=shirt&sort=price-desc&page=3&ref=campaign";
  });

  afterEach(cleanup);

  it("selects a facet using canonical URL values, preserves parameters, and resets pagination", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });

    await user.click(screen.getByRole("checkbox", { name: "Northline" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
  });

  it("removes one selected value while retaining other values", async () => {
    const user = userEvent.setup();
    currentSearchParams = "brand=Northline,Motion+Lab&q=shirt&sort=price-desc&page=3&ref=campaign";
    renderFilters({ q: "shirt", brands: ["Northline", "Motion Lab"], categories: [], sort: "price-desc", page: 3 });

    expect((screen.getByRole("checkbox", { name: "Northline" }) as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole("checkbox", { name: "Northline" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Motion+Lab&sort=price-desc", { scroll: false });
  });

  it("clears only the selected facet group", async () => {
    const user = userEvent.setup();
    currentSearchParams = "brand=Northline&category=apparel,footwear&q=shirt&sort=price-desc&page=3&ref=campaign";
    renderFilters({ q: "shirt", brands: ["Northline"], categories: ["apparel", "footwear"], sort: "price-desc", page: 3 });

    await user.click(within(screen.getByRole("group", { name: "Category" })).getByRole("button", { name: "Clear" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
  });

  it("synchronizes the search input when URL-derived query props change", () => {
    const { rerender } = renderFilters({ q: "shirt", brands: [], categories: [], sort: "name-asc", page: 1 });

    rerender(<ProductFilters query={{ q: "runner", brands: [], categories: [], sort: "name-asc", page: 1 }} {...options} />);

    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("runner");
  });
});
