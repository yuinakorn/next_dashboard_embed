import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listCategories } from "@/lib/db/categories";
import { createAccessRequest } from "@/lib/db/users";
import { allPortalRoles } from "@/lib/db/users";
import type { PortalRole } from "@/lib/portal-types";

type AccessRequestBody = {
  roles?: unknown;
  categoryIds?: unknown;
  reason?: unknown;
};

function parseStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  const body = (await request.json().catch(() => ({}))) as AccessRequestBody;
  const validRoles = allPortalRoles();
  const roles = parseStringArray(body.roles).filter((role): role is PortalRole =>
    validRoles.includes(role as PortalRole),
  );
  const categoryIds = parseStringArray(body.categoryIds);
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";

  if (!reason || reason.length < 10) {
    return NextResponse.json({ error: "กรุณาระบุเหตุผลอย่างน้อย 10 ตัวอักษร" }, { status: 400 });
  }

  if (!roles.length) {
    return NextResponse.json({ error: "กรุณาเลือกบทบาทที่ต้องการ" }, { status: 400 });
  }

  try {
    const categories = await listCategories();
    const id = await createAccessRequest({
      user: currentUser,
      roles,
      categoryIds,
      reason,
      categories,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create access request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
