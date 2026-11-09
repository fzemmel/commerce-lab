// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductFilters } from "@/components/filters/product-filters";
import { formatPrice } from "@/lib/format-price";
import type { ProductQuery } from "@/lib/product-query";
import { positionToPrice, priceToPosition } from "@/lib/price-scale";

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
  priceBounds: { min: 40, max: 200, step: 1 },
};

function renderFilters(query: ProductQuery) {
  return render(<ProductFilters query={query} {...options} />);
}

function positionForPrice(price: number) {
  return String(priceToPosition(price, options.priceBounds));
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
    const optionsList = panel.querySelector<HTMLElement>("[data-facet-options]");

    expect(optionsList).not.toBeNull();
    expect(optionsList?.className).toContain("p-2");

    fireEvent.mouseDown(optionsList as HTMLElement);
    fireEvent.click(optionsList as HTMLElement);

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

  it("remeasures the panel when selecting an option moves the trigger", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(300);
    const { rerender } = renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const trigger = brand.getByRole("button", { name: "Brand" });

    mockTriggerRect(trigger, { top: 120, bottom: 164 });
    await user.click(trigger);

    let panel = getPanel(trigger);
    expect(panel.style.maxHeight).toBe(`${300 - 164 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX}px`);
    expect(panel.className).toContain("top-full");

    // Selecting the first option renders the Clear row above the trigger and moves it down by ~36px.
    mockTriggerRect(trigger, { top: 156, bottom: 200 });
    rerender(<ProductFilters query={{ q: "", brands: ["Northline"], categories: [], sort: "name-asc", page: 1 }} {...options} />);

    panel = getPanel(trigger);
    const measuredAfterSelection = Number.parseFloat(panel.style.maxHeight);

    expect(panel.style.maxHeight).toBe(`${156 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX}px`);
    expect(panel.className).toContain("bottom-full");
    expect(panel.className).not.toContain("top-full");
    expect(156 - PANEL_GAP_PX - measuredAfterSelection).toBeGreaterThanOrEqual(0);

    // Clearing the last selection moves the trigger back up and flips the panel downward again.
    mockTriggerRect(trigger, { top: 120, bottom: 164 });
    rerender(<ProductFilters query={{ q: "", brands: [], categories: [], sort: "name-asc", page: 1 }} {...options} />);

    panel = getPanel(trigger);
    expect(panel.style.maxHeight).toBe(`${300 - 164 - VIEWPORT_MARGIN_PX - PANEL_GAP_PX}px`);
    expect(panel.className).toContain("top-full");
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

  it("keeps the dropdown open on blur without a related target, as browsers do when nothing focusable receives focus", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));

    const search = brand.getByRole("searchbox", { name: "Search brands" });
    fireEvent.focusOut(search, { relatedTarget: null });

    expect(brand.getByRole("searchbox", { name: "Search brands" })).toBeTruthy();
    expect(brand.getByRole("button", { name: "Brand" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("closes the dropdown when focus moves to a control outside of it", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");
    const outsideControl = screen.getByRole("button", { name: "Reset" });

    await user.click(brand.getByRole("button", { name: "Brand" }));

    const search = brand.getByRole("searchbox", { name: "Search brands" });
    fireEvent.focusOut(search, { relatedTarget: outsideControl });

    expect(brand.queryByRole("searchbox", { name: "Search brands" })).toBeNull();
    expect(brand.getByRole("button", { name: "Brand" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("returns focus to the search input when filtering removes the focused option", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const brand = getFacet("Brand");

    await user.click(brand.getByRole("button", { name: "Brand" }));

    const search = brand.getByRole("searchbox", { name: "Search brands" });
    const northline = brand.getByRole("checkbox", { name: "Northline" });

    northline.focus();
    expect(document.activeElement).toBe(northline);

    fireEvent.change(search, { target: { value: "motion" } });

    expect(brand.queryByRole("checkbox", { name: "Northline" })).toBeNull();
    expect(brand.getByRole("checkbox", { name: "Motion Lab" })).toBeTruthy();
    expect(document.activeElement).toBe(search);
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

    fireEvent.change(screen.getByRole("slider", { name: "Minimum price" }), {
      target: { value: positionForPrice(50) },
    });
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&priceMin=50&sort=price-desc", { scroll: false });
  });

  it("applies a maximum price while retaining other query state and resetting pagination", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });

    fireEvent.change(screen.getByRole("slider", { name: "Maximum price" }), {
      target: { value: positionForPrice(100) },
    });
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&priceMax=100&sort=price-desc", { scroll: false });
  });

  it("applies both price bounds and resets pagination", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });

    fireEvent.change(screen.getByRole("slider", { name: "Minimum price" }), {
      target: { value: positionForPrice(50) },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Maximum price" }), {
      target: { value: positionForPrice(120) },
    });
    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&priceMin=50&priceMax=120&sort=price-desc", { scroll: false });
  });

  it("moves slider positions by one with arrows, ten percent with Shift and Page keys, and to the endpoints", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const minimum = screen.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = screen.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    minimum.focus();
    await user.keyboard("{ArrowRight}");
    expect(minimum.value).toBe("1");

    await user.keyboard("{Shift>}{ArrowRight}{/Shift}");
    expect(minimum.value).toBe("101");

    await user.keyboard("{PageUp}");
    expect(minimum.value).toBe("201");

    await user.keyboard("{PageDown}");
    expect(minimum.value).toBe("101");

    await user.keyboard("{Home}");
    expect(minimum.value).toBe("0");

    await user.keyboard("{ArrowLeft}");
    expect(minimum.value).toBe("0");

    maximum.focus();
    await user.keyboard("{End}");
    expect(maximum.value).toBe("1000");

    await user.keyboard("{ArrowRight}");
    expect(maximum.value).toBe("1000");

    await user.keyboard("{PageDown}");
    expect(maximum.value).toBe("900");

    await user.keyboard("{ArrowDown}");
    expect(maximum.value).toBe("899");
  });

  it("applies a price range produced by keyboard position changes", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "shirt", brands: [], categories: [], sort: "price-desc", page: 3 });
    const minimum = screen.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = screen.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;
    const expectedMinimum = positionToPrice(100, options.priceBounds);
    const expectedMaximum = positionToPrice(900, options.priceBounds);

    minimum.focus();
    await user.keyboard("{PageUp}");

    maximum.focus();
    await user.keyboard("{PageDown}");

    expect(screen.getByText(`${formatPrice(expectedMinimum)} to ${formatPrice(expectedMaximum)}`)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Apply" }));

    expect(replace).toHaveBeenCalledWith(
      `/products?ref=campaign&q=shirt&priceMin=${expectedMinimum}&priceMax=${expectedMaximum}&sort=price-desc`,
      { scroll: false },
    );
  });

  it("pushes the opposite handle when a handle crosses it", () => {
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const minimum = screen.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = screen.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;
    const minimumPosition = positionForPrice(50);
    const maximumPosition = positionForPrice(120);

    fireEvent.change(minimum, { target: { value: maximumPosition } });
    expect(minimum.value).toBe(maximumPosition);
    expect(maximum.value).toBe("1000");

    fireEvent.change(maximum, { target: { value: minimumPosition } });
    expect(maximum.value).toBe(minimumPosition);
    expect(minimum.value).toBe(minimumPosition);
    expect(screen.getByText("€50 to €50")).toBeTruthy();

    fireEvent.change(minimum, { target: { value: "1000" } });
    expect(minimum.value).toBe("1000");
    expect(maximum.value).toBe("1000");
    expect(screen.getByText("€200 to €200")).toBeTruthy();

    fireEvent.change(maximum, { target: { value: "0" } });
    expect(maximum.value).toBe("0");
    expect(minimum.value).toBe("0");
    expect(screen.getByText("€40 to €40")).toBeTruthy();
  });

  it("raises the minimum handle when both handles coincide at the maximum bound", async () => {
    const user = userEvent.setup();
    currentSearchParams = "q=shirt&priceMin=200&priceMax=200&sort=name-asc&page=1&ref=campaign";
    renderFilters({ q: "shirt", brands: [], categories: [], price: { min: 200, max: 200 }, sort: "name-asc", page: 1 });
    const minimum = screen.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = screen.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    expect(Number(minimum.style.zIndex)).toBeGreaterThan(Number(maximum.style.zIndex));

    await act(async () => {
      maximum.focus();
    });
    expect(Number(maximum.style.zIndex)).toBeGreaterThan(Number(minimum.style.zIndex));

    await act(async () => {
      minimum.focus();
    });
    expect(Number(minimum.style.zIndex)).toBeGreaterThan(Number(maximum.style.zIndex));

    await user.keyboard("{PageDown}");

    expect(minimum.value).toBe("900");
    expect(maximum.value).toBe("1000");
    expect(screen.getByText("€170 to €200")).toBeTruthy();
  });

  it("raises the maximum handle when both handles coincide at the minimum bound", async () => {
    const user = userEvent.setup();
    currentSearchParams = "q=shirt&priceMin=40&priceMax=40&sort=name-asc&page=1&ref=campaign";
    renderFilters({ q: "shirt", brands: [], categories: [], price: { min: 40, max: 40 }, sort: "name-asc", page: 1 });
    const minimum = screen.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = screen.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    expect(Number(maximum.style.zIndex)).toBeGreaterThan(Number(minimum.style.zIndex));

    maximum.focus();
    await user.keyboard("{PageUp}");

    expect(maximum.value).toBe("100");
    expect(minimum.value).toBe("0");
    expect(screen.getByText("€40 to €47")).toBeTruthy();
  });

  it("clears both price bounds, resets the handles, and retains other active filters", async () => {
    const user = userEvent.setup();
    currentSearchParams = "q=shirt&brand=Northline&priceMin=50&priceMax=120&sort=price-desc&page=3&ref=campaign";
    renderFilters({ q: "shirt", brands: ["Northline"], categories: [], price: { min: 50, max: 120 }, sort: "price-desc", page: 3 });
    const priceRange = within(screen.getByRole("group", { name: "Price range" }));

    await user.click(priceRange.getByRole("button", { name: "Clear" }));

    expect(replace).toHaveBeenCalledWith("/products?ref=campaign&q=shirt&brand=Northline&sort=price-desc", { scroll: false });
    expect((priceRange.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement).value).toBe("0");
    expect((priceRange.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement).value).toBe("1000");
    expect(priceRange.getByText("€40 to €200")).toBeTruthy();
  });

  it("disables Clear when no price is applied and the handles are at the catalog bounds", () => {
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const priceRange = within(screen.getByRole("group", { name: "Price range" }));

    expect((priceRange.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("resets an unapplied price draft locally without navigating", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const priceRange = within(screen.getByRole("group", { name: "Price range" }));
    const minimum = priceRange.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = priceRange.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    fireEvent.change(minimum, { target: { value: positionForPrice(50) } });
    expect((priceRange.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(false);

    await user.click(priceRange.getByRole("button", { name: "Clear" }));

    expect(replace).not.toHaveBeenCalled();
    expect(minimum.value).toBe("0");
    expect(maximum.value).toBe("1000");
    expect(priceRange.getByText("€40 to €200")).toBeTruthy();
  });

  it("resets an unapplied price draft when the global Reset control is used", async () => {
    const user = userEvent.setup();
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const priceRange = within(screen.getByRole("group", { name: "Price range" }));
    const minimum = priceRange.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;

    fireEvent.change(minimum, { target: { value: positionForPrice(50) } });
    await user.click(screen.getByRole("button", { name: "Reset" }));

    expect(replace).toHaveBeenCalledWith("/products", { scroll: false });
    expect((screen.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement).value).toBe("0");
    expect((screen.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement).value).toBe("1000");
  });

  it("does not clamp an out-of-catalog URL range onto the slider", () => {
    currentSearchParams = "q=shirt&priceMin=500&sort=name-asc&page=1&ref=campaign";
    renderFilters({ q: "shirt", brands: [], categories: [], price: { min: 500 }, sort: "name-asc", page: 1 });
    const priceRange = within(screen.getByRole("group", { name: "Price range" }));

    expect((priceRange.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement).value).toBe("0");
    expect((priceRange.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement).value).toBe("1000");
    expect(priceRange.getByText("The requested price range is outside the available catalog prices.")).toBeTruthy();
    expect((priceRange.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("preserves price bounds when brand, category, or sort changes", async () => {
    const user = userEvent.setup();
    currentSearchParams = "q=shirt&priceMin=50&priceMax=120&sort=name-asc&page=2";
    const { rerender } = renderFilters({ q: "shirt", brands: [], categories: [], price: { min: 50, max: 120 }, sort: "name-asc", page: 2 });
    const brand = getFacet("Brand");
    const category = getFacet("Category");

    await user.click(brand.getByRole("button", { name: "Brand" }));
    await user.click(brand.getByRole("checkbox", { name: "Northline" }));

    expect(replace).toHaveBeenLastCalledWith("/products?q=shirt&brand=Northline&priceMin=50&priceMax=120", { scroll: false });

    currentSearchParams = "q=shirt&brand=Northline&priceMin=50&priceMax=120&sort=name-asc";
    rerender(
      <ProductFilters
        query={{ q: "shirt", brands: ["Northline"], categories: [], price: { min: 50, max: 120 }, sort: "name-asc", page: 1 }}
        {...options}
      />,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Sort by" }), "price-desc");

    expect(replace).toHaveBeenLastCalledWith(
      "/products?q=shirt&brand=Northline&priceMin=50&priceMax=120&sort=price-desc",
      { scroll: false },
    );

    currentSearchParams = "q=shirt&brand=Northline&priceMin=50&priceMax=120&sort=price-desc";
    rerender(
      <ProductFilters
        query={{ q: "shirt", brands: ["Northline"], categories: [], price: { min: 50, max: 120 }, sort: "price-desc", page: 1 }}
        {...options}
      />,
    );

    await user.click(category.getByRole("button", { name: "Category" }));
    await user.click(category.getByRole("checkbox", { name: "Apparel" }));

    expect(replace).toHaveBeenLastCalledWith(
      "/products?q=shirt&brand=Northline&category=apparel&priceMin=50&priceMax=120&sort=price-desc",
      { scroll: false },
    );
  });

  it("exposes catalog limits, price-based accessible values, and touch-sized controls for narrow viewports", () => {
    renderFilters({ q: "", brands: [], categories: [], sort: "name-asc", page: 1 });
    const priceRange = within(screen.getByRole("group", { name: "Price range" }));
    const minimum = priceRange.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = priceRange.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;
    const sliderRow = minimum.parentElement as HTMLElement;

    expect(minimum.getAttribute("min")).toBe("0");
    expect(minimum.getAttribute("max")).toBe("1000");
    expect(minimum.getAttribute("step")).toBe("1");
    expect(maximum.getAttribute("min")).toBe("0");
    expect(maximum.getAttribute("max")).toBe("1000");
    expect(minimum.getAttribute("aria-valuetext")).toBe("€40, minimum price");
    expect(maximum.getAttribute("aria-valuetext")).toBe("€200, maximum price");
    expect(minimum.getAttribute("aria-describedby")).toContain("price-range-help");
    expect(minimum.getAttribute("aria-describedby")).not.toContain("price-range-summary");

    expect(minimum.className).toContain("h-11");
    expect(minimum.className).toContain("w-full");
    expect(sliderRow.className).toContain("h-11");
    expect(sliderRow.className).toContain("w-full");
    expect(sliderRow.className).toContain("min-w-0");
    expect(screen.getByText("€40 to €200").getAttribute("aria-live")).toBe("polite");
    expect(priceRange.getByText("Catalog prices €40 to €200")).toBeTruthy();
  });

  it("disables the handles when the catalog has no price range", () => {
    render(<ProductFilters query={{ q: "", brands: [], categories: [], sort: "name-asc", page: 1 }} {...options} priceBounds={{ min: 0, max: 0, step: 1 }} />);
    const priceRange = within(screen.getByRole("group", { name: "Price range" }));

    expect((priceRange.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement).disabled).toBe(true);
    expect((priceRange.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement).disabled).toBe(true);
    expect((priceRange.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(true);
    expect((priceRange.getByRole("button", { name: "Clear" }) as HTMLButtonElement).disabled).toBe(true);
    expect(priceRange.getByText("Price filter unavailable")).toBeTruthy();
  });

  it("synchronizes price handles when URL-derived query props change", () => {
    const { rerender } = renderFilters({ q: "", brands: [], categories: [], price: { min: 50 }, sort: "name-asc", page: 1 });

    rerender(<ProductFilters query={{ q: "", brands: [], categories: [], price: { min: 100, max: 200 }, sort: "name-asc", page: 1 }} {...options} />);

    expect((screen.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement).value).toBe(
      String(priceToPosition(100, options.priceBounds)),
    );
    expect((screen.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement).value).toBe("1000");
  });

  it("makes low and high prices reachable with production-like catalog bounds", () => {
    const productionBounds = { min: 0.79, max: 36999.99, step: 0.01 };
    const lowPosition = priceToPosition(1, productionBounds);
    const highPosition = priceToPosition(30000, productionBounds);

    render(
      <ProductFilters
        query={{ q: "", brands: [], categories: [], sort: "name-asc", page: 1 }}
        {...options}
        priceBounds={productionBounds}
      />,
    );

    const priceRange = within(screen.getByRole("group", { name: "Price range" }));
    const minimum = priceRange.getByRole("slider", { name: "Minimum price" }) as HTMLInputElement;
    const maximum = priceRange.getByRole("slider", { name: "Maximum price" }) as HTMLInputElement;

    expect(minimum.getAttribute("min")).toBe("0");
    expect(minimum.getAttribute("max")).toBe("1000");
    expect(minimum.getAttribute("step")).toBe("1");
    expect(minimum.getAttribute("aria-valuetext")).toBe("€0.79, minimum price");
    expect(maximum.getAttribute("aria-valuetext")).toBe("€36,999.99, maximum price");
    expect(priceRange.getByText("Catalog prices €0.79 to €36,999.99")).toBeTruthy();
    expect(lowPosition).toBeGreaterThanOrEqual(20);
    expect(lowPosition).toBeLessThan(30);
    expect(highPosition).toBeGreaterThanOrEqual(980);

    fireEvent.change(maximum, { target: { value: String(lowPosition) } });

    expect(
      priceRange.getByText(`€0.79 to ${formatPrice(positionToPrice(lowPosition, productionBounds), 2)}`),
    ).toBeTruthy();

    fireEvent.change(minimum, { target: { value: String(highPosition) } });
    fireEvent.change(maximum, { target: { value: "1000" } });

    expect(
      priceRange.getByText(`${formatPrice(positionToPrice(highPosition, productionBounds), 2)} to €36,999.99`),
    ).toBeTruthy();
  });
});
