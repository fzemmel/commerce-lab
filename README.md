# Commerce Lab

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

The app can be deployed as a containerized Next.js standalone service. `next.config.ts` enables `output: "standalone"`, and the production image runs the generated `server.js` process on port `3000`.

The repository keeps deployment configuration generic by reading environment-specific container and runtime settings from the deployment environment instead of committing infrastructure details.

The production Compose file is `docker-compose.prod.yml`. It expects the deployment environment to provide the container image reference and any external network name required by the target platform.

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
- Publishes versioned image tags to the configured container registry.
- Synchronizes the generic deployment files to the target environment.
- Refreshes the environment-specific runtime values on the target environment.
- Pulls the latest image and restarts the application service.

The deployment workflow uses repository secrets and variables for credentials, target access, image naming, and environment-specific runtime values. No infrastructure endpoints or environment-specific values are stored in the repository.

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
