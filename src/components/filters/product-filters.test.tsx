// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductFilters } from "@/components/filters/product-filters";
import type { ProductQuery } from "@/lib/product-query";

const VIEWPORT_MARGIN_PX = 16;
const PANEL_GAP_PX = 8;
const MAX_PANEL_HEIGHT_PX = 384;

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

function getFacet(label: "Brand" | "Category") {
  return within(screen.getByRole("group", { name: label }));
}

function mockTriggerRect(trigger: Element, { top, bottom }: { top: number; bottom: number }) {
  vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
    x: 0,
    y: top,
    width: 320,
    height: bottom - top,
    top,
    right: 320,
    bottom,
    left: 0,
    toJSON: () => ({}),
  } as DOMRect);
}

function getPanel(trigger: HTMLElement) {
  return document.getElementById(trigger.getAttribute("aria-controls") ?? "") as HTMLElement;
}

describe("ProductFilters", () => {
  beforeEach(() => {
    replace.mockReset();
    currentSearchParams = "q=shirt&sort=price-desc&page=3&ref=campaign";
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    Reflect.deleteProperty(window, "visualViewport");
  });

  it("selects a facet using canonical URL values, preserves parameters, and resets pagination", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));
    await user.click(brand.getByRole("checkbox", { name: "Northline" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
  });

  it("removes one selected value while retaining other values", async () => {
    const user = userEvent.setup();
    currentSearchParams = "brand=Northline,Motion+Lab&q=shirt&sort=price-desc&page=3&ref=campaign";
    renderFilters({ q: "shirt", brands: ["Northline", "Motion Lab"], categories: [], sort: "price-desc", page: 3 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: /^Brand/ }));

    expect((brand.getByRole("checkbox", { name: "Northline" }) as HTMLInputElement).checked).toBe(true);
    await user.click(brand.getByRole("checkbox", { name: "Northline" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Motion+Lab&sort=price-desc", { scroll: false });
  });

  it("clears only the selected facet group", async () => {
    const user = userEvent.setup();
    currentSearchParams = "brand=Northline&category=apparel,footwear&q=shirt&sort=price-desc&page=3&ref=campaign";
    renderFilters({ q: "shirt", brands: ["Northline"], categories: ["apparel", "footwear"], sort: "price-desc", page: 3 });

    await user.click(getFacet("Category").getByRole("button", { name: "Clear selected categories" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
  });

  it("filters facet options as the user types and restores them when the search is cleared", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));
    const search = brand.getByRole("searchbox", { name: "Search brands" });
    await user.type(search, "motion");

    expect(brand.getByRole("checkbox", { name: "Motion Lab" })).toBeTruthy();
    expect(brand.queryByRole("checkbox", { name: "Northline" })).toBeNull();

    await user.click(brand.getByRole("button", { name: "Clear search" }));

    expect((search as HTMLInputElement).value).toBe("");
    expect(brand.getByRole("checkbox", { name: "Northline" })).toBeTruthy();
    expect(document.activeElement).toBe(search);
  });

  it("shows an empty state when no facet option matches the search", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const category = getFacet("Category");

    await user.click(category.getByRole("button", { name: "Category" }));
    await user.type(category.getByRole("searchbox", { name: "Search categories" }), "zzz");

    expect(category.getByRole("status").textContent).toBe('No categories match "zzz".');
    expect(category.queryByRole("checkbox")).toBeNull();
  });

  it("shows the selected-option count next to a closed facet label", () => {
    renderFilters({ q: "", brands: ["Northline", "Motion Lab"], categories: ["apparel"], sort: "name-asc", page: 1 });
    const brandTrigger = getFacet("Brand").getByRole("button", { name: "Brand, 2 selected" });
    const brandBadge = within(brandTrigger).getByText(/^2/);
    const categoryTrigger = getFacet("Category").getByRole("button", { name: "Category, 1 selected" });
    const categoryBadge = within(categoryTrigger).getByText(/^1/);

    expect(brandTrigger.getAttribute("aria-describedby")).not.toBeNull();
    expect(brandBadge.textContent).toContain("2");
    expect(brandBadge.className).toContain("bg-amber-100");
    expect(categoryBadge.textContent).toContain("1");
    expect(categoryBadge.className).toContain("bg-amber-100");
    expect(screen.getByText("Selected brands: Northline, Motion Lab.")).toBeTruthy();
  });

  it("selects and deselects multiple options without closing the dropdown", async () => {
    const user = userEvent.setup();
    const { rerender } = renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();

    await user.click(brand.getByRole("checkbox", { name: "Northline" }));
    expect(replace).toHaveBeenLastCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();

    rerender(<ProductFilters query={{ q: "shirt", brands: ["Northline"], categories: [], sort: "price-desc", page: 3 }} {...options} />);
    expect((brand.getByRole("checkbox", { name: "Northline" }) as HTMLInputElement).checked).toBe(true);

    await user.click(brand.getByRole("checkbox", { name: "Motion Lab" }));
    expect(replace).toHaveBeenLastCalledWith("/products?ref=campaign&q=shirt&brand=Northline%2CMotion+Lab&sort=price-desc", { scroll: false });
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();

    rerender(<ProductFilters query={{ q: "shirt", brands: ["Northline", "Motion Lab"], categories: [], sort: "price-desc", page: 3 }} {...options} />);
    expect((brand.getByRole("checkbox", { name: "Northline" }) as HTMLInputElement).checked).toBe(true);
    expect((brand.getByRole("checkbox", { name: "Motion Lab" }) as HTMLInputElement).checked).toBe(true);

    await user.click(brand.getByRole("checkbox", { name: "Northline" }));
    expect(replace).toHaveBeenLastCalledWith("/products?ref=campaign&q=shirt&brand=Motion+Lab&sort=price-desc", { scroll: false });
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();
  });

  it("closes the dropdown when the user clicks outside of it", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();

    await user.click(screen.getByRole("searchbox", { name: "Search" }));

    expect(brand.queryByRole("searchbox", { name: "Search brands" })).toBeNull();
  });

  it("keeps the dropdown open and toggles the option when clicking the option label text", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));
    await user.click(brand.getByText("Northline"));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();
  });

  it("keeps the dropdown open when clicking panel padding", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const trigger = brand.getByRole("button", { name: "Brand" });

    await user.click(trigger);

    const panel = getPanel(trigger);
    const padding = panel.firstElementChild as HTMLElement;

    await user.click(padding);

    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });

  it("keeps the dropdown open when clicking the empty-state message", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));
    await user.type(brand.getByRole("searchbox", { name: "Search brands" }), "zzz");
    await user.click(brand.getByRole("status"));

    expect(brand.getByRole("status").textContent).toBe('No brands match "zzz".');
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();
  });

  it("constrains the panel to the available viewport space below the trigger and remeasures on viewport changes", async () => {
    const user = userEvent.setup();
    const viewportHeight = vi.spyOn(window, "innerHeight", "get").mockReturnValue(900);
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const trigger = brand.getByRole("button", { name: "Brand" });

    mockTriggerRect(trigger, { top: 100, bottom: 144 });
    await user.click(trigger);

    const panel = getPanel(trigger);
    const optionsList = panel.querySelector<HTMLElement>(".overflow-y-auto");

    expect(panel.style.maxHeight).toBe(`${MAX_PANEL_HEIGHT_PX}px`);
    expect(panel.className).toContain("overflow-hidden");
    expect(panel.className).toContain("top-full");
    expect(panel.className).not.toContain("bottom-full");
    expect(optionsList).not.toBeNull();
    expect(optionsList?.className).toContain("overflow-y-auto");

    viewportHeight.mockReturnValue(500);
    fireEvent(window, new Event("resize"));

    expect(panel.style.maxHeight).toBe(`${500 - 144 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX}px`);
  });

  it("clamps the panel to a short viewport instead of forcing a minimum height below the trigger", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(320);
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const trigger = brand.getByRole("button", { name: "Brand" });

    mockTriggerRect(trigger, { top: 120, bottom: 164 });
    await user.click(trigger);

    const panel = getPanel(trigger);
    const availableBelow = 320 - 164 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX;
    const availableAbove = 120 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX;
    const maxHeight = Number.parseFloat(panel.style.maxHeight);

    expect(availableBelow).toBeLessThan(160);
    expect(availableAbove).toBeLessThan(160);
    expect(maxHeight).toBe(availableBelow);
    expect(maxHeight).toBeLessThanOrEqual(availableBelow);
    expect(maxHeight).toBeLessThan(320);
    expect(164 + PANEL_GAP_PX + maxHeight).toBeLessThanOrEqual(320);
    expect(panel.className).toContain("top-full");
  });

  it("opens upward and clamps within a short viewport when above-space is larger", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(240);
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const trigger = brand.getByRole("button", { name: "Brand" });

    mockTriggerRect(trigger, { top: 130, bottom: 174 });
    await user.click(trigger);

    const panel = getPanel(trigger);
    const availableBelow = 240 - 174 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX;
    const availableAbove = 130 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX;
    const maxHeight = Number.parseFloat(panel.style.maxHeight);

    expect(availableBelow).toBeLessThan(160);
    expect(availableAbove).toBeLessThan(160);
    expect(maxHeight).toBe(availableAbove);
    expect(maxHeight).toBeLessThanOrEqual(availableAbove);
    expect(maxHeight).toBeLessThan(240);
    expect(130 - PANEL_GAP_PX - maxHeight).toBeGreaterThanOrEqual(0);
    expect(panel.className).toContain("bottom-full");
    expect(panel.className).not.toContain("top-full");
  });

  it("measures against the visual viewport height and offset when it is available", async () => {
    const user = userEvent.setup();
    let visualHeight = 400;
    const visualViewport = Object.assign(new EventTarget(), { height: 400, offsetTop: 0 });

    Object.defineProperty(visualViewport, "height", { configurable: true, get: () => visualHeight });
    Object.defineProperty(window, "visualViewport", { configurable: true, value: visualViewport });
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(900);
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const trigger = brand.getByRole("button", { name: "Brand" });

    mockTriggerRect(trigger, { top: 100, bottom: 144 });
    await user.click(trigger);

    const panel = getPanel(trigger);

    expect(panel.style.maxHeight).toBe(`${400 - 144 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX}px`);
    expect(panel.className).toContain("top-full");

    visualHeight = 200;
    act(() => {
      visualViewport.dispatchEvent(new Event("resize"));
    });

    expect(panel.style.maxHeight).toBe(`${100 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX}px`);
    expect(panel.className).toContain("bottom-full");
  });

  it("ignores scroll events from the panel's own option list", async () => {
    const user = userEvent.setup();
    const viewportHeight = vi.spyOn(window, "innerHeight", "get").mockReturnValue(900);
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const trigger = brand.getByRole("button", { name: "Brand" });

    mockTriggerRect(trigger, { top: 100, bottom: 144 });
    await user.click(trigger);

    const panel = getPanel(trigger);
    const optionsList = panel.querySelector<HTMLElement>(".overflow-y-auto");

    expect(panel.style.maxHeight).toBe(`${MAX_PANEL_HEIGHT_PX}px`);

    viewportHeight.mockReturnValue(500);
    fireEvent.scroll(optionsList as HTMLElement);

    expect(panel.style.maxHeight).toBe(`${MAX_PANEL_HEIGHT_PX}px`);
  });

  it("closes the dropdown when focus leaves it with Tab", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const category = getFacet("Category");

    await user.click(brand.getByRole("button", { name: "Brand" }));

    brand.getByRole("searchbox", { name: "Search brands" }).focus();
    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();

    expect(document.activeElement).toBe(category.getByRole("button", { name: "Category" }));
    expect(brand.queryByRole("searchbox", { name: "Search brands" })).toBeNull();
  });

  it("opens with the keyboard, tabs through the search and options, and closes on Escape with focus returned", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const trigger = brand.getByRole("button", { name: "Brand" });

    trigger.focus();
    await user.keyboard("{Enter}");

    const search = brand.getByRole("searchbox", { name: "Search brands" });
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(document.activeElement).toBe(search);

    await user.tab();
    expect(document.activeElement).toBe(brand.getByRole("button", { name: "Clear search" }));

    await user.tab();
    expect(document.activeElement).toBe(brand.getByRole("checkbox", { name: "Northline" }));

    await user.keyboard("{Escape}");

    expect(brand.queryByRole("searchbox", { name: "Search brands" })).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(trigger);
  });

  it("toggles options with Space without closing the dropdown", async () => {
    const user = userEvent.setup();
    const { rerender } = renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));

    brand.getByRole("checkbox", { name: "Northline" }).focus();
    await user.keyboard(" ");
    expect(replace).toHaveBeenLastCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();

    rerender(<ProductFilters query={{ q: "shirt", brands: ["Northline"], categories: [], sort: "price-desc", page: 3 }} {...options} />);

    brand.getByRole("checkbox", { name: "Motion Lab" }).focus();
    await user.keyboard(" ");
    expect(replace).toHaveBeenLastCalledWith("/products?ref=campaign&q=shirt&brand=Northline%2CMotion+Lab&sort=price-desc", { scroll: false });
    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();
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
