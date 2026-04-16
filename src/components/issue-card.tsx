"use client";

import { Draggable } from "@hello-pangea/dnd";
import { KanbanIssue } from "@/lib/types";

export function IssueCard({
  issue,
  index,
}: {
  issue: KanbanIssue;
  index: number;
}) {
  return (
    <Draggable draggableId={`${issue.repoOwner}/${issue.repo}#${issue.number}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-shadow dark:border-gray-800 dark:bg-neutral-800 ${
            snapshot.isDragging ? "shadow-lg ring-2 ring-blue-400 dark:ring-blue-500" : "hover:shadow-md"
          }`}
        >
          {/* Repo badge */}
          <div className="mb-2 flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: issue.repoColor }}
            />
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {issue.repoOwner}/{issue.repo}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">#{issue.number}</span>
          </div>

          {/* Title */}
          <a
            href={issue.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2 block text-sm font-medium text-gray-900 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-400"
            onClick={(e) => e.stopPropagation()}
          >
            {issue.title}
          </a>

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {issue.labels.map((label) => (
                <span
                  key={label.name}
                  className="inline-block rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: `#${label.color}20`,
                    color: `#${label.color}`,
                    border: `1px solid #${label.color}40`,
                  }}
                >
                  {label.name}
                </span>
              ))}
            </div>
          )}

          {/* Linked PRs */}
          {issue.linkedPRs.length > 0 && (
            <div className="mb-2 space-y-1">
              {issue.linkedPRs.map((pr) => (
                <a
                  key={pr.number}
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"
                    />
                  </svg>
                  <span className={pr.draft ? "italic" : ""}>
                    PR #{pr.number}{" "}
                    {pr.state === "open" ? (
                      <span className="text-green-600 dark:text-green-400">open</span>
                    ) : (
                      <span className="text-red-500 dark:text-red-400">closed</span>
                    )}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Footer: assignees + comment count */}
          <div className="flex items-center justify-between">
            <div className="flex -space-x-1">
              {issue.assignees.map((a) => (
                <img
                  key={a.login}
                  src={a.avatar_url}
                  alt={a.login}
                  title={a.login}
                  className="h-5 w-5 rounded-full border border-white dark:border-neutral-800"
                />
              ))}
            </div>
            {issue.comments > 0 && (
              <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                  />
                </svg>
                {issue.comments}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
