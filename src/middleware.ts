import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isSuper, isPrivileged, canViewEvents, canViewRequisitions } from "@/lib/roles";

const PUBLIC_PATHS = ["/login"];

export default auth(function middleware(req: NextRequest & { auth: { user?: { role?: string } } | null }) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    if (req.auth?.user) {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!req.auth?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth.user.role ?? "";

  if (isSuper(role)) return NextResponse.next();

  if (pathname.startsWith("/employees") && !isPrivileged(role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/events") && !canViewEvents(role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/requisitions") && !canViewRequisitions(role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
};
