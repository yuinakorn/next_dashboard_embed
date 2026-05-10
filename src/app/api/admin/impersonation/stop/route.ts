import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-origin";
import { portalImpersonationCookieName } from "@/lib/auth/sso-session";

export async function GET(request: Request) {
  const response = NextResponse.redirect(getAppUrl("/admin/users", request));
  response.cookies.delete(portalImpersonationCookieName);

  return response;
}
