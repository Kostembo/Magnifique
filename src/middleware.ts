import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

// Roles with unrestricted access to all protected pages
const SUPER_ROLES = ["owner", "admin"];

// Roles that can access the employees section
const EMPLOYEE_ADMIN_ROLES = ["manager", "owner", "admin"];

// Roles that can access the events section
const EVENT_ROLES = ["manager", "owner", "admin", "sales", "chef", "waiter", "cook"];

// Roles that can access requisitions
const REQUISITION_ROLES = ["manager", "owner", "admin", "warehouse"];

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

  // Super roles bypass all restrictions
  if (SUPER_ROLES.includes(role)) return NextResponse.next();

  if (pathname.startsWith("/employees") && !EMPLOYEE_ADMIN_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/events") && !EVENT_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (pathname.startsWith("/requisitions") && !REQUISITION_ROLES.includes(role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)"],
};
