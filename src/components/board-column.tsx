"use client";

import { useEffect, useRef } from "react";
import { Droppable } from "@hello-pangea/dnd";
import {
  BoardColumn as BoardColumnType,
  KanbanIssue,
  COLUMN_DEFAULT_WIDTH,
  COLUMN_MIN_WIDTH,
  COLUMN_MAX_WIDTH,
  COLUMN_COLLAPSED_WIDTH,
} from "@/lib/types";
import { IssueCard } from "./issue-card";

export function BoardColumn({
  column,
  issues,
  onAddIssue,
  onWidthChange,
  onToggleCollapse,
}: {
  column: BoardColumnType;
  issues: KanbanIssue[];
  onAddIssue?: (columnId: string) => void;
  onWidthChange?: (columnId: string, width: number) => void;
  onToggleCollapse?: (columnId: string) => void;
}) {
  const collapsed = column.collapsed ?? false;
  const width = collapsed
    ? COLUMN_COLLAPSED_WIDTH
    : column.width ?? COLUMN_DEFAULT_WIDTH;

  const resizing = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    if (!onWidthChange) return;
    const onMouseMove = (e: MouseEvent) => {
      if (!resizing.current) return;
      const delta = e.clientX - resizing.current.startX;
      const next = Math.min(
        COLUMN_MAX_WIDTH,
        Math.max(COLUMN_MIN_WIDTH, resizing.current.startWidth + delta)
      );
      onWidthChange(column.id, next);
    };
    const onMouseUp = () => {
      if (!resizing.current) return;
      resizing.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [column.id, onWidthChange]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = { startX: e.clientX, startWidth: width };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  if (collapsed) {
    return (
      <div
        className="relative flex h-full shrink-0 flex-col items-center rounded-xl bg-gray-50 border border-gray-200 dark:bg-neutral-900 dark:border-gray-800"
        style={{ width: `${COLUMN_COLLAPSED_WIDTH}px` }}
      >
        <button
          onClick={() => onToggleCollapse?.(column.id)}
          className="flex h-full w-full flex-col items-center gap-2 py-3"
          title={`Expand ${column.title}`}
        >
          <span
            className="h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: column.color }}
          />
          <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
            {issues.length}
          </span>
          <div
            className="flex-1 text-sm font-semibold text-gray-700 dark:text-gray-200"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            {column.title}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative flex h-full shrink-0 flex-col rounded-xl bg-gray-50 border border-gray-200 dark:bg-neutral-900 dark:border-gray-800"
      style={{ width: `${width}px` }}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => onToggleCollapse?.(column.id)}
          className="rounded p-0.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-500 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
          title="Collapse column"
          aria-label="Collapse column"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
          </svg>
        </button>
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{column.title}</h3>
        <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
          {issues.length}
        </span>
        {onAddIssue && (
          <button
            onClick={() => onAddIssue(column.id)}
            className="rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-gray-200"
            title="New issue in this column"
            aria-label="New issue"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
            </svg>
          </button>
        )}
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-blue-50 dark:bg-blue-900/20" : ""
            }`}
          >
            {issues.map((issue, index) => (
              <IssueCard
                key={`${issue.repoOwner}/${issue.repo}#${issue.number}`}
                issue={issue}
                index={index}
              />
            ))}
            {provided.placeholder}
            {issues.length === 0 && !snapshot.isDraggingOver && (
              <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                No issues
              </div>
            )}
          </div>
        )}
      </Droppable>

      {/* Resize handle */}
      {onWidthChange && (
        <div
          onMouseDown={startResize}
          onDoubleClick={() => onWidthChange(column.id, COLUMN_DEFAULT_WIDTH)}
          className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize transition-colors hover:bg-blue-400/60"
          title="Drag to resize · double-click to reset"
        />
      )}
    </div>
  );
}
