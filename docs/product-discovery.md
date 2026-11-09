---
title: Product Discovery
description: Search, facets, price filtering, sorting, pagination, and comparison behavior in Commerce Lab.
---

# Product Discovery

The `/products` route is the main discovery surface. Search, brand and category filters, price range, sorting, and pagination are all encoded in the URL, so a result view is shareable, reload-safe, and rendered by the server.

## Search

The search input matches product name, brand, and description. Matching is case-insensitive and performed after query normalization on the server. The search text is stored in the `q` parameter.

## Multi-select brand and category filters

Brand and category filters are searchable dropdowns backed by native checkboxes.

- Options are derived from the loaded catalog, not a hard-coded list.
- Multiple values are combined with OR within one facet and AND across facets.
- Selected values are stored as comma-separated lists in the `brand` and `category` parameters.
- Unknown values are discarded during query normalization.
- Each dropdown includes a search field, a visible selected count, and a clear action.
- Changing a filter resets the listing to page 1.

Category labels are generated from the category value, for example `beauty` becomes `Beauty` and hyphenated values are title-cased.

## Price range

The price control is an accessible two-handle range slider.

- The slider bounds are the minimum and maximum prices in the loaded catalog.
- The step is derived from the greatest number of decimal places in the catalog prices.
- Applying the range writes `priceMin` and `priceMax` to the URL.
- A bound equal to the catalog edge is omitted from the URL.
- Clearing the range removes both price parameters.
- Requests outside the catalog bounds are reported in the UI and do not silently produce misleading results.

## Sorting

The `sort` parameter accepts these values:

| Value | Label |
| --- | --- |
| `name-asc` | Name A-Z (default) |
| `price-asc` | Price ascending |
| `price-desc` | Price descending |
| `rating-desc` | Rating descending |

Invalid or missing sort values fall back to `name-asc`. The default sort is omitted from generated URLs.

## Pagination

- The page size is 24 products.
- Pagination is rendered on the server from the filtered result set.
- The `page` parameter is clamped to at least 1 and to the available number of pages.
- Page 1 is omitted from generated URLs.
- The result summary reports the visible item range and total count.

## URL state reference

| Parameter | Meaning | Default or encoding |
| --- | --- | --- |
| `q` | Search text | Empty; trimmed |
| `brand` | Selected brands | Empty; comma-separated |
| `category` | Selected categories | Empty; comma-separated |
| `priceMin` | Minimum price | Omitted when unset or at the catalog minimum |
| `priceMax` | Maximum price | Omitted when unset or at the catalog maximum |
| `sort` | Sort order | `name-asc`; omitted when default |
| `page` | Result page | `1`; omitted when first page |

Example URLs:

```text
/products
/products?q=mascara
/products?brand=Essence&category=beauty&sort=price-asc
/products?priceMin=10&priceMax=50&sort=rating-desc
/products?q=mascara&category=beauty&sort=price-asc&page=2
```

## Listing states

- **Loading:** the listing route renders a filter skeleton while the client filter controls load.
- **Empty:** an unmatched search or filter combination shows a reset action that returns to `/products`.
- **Fallback:** when the external catalog is unavailable, a status message explains that the local fallback catalog is in use.
- **Invalid input:** invalid sort values and malformed page or price values are normalized rather than causing an error.

## Comparison

Products can be added to a comparison from the product detail page.

- Up to four products can be selected.
- The header shows the current comparison count and links to `/compare`.
- The comparison table resolves selected IDs against the server-loaded catalog and shows brand, category, price, rating, and product attributes.
- Products can be removed individually, or the comparison can be cleared.
- Selection is persisted as product IDs in session storage after hydration. No product data is stored in the URL or in global state.
- The comparison provider sanitizes restored values and ignores duplicate or unknown IDs.

See [Application Architecture](/architecture) for the component boundary and [Product Data and Caching](/product-data) for the persistence details.
