"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { BoardConfig, REPO_COLORS } from "@/lib/types";
import { getBoard, updateBoard, deleteBoard } from "@/lib/board-store";
import { KanbanBoard } from "@/components/kanban-board";
import { RepoSelector } from "@/components/repo-selector";
import { ThemeToggle } from "@/components/theme-toggle";

export default function BoardPage() {
  const params = useParams();
  const router = useRouter();
  const { status } = useSession();
  const [board, setBoard] = useState<BoardConfig | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }
    const id = params.id as string;
    const b = getBoard(id);
    if (!b) {
      router.push("/");
      return;
    }
    setBoard(b);
  }, [params.id, status, router]);

  if (status === "loading" || !board) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100 dark:bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500 dark:border-gray-700 dark:border-t-blue-400" />
      </div>
    );
  }

  const handleAddRepos = (repos: { owner: string; repo: string }[]) => {
    const existingKeys = new Set(board.repos.map((r) => `${r.owner}/${r.repo}`));
    const newRepos = repos.filter((r) => !existingKeys.has(`${r.owner}/${r.repo}`));
    if (newRepos.length === 0) return;

    const updated: BoardConfig = {
      ...board,
      repos: [
        ...board.repos,
        ...newRepos.map((r, i) => ({
          ...r,
          color: REPO_COLORS[(board.repos.length + i) % REPO_COLORS.length],
        })),
      ],
    };
    updateBoard(updated);
    setBoard(updated);
    setRefreshKey((k) => k + 1);
  };

  const handleRemoveRepo = (owner: string, repo: string) => {
    const updated: BoardConfig = {
      ...board,
      repos: board.repos.filter((r) => !(r.owner === owner && r.repo === repo)),
    };
    updateBoard(updated);
    setBoard(updated);
    setRefreshKey((k) => k + 1);
  };

  const handleDeleteBoard = () => {
    if (confirm("Delete this board? This cannot be undone.")) {
      deleteBoard(board.id);
      router.push("/");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-neutral-950">
      {/* Top bar */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-neutral-900">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{board.name}</h1>
          <div className="flex items-center gap-1">
            {board.repos.map((r) => (
              <span
                key={`${r.owner}/${r.repo}`}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: r.color }}
              >
                {r.owner}/{r.repo}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800"
          >
            Settings
          </button>
          <ThemeToggle />
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-neutral-900">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
              Repositories on this board
            </h2>
            <div className="mb-4 space-y-2">
              {board.repos.map((r) => (
                <div
                  key={`${r.owner}/${r.repo}`}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: r.color }}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {r.owner}/{r.repo}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveRepo(r.owner, r.repo)}
                    className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <RepoSelector
              onSelect={handleAddRepos}
              existingRepos={board.repos.map((r) => `${r.owner}/${r.repo}`)}
              buttonLabel="Add Repository"
            />
            <div className="mt-4 border-t pt-4 dark:border-gray-800">
              <button
                onClick={handleDeleteBoard}
                className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Delete this board
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard key={refreshKey} board={board} />
      </div>
    </div>
  );
}
