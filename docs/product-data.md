---
title: Product Data and Caching
description: DummyJSON to domain mapping, ISR caching, fallback catalog behavior, and comparison persistence.
---

# Product Data and Caching

Product data is loaded through a single data-access module, `src/lib/products-api.ts`. Routes and components consume the internal `Product` domain type and never depend on DummyJSON response shapes.

## Request flow

1. Server-rendered routes call `getProductCatalog()`.
2. `products-api.ts` requests the DummyJSON product endpoint with `limit=200`.
3. The response is validated and mapped into the internal `Product` type.
4. Next.js ISR caches the external response.
5. Invalid, empty, timed-out, or failed responses fall back to `src/data/products.ts`.
6. Rendering components consume the internal domain model.

```text
DummyJSON API
→ response validation
→ mapDummyProductToProduct()
→ Product[] with source "api"
→ server route query + render

on failure
→ localProducts with source "local"
```

## Caching and timeout

The external request uses Next.js ISR:

```ts
fetch("https://dummyjson.com/products?limit=200", {
  next: { revalidate: 60 * 60 },
});
```

The response is revalidated hourly. The request is aborted after five seconds so a slow external service cannot block rendering indefinitely.

## DummyJSON to domain mapping

| DummyJSON field | Domain field | Notes |
| --- | --- | --- |
| `id` | `id` | Prefixed as `dummy-<id>`. |
| `title` | `name` | Also slugified with the ID appended. |
| `title` | `slug` | Lowercase, non-alphanumeric characters replaced with hyphens. |
| `brand` | `brand` | Falls back to `DummyJSON` when missing or blank. |
| `category` | `category` | Kept as the catalog category value. |
| `description` | `description` | Passed through. |
| `price` | `price` | Passed through. |
| `discountPercentage` | `originalPrice`, `isSale` | Original price is derived when the discount is between 0 and 100. |
| `thumbnail` / `images` | `image`, `images` | Thumbnail first, then additional images, with empty values filtered out. |
| `rating` | `rating` | Passed through. |
| `availabilityStatus` | `attributes.availability` | Defaults to `Unknown`. |
| `stock` | `attributes.stock` | Converted to a string; defaults to `Unknown`. |
| `sku` | `attributes.sku` | Falls back to `DUMMY-<id>`. |

Mapped products receive `source: "api"`. Fallback products receive `source: "local"`.

## Domain type

The shared type lives in `src/types/product.ts`:

```ts
export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  isNew?: boolean;
  isSale?: boolean;
  source?: "api" | "local";
  attributes: ProductAttributes;
};
```

`ProductAttributes` allows known fields such as color, size, and material plus additional string attributes.

## Fallback catalog

The local catalog in `src/data/products.ts` is a complete in-repository dataset. `getProductCatalog()` returns it when:

- The HTTP response is not successful.
- The response body does not match the expected shape.
- The mapped product list is empty.
- The request throws or times out.

The catalog result includes a `source` field. The listing route uses it to display a status message when the fallback is active. The fallback path must remain usable without network access.

## Comparison selection persistence

Comparison selection is the only client-persisted listing-adjacent state:

- `ComparisonProvider` stores an array of `{ id }` objects.
- `sanitizeCompareProducts()` validates IDs, removes duplicates, and enforces the four-product limit.
- The provider restores selection from session storage after hydration and writes changes back after restoration.
- Storage failures are ignored, so private browsing or disabled storage does not break the page.
- The `/compare` route loads the catalog on the server and resolves selected IDs against it, so stale IDs simply do not render.

See [Application Architecture](/architecture) for the component boundary and [Product Discovery](/product-discovery) for the user-facing comparison flow.
