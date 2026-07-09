# Commerce Lab

[![CI](https://github.com/fzemmel/commerce-lab/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fzemmel/commerce-lab/actions/workflows/ci.yml?query=branch%3Amain)

Commerce Lab is a Next.js product discovery app. Use React and Next.js App Router in a commerce context: product listing, faceted search, URL-driven state, server-rendered routes, external product data, and reusable UI components.

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- ESLint
- Storybook
- DummyJSON product API with local fallback data
- `src/` directory and `@/*` import alias

## Features

- Landing page at `/`
- Product listing at `/products`
- Product detail pages at `/products/[slug]`
- External product catalog from DummyJSON with local mock products as a fallback
- Real product imagery rendered with `next/image`
- Product cards with brand, category, price, sale price, rating, and badges
- Search across product name, brand, and description
- Dynamic category filter based on the loaded catalog
- Sorting by name, price ascending, price descending, and rating descending
- Server-rendered pagination with 24 products per page
- URL-synchronized query state such as `/products?q=mascara&category=beauty&sort=price-asc&page=2`
- Empty state for searches without matches
- Loading, error, and not-found route structure
- Isolated component stories for UI primitives and product components
- Responsive Tailwind layout

## Architecture Decisions

- Product data is loaded from DummyJSON in `src/lib/products-api.ts` with ISR caching and a local fallback catalog in `src/data/products.ts`.
- Product domain types live in `src/types/product.ts`.
- Filtering, sorting, pagination, query parsing, dynamic category labels, and product lookup live in `src/lib/product-query.ts`.
- Reusable product UI is grouped under `src/components/product`.
- Interactive listing controls are grouped under `src/components/filters`.
- Generic primitives such as `Button`, `Badge`, `Input`, and `Select` are grouped under `src/components/ui`.
- Storybook is used for local component review and static build validation, but is not deployed separately.
- Global state libraries are intentionally avoided. The URL is the source of truth for listing state.

## Server Components vs. Client Components

Pages are Server Components by default. The product listing reads `searchParams`, loads the product catalog on the server, parses the query, filters the catalog, and renders the product grid on the server.

The external catalog is fetched with ISR so product data is cached and revalidated periodically instead of being requested on every page view:

```ts
fetch("https://dummyjson.com/products?limit=200", {
  next: { revalidate: 3600 },
});
```

Client Components are only used where browser interaction is required. `ProductFilters` uses Next navigation 
hooks to update the URL when the user searches, changes category, changes sorting, or resets filters. 
Once the URL changes, the server page receives new `searchParams` and renders the updated listing.

This keeps the data-reading path simple and server-first while still providing an interactive search and filter experience.

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Run linting:

```bash
pnpm lint
```

Run unit tests:

```bash
pnpm test
```

Start Storybook locally:

```bash
pnpm storybook
```

Build Storybook statically:

```bash
pnpm build-storybook
```

Build the production app:

```bash
pnpm build
```

Start the production server after a build:

```bash
pnpm start
```

The app runs at `http://localhost:3000` by default.

If pnpm is not installed locally, install it first with your preferred Node package manager.

## Production Deployment

The app is deployed as a Dockerized Next.js standalone server. next.config.ts enables output: "standalone", and the production image runs the generated server.js on port 3000.

The deployment setup is designed for a Linux-based VPS environment with Docker, Docker Compose, and a reverse proxy. HTTPS termination, optional access protection, and request forwarding are handled outside the application container.

The production Compose file is docker-compose.prod.yml. It starts the application service from a container image published to GitHub Container Registry.

The app container does not expose a public host port directly. Instead, it is intended to run behind a reverse proxy that forwards traffic to the container over a private Docker network.

## Deployment Pipeline

GitHub Actions runs quality checks for pushes and pull requests targeting `main`:

```bash
pnpm lint
pnpm test
pnpm build
pnpm build-storybook
pnpm lhci
```

On pushes to main, the deployment workflow then:

- Builds the Docker image.
- Publishes versioned image tags to GitHub Container Registry.
- Updates the deployment configuration on the target server.
- Pulls the latest image on the server.
- Restarts the application service via Docker Compose.

The deployment workflow uses repository secrets for SSH access, deployment target configuration, and registry authentication. No credentials or environment-specific values are stored in the repository.

## Dependency Updates

Dependabot is configured in `.github/dependabot.yml` to open weekly pull requests for:

- pnpm dependencies from `package.json` and `pnpm-lock.yaml`.
- GitHub Actions used by the CI and deployment workflow.
- Docker base image updates for the production image.

Dependency updates are grouped for Next.js, React, Storybook, and tooling packages to keep pull requests reviewable. Dependabot pull requests run the normal quality pipeline and are merged manually.

## Useful Routes

- `/`
- `/products`
- `/products?page=2`
- `/products?q=mascara&category=beauty&sort=price-asc`
- `/products?q=mascara&category=beauty&sort=price-asc&page=2`
- `/products/essence-mascara-lash-princess-1`

## Possible Version 2 Improvements

- Add infinite loading or cursor-based pagination
- Add multi-select facets such as brand, color, material, and sale status
- Add Playwright smoke tests for listing and detail routes
- Add component tests for product cards and filter controls
- Add route-level metadata and structured data for product details
- Move from the demo product API to a dedicated headless commerce adapter
- Add compare, wishlist, or recently viewed interactions
