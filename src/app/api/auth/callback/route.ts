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

async function readResponseSnippet(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 1000);
  } catch {
    return "<unreadable response body>";
  }
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

  const tokenEndpoint = new URL("/api/oauth/token", ssoUrl);
  const redirectUri = getRedirectUri(request);
  let tokenResponse: Response;

  try {
    tokenResponse = await fetch(tokenEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
  } catch (error) {
    console.error("SSO token exchange request failed", {
      tokenEndpoint: tokenEndpoint.toString(),
      redirectUri,
      error: error instanceof Error ? error.message : String(error),
    });

    return redirectToLogin(request, "SSO token exchange failed.");
  }

  if (!tokenResponse.ok) {
    console.error("SSO token exchange returned non-OK response", {
      tokenEndpoint: tokenEndpoint.toString(),
      redirectUri,
      status: tokenResponse.status,
      statusText: tokenResponse.statusText,
      body: await readResponseSnippet(tokenResponse),
    });

    return redirectToLogin(request, "SSO token exchange failed.");
  }

  let tokenData: SsoTokenResponse;

  try {
    tokenData = (await tokenResponse.json()) as SsoTokenResponse;
  } catch (error) {
    console.error("SSO token response was not valid JSON", {
      tokenEndpoint: tokenEndpoint.toString(),
      redirectUri,
      error: error instanceof Error ? error.message : String(error),
    });

    return redirectToLogin(request, "SSO token exchange failed.");
  }

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
