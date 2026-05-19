import { NextResponse } from "next/server";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/current-user";
import { deleteManagedUser, getManagedUser } from "@/lib/db/users";

export async function DELETE(
  _request: Request,
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

  if (!actor.roles.includes("system_admin")) {
    return NextResponse.json({ error: "เฉพาะ system admin เท่านั้นที่ลบผู้ใช้ได้" }, { status: 403 });
  }

  const { id } = await params;

  if (actor.id === id) {
    return NextResponse.json({ error: "ไม่สามารถลบบัญชีของตัวเองได้" }, { status: 400 });
  }

  const existing = await getManagedUser(id);

  if (!existing) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้นี้ในระบบ" }, { status: 404 });
  }

  try {
    await deleteManagedUser({ actor, userId: id });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "ไม่สามารถลบผู้ใช้ได้";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
