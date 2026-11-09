---
title: Project Overview
description: Purpose, technology stack, routes, and scope of Commerce Lab.
---

# Project Overview

Commerce Lab is a Next.js 16 App Router application that demonstrates product discovery in a commerce context. It focuses on server rendering, URL-driven listing state, external product data with a local fallback, and a small, clearly bounded set of Client Components.

The application is a learning and reference project rather than a production storefront. It uses a public demo catalog and generic deployment configuration.

## What the project demonstrates

- Server Components reading route parameters and catalog data.
- URL search parameters as the source of truth for listing state.
- Filtering, sorting, and pagination implemented outside JSX.
- Mapping an external API response into an internal domain model.
- Graceful fallback when the external catalog is unavailable.
- A narrow client-side exception for comparison selection persistence.
- Component stories, unit tests, and a multi-stage container image.

## Technology stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 16 with the App Router |
| UI runtime | React 19 |
| Language | TypeScript with strict checking |
| Styling | Tailwind CSS 4 |
| Unit tests | Vitest and Testing Library |
| Component workshop | Storybook 10 |
| Performance checks | Lighthouse CI |
| Documentation | VitePress |
| Package manager | pnpm 10 (`packageManager` is pinned in `package.json`) |
| Runtime | Node.js 22 (`.nvmrc` and `engines` require 22.x) |
| Product data | DummyJSON product API with a local fallback catalog |
| Production image | Multi-stage Docker build using Next.js standalone output |

## Supported routes

| Route | Purpose | Rendering behavior |
| --- | --- | --- |
| `/` | Landing page with a featured catalog sample. | Server Component. Selects up to four products marked as new or on sale. |
| `/products` | Searchable, filterable, sortable, paginated catalog. | Server Component. Reads `searchParams`, loads the catalog, applies the query, and renders the grid. |
| `/products/[slug]` | Product detail page with images, price, rating, description, and attributes. | Server Component with static params generated from the catalog and route metadata. Includes loading, error, and not-found boundaries. |
| `/compare` | Side-by-side comparison of selected products. | Server Component that loads the catalog; a Client Component resolves selected IDs against it. |

The listing and detail routes include route-level loading and error boundaries. The detail route also provides a not-found boundary.

## Scope boundaries

- The catalog is read-only demo data. There is no cart, checkout, authentication, or order management.
- Listing state is URL-driven. Global client state is intentionally avoided except for comparison selection.
- The documentation site is built and validated locally and in CI. It is not published to an external hosting provider by this repository.

## Next steps

- [Product Discovery](/product-discovery) explains the user-facing features and URL parameters.
- [Application Architecture](/architecture) describes Server and Client Component responsibilities and module ownership.
- [Getting Started](/getting-started) covers local setup and validation commands.
