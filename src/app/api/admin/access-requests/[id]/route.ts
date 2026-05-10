import { NextResponse } from "next/server";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/current-user";
import { listCategories } from "@/lib/db/categories";
import { reviewAccessRequest } from "@/lib/db/users";
import { hasPermission } from "@/lib/permissions";

type RouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type ReviewBody = {
  decision?: unknown;
  note?: unknown;
};

export async function PATCH(request: Request, { params }: RouteProps) {
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
    return NextResponse.json({ error: "Access request approval is restricted." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as ReviewBody;
  const decision = body.decision === "approve" ? "approve" : body.decision === "reject" ? "reject" : null;
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!decision) {
    return NextResponse.json({ error: "decision must be approve or reject" }, { status: 400 });
  }

  if (decision === "reject" && note.length < 5) {
    return NextResponse.json({ error: "กรุณาระบุเหตุผลเมื่อปฏิเสธคำขอ" }, { status: 400 });
  }

  const { id } = await params;

  try {
    const categories = await listCategories();
    await reviewAccessRequest({
      actor,
      requestId: id,
      decision,
      note,
      categories,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to review access request.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
