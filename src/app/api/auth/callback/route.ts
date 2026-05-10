import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  createPortalSession,
  getCookieOptions,
  getSessionMaxAgeSeconds,
  portalSessionCookieName,
  portalUserFromSsoProfile,
  ssoStateCookieName,
  unsealState,
  type SsoTokenResponse,
} from "@/lib/auth/sso-session";
import { getAppUrl } from "@/lib/app-origin";
import { upsertCurrentUser } from "@/lib/db/users";

function getRedirectUri(request: Request): string {
  if (process.env.SSO_REDIRECT_URI) {
    return process.env.SSO_REDIRECT_URI;
  }

  return getAppUrl("/api/auth/callback", request).toString();
}

function readStateContext(value: string | null): { state: string; nextPath: string } | null {
  if (!value) {
    return null;
  }

  const separatorIndex = value.indexOf(":");

  if (separatorIndex < 1) {
    return null;
  }

  const state = value.slice(0, separatorIndex);
  const nextPath = value.slice(separatorIndex + 1);

  return {
    state,
    nextPath: nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/",
  };
}

function redirectToLogin(request: Request, reason: string) {
  const url = getAppUrl("/login", request);
  url.searchParams.set("error", reason);

  const response = NextResponse.redirect(url);
  response.cookies.delete(ssoStateCookieName);

  return response;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const error = url.searchParams.get("error");
  const errorDescription = url.searchParams.get("error_description");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readStateContext(unsealState(cookieStore.get(ssoStateCookieName)?.value));

  if (error) {
    return redirectToLogin(request, errorDescription || error);
  }

  if (!code || !state || !expectedState || state !== expectedState.state) {
    return redirectToLogin(request, "Invalid SSO callback state.");
  }

  const ssoUrl = process.env.SSO_URL;
  const clientId = process.env.SSO_CLIENT_ID;
  const clientSecret = process.env.SSO_CLIENT_SECRET;

  if (!ssoUrl || !clientId || !clientSecret) {
    return redirectToLogin(request, "SSO client configuration is incomplete.");
  }

  const tokenResponse = await fetch(new URL("/api/oauth/token", ssoUrl), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(request),
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!tokenResponse.ok) {
    return redirectToLogin(request, "SSO token exchange failed.");
  }

  const tokenData = (await tokenResponse.json()) as SsoTokenResponse;

  if (!tokenData.user) {
    return redirectToLogin(request, "SSO token response did not include a user profile.");
  }

  const portalUser = portalUserFromSsoProfile(tokenData.user);
  await upsertCurrentUser(portalUser, "sso");
  const response = NextResponse.redirect(getAppUrl(expectedState.nextPath, request));

  response.cookies.set(
    portalSessionCookieName,
    createPortalSession(portalUser, tokenData.user),
    getCookieOptions(getSessionMaxAgeSeconds()),
  );
  response.cookies.delete(ssoStateCookieName);

  return response;
}
