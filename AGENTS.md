<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Context

This repository contains `commerce-search-lab`, a commerce product discovery application.

## Primary Goals

When working on this project, prioritize:

1. Clear, maintainable React and TypeScript code.
2. Modern Next.js App Router architecture.
3. A credible commerce/product-discovery use case.
4. Clean separation between domain logic, UI components, and route-level composition.
5. Code should be easy to review and follow best practices.
6. Avoiding unnecessary complexity.

## Tech Stack

Use the existing project stack:

* Next.js with App Router
* React
* TypeScript
* Tailwind CSS
* ESLint
* `src/` directory
* Import alias `@/*`
* Local mock data for Version 1

Do not introduce new major dependencies unless there is a clear architectural reason.

## Application Scope

The current Version 1 scope includes:

* Home page: `/`
* Product listing: `/products`
* Product detail pages: `/products/[slug]`
* Local mock product data
* Search
* Category filtering
* Sorting
* URL-synchronized query parameters
* Product cards
* Product detail views
* Empty states
* Responsive layout
* Loading and error structure

The project should remain focused on product discovery and commerce frontend architecture.

## Architecture Principles

### Server Components by Default

Use React Server Components by default for:

* Route pages
* Data-reading components
* Static or mostly static layout sections
* Product listing composition where possible
* Product detail rendering where possible

Do not add `"use client"` unless the component requires client-side interactivity, browser APIs, event handlers, local state, or hooks that only work on the client.

### Client Components Only Where Needed

Use Client Components for:

* Search input
* Filter controls
* Sort controls
* Interactive UI state
* Components using `useRouter`, `usePathname`, `useSearchParams`, `useState`, or event handlers

Keep Client Components small and focused.

### URL State Over Global State

For Version 1, product discovery state should be represented through URL query parameters.

Examples:

```txt
/products?q=shirt&category=apparel&sort=price-asc
```

Avoid global state libraries such as Zustand, Redux, Jotai, or Pinia equivalents in this project version.

### Domain Logic Belongs in `lib/`

Filtering, sorting, searching, formatting, and query normalization should not be buried inside JSX.

Prefer domain helpers such as:

```txt
src/lib/product-query.ts
src/lib/format-price.ts
src/lib/cn.ts
```

### Types Belong in `types/`

Shared domain types should live in:

```txt
src/types/product.ts
```

Avoid duplicating product-related types across multiple components.

## Suggested Folder Structure

Follow this general structure unless there is a strong reason to adjust it:

```txt
src/
  app/
    page.tsx
    products/
      page.tsx
      [slug]/
        page.tsx
      loading.tsx
      error.tsx
  components/
    product/
      product-card.tsx
      product-grid.tsx
      product-price.tsx
      product-badges.tsx
    filters/
      product-filters.tsx
      search-input.tsx
      category-select.tsx
      sort-select.tsx
    ui/
      button.tsx
      badge.tsx
      input.tsx
      select.tsx
  data/
    products.ts
  lib/
    product-query.ts
    format-price.ts
    cn.ts
  types/
    product.ts
```

## Code Style Guidelines

Use clear, boring, maintainable code.

Prefer:

* Explicit TypeScript types for domain objects.
* Small functions with clear names.
* Composition over large monolithic components.
* Readable JSX.
* Simple Tailwind class usage.
* Semantic HTML where appropriate.
* Accessible labels for form controls.
* Predictable naming.

Avoid:

* Overly clever abstractions.
* Large generic utility layers.
* Premature design systems.
* Unnecessary context providers.
* Unnecessary client-side state.
* Unused dependencies.
* Mock complexity that distracts from the frontend architecture.

## Component Guidelines

### Product Components

Product components should focus on rendering product-related UI.

Examples:

* `ProductCard`
* `ProductGrid`
* `ProductPrice`
* `ProductBadges`

Keep product display logic close to these components, but move reusable business logic into `lib/`.

### Filter Components

Filter components should focus on user interaction and URL updates.

Examples:

* `ProductFilters`
* `SearchInput`
* `CategorySelect`
* `SortSelect`

Filter components may be Client Components.

They should update query parameters rather than storing product discovery state in local component state only.

### UI Components

Reusable UI primitives belong in `components/ui/`.

Examples:

* `Button`
* `Badge`
* `Input`
* `Select`

Keep them simple. This is not a full design system project.

## Product Data Guidelines

Version 1 uses local mock data.

Product data should be realistic enough to support portfolio review.

Each product should include at least:

```ts
type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  isNew?: boolean;
  isSale?: boolean;
  attributes: {
    color?: string;
    size?: string;
    material?: string;
  };
};
```

Do not connect a database or external API in Version 1 unless explicitly requested.

## Search, Filter, and Sort Behavior

The `/products` page should support:

* Search by product name
* Search by brand
* Search by description
* Category filtering
* Sorting by:

    * Name A-Z
    * Price ascending
    * Price descending
    * Rating descending

The implementation should be deterministic, easy to test, and easy to inspect.

Query parameter handling should be robust:

* Unknown sort values should fall back to a sensible default.
* Empty query values should not break filtering.
* Invalid categories should result in either no matches or a safe default behavior.
* Case-insensitive matching is preferred for search.

## Styling Guidelines

Use Tailwind CSS.

The UI should be clean, modern, and restrained.

Prioritize:

* Good spacing
* Clear visual hierarchy
* Responsive grid layouts
* Readable typography
* Accessible contrast
* Useful empty states
* Consistent button/input/select styling

Avoid excessive visual effects, animations, or decorative complexity.

## Accessibility Requirements

Accessibility is a first-class requirement for this project, not an optional enhancement.

All user-facing UI should be implemented with practical WCAG 2.2 AA alignment in mind. The application does not need a formal compliance claim, but code should follow the principles of being perceivable, operable, understandable, and robust.

### Core Accessibility Principles

When implementing or changing UI, ensure that:

* Interactive elements are keyboard accessible.
* Native HTML elements are preferred over custom ARIA-based widgets.
* Buttons are implemented as `<button>`, links as `<a>` or Next.js `Link`.
* Clickable `div` or `span` elements are not acceptable.
* Form controls have visible labels or clearly associated accessible names.
* Focus states are visible and must not be removed.
* Color is not the only way to communicate meaning.
* Text has sufficient contrast against its background.
* Content structure uses semantic headings in a logical order.
* Images and visual placeholders have appropriate alternative text or are marked as decorative when they do not add meaning.
* Loading, empty, and error states are understandable without relying only on visual styling.
* Dynamic UI changes do not create confusing keyboard or screen reader behavior.

### Semantic HTML First

Prefer semantic HTML before adding ARIA.

Use:

* `<main>` for the main page content.
* `<nav>` for navigation areas.
* `<section>` only when it has a meaningful heading.
* `<ul>` / `<ol>` for lists of products or navigation items.
* `<button>` for actions.
* `<a>` / `Link` for navigation.
* `<label>` for form fields.
* Proper heading levels without skipping hierarchy for visual reasons.

Do not use ARIA to compensate for incorrect HTML when native elements can solve the problem.

### ARIA Usage

Use ARIA only when it improves the accessibility tree and the behavior is well understood.

Follow this rule:

> No ARIA is better than bad ARIA.

Before adding ARIA attributes, check whether the same result can be achieved with native HTML.

Acceptable ARIA usage may include:

* `aria-label` for icon-only buttons.
* `aria-describedby` for additional form help text.
* `aria-current="page"` for active navigation links.
* `aria-live` for important dynamic status updates, if needed.
* `aria-expanded` and `aria-controls` for disclosure-style controls, if implemented correctly.

Avoid adding roles such as `button`, `link`, `menu`, `tab`, `dialog`, or `combobox` unless the complete keyboard interaction model is also implemented correctly.

### Keyboard Interaction

All interactive functionality must be usable with a keyboard.

At minimum:

* The `Tab` order should follow the visual and logical page flow.
* Focus must be visible.
* Form controls must be reachable and usable.
* Product cards should not create nested interactive elements.
* Filter and sort controls must be operable without a mouse.
* Custom interactive components must support expected keyboard behavior.

Do not remove outlines with `outline-none` unless a clear replacement focus style is provided.

### Forms, Search, Filters, and Sorting

Search, filter, and sort controls must be accessible.

Requirements:

* Every input/select has a visible label or an accessible name.
* Placeholder text must not be the only label.
* Filter changes should update the URL predictably.
* The user should be able to understand the current filter state.
* Empty states should clearly explain that no products match the current criteria.
* Reset/clear actions should be implemented as real buttons.
* Controls should have adequate touch target size and spacing.

### Product Listing Accessibility

The product listing should be understandable to assistive technologies.

Requirements:

* Product grids should use semantic list markup where appropriate.
* Each product card should have a clear accessible name.
* Product links should describe the target product.
* Prices, sale prices, and original prices should be readable and understandable.
* Badges such as “New” or “Sale” should not rely on color alone.
* Rating information should be exposed as meaningful text, not only as icons.

Example:

```tsx
<span aria-label="Rating: 4.6 out of 5">
  4.6
</span>
```

### Images

Product images or placeholders must be handled intentionally.

Use meaningful `alt` text when the image conveys product information.

Use empty alt text for decorative imagery:

```tsx
alt=""
```

Avoid generic alt text such as:

```txt
image
product image
placeholder
```

Prefer specific text such as:

```txt
Black technical shell jacket by Northline
```

### Error, Loading, and Empty States

States must be clear and accessible.

Loading states should:

* Communicate that content is loading.
* Avoid layout shifts where practical.

Empty states should:

* Explain what happened.
* Provide a useful next action when possible.

Error states should:

* Use clear language.
* Avoid technical stack traces in the UI.
* Provide a recovery path where possible.

### Color and Visual Design

Do not communicate important state using color alone.

For example:

* Sale state should use text such as “Sale”, not only a red price.
* Active filters should have text or structural indication, not only color.
* Error states should include text, not only a red border.

Maintain sufficient contrast for:

* Body text
* Secondary text
* Links
* Buttons
* Form controls
* Focus states
* Badges

### Motion and Animation

Avoid unnecessary motion.

If animations are added:

* They should be subtle.
* They should not block interaction.
* They should not be required to understand the UI.
* Respect reduced motion preferences where relevant.

### Testing Expectations

When implementing UI changes, manually verify at least:

* Keyboard navigation with `Tab`, `Shift + Tab`, `Enter`, and `Space`.
* Visible focus states.
* Form labels and accessible names.
* Product links and button text.
* Empty and error states.
* Responsive layout at mobile and desktop widths.

If accessibility tooling is added later, prefer lightweight checks such as:

* ESLint accessibility rules
* axe-based tests
* Playwright accessibility checks

Do not add testing infrastructure unless explicitly requested.

### Implementation Standard

Accessibility should be considered during implementation, not patched afterward.

Before marking UI work as complete, check:

1. Can the feature be used without a mouse?
2. Does the HTML structure make sense without CSS?
3. Are all controls labeled?
4. Is focus visible and logical?
5. Is meaning communicated without relying only on color?
6. Are links and buttons used correctly?
7. Would a screen reader user understand the purpose of the component?

If the answer to any of these is no, fix the implementation before continuing.

## README Expectations

Keep the `README.md` useful for project users.

It should explain:

* What the project is
* The technical stack
* Core features
* Architecture decisions
* Server Components vs. Client Components
* URL-based product discovery state
* Local setup commands
* Possible Version 2 improvements

The README should be written in English.

Tone: professional, concise, and technically credible.

## Commands

Use the package manager already present in the project.

Common commands:

```bash
pnpm dev
pnpm lint
pnpm build
```

Before considering implementation work complete, run:

```bash
pnpm lint
```

When changes affect routing, rendering, or data flow, also run:

```bash
pnpm build
```

If a command fails, fix the underlying issue rather than suppressing the error.

## Version 1 Constraints

Do not add these features in Version 1 unless explicitly requested:

* Authentication
* Database integration
* Payment or checkout flow
* Full cart implementation
* Global state library
* Complex CMS integration
* End-to-end testing
* Full design system
* Internationalization

These may be considered for Version 2.

## Good Version 2 Candidates

Potential future improvements:

* Wishlist persistence
* Cart prototype
* Route Handlers for product API simulation
* Server Actions for newsletter or lead form submission
* Zod validation
* Supabase or Prisma integration
* Tests for product filtering and sorting
* Component tests
* Storybook
* Deployment on Vercel
* Basic analytics event tracking
* More advanced faceted search
* Price range filtering
* Brand filtering
* Product comparison

Do not implement these unless requested.

## Quality Standards

* Keep code readable.
* Keep commits focused.
* Avoid generated noise.
* Avoid tutorial-style naming.
* Avoid placeholder comments that suggest unfinished work.
* Do not leave dead code.
* Do not leave unused imports.
* Do not add dependencies without need.
* Prefer simple, complete features over broad, unfinished features.

## Agent Behavior

When making changes:

1. Inspect the existing structure first.
2. Preserve the current architectural intent.
3. Make the smallest coherent change that solves the task.
4. Keep Server and Client Component boundaries intentional.
5. Update the README when user-facing or architectural behavior changes.
6. Run linting before completion.
7. Summarize changed files and architectural decisions.

When uncertain, prefer the simpler implementation that keeps the project easy to understand.

Do not over-engineer.
