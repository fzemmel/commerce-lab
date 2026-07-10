import { products as localProducts } from "@/data/products";
import type { Product } from "@/types/product";

const PRODUCTS_API_URL = "https://dummyjson.com/products?limit=200";
const PRODUCTS_REVALIDATE_SECONDS = 60 * 60;

type DummyJsonProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage?: number;
  rating: number;
  brand?: string;
  sku?: string;
  stock?: number;
  availabilityStatus?: string;
  thumbnail?: string;
  images?: string[];
};

type DummyJsonProductsResponse = {
  products: DummyJsonProduct[];
};

export type ProductCatalogSource = "api" | "fallback";

export type ProductCatalogResult = {
  products: Product[];
  source: ProductCatalogSource;
};

function isDummyJsonProductsResponse(value: unknown): value is DummyJsonProductsResponse {
  if (!value || typeof value !== "object" || !("products" in value)) {
    return false;
  }

  return Array.isArray((value as { products: unknown }).products);
}

function slugify(value: string) {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "product";
}

function toOriginalPrice(price: number, discountPercentage?: number) {
  if (!discountPercentage || discountPercentage <= 0 || discountPercentage >= 100) {
    return undefined;
  }

  return Math.round((price / (1 - discountPercentage / 100)) * 100) / 100;
}

export function mapDummyProductToProduct(product: DummyJsonProduct): Product {
  const images = [product.thumbnail, ...(product.images ?? [])].filter((image): image is string => Boolean(image));
  const originalPrice = toOriginalPrice(product.price, product.discountPercentage);

  return {
    id: `dummy-${product.id}`,
    slug: `${slugify(product.title)}-${product.id}`,
    name: product.title,
    brand: product.brand?.trim() || "DummyJSON",
    category: product.category,
    description: product.description,
    price: product.price,
    originalPrice,
    image: product.thumbnail || product.images?.[0] || product.title,
    images,
    rating: product.rating,
    isSale: Boolean(originalPrice),
    source: "api",
    attributes: {
      availability: product.availabilityStatus ?? "Unknown",
      stock: typeof product.stock === "number" ? String(product.stock) : "Unknown",
      sku: product.sku ?? `DUMMY-${product.id}`,
    },
  };
}

function getFallbackCatalog(): ProductCatalogResult {
  return {
    products: localProducts.map((product) => ({ ...product, source: "local" })),
    source: "fallback",
  };
}

export async function getProductCatalog(): Promise<ProductCatalogResult> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);

    const response = await fetch(PRODUCTS_API_URL, {
      next: { revalidate: PRODUCTS_REVALIDATE_SECONDS },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!response.ok) {
      return getFallbackCatalog();
    }

    const data: unknown = await response.json();

    if (!isDummyJsonProductsResponse(data)) {
      return getFallbackCatalog();
    }

    const products = data.products.map(mapDummyProductToProduct);

    return products.length > 0 ? { products, source: "api" } : getFallbackCatalog();
  } catch {
    return getFallbackCatalog();
  }
}
