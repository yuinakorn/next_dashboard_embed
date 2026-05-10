import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  archiveDashboard,
  getDashboard,
  restoreDashboard,
  submitDashboardForReview,
} from "@/lib/db/dashboards";
import {
  canArchiveDashboard,
  canRestoreDashboard,
  canSubmitDashboardForReview,
} from "@/lib/permissions";

type LifecycleRequest = {
  action?: "submit_review" | "archive" | "restore";
  note?: string;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as LifecycleRequest;

  if (body.action !== "submit_review" && body.action !== "archive" && body.action !== "restore") {
    return NextResponse.json({ error: "action must be submit_review, archive, or restore" }, { status: 400 });
  }

  const dashboard = await getDashboard(id, currentUser.id);
  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  if (body.action === "submit_review") {
    if (!canSubmitDashboardForReview(currentUser, dashboard)) {
      return NextResponse.json(
        { error: "Current user cannot submit this dashboard for review" },
        { status: 403 },
      );
    }

    try {
      const submittedDashboard = await submitDashboardForReview({
        dashboardId: id,
        actorUserId: currentUser.id,
        actorName: currentUser.name,
        note: body.note,
      });

      return NextResponse.json({ dashboard: submittedDashboard });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to submit dashboard for review.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (body.action === "restore") {
    if (!canRestoreDashboard(currentUser, dashboard)) {
      return NextResponse.json({ error: "Current user cannot restore this dashboard" }, { status: 403 });
    }

    try {
      const restoredDashboard = await restoreDashboard({
        dashboardId: id,
        actorUserId: currentUser.id,
        actorName: currentUser.name,
        note: body.note,
      });

      return NextResponse.json({ dashboard: restoredDashboard });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to restore dashboard.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!canArchiveDashboard(currentUser, dashboard)) {
    return NextResponse.json({ error: "Current user cannot archive this dashboard" }, { status: 403 });
  }

  try {
    const archivedDashboard = await archiveDashboard({
      dashboardId: id,
      actorUserId: currentUser.id,
      actorName: currentUser.name,
      note: body.note,
    });

    return NextResponse.json({ dashboard: archivedDashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to archive dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
