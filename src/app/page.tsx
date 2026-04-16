"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, useSession } from "next-auth/react";
import { BoardConfig } from "@/lib/types";
import { loadBoards, createBoard } from "@/lib/board-store";
import { RepoSelector } from "@/components/repo-selector";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [boards, setBoards] = useState<BoardConfig[]>([]);
  const [creating, setCreating] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<
    { owner: string; repo: string }[]
  >([]);

  useEffect(() => {
    setBoards(loadBoards());
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-50">
        <div className="text-center">
          <div className="mb-2 flex items-center justify-center gap-2">
            <svg className="h-8 w-8 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <h1 className="text-3xl font-bold text-gray-900">Kanban</h1>
          </div>
          <p className="text-gray-500">
            A Kanban board for your GitHub issues across multiple repos
          </p>
        </div>
        <button
          onClick={() => signIn("github")}
          className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-gray-800"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </button>
      </div>
    );
  }

  const handleCreateBoard = () => {
    if (!boardName.trim() || selectedRepos.length === 0) return;
    const board = createBoard(boardName.trim(), selectedRepos);
    router.push(`/board/${board.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <svg className="h-6 w-6 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <span className="text-lg font-semibold">Kanban</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {session.user?.name || session.user?.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Your Boards</h2>
          <button
            onClick={() => setCreating(true)}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            New Board
          </button>
        </div>

        {/* Create board form */}
        {creating && (
          <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">
              Create a new board
            </h3>
            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Board name
              </label>
              <input
                type="text"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                placeholder="e.g. My Project Board"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Repositories
              </label>
              {selectedRepos.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {selectedRepos.map((r) => (
                    <span
                      key={`${r.owner}/${r.repo}`}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                    >
                      {r.owner}/{r.repo}
                      <button
                        onClick={() =>
                          setSelectedRepos((prev) =>
                            prev.filter(
                              (p) =>
                                !(p.owner === r.owner && p.repo === r.repo)
                            )
                          )
                        }
                        className="ml-1 text-blue-500 hover:text-blue-700"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <RepoSelector
                onSelect={(repos) =>
                  setSelectedRepos((prev) => [...prev, ...repos])
                }
                existingRepos={selectedRepos.map(
                  (r) => `${r.owner}/${r.repo}`
                )}
                buttonLabel="Select Repositories"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreateBoard}
                disabled={!boardName.trim() || selectedRepos.length === 0}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Create Board
              </button>
              <button
                onClick={() => {
                  setCreating(false);
                  setBoardName("");
                  setSelectedRepos([]);
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Board list */}
        {boards.length === 0 && !creating ? (
          <div className="rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-gray-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <rect x="3" y="3" width="7" height="9" rx="1" />
              <rect x="14" y="3" width="7" height="5" rx="1" />
              <rect x="14" y="12" width="7" height="9" rx="1" />
              <rect x="3" y="16" width="7" height="5" rx="1" />
            </svg>
            <h3 className="mb-1 text-lg font-medium text-gray-900">
              No boards yet
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Create your first board by selecting GitHub repositories
            </p>
            <button
              onClick={() => setCreating(true)}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Create your first board
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => router.push(`/board/${board.id}`)}
                className="rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-shadow hover:shadow-md"
              >
                <h3 className="mb-2 text-base font-semibold text-gray-900">
                  {board.name}
                </h3>
                <div className="flex flex-wrap gap-1">
                  {board.repos.map((r) => (
                    <span
                      key={`${r.owner}/${r.repo}`}
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: r.color }}
                    >
                      {r.repo}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  {board.repos.length} repo{board.repos.length !== 1 ? "s" : ""}{" "}
                  &middot; {board.columns.length} columns
                </p>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
