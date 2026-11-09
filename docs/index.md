---
layout: home
title: Commerce Lab Documentation
description: Documentation for the Commerce Lab Next.js product-discovery application.

hero:
  name: Commerce Lab
  text: Product discovery documentation
  tagline: Learn how the Next.js App Router application models search, filtering, sorting, pagination, and comparison with URL-driven state.
  actions:
    - theme: brand
      text: Project overview
      link: /overview
    - theme: alt
      text: Getting started
      link: /getting-started
    - theme: alt
      text: Architecture
      link: /architecture

features:
  - title: Product discovery
    details: Search across name, brand, and description. Combine multi-select brand and category facets, a catalog-bounded price range, sorting, and server-rendered pagination.
    link: /product-discovery
  - title: Server-first architecture
    details: Route pages read data and render the catalog on the server. Client Components are limited to URL controls, comparison selection, and browser navigation.
    link: /architecture
  - title: Development workflow
    details: Install with pnpm, run the app with Next.js, validate with Vitest, Storybook, Lighthouse CI, and the VitePress documentation build.
    link: /getting-started
  - title: Delivery automation
    details: Understand the CI quality gate, container deployment, dependency updates, the opt-in Milestone Autopilot, and the AI review gate.
    link: /contributing
---

## Start here

| Goal | Page |
| --- | --- |
| Understand the project, stack, and routes | [Project Overview](/overview) |
| Learn the user-facing discovery features | [Product Discovery](/product-discovery) |
| Install and run the application | [Getting Started](/getting-started) |
| Review architectural boundaries | [Application Architecture](/architecture) |
| Trace product data and caching | [Product Data and Caching](/product-data) |
| Contribute a change | [Contributing and Quality](/contributing) |
| Understand container delivery | [Deployment](/deployment) |
| Operate the milestone automation | [Milestone Autopilot](/milestone-autopilot) |
| Understand the PR review gate | [AI Code Review](/ai-code-review) |

## Design source of truth

`DESIGN.md` in the repository root is the architectural source of truth. These pages explain and connect that architecture, but they do not replace it. When an architectural boundary changes, update `DESIGN.md` in the same change.
