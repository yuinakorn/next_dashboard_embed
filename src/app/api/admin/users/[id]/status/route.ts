import { NextResponse } from "next/server";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/current-user";
import { updateManagedUserStatus } from "@/lib/db/users";
import { hasPermission } from "@/lib/permissions";
import type { PortalUserStatus } from "@/lib/portal-types";

type UpdateStatusBody = {
  status?: unknown;
  disabledReason?: unknown;
};

const validStatuses: PortalUserStatus[] = ["pending", "active", "suspended"];

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
    return NextResponse.json({ error: "User status management is restricted." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as UpdateStatusBody;
  const status = validStatuses.includes(body.status as PortalUserStatus)
    ? (body.status as PortalUserStatus)
    : null;
  const disabledReason = typeof body.disabledReason === "string" ? body.disabledReason : null;

  if (!status) {
    return NextResponse.json({ error: "status must be pending, active, or suspended" }, { status: 400 });
  }

  try {
    await updateManagedUserStatus({
      actor,
      userId: id,
      status,
      disabledReason,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update user status.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
