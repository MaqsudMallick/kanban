"use client";

import { Droppable } from "@hello-pangea/dnd";
import { BoardColumn as BoardColumnType, KanbanIssue } from "@/lib/types";
import { IssueCard } from "./issue-card";

export function BoardColumn({
  column,
  issues,
  onAddIssue,
}: {
  column: BoardColumnType;
  issues: KanbanIssue[];
  onAddIssue?: (columnId: string) => void;
}) {
  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-gray-50 border border-gray-200 dark:bg-neutral-900 dark:border-gray-800">
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">{column.title}</h3>
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
    </div>
  );
}
