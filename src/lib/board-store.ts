import {
  BoardConfig,
  KanbanIssue,
  DEFAULT_COLUMNS,
  DEFAULT_COLUMN_MAPPINGS,
  REPO_COLORS,
} from "./types";

const STORAGE_KEY = "kanban-boards";

export function loadBoards(): BoardConfig[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBoards(boards: BoardConfig[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

export function createBoard(
  name: string,
  repos: { owner: string; repo: string }[]
): BoardConfig {
  const board: BoardConfig = {
    id: crypto.randomUUID(),
    name,
    repos: repos.map((r, i) => ({
      ...r,
      color: REPO_COLORS[i % REPO_COLORS.length],
    })),
    columns: DEFAULT_COLUMNS,
    columnMappings: DEFAULT_COLUMN_MAPPINGS,
  };

  const boards = loadBoards();
  boards.push(board);
  saveBoards(boards);
  return board;
}

export function updateBoard(board: BoardConfig) {
  const boards = loadBoards();
  const idx = boards.findIndex((b) => b.id === board.id);
  if (idx >= 0) {
    boards[idx] = board;
    saveBoards(boards);
  }
}

export function deleteBoard(id: string) {
  const boards = loadBoards().filter((b) => b.id !== id);
  saveBoards(boards);
}

export function getBoard(id: string): BoardConfig | undefined {
  return loadBoards().find((b) => b.id === id);
}

export function groupIssuesByColumn(
  issues: KanbanIssue[],
  columns: BoardConfig["columns"]
): Record<string, KanbanIssue[]> {
  const grouped: Record<string, KanbanIssue[]> = {};
  for (const col of columns) {
    grouped[col.id] = [];
  }
  for (const issue of issues) {
    if (grouped[issue.columnId]) {
      grouped[issue.columnId].push(issue);
    } else {
      // Fallback to backlog
      grouped["backlog"]?.push(issue);
    }
  }
  return grouped;
}
