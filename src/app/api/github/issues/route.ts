import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOctokit, fetchIssuesForRepo } from "@/lib/github";
import { ColumnMapping } from "@/lib/types";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { repos, mappings } = (await request.json()) as {
      repos: { owner: string; repo: string; color: string }[];
      mappings?: ColumnMapping[];
    };

    const octokit = createOctokit(session.accessToken);

    const allIssues = await Promise.all(
      repos.map((r) =>
        fetchIssuesForRepo(octokit, r.owner, r.repo, r.color, mappings)
      )
    );

    return NextResponse.json(allIssues.flat());
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch issues" },
      { status: error.status || 500 }
    );
  }
}
