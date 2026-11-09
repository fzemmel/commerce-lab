---
title: Contributing and Quality
description: Contribution expectations, validation commands, CI, dependency updates, and the architectural source of truth.
---

# Contributing and Quality

## Principles

- Make the smallest coherent change. Avoid unrelated refactoring.
- Preserve the boundaries and URL-driven state described in `DESIGN.md`.
- Keep Server Components as the default and add `"use client"` only for browser interaction, event handlers, state, or Next.js navigation hooks.
- Do not add global client state without an approved architectural change.
- Use semantic HTML and native controls. Keep controls labeled, keyboard-operable, and focusable.
- Write repository content in English: code comments, commit messages, branch names, issues, pull requests, workflows, and UI text.
- Do not add dependencies without a clear architectural reason.
- Update `DESIGN.md` when an architectural boundary changes.

## Local validation

Run the fast gate while developing:

```bash
pnpm check
```

This runs ESLint, TypeScript checking, and the Vitest suite.

Run the full CI-equivalent gate before requesting review when practical:

```bash
pnpm verify
```

`pnpm verify` runs:

1. `pnpm check`
2. `pnpm docs:build`
3. `pnpm build`
4. `pnpm build-storybook`
5. `pnpm lhci`

The documentation build is part of the canonical pipeline, so VitePress configuration and page links are validated alongside application code.

## Continuous integration

The `CI` GitHub Actions workflow is defined in `.github/workflows/ci.yml`.

- It runs for pushes and pull requests targeting `main` and `milestone/**`.
- The `Quality checks` job installs with `pnpm install --frozen-lockfile`, runs the autopilot safety suite, and runs `pnpm verify`.
- Lighthouse reports are uploaded as a workflow artifact even when the job fails.
- The `deploy` job runs only for pushes to `main`, after `Quality checks` succeeds.

`Quality checks` is the required status context used by the automation and by branch protection.

## Documentation changes

- Update the VitePress pages under `docs/` when behavior, commands, or workflows change.
- Update `README.md` when the quick start or top-level navigation changes.
- Update `DESIGN.md` when architecture or module boundaries change.
- Keep `docs/AUTOPILOT.md` as the detailed reference for the automation.
- Run `pnpm docs:build` after changing documentation.

## Dependency updates

Dependabot is configured in `.github/dependabot.yml`.

- **npm dependencies:** weekly on Monday at 08:00 Europe/Berlin. Updates are grouped for Next.js, React, Storybook, and tooling. Major updates are ignored.
- **GitHub Actions:** weekly, grouped, with major updates ignored.
- **Docker:** weekly, with Node major updates ignored.

The `Dependabot auto-merge` workflow in `.github/workflows/dependabot-auto-merge.yml` auto-merges only a narrow class of updates:

- The pull request is from `dependabot[bot]`, targets `main`, and is not a draft.
- The update is an npm direct development dependency on a semver patch.
- It is either outside a group or in the `tooling` group.
- The update has no maintainer changes.
- Only `package.json` and `pnpm-lock.yaml` are changed.
- The `main` ruleset is active, has no bypass actors, and requires up-to-date `Quality checks`.

Everything else remains subject to manual review. The workflow never checks out or runs code from the pull request.

## Pull requests

- Keep changes reviewable and explain the behavior being changed.
- Include tests for domain logic and interactive components where practical.
- Verify accessibility-relevant behavior for new controls.
- Do not include secrets, credentials, environment-specific endpoints, or private infrastructure details.
- Do not bypass branch protection or required checks.

## Architectural source of truth

`DESIGN.md` remains the architectural source of truth. The documentation site explains the architecture but does not replace it. If the two ever disagree, treat `DESIGN.md` and the code as authoritative and update the documentation in the same change.
