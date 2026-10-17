#!/usr/bin/env node
// Resume-safe, serial milestone delivery. GitHub PRs are the durable state.
import { spawnSync } from "node:child_process";
import { dependenciesFromBody, selectNext, reviewForSha, riskyPaths, qualityStatus } from "./autopilot-core.mjs";

const repo = process.env.GITHUB_REPOSITORY;
const milestone = Number(process.argv[2]);
const token = process.env.AUTOPILOT_GH_TOKEN;
const model = process.env.AUTOPILOT_MODEL || "anthropic/claude-sonnet-4-5";
const reviewModel = process.env.AUTOPILOT_REVIEW_MODEL || model;
const target = "milestone/" + milestone;
const fixes = 3;

if (!repo || !Number.isSafeInteger(milestone) || milestone < 1 || !token) {
  throw new Error("GITHUB_REPOSITORY, numeric milestone and AUTOPILOT_GH_TOKEN are required");
}
if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required");

function run(binary, args, options = {}) {
  const result = spawnSync(binary, args, {
    encoding: "utf8",
    env: options.cleanEnv ? options.env : { ...process.env, ...options.env },
    timeout: options.timeout || 120000,
    maxBuffer: 16 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    throw new Error(binary + " failed: " + (result.error?.message || result.stderr || result.stdout || result.status).slice(-3000));
  }
  return result.stdout.trim();
}
function gh(...args) {
  return run("gh", args, { env: { GH_TOKEN: token, GITHUB_TOKEN: token } });
}
function api(path) {
  return JSON.parse(gh("api", "-H", "X-GitHub-Api-Version: 2026-03-10", path));
}
function apiPages(path) {
  return JSON.parse(gh("api", "--paginate", "--slurp", path)).flat();
}
function git(...args) {
  return run("git", args);
}
function push(refspec) {
  // Only the controller, not the coding agent, receives credentials.
  const header = "AUTHORIZATION: basic " + Buffer.from("x-access-token:" + token).toString("base64");
  return run("git", ["-c", "http.https://github.com/.extraheader=" + header, "push", "origin", refspec]);
}
function sleep(milliseconds) {
  // Short-lived Action job; no external state is held during wait.
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}
function comment(prNumber, message) {
  gh("pr", "comment", String(prNumber), "--body", message);
}
function humanRequired(prNumber, reason) {
  comment(prNumber, "<!-- autopilot:human-required -->\nAUTOPILOT HUMAN REVIEW REQUIRED: " + reason);
  throw new Error("Human intervention required for PR #" + prNumber + ": " + reason);
}
function invokeOpenCode(agent, prompt, selectedModel = model) {
  const env = { ...process.env };
  for (const key of ["GH_TOKEN", "GITHUB_TOKEN", "AUTOPILOT_GH_TOKEN", "MISTRAL_API_KEY", "DEPLOY_SSH_PRIVATE_KEY"]) {
    delete env[key];
  }
  const output = run("opencode", ["run", "--agent", agent, "--model", selectedModel, prompt], {
    env,
    cleanEnv: true,
    timeout: 45 * 60 * 1000
  });
  if (!output) throw new Error("Empty OpenCode response");
  return output.slice(-24000);
}
function issueBranch(number) {
  return "autopilot/issue-" + number + "-milestone-" + milestone;
}
function branchExists(branch) {
  return Boolean(git("ls-remote", "--heads", "origin", "refs/heads/" + branch));
}
function ensureIntegrationBranch() {
  if (!branchExists(target)) {
    git("fetch", "origin", "main");
    push("refs/remotes/origin/main:refs/heads/" + target);
  }
  git("fetch", "origin", target);
}
function trackedChanges() {
  run("git", ["add", "-A"]);
  return git("diff", "--cached", "--no-renames", "--name-only").split("\n").filter(Boolean);
}
function ensureSafeDiff() {
  const changed = trackedChanges();
  if (!changed.length) throw new Error("Agent produced no file changes");
  const risky = riskyPaths(changed);
  if (risky.length) throw new Error("Protected files changed: " + risky.join(", "));
}
async function awaitIntegrationCI() {
  git("fetch", "origin", target);
  const sha = git("rev-parse", "refs/remotes/origin/" + target);
  for (let attempt = 0; attempt < 90; attempt++) {
    const runs = JSON.parse(gh("run", "list", "--workflow", "ci.yml", "--branch", target,
      "--json", "headSha,status,conclusion", "--limit", "20"));
    const match = runs.find((run) => run.headSha === sha);
    if (match?.status === "completed") {
      if (match.conclusion !== "success") throw new Error("Integration branch CI failed on " + sha);
      return;
    }
    await sleep(20000);
  }
  throw new Error("Integration branch CI did not complete for " + sha);
}
function getIssues() {
  const items = apiPages("repos/" + repo + "/issues?milestone=" + milestone + "&state=all&per_page=100");
  return items.filter((issue) => !issue.pull_request);
}
function getPRs() {
  return apiPages("repos/" + repo + "/pulls?state=all&base=" + target + "&per_page=100");
}
function mapPRs(prs) {
  const map = new Map();
  for (const pr of prs) {
    const match = pr.head?.ref?.match(/^autopilot\/issue-(\d+)-milestone-(\d+)$/);
    if (match && Number(match[2]) === milestone && pr.base?.ref === target) {
      const number = Number(match[1]);
      if (map.has(number)) throw new Error("Duplicate autopilot PR for issue #" + number);
      map.set(number, pr);
    }
  }
  return map;
}
function getDependencies(issues) {
  const known = new Map(issues.map((issue) => [issue.number, issue]));
  const result = new Map();
  for (const issue of issues) {
    if (issue.state !== "open") continue;
    const native = apiPages("repos/" + repo + "/issues/" + issue.number + "/dependencies/blocked_by?per_page=100");
    const numbers = new Set([...dependenciesFromBody(issue.body || ""), ...native.map((item) => item.number)]);
    const deps = [...numbers].map((number) => {
      if (number === issue.number) throw new Error("Self-dependency on #" + number);
      const dependency = known.get(number) || api("repos/" + repo + "/issues/" + number);
      return { number, state: dependency.state };
    });
    result.set(issue.number, deps);
  }
  return result;
}
function planIssue(issue) {
  const task = "Issue #" + issue.number + ": " + issue.title + "\n" + (issue.body || "");
  let plan = invokeOpenCode("plan",
    "Read AGENTS.md, DESIGN.md and relevant source/tests. Produce a concrete minimal implementation plan with tests. Do not modify files. Task:\n" + task);
  for (let iteration = 0; iteration < 3; iteration++) {
    const response = invokeOpenCode("plan",
      "Act as an independent critical plan reviewer. Compare the following plan with the repository, architecture and issue. Give actionable feedback. End with exactly VERDICT: APPROVE or VERDICT: CHANGES_REQUESTED.\nIssue:\n" + task + "\nPlan:\n" + plan,
      reviewModel);
    if (/^VERDICT: APPROVE\s*$/m.test(response) && !/^VERDICT: CHANGES_REQUESTED\s*$/m.test(response)) return plan;
    if (!/^VERDICT: CHANGES_REQUESTED\s*$/m.test(response)) throw new Error("Invalid planning verdict");
    plan = invokeOpenCode("plan",
      "Revise the complete implementation plan using this independent feedback. No file edits.\nIssue:\n" + task + "\nPrevious plan:\n" + plan + "\nReview:\n" + response);
  }
  throw new Error("Plan failed independent review after three iterations");
}
function buildIssue(issue) {
  const plan = planIssue(issue);
  invokeOpenCode("build",
    "Implement GitHub issue #" + issue.number + " within its acceptance criteria. Use this reviewed plan:\n" +
    plan + "\nIssue body:\n" + (issue.body || "") +
    "\nWrite meaningful regression tests. Do not commit, push, open PRs, modify workflows, agent tooling, package manifests, deployment settings, credentials or other protected files. Do not weaken existing tests. Run pnpm check and fix failures. Leave changes in the working tree.");
  ensureSafeDiff();
  run("pnpm", ["check"], { timeout: 15 * 60 * 1000 });
  git("config", "user.name", "commerce-lab-autopilot");
  git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com");
  git("commit", "-m", "feat: implement issue #" + issue.number);
  push("HEAD:refs/heads/" + issueBranch(issue.number));
  const prBody = "Autonomous implementation of #" + issue.number +
    " into " + target + ".\n\nSource issue: #" + issue.number +
    "\n\nRequires: current-HEAD Mistral approval, CI Quality checks, protected-path policy.\n\n" +
    "No deployment or merge into main is permitted by this controller.\n\n" +
    "<!-- autopilot-base-sha=" + git("rev-parse", "refs/remotes/origin/" + target) + " -->";
  gh("pr", "create", "--base", target, "--head", issueBranch(issue.number),
    "--title", "feat(autopilot): " + issue.title.slice(0, 100), "--body", prBody, "--draft");
  const pr = apiPages("repos/" + repo + "/pulls?state=open&base=" + target + "&per_page=100")
    .find((candidate) => candidate.head?.ref === issueBranch(issue.number));
  if (!pr) throw new Error("PR creation did not return an open PR");
  return pr;
}
async function awaitVerdict(prNumber) {
  for (let attempt = 0; attempt < 90; attempt++) {
    const pr = api("repos/" + repo + "/pulls/" + prNumber);
    const sha = pr.head.sha;
    const reviews = apiPages("repos/" + repo + "/issues/" + prNumber + "/comments?per_page=100");
    const review = reviewForSha(reviews, sha);
    // The pull_request CI runs against GitHub's synthetic merge commit, not
    // necessarily the PR head. GraphQL statusCheckRollup follows the PR.
    const checks = JSON.parse(gh("pr", "view", String(prNumber), "--json", "statusCheckRollup")).statusCheckRollup || [];
    const quality = qualityStatus(checks);
    if (review?.verdict === "INVALID") return { sha, verdict: "INVALID", quality, feedback: review.body };
    if (review && quality !== "PENDING") {
      return { sha, verdict: review.verdict, quality, feedback: review.body };
    }
    await sleep(20000);
  }
  throw new Error("Review or CI timed out after 30 minutes; inspect GitHub Actions");
}
function verifyPRDiff(prNumber) {
  const files = apiPages("repos/" + repo + "/pulls/" + prNumber + "/files?per_page=100")
    .flatMap((file) => [file.filename, file.previous_filename].filter(Boolean));
  const risky = riskyPaths(files);
  if (risky.length) humanRequired(prNumber, "Changes to protected paths: " + risky.join(", "));
  if (!files.length) humanRequired(prNumber, "PR has no changed files");
}
async function completePR(pr) {
  const comments = apiPages("repos/" + repo + "/issues/" + pr.number + "/comments?per_page=100");
  if (comments.some((comment) => comment.body?.includes("<!-- autopilot:human-required -->"))) {
    throw new Error("PR #" + pr.number + " already requires human review");
  }
  for (let iteration = 0; iteration <= fixes; iteration++) {
    verifyPRDiff(pr.number);
    const gate = await awaitVerdict(pr.number);
    const current = api("repos/" + repo + "/pulls/" + pr.number);
    if (current.head.sha !== gate.sha) continue;
    if (gate.verdict === "APPROVE" && gate.quality === "SUCCESS") {
      const baseSha = current.body?.match(/<!-- autopilot-base-sha=([a-f0-9]{40}) -->/)?.[1];
      if (!baseSha) humanRequired(pr.number, "Missing trusted milestone base marker");
      git("fetch", "origin", target);
      if (git("rev-parse", "refs/remotes/origin/" + target) !== baseSha) {
        humanRequired(pr.number, "Milestone branch changed during review; rebase and revalidate");
      }
      if (current.draft) gh("pr", "ready", String(pr.number));
      // GitHub merge protections still apply. Never merge to main.
      gh("pr", "merge", String(pr.number), "--squash", "--delete-branch");
      console.log("Integrated issue PR #" + pr.number + " at " + gate.sha);
      return;
    }
    if (iteration === fixes) humanRequired(pr.number, "Review/CI failed after " + fixes + " fixes: " + gate.verdict + "/" + gate.quality);
    if (gate.verdict === "INVALID") humanRequired(pr.number, "Invalid structured Mistral verdict");
    git("fetch", "origin", issueBranchFromPR(pr));
    git("checkout", "-B", issueBranchFromPR(pr), "origin/" + issueBranchFromPR(pr));
    invokeOpenCode("build",
      "Correct the following independent review/CI findings for the current PR without changing its scope. " +
      "Do not alter protected files or tests to hide failures. Review:\n" + gate.feedback.slice(0, 12000) +
      "\nCI quality status: " + gate.quality + ". Run pnpm check. Do not commit or push.");
    ensureSafeDiff();
    run("pnpm", ["check"], { timeout: 15 * 60 * 1000 });
    git("config", "user.name", "commerce-lab-autopilot");
    git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com");
    git("commit", "-m", "fix: address independent review for PR #" + pr.number);
    push("HEAD:refs/heads/" + issueBranchFromPR(pr));
  }
}
function issueBranchFromPR(pr) {
  if (!/^autopilot\/issue-\d+-milestone-\d+$/.test(pr.head.ref)) throw new Error("Unexpected PR head");
  return pr.head.ref;
}
function finalReleasePR(issues) {
  const open = apiPages("repos/" + repo + "/pulls?state=open&base=main&per_page=100");
  if (open.some((pr) => pr.head?.ref === target)) return;
  gh("pr", "create", "--base", "main", "--head", target, "--draft",
    "--title", "release: milestone #" + milestone,
    "--body", "Autonomously integrated issues: " + issues.map((issue) => "#" + issue.number).join(", ") +
    "\n\nHUMAN RELEASE APPROVAL REQUIRED. Confirm complete end-to-end behavior, security and full CI. " +
    "Merging this PR to main will trigger production deployment.");
}
async function main() {
  ensureIntegrationBranch();
  await awaitIntegrationCI();
  const issues = getIssues();
  if (!issues.length) throw new Error("Milestone has no issues; refusing to run");
  const prs = mapPRs(getPRs());
  const state = selectNext(issues, prs, getDependencies(issues));
  if (state.complete) {
    finalReleasePR(issues);
    console.log("All milestone issues integrated. Draft release PR created/exists; main requires human approval.");
    return;
  }
  if (!state.issue) throw new Error("No runnable issues: " + JSON.stringify(state.blocked));
  const issue = state.issue;
  console.log("Processing issue #" + issue.number + " on " + target);
  let pr = prs.get(issue.number);
  if (!pr) {
    git("fetch", "origin", target);
    git("checkout", "-B", issueBranch(issue.number), "origin/" + target);
    pr = buildIssue(issue);
  }
  await completePR(pr);
  // A new workflow run resumes from GitHub PR state, avoiding the six-hour Actions job limit.
  gh("workflow", "run", "milestone-autopilot.yml", "--ref", "main", "-f", "milestone=" + milestone);
  console.log("Queued next milestone iteration");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
