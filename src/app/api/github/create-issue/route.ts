import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOctokit, createIssue } from "@/lib/github";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo, title, body, labels, assignees } = (await request.json()) as {
      owner: string;
      repo: string;
      title: string;
      body?: string;
      labels?: string[];
      assignees?: string[];
    };

    if (!owner || !repo || !title?.trim()) {
      return NextResponse.json(
        { error: "owner, repo, and title are required" },
        { status: 400 }
      );
    }

    const octokit = createOctokit(session.accessToken);
    const issue = await createIssue(
      octokit,
      owner,
      repo,
      title.trim(),
      body || "",
      labels || [],
      assignees || []
    );

    return NextResponse.json(issue);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create issue" },
      { status: error.status || 500 }
    );
  }
}
