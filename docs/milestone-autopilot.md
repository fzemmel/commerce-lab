---
title: Milestone Autopilot
description: Overview of the opt-in GitHub Actions workflow that delivers a milestone serially into an integration branch.
---

# Milestone Autopilot

The Milestone Autopilot is an **opt-in** GitHub Actions workflow that implements a GitHub milestone issue by issue, validates each change, and integrates successful work into a milestone branch. It never merges into `main` automatically; it only opens a draft release pull request for human review. It never deploys to production.

The complete operational reference is [Autopilot Reference](/AUTOPILOT) (`docs/AUTOPILOT.md`). This page is a concise overview of what the automation does and where human control remains.

## What it does

1. A maintainer manually dispatches `Milestone Autopilot` with a **numeric** GitHub milestone ID.
2. The controller creates or reuses the `milestone/<number>` integration branch from `main`.
3. It waits for green CI on the integration branch.
4. It loads milestone issues and resolves dependencies from GitHub's native **blocked by** relationships plus `Depends on #123, #124` body references.
5. It selects one unblocked issue. Closed issues and issues already integrated through an autopilot pull request count as complete.
6. OpenCode creates a plan and an independent planning review.
7. The controller implements the change on `autopilot/issue-<issue>-milestone-<milestone>`, checks protected paths, validates the result, commits, pushes, and opens a draft pull request against the milestone branch.
8. The PR receives an AI review bound to the exact head SHA and must pass the `Quality checks` job.
9. A passing PR is merged **only into the milestone branch**. The workflow queues the next issue through a new GitHub Actions run.
10. After all issues are integrated, a **draft release pull request** targeting `main` is opened for whole-milestone human review.

The workflow is sequential: it processes one issue per run. State lives in GitHub issues and pull requests, so re-runs resume safely.

## Prerequisites

The automation is not operational until all of these are in place:

- The workflow exists on the default branch. Merge the enabling change to `main` before dispatching it.
- A dedicated self-hosted runner is registered with the label `commerce-lab-autopilot`.
- OpenCode `1.19.0` is installed for the runner user and authenticated with a persistent OpenAI ChatGPT/Codex OAuth login. `opencode auth list` must show the OpenAI OAuth entry before a run.
- The runner stays online for every continuation run and retains that login.
- A repository Actions secret provides a short-lived installation token or fine-grained personal access token with contents, pull request, issue, and Actions permissions. A normal `GITHUB_TOKEN` is intentionally insufficient because bot-created pull requests must trigger other workflows.
- Actions are allowed to create and merge pull requests targeting `milestone/*`. Repository rulesets may still block auto-merge; that is a safety stop and must not be bypassed.
- The runner is dedicated, private to this repository, and free of production credentials, deployment access, personal files, and unrelated workloads.

## Starting a run

Use **Actions → Milestone Autopilot → Run workflow** and enter the numeric milestone ID, or dispatch from the GitHub CLI:

```bash
gh workflow run milestone-autopilot.yml --ref main -f milestone=5
```

The value is the milestone number, not its title. The workflow has no schedule; it runs only when manually dispatched or when a continuation run is queued.

## Dependency handling

An issue is eligible only when it is not blocked:

- GitHub's native dependency relationships are read.
- `Depends on #123, #124` references in the issue body are parsed.
- Missing dependency data fails closed rather than guessing.
- Blocked issues are skipped until their dependencies are closed or integrated.

## Branch and pull request lifecycle

- Each issue is implemented on `autopilot/issue-<issue>-milestone-<milestone>`.
- The pull request targets `milestone/<number>`, never `main`.
- The pull request is opened as a draft and remains subject to review and CI.
- A passing pull request is merged into the milestone branch.
- After the last issue, a draft release pull request targets `main`.

## Safeguards

- Protected infrastructure such as `.github/**`, `.opencode/**`, `scripts/autopilot*`, `AGENTS.md`, credentials, and deployment configuration cannot be autonomously merged.
- Validation and lifecycle scripts in `package.json` are immutable.
- Dependency metadata or `next.config.*` changes trigger `pnpm install --frozen-lockfile` followed by `pnpm verify`; other changes run `pnpm check` before the pull request is created.
- Only a valid independent AI verdict for the exact current head SHA and a passing `Quality checks` run can authorize an integration merge.
- Malformed verdicts, stale SHA approvals, failed CI, unsafe files, or exceeded fix attempts fail closed and require manual intervention.
- There is a fixed maximum of three correction attempts.
- The workflow never merges into `main` automatically. It only opens a draft release pull request targeting `main` for human review, and it never triggers production deployment.

## Failure recovery

A failed run does not schedule a continuation. To recover:

1. Inspect the Actions logs and the affected issue or pull request.
2. Correct the problem, such as restoring the runner, renewing the OpenCode login, fixing CI, or resolving a protected-path conflict.
3. Dispatch the workflow again with the same numeric milestone ID.

Closed and already integrated issues are detected from GitHub state, so a re-run does not repeat completed work.

## Human review is required

The final draft release pull request is never merged automatically. A human maintainer must review the integrated milestone, confirm that CI and the AI review results are acceptable, and merge it. Any push or merge to `main` triggers the production deployment, including the merge of the release pull request. Green CI and an AI approval are evidence, not proof that the change is free of functional, security, or architectural defects.

## Local safety tests

The controller's scheduling and quality-gate behavior is covered by:

```bash
pnpm exec vitest run scripts/autopilot-core.test.mjs
```

This suite covers dependency parsing, deterministic scheduling, planning verdicts, validation selection, SHA-bound review verification, protected paths, and CI gate behavior. Full end-to-end testing requires a GitHub repository, credentials, a dedicated self-hosted runner, and an active OpenCode OAuth session.
