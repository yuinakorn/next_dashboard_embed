import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboard, reviewDashboard } from "@/lib/db/dashboards";
import { canPublishDashboard } from "@/lib/permissions";

type ReviewRequest = {
  decision?: "approve" | "reject";
  note?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as ReviewRequest;

  if (body.decision !== "approve" && body.decision !== "reject") {
    return NextResponse.json({ error: "decision must be approve or reject" }, { status: 400 });
  }

  const dashboard = await getDashboard(id, currentUser.id);
  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  if (!canPublishDashboard(currentUser, dashboard)) {
    return NextResponse.json({ error: "Current user cannot publish this dashboard" }, { status: 403 });
  }

  try {
    const reviewedDashboard = await reviewDashboard({
      dashboardId: id,
      decision: body.decision,
      note: body.note ?? "",
      actorUserId: currentUser.id,
      actorName: currentUser.name,
    });

    return NextResponse.json({ dashboard: reviewedDashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to review dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
