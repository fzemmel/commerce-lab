---
title: AI Code Review
description: How the OpenAI Code Review workflow validates autopilot pull requests and interacts with CI.
---

# AI Code Review

The repository's current pull-request review gate is the **OpenAI Code Review** workflow in `.github/workflows/openai-review.yml`. Older references to a Mistral review describe the same automated PR-review gate; the current implementation is the OpenAI workflow documented here.

## Purpose

The review provides an independent assessment of an automated pull request against its source issue, repository rules, code changes, and tests. It is a gate for Milestone Autopilot integration, not a replacement for human review of the final release.

## Trigger and scope

The workflow runs on pull request `opened` and `synchronize` events, and only when both conditions are true:

- The pull request comes from the same repository, not a fork.
- The head branch starts with `autopilot/issue-`.

As a result, normal contributor pull requests and external fork pull requests do not receive this automated review. They still require the standard `Quality checks` CI gate and human review.

Outdated runs for the same pull request are cancelled when a newer event arrives.

## Execution environment

- The job runs on the dedicated self-hosted runner labeled `commerce-lab-autopilot`.
- It verifies that OpenCode `1.19.0` is installed and that the runner user has a persistent OpenAI OAuth login.
- The model runs with the runner's OAuth session. A scoped GitHub token is used by the workflow to read pull request data and post the review comment, but the model process does not receive that token.
- Model selection defaults to `openai/gpt-5.6-terra` and can be overridden through the `AUTOPILOT_REVIEW_MODEL` or `AUTOPILOT_MODEL` repository Actions variables. No credential values are stored in the repository or documented here.

If the runner, OpenCode installation, or OAuth login is unavailable, the workflow fails and the pull request remains blocked.

## Review inputs

The reviewer receives:

- The pull request title and body.
- The source issue, extracted from body references such as `Source issue: #123` or `Closes #123`.
- `AGENTS.md` repository rules.
- `DESIGN.md` architectural boundaries.
- The pull request diff, excluding lockfiles.
- Up to the last ten pull request comments, truncated per comment.

Diffs larger than the workflow's review limit are truncated. A truncated diff cannot receive an approval; the workflow forces a `CHANGES_REQUESTED` verdict and asks for a smaller pull request.

## Output and verdict

The workflow posts a pull request comment that begins with a hidden marker containing the exact head SHA:

```text
<!-- openai-review sha=<head SHA> -->
```

The comment then contains the review and ends with exactly one verdict line:

```text
VERDICT: APPROVE
```

or

```text
VERDICT: CHANGES_REQUESTED
```

The SHA marker binds the verdict to a specific revision. A later push produces a new head SHA and a new review event, so an old approval cannot authorize a changed pull request.

## Interaction with CI and Milestone Autopilot

The Milestone Autopilot controller waits for both:

- A valid review verdict for the **exact current head SHA**.
- A successful `Quality checks` run.

The controller fails closed when the review is missing, malformed, stale, or from an unexpected source. It accepts reviewer comments only from `github-actions[bot]`. If the pull request changes, the controller waits for the new review rather than reusing the previous verdict.

The controller may correct failures up to three times. Each new revision must pass review and CI again before integration into the milestone branch.

## When a maintainer must intervene

Manual intervention is required when:

- The review workflow cannot run because the self-hosted runner, OpenCode installation, or OAuth login is unavailable.
- A review comment is missing, malformed, or lacks a valid verdict line.
- The latest verdict is bound to an older head SHA and no new review appears.
- `Quality checks` continues to fail after the allowed correction attempts.
- The pull request changes protected infrastructure, credentials, deployment configuration, or another path that cannot be autonomously merged.
- The diff is too large for a complete review.
- The pull request comes from a fork or a branch that does not start with `autopilot/issue-`, so the automated review does not run.
- The automated review approves but a human disagrees on functional, security, or architectural grounds.

Even when the automated review approves, a maintainer must review and merge the final milestone release pull request into `main`.

## Relationship to the Mistral reference

Older project material may refer to a Mistral AI code review. That description referred to the same PR-review gate: an automated review posts feedback and a verdict, and Milestone Autopilot requires that verdict plus CI before integrating a change. The current and authoritative implementation is the OpenAI Code Review workflow described on this page.
