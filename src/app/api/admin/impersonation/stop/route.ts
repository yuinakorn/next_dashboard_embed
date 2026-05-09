import { NextResponse } from "next/server";
import { portalImpersonationCookieName } from "@/lib/auth/sso-session";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/admin/users", request.url));
  response.cookies.delete(portalImpersonationCookieName);

  return response;
}
