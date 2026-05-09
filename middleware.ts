import { NextResponse, type NextRequest } from "next/server";

const portalSessionCookieName = "dashboard_hub_session";

function getAuthMode(): string {
  const configuredMode = process.env.PORTAL_AUTH_MODE;

  if (configuredMode === "trusted-header" || configuredMode === "dev" || configuredMode === "sso-session") {
    return configuredMode;
  }

  return process.env.NODE_ENV === "production" ? "sso-session" : "dev";
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/public" ||
    pathname.startsWith("/public/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  );
}

export function middleware(request: NextRequest) {
  if (getAuthMode() !== "sso-session" || isPublicPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const hasSessionCookie = Boolean(request.cookies.get(portalSessionCookieName)?.value);

  if (hasSessionCookie) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
