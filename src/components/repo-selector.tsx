"use client";

import { useEffect, useState } from "react";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  description: string | null;
  private: boolean;
  open_issues_count: number;
}

export function RepoSelector({
  onSelect,
  existingRepos = [],
  buttonLabel = "Add",
}: {
  onSelect: (repos: { owner: string; repo: string }[]) => void;
  existingRepos?: string[];
  buttonLabel?: string;
}) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (open && repos.length === 0) {
      setLoading(true);
      fetch("/api/github/repos")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setRepos(data);
        })
        .finally(() => setLoading(false));
    }
  }, [open, repos.length]);

  const filtered = repos.filter((r) => {
    if (existingRepos.includes(r.full_name)) return false;
    if (!search) return true;
    return r.full_name.toLowerCase().includes(search.toLowerCase());
  });

  const toggle = (fullName: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fullName)) next.delete(fullName);
      else next.add(fullName);
      return next;
    });
  };

  const handleAdd = () => {
    const reposToAdd = Array.from(selected).map((full) => {
      const [owner, repo] = full.split("/");
      return { owner, repo };
    });
    onSelect(reposToAdd);
    setSelected(new Set());
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-dashed border-gray-300 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
      >
        + {buttonLabel}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          placeholder="Search repositories..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        <button
          onClick={() => {
            setOpen(false);
            setSelected(new Set());
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-500">
          Loading repositories...
        </div>
      ) : (
        <div className="max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="py-4 text-center text-sm text-gray-400">
              No matching repositories
            </div>
          ) : (
            filtered.map((repo) => (
              <label
                key={repo.id}
                className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(repo.full_name)}
                  onChange={() => toggle(repo.full_name)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {repo.full_name}
                    </span>
                    {repo.private && (
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                        private
                      </span>
                    )}
                  </div>
                  {repo.description && (
                    <p className="text-xs text-gray-500 truncate">
                      {repo.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-xs text-gray-400">
                  {repo.open_issues_count} issues
                </span>
              </label>
            ))
          )}
        </div>
      )}

      {selected.size > 0 && (
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm text-gray-600">
            {selected.size} selected
          </span>
          <button
            onClick={handleAdd}
            className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            {buttonLabel}
          </button>
        </div>
      )}
    </div>
  );
}
