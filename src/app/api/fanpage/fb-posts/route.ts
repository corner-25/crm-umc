import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getPagePosts, getPostInsights } from "@/lib/facebook";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const withInsights = searchParams.get("insights") === "true";

    const postsData = await getPagePosts(limit);
    const posts = postsData.data || [];

    // Lấy insights từng bài nếu cần
    let postsWithInsights = posts;
    if (withInsights) {
      postsWithInsights = await Promise.all(
        posts.map(async (post: any) => {
          const insights = await getPostInsights(post.id);
          const insightMap: Record<string, number> = {};
          if (insights?.data) {
            for (const metric of insights.data) {
              insightMap[metric.name] = metric.values?.[1]?.value ?? metric.values?.[0]?.value ?? 0;
            }
          }
          return {
            ...post,
            reach: insightMap["post_impressions_unique"] ?? 0,
            impressions: insightMap["post_impressions"] ?? 0,
            likeCount: post.likes?.summary?.total_count ?? 0,
            commentCount: post.comments?.summary?.total_count ?? 0,
            shareCount: post.shares?.count ?? 0,
          };
        })
      );
    } else {
      postsWithInsights = posts.map((post: any) => ({
        ...post,
        likeCount: post.likes?.summary?.total_count ?? 0,
        commentCount: post.comments?.summary?.total_count ?? 0,
        shareCount: post.shares?.count ?? 0,
      }));
    }

    return NextResponse.json({ posts: postsWithInsights, paging: postsData.paging });
  } catch (error: any) {
    console.error("Facebook posts error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch posts" }, { status: 500 });
  }
}
