"use client";

import { useEffect, useRef, useState } from "react";

interface AssignableUser {
  login: string;
  avatar_url: string;
}

export function AssigneePicker({
  owner,
  repo,
  selected,
  onChange,
  onClose,
  anchor,
}: {
  owner: string;
  repo: string;
  selected: string[];
  onChange: (next: string[]) => void;
  onClose: () => void;
  anchor?: { x: number; y: number };
}) {
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/github/assignees?owner=${owner}&repo=${repo}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setUsers(data);
      })
      .finally(() => setLoading(false));
  }, [owner, repo]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onClose]);

  const filtered = users.filter((u) =>
    u.login.toLowerCase().includes(search.toLowerCase())
  );

  // Show selected users that aren't in the assignable list (e.g. removed from repo)
  const orphans = selected
    .filter((login) => !users.some((u) => u.login === login))
    .map((login) => ({ login, avatar_url: `https://github.com/${login}.png` }));

  const toggle = (login: string) => {
    if (selected.includes(login)) {
      onChange(selected.filter((l) => l !== login));
    } else {
      onChange([...selected, login]);
    }
  };

  // Position: if anchor provided, position fixed near it; otherwise, just relative
  const positionStyle: React.CSSProperties = anchor
    ? {
        position: "fixed",
        left: Math.min(anchor.x, window.innerWidth - 270),
        top: Math.min(anchor.y, window.innerHeight - 320),
      }
    : { position: "absolute", top: "100%", left: 0, marginTop: 4 };

  return (
    <div
      ref={ref}
      style={{ ...positionStyle, zIndex: 100, width: 250 }}
      className="rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-neutral-800"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="border-b border-gray-200 p-2 dark:border-gray-700">
        <input
          type="text"
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search collaborators..."
          className="w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-neutral-900 dark:text-gray-100 dark:placeholder-gray-500"
        />
      </div>
      <div className="max-h-64 overflow-y-auto py-1">
        {loading ? (
          <div className="px-3 py-4 text-center text-sm text-gray-400">
            Loading...
          </div>
        ) : filtered.length === 0 && orphans.length === 0 ? (
          <div className="px-3 py-4 text-center text-sm text-gray-400">
            No collaborators
          </div>
        ) : (
          <>
            {[...orphans, ...filtered].map((user) => {
              const checked = selected.includes(user.login);
              return (
                <button
                  key={user.login}
                  onClick={() => toggle(user.login)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-neutral-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className="rounded border-gray-300 text-blue-600 dark:border-gray-600"
                  />
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="h-5 w-5 rounded-full"
                  />
                  <span className="truncate text-gray-700 dark:text-gray-200">
                    {user.login}
                  </span>
                </button>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
