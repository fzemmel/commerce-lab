---
title: Getting Started
description: Prerequisites, installation, development commands, tests, Storybook, and the documentation site.
---

# Getting Started

## Prerequisites

- Node.js 22.x. The repository uses `.nvmrc` and `package.json#engines` to require Node 22.
- pnpm 10.24.0. The exact version is declared in `package.json#packageManager`.
- No external service or database is required for local development. If the DummyJSON product API is unavailable, the application uses its local fallback catalog.

If pnpm is not installed, enable it through Corepack or install it with your preferred Node.js package manager.

## Install dependencies

```bash
pnpm install --frozen-lockfile
```

Use the frozen lockfile form when you want to reproduce CI exactly. During normal dependency work, `pnpm install` updates `pnpm-lock.yaml`.

## Start the development server

```bash
pnpm dev
```

The application runs at `http://localhost:3000` by default.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server. |
| `pnpm lint` | Run ESLint. |
| `pnpm typecheck` | Run the TypeScript compiler without emitting files. |
| `pnpm test` | Run Vitest once. |
| `pnpm test:watch` | Run Vitest in watch mode. |
| `pnpm check` | Run linting, type checking, and unit tests. |
| `pnpm build` | Build the production application and assemble standalone output. |
| `pnpm start` | Start the standalone production server after a build. |
| `pnpm storybook` | Start Storybook on port 6006. |
| `pnpm build-storybook` | Build the static Storybook output. |
| `pnpm lhci` | Run Lighthouse CI against a production server. |
| `pnpm verify` | Run the full validation pipeline: check, documentation build, production build, Storybook build, and Lighthouse CI. |
| `pnpm docs:dev` | Start the VitePress documentation site with hot reload. |
| `pnpm docs:build` | Build the static documentation site. |
| `pnpm docs:preview` | Preview a built documentation site locally. |

`pnpm check` is the fast development gate. `pnpm verify` is the CI-equivalent gate and is the command to run before opening a pull request when you want full confidence.

## Tests

Unit tests use Vitest with Testing Library and jsdom. Test files are colocated with the modules and components they cover, with shared fixtures under `src/test/fixtures/`.

```bash
pnpm test
pnpm test:watch
```

The Milestone Autopilot safety invariants have their own focused suite:

```bash
pnpm exec vitest run scripts/autopilot-core.test.mjs
```

## Storybook

Storybook is used for local component review and static build validation. It is not deployed separately.

```bash
pnpm storybook
pnpm build-storybook
```

Storybook discovers stories from `src/**/*.stories.@(ts|tsx)`. The static build is written to `storybook-static/`, which is ignored by Git.

## Lighthouse CI

Lighthouse starts its own production server on `127.0.0.1:3100` so it does not conflict with a development server on port 3000. Override the port with `LHCI_PORT` if needed:

```bash
LHCI_PORT=3101 pnpm verify
```

Configuration lives in `lighthouserc.cjs`, and generated reports are written to `lighthouse-reports/`.

## Production build

```bash
pnpm build
pnpm start
```

`next.config.ts` sets `output: "standalone"`. The `build` script copies `public/` and `.next/static/` into the standalone output, and `pnpm start` runs the generated `server.js`. The application listens on port 3000 by default.

See [Deployment](/deployment) for the container image and delivery pipeline.

## Documentation site

The documentation is built with VitePress and sourced from `docs/`.

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

`pnpm verify` includes `pnpm docs:build`, so CI validates both the site configuration and every documentation page. The built output is written to `docs/.vitepress/dist/`, which is ignored by Git.
