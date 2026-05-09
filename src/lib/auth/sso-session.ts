import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { PortalRole, PortalUser, TeamScope } from "@/lib/portal-types";

export const portalSessionCookieName = "dashboard_hub_session";
export const portalImpersonationCookieName = "dashboard_hub_impersonation";
export const ssoStateCookieName = "dashboard_hub_sso_state";

const defaultSessionTtlSeconds = 8 * 60 * 60;
const defaultStateTtlSeconds = 10 * 60;

export type SsoOrganization = {
  hcode?: string | null;
  hname_th?: string | null;
  hname_eng?: string | null;
  position?: string | null;
  position_type?: string | null;
  license_id_verify?: boolean | null;
  is_hr_admin?: boolean | null;
  is_director?: boolean | null;
};

export type SsoUserProfile = {
  id?: string | null;
  provider_id?: string | null;
  account_id?: string | null;
  name_prefix?: string | null;
  name?: string | null;
  surname?: string | null;
  hash_cid?: string | null;
  name_th?: string | null;
  name_eng?: string | null;
  organizations?: SsoOrganization[];
};

export type SsoTokenResponse = {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
  user?: SsoUserProfile;
};

type PortalSessionPayload = {
  user: PortalUser;
  sso: {
    providerId: string;
    accountId?: string;
    hashCid?: string;
  };
  iat: number;
  exp: number;
};

type PortalImpersonationPayload = {
  actor: {
    id: string;
    name: string;
  };
  user: PortalUser;
  iat: number;
  exp: number;
};

function getSessionSecret(): string {
  const secret = process.env.PORTAL_SESSION_SECRET || process.env.SSO_CLIENT_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PORTAL_SESSION_SECRET or SSO_CLIENT_SECRET is required for SSO session auth.");
    }

    return "development-only-dashboard-hub-session-secret";
  }

  return secret;
}

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string): string {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function verifySignature(value: string, signature: string): boolean {
  const expected = sign(value);
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function parseCsv(value: string | undefined): string[] {
  return value
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
}

function parsePortalRoles(value: string | undefined): PortalRole[] {
  const allowedRoles: PortalRole[] = [
    "system_admin",
    "category_admin",
    "project_manager",
    "editor",
    "viewer",
  ];
  const roles = parseCsv(value).filter((role): role is PortalRole =>
    allowedRoles.includes(role as PortalRole),
  );

  return roles.length ? roles : ["viewer"];
}

function getDefaultCategoryScope(): string[] {
  return parseCsv(process.env.PORTAL_DEFAULT_CATEGORY_IDS);
}

function deriveRoles(organizations: SsoOrganization[]): PortalRole[] {
  const configuredRoles = parsePortalRoles(process.env.PORTAL_DEFAULT_ROLES);

  if (process.env.PORTAL_DEFAULT_ROLES) {
    return configuredRoles;
  }

  if (organizations.some((organization) => organization.is_hr_admin || organization.is_director)) {
    return ["category_admin", "project_manager", "editor", "viewer"];
  }

  if (organizations.some((organization) => organization.position_type?.toLowerCase() === "it")) {
    return ["editor", "viewer"];
  }

  return ["viewer"];
}

function getDisplayName(user: SsoUserProfile): string {
  const englishName = [user.name_prefix, user.name, user.surname].filter(Boolean).join(" ");
  return user.name_th || user.name_eng || englishName || user.provider_id || "SSO User";
}

export function portalUserFromSsoProfile(user: SsoUserProfile): PortalUser {
  const organizations = user.organizations ?? [];
  const primaryOrganization = organizations[0];
  const providerId = user.provider_id || user.id || user.account_id;

  if (!providerId) {
    throw new Error("SSO user profile is missing provider_id.");
  }

  const teamId = primaryOrganization?.hcode
    ? `hcode:${primaryOrganization.hcode}`
    : process.env.PORTAL_DEFAULT_TEAM_ID || "sso-authenticated";
  const categoryIds = getDefaultCategoryScope();
  const scopes: TeamScope[] = categoryIds.length ? [{ teamId, categoryIds }] : [];

  return {
    id: providerId,
    name: getDisplayName(user),
    title: primaryOrganization?.position || primaryOrganization?.position_type || "Provider ID user",
    department:
      primaryOrganization?.hname_th ||
      primaryOrganization?.hname_eng ||
      process.env.PORTAL_DEFAULT_DEPARTMENT ||
      "Authenticated organization",
    teamId,
    roles: deriveRoles(organizations),
    scopes,
  };
}

export function createRandomState(): string {
  return randomBytes(24).toString("base64url");
}

export function sealState(state: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + defaultStateTtlSeconds;
  const payload = base64Url(JSON.stringify({ state, exp: expiresAt }));

  return `${payload}.${sign(payload)}`;
}

export function unsealState(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !verifySignature(payload, signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      state?: string;
      exp?: number;
    };

    if (!parsed.state || !parsed.exp || parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return parsed.state;
  } catch {
    return null;
  }
}

export function createPortalSession(user: PortalUser, ssoUser: SsoUserProfile): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const ttlSeconds = Number(process.env.PORTAL_SESSION_TTL_SECONDS) || defaultSessionTtlSeconds;
  const payload: PortalSessionPayload = {
    user,
    sso: {
      providerId: ssoUser.provider_id || user.id,
      accountId: ssoUser.account_id || undefined,
      hashCid: ssoUser.hash_cid || undefined,
    },
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readPortalSession(value: string | undefined): PortalSessionPayload | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !verifySignature(payload, signature)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PortalSessionPayload;

    if (!session.user?.id || !session.exp || session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function createPortalImpersonation(actor: PortalUser, user: PortalUser): string {
  const issuedAt = Math.floor(Date.now() / 1000);
  const ttlSeconds = Number(process.env.PORTAL_IMPERSONATION_TTL_SECONDS) || defaultSessionTtlSeconds;
  const payload: PortalImpersonationPayload = {
    actor: {
      id: actor.id,
      name: actor.name,
    },
    user,
    iat: issuedAt,
    exp: issuedAt + ttlSeconds,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readPortalImpersonation(value: string | undefined): PortalImpersonationPayload | null {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !verifySignature(payload, signature)) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as PortalImpersonationPayload;

    if (!session.actor?.id || !session.user?.id || !session.exp || session.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    maxAge: maxAgeSeconds,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

export function getSessionMaxAgeSeconds(): number {
  return Number(process.env.PORTAL_SESSION_TTL_SECONDS) || defaultSessionTtlSeconds;
}

export function getStateMaxAgeSeconds(): number {
  return defaultStateTtlSeconds;
}
