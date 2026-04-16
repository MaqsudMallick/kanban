"use client";

import { Droppable } from "@hello-pangea/dnd";
import { BoardColumn as BoardColumnType, KanbanIssue } from "@/lib/types";
import { IssueCard } from "./issue-card";

export function BoardColumn({
  column,
  issues,
}: {
  column: BoardColumnType;
  issues: KanbanIssue[];
}) {
  return (
    <div className="flex h-full w-80 shrink-0 flex-col rounded-xl bg-gray-50 border border-gray-200">
      {/* Column header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: column.color }}
        />
        <h3 className="text-sm font-semibold text-gray-700">{column.title}</h3>
        <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
          {issues.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-2 space-y-2 transition-colors ${
              snapshot.isDraggingOver ? "bg-blue-50" : ""
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
              <div className="py-8 text-center text-sm text-gray-400">
                No issues
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
