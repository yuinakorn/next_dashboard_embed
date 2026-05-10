import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-origin";
import { portalSessionCookieName, ssoStateCookieName } from "@/lib/auth/sso-session";

function buildRedirectTarget(request: Request): URL {
  const ssoUrl = process.env.SSO_URL;
  const clientId = process.env.SSO_CLIENT_ID;
  const postLogoutRedirectUri = getAppUrl("/login?logged_out=1", request).toString();

  if (!ssoUrl || !clientId) {
    return new URL(postLogoutRedirectUri);
  }

  const logoutUrl = new URL("/api/auth/logout", ssoUrl);
  logoutUrl.searchParams.set("client_id", clientId);
  logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);

  return logoutUrl;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(buildRedirectTarget(request));

  response.cookies.delete(portalSessionCookieName);
  response.cookies.delete(ssoStateCookieName);

  return response;
}

export async function POST(request: Request) {
  return GET(request);
}
