"use client";

import { useEffect, useRef, useState } from "react";
import { KanbanIssue } from "@/lib/types";

function generateBranchName(number: number, title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50)
    .replace(/-+$/, "");
  return slug ? `${number}-${slug}` : `${number}`;
}

export function CreateBranchModal({
  issue,
  onClose,
}: {
  issue: KanbanIssue;
  onClose: () => void;
}) {
  const [branchName, setBranchName] = useState(
    generateBranchName(issue.number, issue.title)
  );
  const [defaultBranch, setDefaultBranch] = useState<string | null>(null);
  const [loadingBranch, setLoadingBranch] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    branchName: string;
    sourceBranch: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<"name" | "command" | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/github/default-branch?owner=${issue.repoOwner}&repo=${issue.repo}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.defaultBranch) setDefaultBranch(data.defaultBranch);
      })
      .finally(() => setLoadingBranch(false));
  }, [issue.repoOwner, issue.repo]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim() || submitting) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/github/create-branch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: issue.repoOwner,
          repo: issue.repo,
          branchName: branchName.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create branch");
      setCreated({ branchName: data.branchName, sourceBranch: data.sourceBranch });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (text: string, field: "name" | "command") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField((c) => (c === field ? null : c)), 1500);
    } catch {
      // ignore
    }
  };

  // Success state
  if (created) {
    const command = `git fetch origin && git checkout ${created.branchName}`;
    return (
      <ModalShell onClose={onClose} title="Branch created">
        <div className="space-y-4 p-5">
          <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950/40 dark:text-green-300">
            Created <code className="font-mono font-semibold">{created.branchName}</code> from{" "}
            <code className="font-mono">{created.sourceBranch}</code>
          </div>

          <CopyRow
            label="Branch name"
            value={created.branchName}
            copied={copiedField === "name"}
            onCopy={() => copy(created.branchName, "name")}
          />
          <CopyRow
            label="Checkout command"
            value={command}
            copied={copiedField === "command"}
            onCopy={() => copy(command, "command")}
          />
        </div>
        <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3 dark:border-gray-800">
          <a
            href={`https://github.com/${issue.repoOwner}/${issue.repo}/tree/${created.branchName}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-gray-300 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800"
          >
            View on GitHub
          </a>
          <button
            onClick={onClose}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell onClose={onClose} title="Create branch">
      <form onSubmit={handleSubmit}>
        <div className="space-y-4 p-5">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            For {issue.repoOwner}/{issue.repo} #{issue.number}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Branch name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 font-mono text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-neutral-800 dark:text-gray-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Source branch
            </label>
            <div className="flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 font-mono text-sm text-gray-700 dark:border-gray-800 dark:bg-neutral-800 dark:text-gray-300">
              {loadingBranch ? "Loading..." : defaultBranch ?? "main"}
              <span className="ml-2 text-xs text-gray-400">(repo default)</span>
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
        </div>

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
            disabled={!branchName.trim() || submitting || loadingBranch}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create branch"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

function ModalShell({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white shadow-xl dark:bg-neutral-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {title}
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
        {children}
      </div>
    </div>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="flex gap-2">
        <code className="flex-1 truncate rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800 dark:border-gray-800 dark:bg-neutral-800 dark:text-gray-200">
          {value}
        </code>
        <button
          type="button"
          onClick={onCopy}
          className={`shrink-0 rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
            copied
              ? "border-green-500 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/40 dark:text-green-300"
              : "border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800"
          }`}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
