import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOctokit, moveIssue } from "@/lib/github";
import { ColumnMapping } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { owner, repo, issueNumber, targetColumnId, mappings } =
      (await request.json()) as {
        owner: string;
        repo: string;
        issueNumber: number;
        targetColumnId: string;
        mappings?: ColumnMapping[];
      };

    const octokit = createOctokit(session.accessToken);
    await moveIssue(octokit, owner, repo, issueNumber, targetColumnId, mappings);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to move issue" },
      { status: error.status || 500 }
    );
  }
}
