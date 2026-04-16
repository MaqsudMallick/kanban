import { Octokit } from "@octokit/rest";
import {
  KanbanIssue,
  LinkedPR,
  ColumnMapping,
  DEFAULT_COLUMN_MAPPINGS,
} from "./types";

export function createOctokit(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

function determineColumn(
  issue: { state: string; labels: { name: string }[] },
  hasOpenPR: boolean,
  mappings: ColumnMapping[]
): string {
  // Closed issues go to "done"
  const closedMapping = mappings.find((m) => m.matchClosed);
  if (issue.state === "closed" && closedMapping) {
    return closedMapping.columnId;
  }

  // Check label-based mappings (most specific first)
  for (const mapping of mappings) {
    if (mapping.label && issue.labels.some((l) => l.name === mapping.label)) {
      return mapping.columnId;
    }
  }

  // Check PR-based mapping
  const prMapping = mappings.find((m) => m.matchPR);
  if (hasOpenPR && prMapping) {
    return prMapping.columnId;
  }

  // Default to backlog
  const backlog = mappings.find((m) => !m.label && !m.matchClosed && !m.matchPR);
  return backlog?.columnId ?? "backlog";
}

export async function fetchIssuesForRepo(
  octokit: Octokit,
  owner: string,
  repo: string,
  repoColor: string,
  mappings: ColumnMapping[] = DEFAULT_COLUMN_MAPPINGS
): Promise<KanbanIssue[]> {
  // Fetch open and recently closed issues (not PRs)
  const [openIssues, closedIssues] = await Promise.all([
    octokit.paginate(octokit.issues.listForRepo, {
      owner,
      repo,
      state: "open",
      per_page: 100,
      sort: "updated",
    }),
    octokit.paginate(octokit.issues.listForRepo, {
      owner,
      repo,
      state: "closed",
      per_page: 30,
      sort: "updated",
    }),
  ]);

  const allIssues = [...openIssues, ...closedIssues].filter(
    (issue) => !issue.pull_request
  );

  // Fetch linked PRs for open issues via timeline events
  const issuesWithPRs = await Promise.all(
    allIssues.map(async (issue) => {
      let linkedPRs: LinkedPR[] = [];

      if (issue.state === "open") {
        try {
          const timeline = await octokit.issues.listEventsForTimeline({
            owner,
            repo,
            issue_number: issue.number,
            per_page: 100,
          });

          const crossRefEvents = timeline.data.filter(
            (e) => e.event === "cross-referenced"
          );

          linkedPRs = crossRefEvents
            .filter((e: any) => e.source?.issue?.pull_request)
            .map((e: any) => ({
              number: e.source.issue.number,
              title: e.source.issue.title,
              state: e.source.issue.state,
              url: e.source.issue.html_url,
              draft: e.source.issue.pull_request?.draft ?? false,
            }));
        } catch {
          // Timeline API might not be available for all repos
        }
      }

      const hasOpenPR = linkedPRs.some((pr) => pr.state === "open");

      return {
        id: issue.id,
        number: issue.number,
        title: issue.title,
        body: issue.body ?? null,
        state: issue.state,
        labels: (issue.labels || [])
          .filter((l): l is { name: string; color: string } => typeof l !== "string" && !!l.name)
          .map((l) => ({ name: l.name!, color: l.color || "ededed" })),
        assignees: (issue.assignees || []).map((a) => ({
          login: a.login,
          avatar_url: a.avatar_url,
        })),
        user: {
          login: issue.user?.login ?? "unknown",
          avatar_url: issue.user?.avatar_url ?? "",
        },
        repo,
        repoOwner: owner,
        repoColor,
        columnId: determineColumn(
          {
            state: issue.state,
            labels: (issue.labels || [])
              .filter((l): l is { name: string } => typeof l !== "string" && !!l.name)
              .map((l) => ({ name: l.name! })),
          },
          hasOpenPR,
          mappings
        ),
        linkedPRs,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
        comments: issue.comments,
        html_url: issue.html_url,
      } satisfies KanbanIssue;
    })
  );

  return issuesWithPRs;
}

export async function moveIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  issueNumber: number,
  targetColumnId: string,
  mappings: ColumnMapping[] = DEFAULT_COLUMN_MAPPINGS
) {
  const targetMapping = mappings.find((m) => m.columnId === targetColumnId);
  if (!targetMapping) return;

  if (targetMapping.matchClosed) {
    // Close the issue
    await octokit.issues.update({
      owner,
      repo,
      issue_number: issueNumber,
      state: "closed",
    });
    return;
  }

  // Reopen if it was closed
  await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    state: "open",
  });

  // Get current labels
  const { data: issue } = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  // Remove all column-related labels
  const columnLabels = mappings
    .map((m) => m.label)
    .filter((l): l is string => l !== null);

  const currentLabels = (issue.labels || [])
    .filter((l): l is { name: string } => typeof l !== "string" && !!l.name)
    .map((l) => l.name!)
    .filter((name) => !columnLabels.includes(name));

  // Add the target column's label (if it has one)
  if (targetMapping.label) {
    currentLabels.push(targetMapping.label);

    // Ensure the label exists on the repo
    try {
      await octokit.issues.getLabel({
        owner,
        repo,
        name: targetMapping.label,
      });
    } catch {
      await octokit.issues.createLabel({
        owner,
        repo,
        name: targetMapping.label,
        color: "ededed",
      });
    }
  }

  await octokit.issues.update({
    owner,
    repo,
    issue_number: issueNumber,
    labels: currentLabels,
  });
}

export async function fetchUserRepos(octokit: Octokit) {
  const repos = await octokit.paginate(octokit.repos.listForAuthenticatedUser, {
    per_page: 100,
    sort: "updated",
    affiliation: "owner,collaborator,organization_member",
  });

  return repos.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    owner: r.owner.login,
    description: r.description,
    private: r.private,
    open_issues_count: r.open_issues_count,
    html_url: r.html_url,
  }));
}
