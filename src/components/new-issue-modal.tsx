"use client";

import { useEffect, useRef, useState } from "react";
import { BoardConfig } from "@/lib/types";

interface RepoLabel {
  name: string;
  color: string;
  description: string | null;
}

export function NewIssueModal({
  board,
  defaultColumnId,
  onClose,
  onCreated,
}: {
  board: BoardConfig;
  defaultColumnId: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const defaultRepo = board.repos[0];
  const [owner, setOwner] = useState(defaultRepo.owner);
  const [repo, setRepo] = useState(defaultRepo.repo);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [availableLabels, setAvailableLabels] = useState<RepoLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Set<string>>(new Set());
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);

  // Auto-add the column's label
  useEffect(() => {
    const mapping = board.columnMappings.find(
      (m) => m.columnId === defaultColumnId
    );
    if (mapping?.label) {
      setSelectedLabels(new Set([mapping.label]));
    }
  }, [board.columnMappings, defaultColumnId]);

  // Focus title on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Fetch labels when repo changes
  useEffect(() => {
    setLabelsLoading(true);
    fetch(`/api/github/labels?owner=${owner}&repo=${repo}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAvailableLabels(data);
      })
      .finally(() => setLabelsLoading(false));
  }, [owner, repo]);

  const handleRepoChange = (fullName: string) => {
    const [o, r] = fullName.split("/");
    setOwner(o);
    setRepo(r);
    // Reset to just the column label after switching repos
    const mapping = board.columnMappings.find(
      (m) => m.columnId === defaultColumnId
    );
    setSelectedLabels(mapping?.label ? new Set([mapping.label]) : new Set());
  };

  const toggleLabel = (name: string) => {
    setSelectedLabels((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || submitting) return;

    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/github/create-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          title,
          body,
          labels: Array.from(selectedLabels),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create issue");
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const targetColumn = board.columns.find((c) => c.id === defaultColumnId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              New Issue
              {targetColumn && (
                <span className="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                  &rarr; {targetColumn.title}
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 p-5">
            {/* Repo picker (only if multiple repos) */}
            {board.repos.length > 1 && (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Repository
                </label>
                <select
                  value={`${owner}/${repo}`}
                  onChange={(e) => handleRepoChange(e.target.value)}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
                >
                  {board.repos.map((r) => (
                    <option key={`${r.owner}/${r.repo}`} value={`${r.owner}/${r.repo}`}>
                      {r.owner}/{r.repo}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Issue title"
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:placeholder-gray-500"
                required
              />
            </div>

            {/* Body */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description <span className="text-xs font-normal text-gray-400">(markdown)</span>
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Add more details..."
                rows={5}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>

            {/* Labels */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Labels
              </label>
              {labelsLoading ? (
                <p className="text-sm text-gray-400">Loading labels...</p>
              ) : (
                <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
                  {availableLabels.length === 0 && selectedLabels.size === 0 && (
                    <p className="text-sm text-gray-400">No labels in this repo</p>
                  )}
                  {/* Show selected labels that don't yet exist on the repo (column label) */}
                  {Array.from(selectedLabels)
                    .filter((name) => !availableLabels.some((l) => l.name === name))
                    .map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleLabel(name)}
                        className="inline-flex items-center gap-1 rounded-full border-2 border-blue-500 bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                        title="Will be created on submit"
                      >
                        {name}
                        <span className="text-[10px] opacity-70">(new)</span>
                      </button>
                    ))}
                  {availableLabels.map((label) => {
                    const checked = selectedLabels.has(label.name);
                    return (
                      <button
                        key={label.name}
                        type="button"
                        onClick={() => toggleLabel(label.name)}
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all"
                        style={{
                          backgroundColor: checked ? `#${label.color}` : `#${label.color}20`,
                          color: checked ? readableTextColor(label.color) : `#${label.color}`,
                          border: `2px solid ${checked ? `#${label.color}` : "transparent"}`,
                        }}
                      >
                        {label.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function readableTextColor(hex: string): string {
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "#000000" : "#ffffff";
}
