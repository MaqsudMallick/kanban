export interface BoardColumn {
  id: string;
  title: string;
  color: string;
}

export interface LinkedPR {
  number: number;
  title: string;
  state: string;
  url: string;
  draft: boolean;
}

export interface KanbanIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: { name: string; color: string }[];
  assignees: { login: string; avatar_url: string }[];
  user: { login: string; avatar_url: string };
  repo: string;
  repoOwner: string;
  repoColor: string;
  columnId: string;
  linkedPRs: LinkedPR[];
  created_at: string;
  updated_at: string;
  comments: number;
  html_url: string;
}

export interface ColumnMapping {
  columnId: string;
  label: string | null; // null means "no matching label" (backlog)
  matchClosed: boolean;
  matchPR: boolean; // match issues with open PRs
}

export interface BoardConfig {
  id: string;
  name: string;
  repos: { owner: string; repo: string; color: string }[];
  columns: BoardColumn[];
  columnMappings: ColumnMapping[];
}

export const DEFAULT_COLUMNS: BoardColumn[] = [
  { id: "backlog", title: "Backlog", color: "#6b7280" },
  { id: "in-progress", title: "In Progress", color: "#f59e0b" },
  { id: "in-review", title: "In Review", color: "#8b5cf6" },
  { id: "done", title: "Done", color: "#10b981" },
];

export const DEFAULT_COLUMN_MAPPINGS: ColumnMapping[] = [
  { columnId: "backlog", label: null, matchClosed: false, matchPR: false },
  { columnId: "in-progress", label: "in-progress", matchClosed: false, matchPR: false },
  { columnId: "in-review", label: "in-review", matchClosed: false, matchPR: true },
  { columnId: "done", label: null, matchClosed: true, matchPR: false },
];

export function determineColumn(
  issue: { state: string; labels: { name: string }[] },
  hasOpenPR: boolean,
  mappings: ColumnMapping[]
): string {
  const closedMapping = mappings.find((m) => m.matchClosed);
  if (issue.state === "closed" && closedMapping) {
    return closedMapping.columnId;
  }

  for (const mapping of mappings) {
    if (mapping.label && issue.labels.some((l) => l.name === mapping.label)) {
      return mapping.columnId;
    }
  }

  const prMapping = mappings.find((m) => m.matchPR);
  if (hasOpenPR && prMapping) {
    return prMapping.columnId;
  }

  const backlog = mappings.find((m) => !m.label && !m.matchClosed && !m.matchPR);
  return backlog?.columnId ?? "backlog";
}

export const REPO_COLORS = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#10b981", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];
