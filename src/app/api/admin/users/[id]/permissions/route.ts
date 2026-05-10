import { NextResponse } from "next/server";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/current-user";
import { listCategories } from "@/lib/db/categories";
import { updateManagedUserPermissions } from "@/lib/db/users";
import { hasPermission } from "@/lib/permissions";
import type { PortalRole } from "@/lib/portal-types";

type UpdatePermissionsBody = {
  roles?: unknown;
  categoryIds?: unknown;
  activate?: unknown;
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  let actor;

  try {
    actor = await getCurrentUser();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    throw error;
  }

  if (!hasPermission(actor, "permission:manage")) {
    return NextResponse.json({ error: "Permission management is restricted." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as UpdatePermissionsBody;
  const roles = parseStringArray(body.roles).filter((role): role is PortalRole =>
    validRoles.includes(role as PortalRole),
  );
  const categoryIds = parseStringArray(body.categoryIds);
  const activateUser = body.activate === true;

  await updateManagedUserPermissions({
    actor,
    userId: id,
    roles,
    categoryIds,
    categories: await listCategories(),
    activateUser,
  });

  return NextResponse.json({ ok: true });
}
