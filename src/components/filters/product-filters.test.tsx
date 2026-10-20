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

    await user.click(screen.getByRole("button", { name: "Brand" }));
    await user.click(screen.getByRole("checkbox", { name: "Northline" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
  });

  it("removes one selected value while retaining other values", async () => {
    const user = userEvent.setup();
    currentSearchParams = "brand=Northline,Motion+Lab&q=shirt&sort=price-desc&page=3&ref=campaign";
    renderFilters({ q: "shirt", brands: ["Northline", "Motion Lab"], categories: [], sort: "price-desc", page: 3 });

    await user.click(screen.getByRole("button", { name: "Brand (2)" }));
    expect((screen.getByRole("checkbox", { name: "Northline" }) as HTMLInputElement).checked).toBe(true);
    await user.click(screen.getByRole("checkbox", { name: "Northline" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Motion+Lab&sort=price-desc", { scroll: false });
  });

  it("clears only the selected facet group", async () => {
    const user = userEvent.setup();
    currentSearchParams = "brand=Northline&category=apparel,footwear&q=shirt&sort=price-desc&page=3&ref=campaign";
    renderFilters({ q: "shirt", brands: ["Northline"], categories: ["apparel", "footwear"], sort: "price-desc", page: 3 });

    await user.click(screen.getByRole("button", { name: "Category (2)" }));
    await user.click(within(screen.getByRole("group", { name: "Category" })).getByRole("button", { name: "Clear selected Category" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
  });

  it("filters options, resets the option search, and shows an empty state", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });

    await user.click(screen.getByRole("button", { name: "Brand" }));
    const search = screen.getByLabelText("Search Brand options");
    await user.type(search, "motion");

    expect(screen.getByRole("checkbox", { name: "Motion Lab" })).toBeDefined();
    expect(screen.queryByRole("checkbox", { name: "Northline" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Clear Brand search" }));
    expect((search as HTMLInputElement).value).toBe("");
    expect(screen.getByRole("checkbox", { name: "Northline" })).toBeDefined();

    await user.type(search, "unknown");
    expect(screen.getByText("No matching options.")).toBeDefined();
  });

  it("keeps the facet open while selecting and deselecting values", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: ["Northline"], categories: [], sort: "price-desc", page: 3 });

    const trigger = screen.getByRole("button", { name: "Brand (1)" });
    await user.click(trigger);
    await user.click(screen.getByRole("checkbox", { name: "Northline" }));
    await user.click(screen.getByRole("checkbox", { name: "Motion Lab" }));

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("checkbox", { name: "Northline" })).toBeDefined();
    expect(replace).toHaveBeenNthCalledWith(1, "/products?ref=campaign&q=shirt&sort=price-desc", { scroll: false });
    expect(replace).toHaveBeenNthCalledWith(2, "/products?ref=campaign&q=shirt&brand=Northline%2CMotion+Lab&sort=price-desc", { scroll: false });
  });

  it("opens from its trigger, focuses search, supports checkbox keyboard interaction, and restores focus on Escape", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });

    const trigger = screen.getByRole("button", { name: "Brand" });
    trigger.focus();
    await user.keyboard("{Enter}");

    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(screen.getByLabelText("Search Brand options"));

    const checkbox = screen.getByRole("checkbox", { name: "Northline" });
    checkbox.focus();
    await user.keyboard("[Space]");
    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });

    await user.keyboard("{Escape}");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("synchronizes the search input when URL-derived query props change", () => {
    const { rerender } = renderFilters({ q: "shirt", brands: [], categories: [], sort: "name-asc", page: 1 });

    rerender(<ProductFilters query={{ q: "runner", brands: [], categories: [], sort: "name-asc", page: 1 }} {...options} />);

    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("runner");
  });

  it("applies a minimum price while retaining other query state and resetting pagination", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });

    await user.type(screen.getByLabelText("Minimum price"), "50");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&priceMin=50&sort=price-desc", { scroll: false });
  });

  it("applies both price bounds and resets pagination", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });

    await user.type(screen.getByLabelText("Minimum price"), "50");
    await user.type(screen.getByLabelText("Maximum price"), "120");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&priceMin=50&priceMax=120&sort=price-desc", { scroll: false });
  });

  it("clears both price bounds while retaining other active filters", async () => {
    const user = userEvent.setup();
    currentSearchParams = "q=shirt&brand=Northline&priceMin=50&priceMax=120&sort=price-desc&page=3&ref=campaign";
    renderFilters({ q: "shirt", brands: ["Northline"], categories: [], price: { min: 50, max: 120 }, sort: "price-desc", page: 3 });

    await user.click(within(screen.getByRole("group", { name: "Price range" })).getByRole("button", { name: "Clear" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
  });

  it("shows a validation error and does not navigate for reversed price bounds", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });

    await user.type(screen.getByLabelText("Minimum price"), "120");
    await user.type(screen.getByLabelText("Maximum price"), "50");
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(screen.getByRole("alert").textContent).toBe("Minimum price cannot be greater than maximum price.");
    expect(replace).not.toHaveBeenCalled();
  });

  it("synchronizes price inputs when URL-derived query props change", () => {
    const { rerender } = renderFilters({ q: "", brands: [], categories: [], price: { min: 50 }, sort: "name-asc", page: 1 });

    rerender(<ProductFilters query={{ q: "", brands: [], categories: [], price: { min: 100, max: 200 }, sort: "name-asc", page: 1 }} {...options} />);

    expect((screen.getByLabelText("Minimum price") as HTMLInputElement).value).toBe("100");
    expect((screen.getByLabelText("Maximum price") as HTMLInputElement).value).toBe("200");
  });
});
