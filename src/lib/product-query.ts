import type { Product, ProductCategory } from "@/types/product";

export type ProductSort = "name-asc" | "price-asc" | "price-desc" | "rating-desc";

export const PRODUCTS_PER_PAGE = 24;

export type ProductQuery = {
  q: string;
  category: ProductCategory | "all";
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

export function parseProductQuery(searchParams: ProductSearchParams, validCategories?: ProductCategory[]): ProductQuery {
  const q = firstParam(searchParams.q)?.trim() ?? "";
  const category = firstParam(searchParams.category);
  const sort = firstParam(searchParams.sort);
  const hasKnownCategory = category && (!validCategories || validCategories.includes(category));

  return {
    q,
    category: hasKnownCategory ? category : "all",
    sort: sort && sortValues.includes(sort as ProductSort) ? (sort as ProductSort) : "name-asc",
    page: parsePage(searchParams.page),
  };
}

export function getCategoryOptions(catalog: Product[]) {
  return [...new Set(catalog.map((product) => product.category))]
    .toSorted((a, b) => formatCategoryLabel(a).localeCompare(formatCategoryLabel(b)))
    .map((value) => ({ value, label: formatCategoryLabel(value) }));
}

export function getProductBySlug(slug: string, catalog: Product[]) {
  return catalog.find((product) => product.slug === slug);
}

export function queryProducts(query: ProductQuery, catalog: Product[]) {
  const search = query.q.toLowerCase();

  return catalog
    .filter((product) => {
      const matchesCategory = query.category === "all" || product.category === query.category;
      const searchable = `${product.name} ${product.brand} ${product.description}`.toLowerCase();
      const matchesSearch = search.length === 0 || searchable.includes(search);

      return matchesCategory && matchesSearch;
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
