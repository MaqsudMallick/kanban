import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createOctokit, fetchUserRepos } from "@/lib/github";

export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const octokit = createOctokit(session.accessToken);
    const repos = await fetchUserRepos(octokit);
    return NextResponse.json(repos);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch repos" },
      { status: error.status || 500 }
    );
  }
}
