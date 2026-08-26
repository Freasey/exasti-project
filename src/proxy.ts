import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "ecocycle_session";

/**
 * Penjaga cepat di edge. Di Next.js 16 berkas ini bernama `proxy`
 * (dulu `middleware`).
 *
 * Pengunjung tanpa cookie sesi langsung dilempar ke /login tanpa perlu
 * menyentuh database. Verifikasi token yang sebenarnya tetap dilakukan di
 * layout area privat (src/app/(app)/layout.tsx).
 */
export default function proxy(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/activities/:path*",
    "/analytics/:path*",
    "/rewards/:path*",
    "/leaderboard/:path*",
    "/live/:path*",
    "/ride/:path*",
    "/settings/:path*",
  ],
};
