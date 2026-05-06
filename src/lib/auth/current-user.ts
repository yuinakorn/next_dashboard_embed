import { headers } from "next/headers";
import { getMockCurrentUser, userFromJwtPayload } from "@/lib/mock-auth";
import type { MockJwtPayload, PortalUser } from "@/lib/portal-types";

type AuthMode = "dev" | "trusted-header";

function getAuthMode(): AuthMode {
  const configuredMode = process.env.PORTAL_AUTH_MODE;

  if (configuredMode === "trusted-header" || configuredMode === "dev") {
    return configuredMode;
  }

  return process.env.NODE_ENV === "production" ? "trusted-header" : "dev";
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

export async function getCurrentUser(): Promise<PortalUser> {
  if (getAuthMode() === "dev") {
    return getMockCurrentUser();
  }

  const headerStore = await headers();
  const user = parseTrustedHeaderUser(headerStore.get("x-portal-user"));

  if (user) {
    return user;
  }

  if (process.env.NODE_ENV !== "production") {
    return getMockCurrentUser();
  }

  throw new Error("Missing authenticated portal user.");
}
