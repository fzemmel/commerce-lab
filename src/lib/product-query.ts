import type { Product, ProductCategory } from "@/types/product";

export type ProductSort = "name-asc" | "price-asc" | "price-desc" | "rating-desc";

export const PRODUCTS_PER_PAGE = 24;

export type ProductQuery = {
  q: string;
  brands: string[];
  categories: ProductCategory[];
  sort: ProductSort;
  page: number;
};

export type PaginatedProducts = {
  items: Product[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startItem: number;
  endItem: number;
};

export type SearchParamValue = string | string[] | undefined;
export type ProductSearchParams = Record<string, SearchParamValue>;

export const sortLabels: Record<ProductSort, string> = {
  "name-asc": "Name A-Z",
  "price-asc": "Price ascending",
  "price-desc": "Price descending",
  "rating-desc": "Rating descending",
};

const sortValues = Object.keys(sortLabels) as ProductSort[];

function firstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parseFacetValues(value: SearchParamValue, validValues?: string[]) {
  const values = (Array.isArray(value) ? value : [value])
    .flatMap((entry) => entry?.split(",") ?? [])
    .map((entry) => entry.trim())
    .filter(Boolean);
  const uniqueValues = [...new Set(values)];

  return validValues ? uniqueValues.filter((entry) => validValues.includes(entry)) : uniqueValues;
}

function serializeFacetValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function parsePage(value: SearchParamValue) {
  const page = Number.parseInt(firstParam(value) ?? "", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function formatCategoryLabel(category: ProductCategory) {
  return category
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

export function parseProductQuery(
  searchParams: ProductSearchParams,
  validBrands?: string[],
  validCategories?: ProductCategory[],
): ProductQuery {
  const q = firstParam(searchParams.q)?.trim() ?? "";
  const sort = firstParam(searchParams.sort);

  return {
    q,
    brands: parseFacetValues(searchParams.brand, validBrands),
    categories: parseFacetValues(searchParams.category, validCategories),
    sort: sort && sortValues.includes(sort as ProductSort) ? (sort as ProductSort) : "name-asc",
    page: parsePage(searchParams.page),
  };
}

export function serializeProductQuery(query: ProductQuery) {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  const brands = serializeFacetValues(query.brands);
  const categories = serializeFacetValues(query.categories);

  if (brands.length > 0) {
    params.set("brand", brands.join(","));
  }

  if (categories.length > 0) {
    params.set("category", categories.join(","));
  }

  if (query.sort !== "name-asc") {
    params.set("sort", query.sort);
  }

  if (query.page > 1) {
    params.set("page", String(query.page));
  }

  return params;
}

export function applyProductQueryToSearchParams(searchParams: Pick<URLSearchParams, "toString">, query: ProductQuery) {
  const params = new URLSearchParams(searchParams.toString());

  ["q", "brand", "category", "sort", "page"].forEach((key) => params.delete(key));
  serializeProductQuery(query).forEach((value, key) => params.set(key, value));

  return params;
}

export function getCategoryOptions(catalog: Product[]) {
  return [...new Set(catalog.map((product) => product.category))]
    .toSorted((a, b) => formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)))
    .map((value) => ({ value, label: formatCategoryLabel(value) }));
}

export function getBrandOptions(catalog: Product[]) {
  return [...new Set(catalog.map((product) => product.brand))]
    .toSorted((a, b) => a.localeCompare(b))
    .map((value) => ({ value, label: value }));
}

export function getProductBySlug(slug: string, catalog: Product[]) {
  return catalog.find((product) => product.slug === slug);
}

export function queryProducts(query: ProductQuery, catalog: Product[]) {
  const search = query.q.toLowerCase();

  return catalog
    .filter((product) => {
      const matchesBrand = query.brands.length === 0 || query.brands.includes(product.brand);
      const matchesCategory = query.categories.length === 0 || query.categories.includes(product.category);
      const searchable = `${product.name} ${product.brand} ${product.description}`.toLowerCase();
      const matchesSearch = search.length === 0 || searchable.includes(search);

      return matchesBrand && matchesCategory && matchesSearch;
    })
    .toSorted((a, b) => {
      switch (query.sort) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "rating-desc":
          return b.rating - a.rating;
        case "name-asc":
        default:
          return a.name.localeCompare(b.name);
      }
    });
}

export function paginateProducts(products: Product[], page: number, pageSize = PRODUCTS_PER_PAGE): PaginatedProducts {
  const normalizedPageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : PRODUCTS_PER_PAGE;
  const normalizedPage = Number.isFinite(page) ? Math.floor(page) : 1;
  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize));
  const safePage = Math.min(Math.max(normalizedPage, 1), totalPages);
  const startIndex = (safePage - 1) * normalizedPageSize;
  const items = products.slice(startIndex, startIndex + normalizedPageSize);
  const startItem = totalItems === 0 ? 0 : startIndex + 1;
  const endItem = totalItems === 0 ? 0 : startIndex + items.length;

  return {
    items,
    page: safePage,
    pageSize: normalizedPageSize,
    totalItems,
    totalPages,
    startItem,
    endItem,
  };
}
