<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Commerce Lab agent guide

Commerce Lab is a Next.js 16 App Router product-discovery application built with React 19, TypeScript, Tailwind CSS, Vitest, Storybook, and Lighthouse CI. It provides `/`, `/products`, and `/products/[slug]`.

`DESIGN.md` is the architectural source of truth. Read it before changing routes, data access, product discovery, or component boundaries.

## Boundaries

- `src/app/` owns routes and route-level composition.
- `src/lib/` owns product data access, mapping, query normalization, filtering, sorting, and pagination.
- `src/components/product/` renders product presentation.
- `src/components/filters/` contains interactive URL controls.
- `src/components/ui/` contains small reusable primitives.
- `src/data/` provides the local catalog fallback; `src/types/` owns shared domain types.

Product data comes from DummyJSON through `src/lib/products-api.ts`, which maps it into the internal `Product` type and falls back to local data. UI code must not depend on DummyJSON response types.

Use Server Components by default. Add `"use client"` only for browser interaction, event handlers, state, or Next navigation hooks. Keep Client Components small: `ProductFilters` updates the URL, and the server route renders the resulting catalog. Product-listing state (`q`, `category`, `sort`, and `page`) is URL-driven; do not add global client state without an approved architectural change.

## Accessibility

Use semantic HTML and native controls. Keep controls visibly labeled, keyboard-operable, and focusable. Use links for navigation and buttons for actions. Preserve meaningful image alternatives and clear loading, empty, and error states.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm check
pnpm verify
```

`pnpm check` runs linting, type checking, and unit tests. `pnpm verify` additionally runs the production build, static Storybook build, and Lighthouse CI.

## Definition of Done

- Make the smallest coherent change; avoid unrelated refactoring.
- Preserve the boundaries and URL-driven state described in `DESIGN.md`.
- Update `DESIGN.md` when those boundaries change.
- Run the relevant canonical validation command.
- Do not add dependencies without a clear architectural reason.
