export function dependenciesFromBody(body = "") {
  const dependencies = new Set();
  for (const match of body.matchAll(/(?:depends on|blocked by)\s+([^\n.]+)/gi)) {
    for (const ref of match[1].matchAll(/#(\d+)/g)) dependencies.add(Number(ref[1]));
  }
  return [...dependencies];
}

export function selectNext(issues, prsByIssue, dependenciesByIssue) {
  const members = new Map(issues.map((issue) => [issue.number, issue]));
  const complete = (number) => {
    const issue = members.get(number);
    if (!issue) return false;
    return issue.state === "closed" || Boolean(prsByIssue.get(number)?.merged_at);
  };
  const pending = issues
    .filter((issue) => issue.state === "open" && !prsByIssue.get(issue.number)?.merged_at)
    .sort((a, b) => a.number - b.number);
  const blocked = [];
  for (const issue of pending) {
    const pr = prsByIssue.get(issue.number);
    if (pr?.state === "closed") {
      blocked.push({ number: issue.number, reason: "PR closed without merge" });
      continue;
    }
    const dependencies = dependenciesByIssue.get(issue.number) || [];
    const unmet = dependencies.filter((dependency) => {
      if (members.has(dependency.number)) return !complete(dependency.number);
      return dependency.state !== "closed";
    });
    if (unmet.length) {
      blocked.push({ number: issue.number, reason: "Blocked by " + unmet.map((d) => "#" + d.number).join(", ") });
      continue;
    }
    return { issue, blocked, complete: false };
  }
  return { issue: null, blocked, complete: pending.length === 0 };
}

export function reviewForSha(comments, sha) {
  const matches = (comments || []).filter((comment) =>
    comment.user?.login === "github-actions[bot]" &&
    comment.body?.includes("<!-- mistral-review sha=" + sha + " -->")
  );
  if (!matches.length) return null;
  const body = matches[matches.length - 1].body;
  const verdicts = [...body.matchAll(/^VERDICT: (APPROVE|CHANGES_REQUESTED)\s*$/gm)];
  const finalLine = body.trim().split(/\r?\n/).at(-1)?.trim();
  if (verdicts.length !== 1 || finalLine !== "VERDICT: " + verdicts[0][1]) {
    return { verdict: "INVALID", body };
  }
  return { verdict: verdicts[0][1], body };
}

const protectedPaths = [
  /^\.github\//, /^\.opencode\//, /^scripts\/autopilot/, /^\.env(?:\.|$)/,
  /^AGENTS\.md$/, /^DESIGN\.md$/, /^package\.json$/, /^pnpm-lock\.yaml$/,
  /^Dockerfile/, /^docker-compose/, /^next\.config\./, /^\.npmrc$/,
  /^\.gitmodules$/, /^\.gitattributes$/
];
export function riskyPaths(paths) {
  return paths.filter((path) => protectedPaths.some((rule) => rule.test(path)));
}

export function qualityStatus(checkRuns) {
  const checks = (checkRuns || []).filter((check) => check.name === "Quality checks");
  if (!checks.length) return "PENDING";
  const latest = checks.sort((a, b) => (b.id || 0) - (a.id || 0))[0];
  if (String(latest.status).toLowerCase() !== "completed") return "PENDING";
  return String(latest.conclusion).toLowerCase() === "success" ? "SUCCESS" : "FAILED";
}
