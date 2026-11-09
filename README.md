# Commerce Lab

Commerce Lab is a Next.js 16 App Router product-discovery application built with React 19, TypeScript, Tailwind CSS, Vitest, Storybook, and Lighthouse CI. It demonstrates server-rendered product discovery with URL-driven search, multi-select facets, price filtering, sorting, pagination, and comparison.

## Documentation

Comprehensive documentation lives in the VitePress site under [`docs/`](docs/index.md).

| Topic | Page |
| --- | --- |
| Project purpose, stack, and routes | [Project overview](docs/overview.md) |
| Search, filters, sorting, pagination, comparison | [Product discovery](docs/product-discovery.md) |
| Installation, commands, tests, Storybook, docs | [Getting started](docs/getting-started.md) |
| App Router, Server/Client boundaries, modules | [Application architecture](docs/architecture.md) |
| DummyJSON mapping, ISR, fallback, comparison state | [Product data and caching](docs/product-data.md) |
| Contributing, CI, Dependabot, quality expectations | [Contributing and quality](docs/contributing.md) |
| Production build and container delivery | [Deployment](docs/deployment.md) |
| Milestone Autopilot overview | [Milestone Autopilot](docs/milestone-autopilot.md) |
| Detailed autopilot reference | [Autopilot reference](docs/AUTOPILOT.md) |
| OpenAI pull-request review gate | [AI code review](docs/ai-code-review.md) |

Run the documentation locally:

```bash
pnpm docs:dev
```

Build the static documentation site:

```bash
pnpm docs:build
```

The build is part of `pnpm verify` and is validated by CI. `DESIGN.md` remains the architectural source of truth.

## Tech Stack

- Next.js 16 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Vitest and Testing Library
- Storybook
- Lighthouse CI
- VitePress
- DummyJSON product API with local fallback data
- pnpm 10 and Node.js 22

## Features

- Landing page at `/` with a featured catalog sample
- Product listing at `/products`
- Product detail pages at `/products/[slug]`
- Side-by-side comparison at `/compare` for up to four products
- Search across product name, brand, and description
- Searchable multi-select brand and category filters
- Catalog-bounded price range slider
- Sorting by name, price ascending, price descending, and rating descending
- Server-rendered pagination with 24 products per page
- URL-synchronized query state
- Empty, loading, error, not-found, and fallback states
- Isolated component stories and responsive Tailwind layouts

## Quick Start

Node.js 22 and pnpm 10.24.0 are required.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The application runs at `http://localhost:3000` by default.

## Essential Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server. |
| `pnpm check` | Run linting, type checking, and unit tests. |
| `pnpm verify` | Run check, the documentation build, production build, Storybook build, and Lighthouse CI. |
| `pnpm test` | Run unit tests. |
| `pnpm storybook` | Start Storybook on port 6006. |
| `pnpm build` | Build the production application. |
| `pnpm start` | Start the standalone production server. |
| `pnpm docs:dev` | Start the VitePress documentation site. |
| `pnpm docs:build` | Build the static documentation site. |
| `pnpm docs:preview` | Preview the built documentation site. |

See [Getting started](docs/getting-started.md) for prerequisites, Lighthouse port configuration, and the complete command reference.

## Supported Routes

- `/`
- `/products`
- `/products?page=2`
- `/products?q=mascara&category=beauty&sort=price-asc`
- `/products?brand=Essence&priceMin=10&priceMax=50`
- `/products/essence-mascara-lash-princess-1`
- `/compare`

## Architecture Summary

Route pages and data-reading components are Server Components. Client Components are limited to URL controls, comparison selection, and browser navigation. Listing state is URL-driven through `q`, `brand`, `category`, `priceMin`, `priceMax`, `sort`, and `page`.

Product data is loaded in `src/lib/products-api.ts` from DummyJSON, mapped into the internal `Product` type, cached with ISR, and replaced by the local catalog in `src/data/products.ts` when the external API fails. UI code never depends on DummyJSON response types.

Read [Application architecture](docs/architecture.md) and [Product data and caching](docs/product-data.md) for the full design. Architectural changes must update [`DESIGN.md`](DESIGN.md).

## Deployment Summary

The production image uses Next.js standalone output and a multi-stage Docker build. `docker-compose.prod.yml` expects the container image and external network name from the deployment environment. The `CI` workflow validates pushes and pull requests to `main` and `milestone/**`; on pushes to `main`, the deploy job publishes the image and restarts the production service.

Environment-specific endpoints, credentials, and runtime values are not stored in the repository. See [Deployment](docs/deployment.md) for the pipeline overview.

## Automation and Dependency Updates

- **CI:** the `Quality checks` job runs the autopilot safety suite and `pnpm verify`.
- **Milestone Autopilot:** an opt-in workflow that implements milestone issues serially into `milestone/<number>` and leaves the final release pull request for human review. It never merges into `main`.
- **AI code review:** the `OpenAI Code Review` workflow reviews same-repository `autopilot/issue-*` pull requests, posts a SHA-bound comment with a verdict, and gates autopilot integration alongside `Quality checks`.
- **Dependabot:** weekly updates for npm dependencies, GitHub Actions, and Docker. Only a narrow class of direct development-dependency patch updates is auto-merged after required `Quality checks` protection is confirmed.

See [Milestone Autopilot](docs/milestone-autopilot.md), [AI code review](docs/ai-code-review.md), and [Contributing and quality](docs/contributing.md) for details.

## Contributing

Make the smallest coherent change, preserve the boundaries in `DESIGN.md`, write repository content in English, and run `pnpm check` (or `pnpm verify` for the full gate). Do not add dependencies without a clear architectural reason.

See [Contributing and quality](docs/contributing.md) for CI, Dependabot, and pull request expectations.

## Possible Version 2 Improvements

- Add infinite loading or cursor-based pagination
- Add additional facets such as color, material, and sale status
- Add Playwright smoke tests for listing and detail routes
- Add component tests for product cards and pagination controls
- Add route-level metadata and structured data for product details
- Move from the demo product API to a dedicated headless commerce adapter
- Add wishlist or recently viewed interactions
