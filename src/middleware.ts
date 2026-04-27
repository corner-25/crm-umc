import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// ────────────────────────────────────────────────────────────────────────────
// Locked mode — chặn truy cập tính năng cho user không trong whitelist.
// Bật: env LOCKED_MODE=true
// Whitelist: env LOCKED_MODE_WHITELIST="email1@x.com,email2@x.com"
// ────────────────────────────────────────────────────────────────────────────
const LOCKED_MODE = process.env.LOCKED_MODE === "true";
const WHITELIST = (process.env.LOCKED_MODE_WHITELIST || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function isWhitelisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return WHITELIST.includes(email.toLowerCase());
}

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth?.token;
    const email = (token?.email as string | undefined) || null;

    // Khi locked mode bật và user không whitelist → chặn
    if (LOCKED_MODE && token && !isWhitelisted(email)) {
      // Ngoại lệ: cho phép vào trang access-denied và logout
      if (pathname.startsWith("/access-denied")) {
        return NextResponse.next();
      }
      // API: trả 403
      if (pathname.startsWith("/api/")) {
        // Cho phép logout API hoạt động (next-auth signout)
        if (pathname.startsWith("/api/auth/")) {
          return NextResponse.next();
        }
        return NextResponse.json(
          {
            error: "ACCESS_RESTRICTED",
            message:
              "Truy cập bị giới hạn. Hệ thống tạm giới hạn các chức năng cho đến khi có thỏa thuận chính thức với chủ sở hữu.",
          },
          { status: 403 }
        );
      }
      // Page: redirect sang /access-denied
      const url = req.nextUrl.clone();
      url.pathname = "/access-denied";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - public assets (wards/, geojson, images)
     *
     * Khi LOCKED_MODE bật, middleware sẽ áp dụng cho cả /api/* (trừ /api/auth/*)
     * để chặn cả tầng API.
     */
    "/((?!auth/|_next/static|_next/image|favicon.ico|wards/|vietnam-provinces\\.geojson|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$|.*\\.ico$|.*\\.json$|.*\\.geojson$).*)",
  ],
};
