import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOctokit, createBranch } from "@/lib/github";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo, branchName } = (await request.json()) as {
      owner: string;
      repo: string;
      branchName: string;
    };

    if (!owner || !repo || !branchName?.trim()) {
      return NextResponse.json(
        { error: "owner, repo, and branchName are required" },
        { status: 400 }
      );
    }

    // Validate branch name (basic git ref rules)
    const name = branchName.trim();
    if (!/^[a-zA-Z0-9._/-]+$/.test(name) || name.startsWith("-") || name.endsWith("/") || name.includes("..")) {
      return NextResponse.json(
        { error: "Invalid branch name" },
        { status: 400 }
      );
    }

    const octokit = createOctokit(session.accessToken);
    const result = await createBranch(octokit, owner, repo, name);

    return NextResponse.json({
      branchName: name,
      sourceBranch: result.source,
      sha: result.sha,
    });
  } catch (error: any) {
    // GitHub returns 422 when the ref already exists
    if (error.status === 422) {
      return NextResponse.json(
        { error: "A branch with that name already exists" },
        { status: 422 }
      );
    }
    if (error.status === 403) {
      return NextResponse.json(
        { error: "You don't have push access to this repository" },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: error.message || "Failed to create branch" },
      { status: error.status || 500 }
    );
  }
}
