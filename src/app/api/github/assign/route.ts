import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOctokit, setIssueAssignees } from "@/lib/github";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo, issueNumber, assignees } = (await request.json()) as {
      owner: string;
      repo: string;
      issueNumber: number;
      assignees: string[];
    };

    if (!owner || !repo || !issueNumber || !Array.isArray(assignees)) {
      return NextResponse.json(
        { error: "owner, repo, issueNumber, and assignees are required" },
        { status: 400 }
      );
    }

    const octokit = createOctokit(session.accessToken);
    const updated = await setIssueAssignees(
      octokit,
      owner,
      repo,
      issueNumber,
      assignees
    );

    return NextResponse.json({
      assignees: (updated.assignees || []).map((a) => ({
        login: a.login,
        avatar_url: a.avatar_url,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update assignees" },
      { status: error.status || 500 }
    );
  }
}
