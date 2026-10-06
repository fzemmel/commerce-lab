# Design

## System overview

Commerce Lab is a Next.js 16 App Router product-discovery application using React 19, TypeScript, Tailwind CSS, Vitest, Storybook, and Lighthouse CI.

## Routes

- `/` is the landing page.
- `/products` is the searchable, filterable, paginated product listing.
- `/products/[slug]` is a product detail page.

The product listing and detail routes provide loading and error boundaries; the detail route also provides a not-found boundary.

## Product data flow

1. Server-rendered routes call `getProductCatalog()`.
2. `src/lib/products-api.ts` requests the DummyJSON product API.
3. External data is mapped to the internal `Product` domain type.
4. Next.js ISR caches the external response.
5. Invalid, empty, timed-out, or failed responses fall back to `src/data/products.ts`.
6. Rendering components consume the internal domain model, not DummyJSON-specific types.

## Product-listing state

The URL is the source of truth for search, category, sorting, and pagination.

```text
URL search parameters
→ query normalization
→ filtering and sorting
→ pagination
→ server-rendered product grid
```

## Server and Client Component boundary

Route pages and data-reading components are Server Components by default. Client Components are limited to browser interaction and navigation hooks. `ProductFilters` updates URL parameters; the changed URL causes the server route to render the resulting catalog state. Global client-side state is intentionally avoided.

## Module responsibilities

- `src/app/` — routes and route-level composition
- `src/components/product/` — product presentation
- `src/components/filters/` — interactive URL controls
- `src/components/ui/` — small reusable UI primitives
- `src/lib/` — data access and domain logic
- `src/data/` — local fallback catalog
- `src/types/` — shared domain types
- `src/test/` and colocated test files — test support and unit tests

## Validation and delivery

ESLint, TypeScript checking, Vitest, the production Next.js build, the static Storybook build, and Lighthouse CI validate the repository. The standalone Docker image is published by the deploy job, which then updates the production service.

## Architectural invariants

- UI components must not depend on DummyJSON response types.
- External product data must be mapped at the data-access boundary.
- Product-listing state remains URL-driven unless an architectural change is explicitly approved.
- Server Components remain the default; Client Components stay small and interaction-focused.
- Reusable domain logic belongs outside JSX.
- The local fallback must remain usable when the external API fails.
- New major dependencies require a clear architectural reason.
- Changes to these boundaries require an update to this document.
