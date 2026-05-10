import { NextResponse } from "next/server";
import {
  createRandomState,
  getCookieOptions,
  getStateMaxAgeSeconds,
  sealState,
  ssoStateCookieName,
} from "@/lib/auth/sso-session";
import { getAppUrl } from "@/lib/app-origin";

function getRedirectUri(request: Request): string {
  if (process.env.SSO_REDIRECT_URI) {
    return process.env.SSO_REDIRECT_URI;
  }

  return getAppUrl("/api/auth/callback", request).toString();
}

function getNextPath(request: Request): string {
  const nextPath = new URL(request.url).searchParams.get("next");

  if (!nextPath?.startsWith("/") || nextPath.startsWith("//")) {
    return "/";
  }

  return nextPath;
}

export async function GET(request: Request) {
  const ssoUrl = process.env.SSO_URL;
  const clientId = process.env.SSO_CLIENT_ID;

  if (!ssoUrl || !clientId) {
    return NextResponse.json(
      { error: "SSO_URL and SSO_CLIENT_ID must be configured before starting SSO login." },
      { status: 500 },
    );
  }

  const state = createRandomState();
  const authorizeUrl = new URL("/authorize", ssoUrl);

  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", getRedirectUri(request));
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(
    ssoStateCookieName,
    sealState(`${state}:${getNextPath(request)}`),
    getCookieOptions(getStateMaxAgeSeconds()),
  );

  return response;
}
