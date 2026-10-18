# Autonomous Milestone Delivery

This is an **opt-in** GitHub Actions workflow for delivering a GitHub milestone without reviewing every individual implementation PR. It is **not** enabled on a schedule and **never merges into `main`**.

## How it works

1. Start `Milestone Autopilot` with a numeric GitHub milestone number (not its title).
2. The controller creates `milestone/<number>` from `main` if needed.
3. It waits for green CI on that integration branch, loads all milestone issues, and resolves GitHub's native *blocked by* dependencies plus `Depends on #123, #124` body references.
4. It selects one unblocked issue. Closed issues and issues already merged through an autopilot PR are considered completed; blocked issues are not.
5. OpenCode v1 uses the runner's persistent ChatGPT/Codex OAuth session to create a plan, independently review it (up to three iterations), and implement the approved plan on `autopilot/issue-<issue>-milestone-<milestone>`.
6. The controller runs `pnpm check`, rejects changes to protected paths, commits and pushes, and creates a draft PR against the milestone branch.
7. Mistral evaluates that PR against the source issue, `AGENTS.md`, `DESIGN.md`, code and tests. The review includes a machine verdict and the **exact PR head SHA**.
8. The controller waits for that SHA's Mistral review and GitHub's **Quality checks** check. It corrects failures up to three times, verifying each new revision. Missing, malformed or stale approvals fail closed.
9. A passing PR is merged **only into the milestone branch**. The workflow dispatches the next run; GitHub PR state makes re-runs resume safely.
10. After every issue is integrated, a **draft release PR** targeting `main` is created for whole-milestone human review and CI. Its merge to `main` triggers production deployment, so it is never automated.

Only one issue is built or merged per run. Each continuation uses a new GitHub Actions job. Controller state remains in GitHub, while the dedicated runner provides the persistent OpenCode OAuth login required across jobs.

## Setup

This automation is not operational until these requirements are fulfilled:

- Merge the implementation PR into `main` first. The `workflow_dispatch` workflow must exist on the default branch.
- Register a dedicated self-hosted runner with the custom label `commerce-lab-autopilot`. The workflow does not run on GitHub-hosted runners because the interactive OpenCode OAuth session must persist between issue runs.
- Install OpenCode v1 and authenticate as the same operating-system user that runs the GitHub Actions runner:

  ```bash
  npm install --global 'opencode-ai@^1'
  opencode auth login
  opencode auth list
  ```

  Select OpenAI and complete the interactive ChatGPT/Codex login. `opencode auth list` must show `OpenAI oauth` before the workflow starts. On OpenCode v1 the credential is normally stored in `~/.local/share/opencode/auth.json`; never commit or copy that file into the repository.
- The workflow uses `openai/gpt-5.6-terra` by default. `AUTOPILOT_MODEL` and `AUTOPILOT_REVIEW_MODEL` may override the model through repository Actions variables, but both models must be available to the runner's OpenAI OAuth account.
- Keep `MISTRAL_API_KEY` configured for the independent review workflow.
- Configure the Actions secret `AUTOPILOT_GH_TOKEN` to a short-lived installation token or fine-grained PAT restricted to this repository, with **Contents read/write, Pull requests read/write, Issues read, Actions read/write**. Use a dedicated GitHub App where possible. A normal `GITHUB_TOKEN` is intentionally insufficient here: bot-created PRs must trigger other GitHub Actions workflows.
- Ensure Actions may create and merge PRs to `milestone/*`. Repository rulesets may block auto-merge; this is an expected safety stop. **Do not bypass protections** to make it work.
- Avoid submitting untrusted or security-sensitive issues for autonomous implementation. The coding agent necessarily has access to its OpenCode OAuth session, and generated code runs on the same machine. Use a dedicated runner account and host with no production credentials, deployment access, personal files or unrelated workloads.
- Keep the self-hosted runner private to this repository. Do not attach it to public forks or workflows that execute untrusted pull request code.

Run **Actions → Milestone Autopilot → Run workflow** with the numerical milestone ID. Or use:

```bash
gh workflow run milestone-autopilot.yml --ref main -f milestone=5
```

Monitor Actions runs, integration PRs, and the final release PR. The workflow has no wall-clock scheduling; start it when you want an unattended batch.

## Safeguards

- Never automatically targets `main`; deployment remains behind an explicit human merge.
- Only GitHub's `Quality checks` check and a valid independent Mistral verdict for the exact current PR head SHA can authorize an integration merge.
- Each integration branch must also pass its own CI after the prior issue's merge.
- Protected files such as `.github/**`, `.opencode/**`, `scripts/autopilot*`, `AGENTS.md`, `DESIGN.md`, package manifests, lockfiles and deployment configuration cannot be autonomously merged.
- Excessive/truncated diffs cannot receive autonomous Mistral approval.
- Reviewer comments are accepted only from `github-actions[bot]`. A malformed verdict, failed CI, unsafe files or exhausted fix attempts block the PR and require manual intervention.
- No silent fallback when GitHub's dependency API is unavailable.
- A failed run **does not schedule another run**. Correct the problem and manually dispatch again.

## Known limits

- This first version is **sequential**; it does not parallelize independent issues.
- The dedicated self-hosted runner must remain online for every continuation run and retain the OpenCode OAuth session. If the session expires, run `opencode auth login` again as the runner user and manually restart the workflow.
- It performs existing `pnpm check` and `pnpm verify` gates, but does not add a dedicated E2E suite. Feature-specific regression coverage must be requested and verified separately.
- There is a fixed three-fix maximum, but **no hard USD/token budget enforcement**. Monitor model costs.
- A run will halt if an issue requires agent changes to protected infrastructure or architecture files; those changes need human review.
- The full release PR and deployment still require manual approval. Green CI and an AI reviewer do not prove the absence of functional, security or architectural defects.
- Session IDs are not retained across GitHub Actions runs; fixes are resumed from the PR, issue, repository state and independent review feedback rather than from the previous model session.

## Local tests

```bash
pnpm exec vitest run scripts/autopilot-core.test.mjs
```

This covers dependency parsing, deterministic scheduling, SHA-bound review verification, protected paths and CI gate behavior. End-to-end testing requires a GitHub repository, GitHub App/PAT credentials, a dedicated self-hosted runner and an active OpenCode ChatGPT/Codex OAuth session.
