"use client";

import { useEffect, useRef, useState } from "react";
import { KanbanIssue } from "@/lib/types";

export interface FilterState {
  repos: Set<string>; // "owner/repo" keys; empty = all
  labels: Set<string>; // empty = all
}

export function BoardFilters({
  issues,
  repos,
  filters,
  onChange,
}: {
  issues: KanbanIssue[];
  repos: { owner: string; repo: string; color: string }[];
  filters: FilterState;
  onChange: (next: FilterState) => void;
}) {
  // Collect unique labels seen across all issues (with their colors)
  const labelMap = new Map<string, string>();
  for (const issue of issues) {
    for (const label of issue.labels) {
      if (!labelMap.has(label.name)) labelMap.set(label.name, label.color);
    }
  }
  const allLabels = Array.from(labelMap.entries())
    .map(([name, color]) => ({ name, color }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const activeCount = filters.repos.size + filters.labels.size;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-neutral-900">
      <FilterMenu
        label="Repository"
        count={filters.repos.size}
        items={repos.map((r) => ({
          key: `${r.owner}/${r.repo}`,
          label: `${r.owner}/${r.repo}`,
          color: r.color,
        }))}
        selected={filters.repos}
        onToggle={(key) => {
          const next = new Set(filters.repos);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          onChange({ ...filters, repos: next });
        }}
        onClear={() => onChange({ ...filters, repos: new Set() })}
      />
      <FilterMenu
        label="Label"
        count={filters.labels.size}
        items={allLabels.map((l) => ({
          key: l.name,
          label: l.name,
          color: `#${l.color}`,
        }))}
        selected={filters.labels}
        onToggle={(key) => {
          const next = new Set(filters.labels);
          if (next.has(key)) next.delete(key);
          else next.add(key);
          onChange({ ...filters, labels: next });
        }}
        onClear={() => onChange({ ...filters, labels: new Set() })}
        emptyMessage="No labels in view"
      />

      {activeCount > 0 && (
        <button
          onClick={() => onChange({ repos: new Set(), labels: new Set() })}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

function FilterMenu({
  label,
  count,
  items,
  selected,
  onToggle,
  onClear,
  emptyMessage = "No options",
}: {
  label: string;
  count: number;
  items: { key: string; label: string; color: string }[];
  selected: Set<string>;
  onToggle: (key: string) => void;
  onClear: () => void;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
          count > 0
            ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
            : "border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800"
        }`}
      >
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
        {label}
        {count > 0 && (
          <span className="rounded-full bg-blue-200 px-1.5 text-[10px] text-blue-900 dark:bg-blue-800 dark:text-blue-100">
            {count}
          </span>
        )}
        <svg className="h-3 w-3 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute left-0 z-50 mt-1 w-64 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-neutral-800">
          {items.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">{emptyMessage}</div>
          ) : (
            <>
              <div className="max-h-64 overflow-y-auto">
                {items.map((item) => {
                  const checked = selected.has(item.key);
                  return (
                    <button
                      key={item.key}
                      onClick={() => onToggle(item.key)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        readOnly
                        className="rounded border-gray-300 text-blue-600 dark:border-gray-600 dark:bg-neutral-900"
                      />
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-gray-700 dark:text-gray-200">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selected.size > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={onClear}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-neutral-700 dark:hover:text-gray-200"
                  >
                    Clear {label.toLowerCase()} filter
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function applyFilters(issues: KanbanIssue[], filters: FilterState): KanbanIssue[] {
  return issues.filter((issue) => {
    if (filters.repos.size > 0) {
      if (!filters.repos.has(`${issue.repoOwner}/${issue.repo}`)) return false;
    }
    if (filters.labels.size > 0) {
      const hasMatch = issue.labels.some((l) => filters.labels.has(l.name));
      if (!hasMatch) return false;
    }
    return true;
  });
}
