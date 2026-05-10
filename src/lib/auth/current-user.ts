import { cookies, headers } from "next/headers";
import { getMockCurrentUser, userFromJwtPayload } from "@/lib/mock-auth";
import type { MockJwtPayload, PortalUser } from "@/lib/portal-types";
import {
  portalImpersonationCookieName,
  portalSessionCookieName,
  readPortalImpersonation,
  readPortalSession,
} from "@/lib/auth/sso-session";
import { getManagedUser } from "@/lib/db/users";
import { hasPermission } from "@/lib/permissions";

type AuthMode = "dev" | "trusted-header" | "sso-session";

export class AuthRequiredError extends Error {
  constructor(message = "Authentication is required.") {
    super(message);
    this.name = "AuthRequiredError";
  }
}

function getAuthMode(): AuthMode {
  const configuredMode = process.env.PORTAL_AUTH_MODE;

  if (configuredMode === "trusted-header" || configuredMode === "dev" || configuredMode === "sso-session") {
    return configuredMode;
  }

  return process.env.NODE_ENV === "production" ? "sso-session" : "dev";
}

function parseTrustedHeaderUser(value: string | null): PortalUser | null {
  if (!value) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as MockJwtPayload;
    return userFromJwtPayload(payload);
  } catch {
    return null;
  }
}

async function applyStoredPermissions(user: PortalUser): Promise<PortalUser> {
  try {
    const storedUser = await getManagedUser(user.id);

    if (!storedUser) {
      return user;
    }

    return {
      ...user,
      teamId: storedUser.teamId,
      status: storedUser.status,
      roles: storedUser.roles,
      scopes: storedUser.scopes,
    };
  } catch {
    return user;
  }
}

export async function getCurrentBaseUser(): Promise<PortalUser> {
  const authMode = getAuthMode();

  if (authMode === "dev") {
    return applyStoredPermissions(getMockCurrentUser());
  }

  if (authMode === "trusted-header") {
    const headerStore = await headers();
    const user = parseTrustedHeaderUser(headerStore.get("x-portal-user"));

    if (user) {
      return applyStoredPermissions(user);
    }

    if (process.env.NODE_ENV !== "production") {
      return applyStoredPermissions(getMockCurrentUser());
    }

    throw new AuthRequiredError("Missing authenticated portal user.");
  }

  const cookieStore = await cookies();
  const session = readPortalSession(cookieStore.get(portalSessionCookieName)?.value);

  if (session?.user) {
    return applyStoredPermissions(session.user);
  }

  throw new AuthRequiredError("Missing or expired SSO session.");
}

export async function getCurrentUser(): Promise<PortalUser> {
  const baseUser = await getCurrentBaseUser();
  const cookieStore = await cookies();
  const impersonation = readPortalImpersonation(cookieStore.get(portalImpersonationCookieName)?.value);

  if (!impersonation || impersonation.actor.id !== baseUser.id || !hasPermission(baseUser, "permission:manage")) {
    return baseUser;
  }

  return {
    ...impersonation.user,
    impersonatedBy: impersonation.actor,
  };
}
