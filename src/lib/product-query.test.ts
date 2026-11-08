import { describe, expect, it } from "vitest";

import {
  applyProductQueryToSearchParams,
  formatCategoryLabel,
  getBrandOptions,
  getCategoryOptions,
  getProductBySlug,
  paginateProducts,
  parseProductQuery,
  queryProducts,
  serializeProductQuery,
  type ProductQuery,
} from "@/lib/product-query";
import type { Product } from "@/types/product";

const catalog: Product[] = [
  {
    id: "test-1", slug: "alpha-shirt", name: "Alpha Shirt", brand: "Northline", category: "apparel",
    description: "Breathable cotton shirt for warm days.", price: 50, image: "alpha shirt", rating: 4.4,
    attributes: { color: "White", size: "M", material: "Cotton" },
  },
  {
    id: "test-2", slug: "bravo-runner", name: "Bravo Runner", brand: "Motion Lab", category: "footwear",
    description: "Lightweight running shoe with responsive foam.", price: 120, image: "bravo runner", rating: 4.9,
    attributes: { color: "Black", size: "EU 42", material: "Knit" },
  },
  {
    id: "test-3", slug: "carry-tote", name: "Carry Tote", brand: "Carry Studio", category: "accessories",
    description: "Oversized tote for daily commerce essentials.", price: 40, image: "carry tote", rating: 4.1,
    attributes: { color: "Natural", size: "18L", material: "Linen" },
  },
];

const validBrands = catalog.map((product) => product.brand);
const validCategories = catalog.map((product) => product.category);
const defaultQuery: ProductQuery = { q: "", brands: [], categories: [], sort: "name-asc", page: 1 };

describe("parseProductQuery", () => {
  it("uses safe defaults for empty search params", () => {
    expect(parseProductQuery({})).toEqual(defaultQuery);
  });

  it("parses comma-separated, repeated, and mixed facet values", () => {
    expect(
      parseProductQuery(
        { q: "  shirt  ", brand: ["Northline, Motion Lab", "Carry Studio"], category: ["apparel", "footwear,accessories"], sort: "price-asc" },
        validBrands,
        validCategories,
      ),
    ).toEqual({
      q: "shirt",
      brands: ["Northline", "Motion Lab", "Carry Studio"],
      categories: ["apparel", "footwear", "accessories"],
      sort: "price-asc",
      page: 1,
    });
  });

  it("trims, deduplicates, and ignores empty or invalid facet values", () => {
    expect(
      parseProductQuery(
        { brand: [" Northline, ,Northline", "unknown"], category: ["apparel,invalid", "", "apparel"] },
        validBrands,
        validCategories,
      ),
    ).toEqual({ ...defaultQuery, brands: ["Northline"], categories: ["apparel"] });
  });

  it("keeps dynamic facets when no catalog allow-list is provided", () => {
    expect(parseProductQuery({ brand: "Acme", category: "home-decoration" })).toEqual({
      ...defaultQuery,
      brands: ["Acme"],
      categories: ["home-decoration"],
    });
  });

  it("uses the first value for singular parameters and parses a positive page", () => {
    expect(parseProductQuery({ q: ["shoe", "shirt"], sort: ["rating-desc", "price-asc"], page: ["2", "3"] })).toEqual({
      ...defaultQuery,
      q: "shoe",
      sort: "rating-desc",
      page: 2,
    });
  });

  it("falls back for invalid sort and page values", () => {
    expect(parseProductQuery({ sort: "unknown", page: "0" })).toEqual(defaultQuery);
  });

  it("parses minimum-only, maximum-only, and bounded price ranges", () => {
    expect(parseProductQuery({ priceMin: "50" })).toEqual({ ...defaultQuery, price: { min: 50 } });
    expect(parseProductQuery({ priceMax: "120" })).toEqual({ ...defaultQuery, price: { max: 120 } });
    expect(parseProductQuery({ priceMin: "50", priceMax: "120" })).toEqual({ ...defaultQuery, price: { min: 50, max: 120 } });
  });

  it("ignores invalid price bounds and reversed price ranges", () => {
    ["", "not-a-number", "NaN", "Infinity", "0", "-10"].forEach((value) => {
      expect(parseProductQuery({ priceMin: value })).toEqual(defaultQuery);
      expect(parseProductQuery({ priceMax: value })).toEqual(defaultQuery);
    });

    expect(parseProductQuery({ priceMin: "50", priceMax: "invalid" })).toEqual({ ...defaultQuery, price: { min: 50 } });
    expect(parseProductQuery({ priceMin: "200", priceMax: "100" })).toEqual(defaultQuery);
  });
});

describe("product query serialization", () => {
  it("omits empty facets and default sort and page", () => {
    expect(serializeProductQuery(defaultQuery).toString()).toBe("");
  });

  it("serializes single and multiple facets canonically", () => {
    expect(
      serializeProductQuery({ q: "shirt", brands: ["Northline", "Motion Lab"], categories: ["apparel"], sort: "price-desc", page: 2 }).toString(),
    ).toBe("q=shirt&brand=Northline%2CMotion+Lab&category=apparel&sort=price-desc&page=2");
  });

  it("serializes valid price bounds and omits invalid ranges", () => {
    expect(serializeProductQuery({ ...defaultQuery, price: { min: 50 } }).toString()).toBe("priceMin=50");
    expect(serializeProductQuery({ ...defaultQuery, price: { max: 120 } }).toString()).toBe("priceMax=120");
    expect(serializeProductQuery({ ...defaultQuery, price: { min: 50, max: 120 } }).toString()).toBe("priceMin=50&priceMax=120");
    expect(serializeProductQuery({ ...defaultQuery, price: { min: 120, max: 50 } }).toString()).toBe("");
  });

  it("preserves unrelated parameters while replacing known query values", () => {
    const params = applyProductQueryToSearchParams(new URLSearchParams("ref=campaign&brand=unknown&priceMin=10&priceMax=20&page=8"), {
      ...defaultQuery,
      brands: ["Northline"],
      price: { min: 50, max: 120 },
    });

    expect(params.toString()).toBe("ref=campaign&brand=Northline&priceMin=50&priceMax=120");
  });
});

describe("queryProducts", () => {
  it("searches by name, brand, and description case-insensitively", () => {
    expect(queryProducts({ ...defaultQuery, q: "alpha" }, catalog).map((product) => product.slug)).toEqual(["alpha-shirt"]);
    expect(queryProducts({ ...defaultQuery, q: "motion lab" }, catalog).map((product) => product.slug)).toEqual(["bravo-runner"]);
    expect(queryProducts({ ...defaultQuery, q: "ESSENTIALS" }, catalog).map((product) => product.slug)).toEqual(["carry-tote"]);
  });

  it("combines values within each facet using OR", () => {
    expect(queryProducts({ ...defaultQuery, brands: ["Northline", "Carry Studio"] }, catalog).map((product) => product.slug)).toEqual([
      "alpha-shirt", "carry-tote",
    ]);
    expect(queryProducts({ ...defaultQuery, categories: ["footwear", "accessories"] }, catalog).map((product) => product.slug)).toEqual([
      "bravo-runner", "carry-tote",
    ]);
  });

  it("combines facets, search, and sorting using AND", () => {
    expect(
      queryProducts(
        { q: "daily", brands: ["Carry Studio", "Northline"], categories: ["accessories", "apparel"], price: { min: 40, max: 40 }, sort: "price-desc", page: 1 },
        catalog,
      ).map((product) => product.slug),
    ).toEqual(["carry-tote"]);
  });

  it("filters inclusively by minimum-only, maximum-only, and bounded prices", () => {
    expect(queryProducts({ ...defaultQuery, price: { min: 50 } }, catalog).map((product) => product.slug)).toEqual(["alpha-shirt", "bravo-runner"]);
    expect(queryProducts({ ...defaultQuery, price: { max: 50 } }, catalog).map((product) => product.slug)).toEqual(["alpha-shirt", "carry-tote"]);
    expect(queryProducts({ ...defaultQuery, price: { min: 50, max: 120 } }, catalog).map((product) => product.slug)).toEqual(["alpha-shirt", "bravo-runner"]);
  });

  it("sorts by name ascending by default and does not mutate the catalog", () => {
    const originalOrder = catalog.map((product) => product.slug);

    expect(queryProducts(defaultQuery, catalog).map((product) => product.slug)).toEqual(["alpha-shirt", "bravo-runner", "carry-tote"]);
    queryProducts({ ...defaultQuery, sort: "price-asc" }, catalog);
    expect(catalog.map((product) => product.slug)).toEqual(originalOrder);
  });
});

describe("product options and helpers", () => {
  it("returns products by slug", () => {
    expect(getProductBySlug("alpha-shirt", catalog)?.name).toBe("Alpha Shirt");
    expect(getProductBySlug("does-not-exist", catalog)).toBeUndefined();
  });

  it("returns sorted brand and category options", () => {
    expect(getBrandOptions(catalog)).toEqual([
      { value: "Carry Studio", label: "Carry Studio" },
      { value: "Motion Lab", label: "Motion Lab" },
      { value: "Northline", label: "Northline" },
    ]);
    expect(getCategoryOptions(catalog)).toEqual([
      { value: "accessories", label: "Accessories" },
      { value: "apparel", label: "Apparel" },
      { value: "footwear", label: "Footwear" },
    ]);
  });

  it("formats category slugs as readable labels", () => {
    expect(formatCategoryLabel("home-decoration")).toBe("Home Decoration");
    expect(formatCategoryLabel("mens_shoes")).toBe("Mens Shoes");
  });
});

describe("paginateProducts", () => {
  it("returns the requested slice with metadata and clamps page values", () => {
    expect(paginateProducts(catalog, 2, 2)).toMatchObject({ items: [catalog[2]], page: 2, totalPages: 2, startItem: 3, endItem: 3 });
    expect(paginateProducts(catalog, 99, 2).page).toBe(2);
  });

  it("handles empty catalogs", () => {
    expect(paginateProducts([], 3, 2)).toMatchObject({ items: [], page: 1, totalItems: 0, totalPages: 1 });
  });
});
