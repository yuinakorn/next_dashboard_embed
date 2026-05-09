import { NextResponse } from "next/server";
import { portalSessionCookieName, ssoStateCookieName } from "@/lib/auth/sso-session";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/login?logged_out=1", request.url));

  response.cookies.delete(portalSessionCookieName);
  response.cookies.delete(ssoStateCookieName);

  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
