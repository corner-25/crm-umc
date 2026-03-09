import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPageInfo, getPageInsights } from "@/lib/facebook";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since") || undefined;
    const until = searchParams.get("until") || undefined;

    const [pageInfo, impressions, reach, engagedUsers] = await Promise.all([
      getPageInfo(),
      getPageInsights("page_impressions", "day", since, until).catch(() => null),
      getPageInsights("page_impressions_unique", "day", since, until).catch(() => null),
      getPageInsights("page_engaged_users", "day", since, until).catch(() => null),
    ]);

    return NextResponse.json({
      page: {
        id: pageInfo.id,
        name: pageInfo.name,
        fanCount: pageInfo.fan_count,
        followersCount: pageInfo.followers_count,
        picture: pageInfo.picture?.data?.url,
      },
      insights: {
        impressions: impressions?.data?.[0]?.values || [],
        reach: reach?.data?.[0]?.values || [],
        engagedUsers: engagedUsers?.data?.[0]?.values || [],
      },
    });
  } catch (error: any) {
    console.error("Facebook insights error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch insights" }, { status: 500 });
  }
}
