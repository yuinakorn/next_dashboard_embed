import { NextResponse } from "next/server";
import { AuthRequiredError, getCurrentBaseUser } from "@/lib/auth/current-user";
import {
  createPortalImpersonation,
  getCookieOptions,
  getSessionMaxAgeSeconds,
  portalImpersonationCookieName,
} from "@/lib/auth/sso-session";
import { getManagedUser } from "@/lib/db/users";
import { hasPermission } from "@/lib/permissions";
import type { PortalRole, PortalUser } from "@/lib/portal-types";

type ImpersonationBody = {
  userId?: unknown;
  roles?: unknown;
  categoryIds?: unknown;
};

const validRoles: PortalRole[] = [
  "system_admin",
  "category_admin",
  "project_manager",
  "editor",
  "viewer",
];

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.length > 0)
    : [];
}

async function requireSystemAdmin() {
  try {
    const actor = await getCurrentBaseUser();

    if (!hasPermission(actor, "permission:manage")) {
      return { actor: null, response: NextResponse.json({ error: "Impersonation is restricted." }, { status: 403 }) };
    }

    return { actor, response: null };
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return { actor: null, response: NextResponse.json({ error: error.message }, { status: 401 }) };
    }

    throw error;
  }
}

export async function POST(request: Request) {
  const { actor, response } = await requireSystemAdmin();

  if (!actor) {
    return response;
  }

  const body = (await request.json()) as ImpersonationBody;
  const userId = typeof body.userId === "string" ? body.userId : "";
  const target = userId ? await getManagedUser(userId) : null;

  if (!target) {
    return NextResponse.json({ error: "Target user was not found." }, { status: 404 });
  }

  const roles = parseStringArray(body.roles).filter((role): role is PortalRole =>
    validRoles.includes(role as PortalRole),
  );
  const categoryIds = parseStringArray(body.categoryIds);
  const impersonatedUser: PortalUser = {
    id: target.id,
    name: target.name,
    title: target.title,
    department: target.department,
    teamId: target.teamId,
    roles: roles.length ? roles : ["viewer"],
    scopes: categoryIds.length ? [{ teamId: target.teamId, categoryIds }] : [],
  };
  const nextResponse = NextResponse.json({ ok: true });

  nextResponse.cookies.set(
    portalImpersonationCookieName,
    createPortalImpersonation(actor, impersonatedUser),
    getCookieOptions(getSessionMaxAgeSeconds()),
  );

  return nextResponse;
}

export async function DELETE() {
  const nextResponse = NextResponse.json({ ok: true });
  nextResponse.cookies.delete(portalImpersonationCookieName);

  return nextResponse;
}
