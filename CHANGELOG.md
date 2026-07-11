# Changelog

All notable changes to this project will be documented in this file.

This changelog includes the private pre-release development history of the project. Version `1.0.0` marks the first public release.

## Unreleased

## 1.0.1 - 2026-07-11

### Changed

- Updated project dependencies and lockfile state.
- Added pnpm workspace override configuration for dependency compatibility and security resolution.
- Kept the public project setup aligned with the updated pnpm dependency graph.

### Fixed

- Fixed the Docker build by copying `pnpm-workspace.yaml` into the dependency install stage before `pnpm install --frozen-lockfile`.
- Restored compatibility between the committed lockfile and deployment builds using frozen installs.

## 1.0.0 - 2026-07-10

### Changed

- First public release of the project.
- Public-facing documentation was revised for repository publication.
- Sensitive operational details were reduced or removed from the public documentation where appropriate.

### Notes

- Versions `0.1.0` to `0.6.0` represent the pre-public development history of the project and are intentionally preserved for transparency.

## Pre-public development history

## 0.6.0 - 2026-06-28

### Added

- Server-rendered product listing pagination with URL-synchronized page state.
- Accessible pagination navigation for product listing results.
- Pagination-aware result summary for filtered catalogs.
- Storybook coverage for the product pagination component.

## 0.5.0 - 2026-06-27

### Added

- Dependabot configuration for pnpm dependencies, GitHub Actions, and Docker base image updates.
- Storybook setup for local component development with Next.js and Tailwind CSS.
- Initial stories for UI primitives and product components using local fixtures.
- CI validation for static Storybook builds.

## 0.4.0 - 2026-06-27

### Added

- DummyJSON product API integration with server-side ISR caching.
- Local fallback catalog when the external product API is unavailable.
- Dynamic category options based on the loaded product catalog.
- Real product imagery via `next/image` with a remote image allow-list for DummyJSON assets.
- Unit tests for API product mapping and fallback behavior.

## 0.3.0 - 2026-06-26

### Added

- Docker-based deployment setup with a Next.js standalone production image.
- Production Compose configuration for containerized hosting.
- GitHub Actions deployment job that builds and pushes images, then deploys over SSH.
- Deployment documentation for environment-driven production configuration.

## 0.2.0 - 2026-06-26

### Added

- Lighthouse CI checks for key routes in the GitHub Actions pipeline, including report artifact upload.
- Vitest unit tests for product query parsing, filtering, sorting, price formatting, and class name utilities.

## 0.1.0 - 2026-06-20

### Added

- Initial Next.js App Router application setup with React, TypeScript, Tailwind CSS, ESLint, `src/`, and `@/*` imports.
- Commerce product discovery routes for `/`, `/products`, and `/products/[slug]`.
- Typed local mock catalog with 16 products across apparel, footwear, accessories, and equipment.
- URL-synchronized product search, category filtering, and sorting.
- Reusable product components for cards, grids, prices, badges, and detail views.
- Focused filter components for search, category selection, sort selection, and reset behavior.
- Loading, error, empty, and not-found route states.
- Accessibility improvements for labels, form control names, semantic product lists, prices, ratings, loading states, and error messaging.
- pnpm-based project setup with a committed `pnpm-lock.yaml`.
