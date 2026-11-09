---
title: Application Architecture
description: App Router routes, Server and Client Component boundaries, URL-driven state, and module ownership.
---

# Application Architecture

Commerce Lab uses the Next.js App Router with React Server Components as the default. The architecture keeps data access, domain logic, and presentation separate so the catalog can be rendered on the server while interactive URL controls remain small and focused.

`DESIGN.md` is the architectural source of truth. This page explains the same boundaries in more detail.

## App Router structure

```text
src/app/
├── layout.tsx                 root layout and comparison provider
├── page.tsx                   landing page
├── products/
│   ├── page.tsx               listing route
│   ├── loading.tsx            listing loading boundary
│   ├── error.tsx              listing error boundary
│   └── [slug]/
│       ├── page.tsx           product detail route
│       ├── loading.tsx        detail loading boundary
│       ├── error.tsx          detail error boundary
│       └── not-found.tsx      detail not-found boundary
└── compare/
    └── page.tsx               comparison route
```

Route pages own route-level composition. They read route parameters, call data-access functions, and pass domain objects to presentation components.

## Server and Client Components

### Server Components

Route pages and data-reading components are Server Components by default. The listing page:

1. Awaits `searchParams`.
2. Calls `getProductCatalog()`.
3. Builds brand, category, and price options from the catalog.
4. Parses and normalizes the query.
5. Filters, sorts, and paginates the catalog.
6. Renders the product grid and pagination on the server.

The product detail page loads the catalog, resolves the product by slug, generates metadata, and renders the product presentation. The comparison page loads the catalog on the server and passes it to the client comparison view.

### Client Components

Client Components are limited to browser interaction, navigation hooks, and state:

| Component | Responsibility |
| --- | --- |
| `ProductFilters` | Updates the URL when search, facets, price, sort, or reset actions change. |
| `FacetFilter` | Searchable multi-select dropdown with keyboard and focus handling. |
| `PriceRangeControl` | Two-handle range slider with keyboard support and apply/clear actions. |
| `ComparisonProvider` | Stores validated comparison product IDs and persists them to session storage. |
| `CompareButton` | Adds or removes a product from the comparison. |
| `ComparisonLink` | Displays the comparison count in the header. |
| `ComparisonView` | Resolves selected IDs against server-provided catalog data and renders the comparison table. |

`ProductFilters` uses `usePathname`, `useRouter`, and `useSearchParams`. After it updates the URL, the server route receives new `searchParams` and renders the resulting catalog state.

## URL-driven listing state

The URL is the source of truth for listing state:

```text
URL search parameters
→ query normalization
→ filtering and sorting
→ pagination
→ server-rendered product grid
```

Supported parameters are `q`, `brand`, `category`, `priceMin`, `priceMax`, `sort`, and `page`. Query parsing is centralized in `src/lib/product-query.ts`:

- Search text is trimmed.
- Brand and category values are comma-separated, deduplicated, and validated against catalog options.
- Prices must be positive numbers; an inverted range is discarded.
- Sort values are validated against the supported set.
- Page numbers are parsed and clamped.

Filter changes reset the page to 1. Serialization omits defaults so canonical URLs stay short. See [Product Discovery](/product-discovery) for the full behavior and examples.

No global client state library is used for listing state. The single exception is comparison selection, described below.

## Module ownership

| Path | Responsibility |
| --- | --- |
| `src/app/` | Routes and route-level composition. |
| `src/components/product/` | Product presentation: cards, grid, images, prices, badges, pagination. |
| `src/components/filters/` | Interactive URL controls: search input, facet dropdown, sort select, price slider. |
| `src/components/comparison/` | Comparison provider, buttons, link, table, and view. |
| `src/components/ui/` | Small reusable primitives such as Button, Badge, Input, and Select. |
| `src/lib/` | Data access, mapping, query normalization, filtering, sorting, pagination, formatting, and comparison logic. |
| `src/data/` | Local fallback catalog used when the external API fails. |
| `src/types/` | Shared domain types. |
| `src/test/` | Shared test fixtures. |
| `scripts/` | Milestone Autopilot controller and safety tests. |

## Comparison selection persistence

Comparison is the deliberate exception to the server-first, URL-driven rule:

1. A product detail page renders a client `CompareButton`.
2. The button dispatches to `ComparisonProvider`, which stores only validated product IDs.
3. The provider persists IDs in session storage after hydration.
4. The `/compare` route remains server-sourced and resolves those IDs against the freshly loaded catalog.
5. Unknown or stale IDs are ignored, and the selection is capped at four products.

This keeps catalog data out of client storage while still allowing a multi-page comparison workflow.

## Architectural invariants

- UI components must not depend on DummyJSON response types.
- External product data must be mapped at the data-access boundary.
- Product-listing state remains URL-driven unless an architectural change is explicitly approved.
- Server Components remain the default; Client Components stay small and interaction-focused.
- Reusable domain logic belongs outside JSX.
- The local fallback must remain usable when the external API fails.
- New major dependencies require a clear architectural reason.
- Changes to these boundaries require an update to `DESIGN.md`.

## Related pages

- [Product Data and Caching](/product-data)
- [Product Discovery](/product-discovery)
- [Contributing and Quality](/contributing)
