"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { BoardColumn as BoardColumnType, BoardConfig, KanbanIssue } from "@/lib/types";
import { groupIssuesByColumn, updateBoard } from "@/lib/board-store";
import { BoardColumn } from "./board-column";
import { NewIssueModal } from "./new-issue-modal";
import { BoardFilters, FilterState, applyFilters } from "./board-filters";

export function KanbanBoard({ board }: { board: BoardConfig }) {
  const [issues, setIssues] = useState<KanbanIssue[]>([]);
  const [columns, setColumns] = useState<BoardColumnType[]>(board.columns);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [newIssueColumnId, setNewIssueColumnId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    repos: new Set(),
    labels: new Set(),
  });

  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local columns when the board prop changes (e.g. repo added/removed)
  useEffect(() => {
    setColumns(board.columns);
  }, [board.columns]);

  const persistColumns = useCallback(
    (next: BoardColumnType[]) => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(() => {
        updateBoard({ ...board, columns: next });
      }, 200);
    },
    [board]
  );

  const handleWidthChange = useCallback(
    (columnId: string, width: number) => {
      setColumns((prev) => {
        const next = prev.map((c) => (c.id === columnId ? { ...c, width } : c));
        persistColumns(next);
        return next;
      });
    },
    [persistColumns]
  );

  const handleToggleCollapse = useCallback(
    (columnId: string) => {
      setColumns((prev) => {
        const next = prev.map((c) =>
          c.id === columnId ? { ...c, collapsed: !c.collapsed } : c
        );
        persistColumns(next);
        return next;
      });
    },
    [persistColumns]
  );

  const fetchIssues = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/github/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repos: board.repos,
          mappings: board.columnMappings,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch issues");
      }
      const data: KanbanIssue[] = await res.json();
      setIssues(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [board.repos, board.columnMappings]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { destination, source, draggableId } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      )
        return;

      // Parse draggableId: "owner/repo#number"
      const match = draggableId.match(/^(.+?)\/(.+?)#(\d+)$/);
      if (!match) return;
      const [, owner, repo, numStr] = match;
      const issueNumber = parseInt(numStr, 10);
      const targetColumnId = destination.droppableId;

      // Optimistic update
      setIssues((prev) =>
        prev.map((issue) =>
          issue.repoOwner === owner &&
          issue.repo === repo &&
          issue.number === issueNumber
            ? { ...issue, columnId: targetColumnId }
            : issue
        )
      );

      setMoving(draggableId);

      try {
        const res = await fetch("/api/github/move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            owner,
            repo,
            issueNumber,
            targetColumnId,
            mappings: board.columnMappings,
          }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to move issue");
        }
      } catch {
        // Revert on failure
        fetchIssues();
      } finally {
        setMoving(null);
      }
    },
    [board.columnMappings, fetchIssues]
  );

  const handleAssigneesChange = useCallback(
    (issueKey: string, assignees: { login: string; avatar_url: string }[]) => {
      const [ownerRepo, numStr] = issueKey.split("#");
      const [owner, repo] = ownerRepo.split("/");
      const num = parseInt(numStr, 10);
      setIssues((prev) =>
        prev.map((i) =>
          i.repoOwner === owner && i.repo === repo && i.number === num
            ? { ...i, assignees }
            : i
        )
      );
    },
    []
  );

  const filteredIssues = applyFilters(issues, filters);
  const grouped = groupIssuesByColumn(filteredIssues, columns);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Loading issues from {board.repos.length} repo{board.repos.length !== 1 ? "s" : ""}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="rounded-lg bg-red-50 p-6 text-center dark:bg-red-950/40">
          <p className="text-sm font-medium text-red-800 dark:text-red-200">Error loading issues</p>
          <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchIssues();
            }}
            className="mt-3 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <BoardFilters
        issues={issues}
        repos={board.repos}
        filters={filters}
        onChange={setFilters}
      />
      <div className="flex flex-1 gap-4 overflow-x-auto p-4">
        <DragDropContext onDragEnd={onDragEnd}>
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              issues={grouped[column.id] || []}
              onAddIssue={setNewIssueColumnId}
              onWidthChange={handleWidthChange}
              onToggleCollapse={handleToggleCollapse}
              onAssigneesChange={handleAssigneesChange}
            />
          ))}
        </DragDropContext>
      </div>
      {moving && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white shadow-lg">
          Updating GitHub...
        </div>
      )}
      {newIssueColumnId && (
        <NewIssueModal
          board={board}
          defaultColumnId={newIssueColumnId}
          onClose={() => setNewIssueColumnId(null)}
          onCreated={(issue) => {
            setIssues((prev) => [issue, ...prev]);
          }}
        />
      )}
    </div>
  );
}

