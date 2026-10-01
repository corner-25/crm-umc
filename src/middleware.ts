import { withAuth, type NextRequestWithAuth } from "next-auth/middleware";
import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";
import { isBlockedBot } from "@/lib/bot-blocker";

const authMiddleware = withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

/*
 * Các đường dẫn KHÔNG cần đăng nhập (giữ nguyên như matcher cũ):
 * - api/ (API tự xử lý auth), auth/ (trang đăng nhập)
 * - _next/static, _next/image, favicon.ico, robots.txt
 * - public assets: wards/, vietnam-provinces.geojson, ảnh, json, geojson
 */
const PUBLIC_PATH =
  /^\/(api\/|auth\/|_next\/static|_next\/image|favicon\.ico$|robots\.txt$|wards\/|vietnam-provinces\.geojson)|\.(png|jpe?g|svg|ico|json|geojson)$/;

export default function middleware(req: NextRequest, event: NextFetchEvent) {
  const { pathname } = req.nextUrl;

  // Chặn bot AI trên mọi đường dẫn (trừ robots.txt để bot đọc được lệnh Disallow).
  if (pathname !== "/robots.txt" && isBlockedBot(req.headers.get("user-agent"))) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: { "X-Robots-Tag": "noindex, nofollow, noarchive" },
    });
  }

  if (PUBLIC_PATH.test(pathname)) {
    return NextResponse.next();
  }

  return authMiddleware(req as NextRequestWithAuth, event);
}

export const config = {
  // Chạy trên mọi request trừ file build tĩnh của Next.
  matcher: ["/((?!_next/static|_next/image).*)"],
};
