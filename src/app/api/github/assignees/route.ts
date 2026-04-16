import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOctokit, fetchAssignableUsers } from "@/lib/github";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo are required" },
      { status: 400 }
    );
  }

  try {
    const octokit = createOctokit(session.accessToken);
    const users = await fetchAssignableUsers(octokit, owner, repo);
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch assignees" },
      { status: error.status || 500 }
    );
  }
}
