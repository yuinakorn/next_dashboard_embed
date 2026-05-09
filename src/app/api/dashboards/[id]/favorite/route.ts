import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboard, setDashboardFavorite } from "@/lib/db/dashboards";
import { canViewDashboard } from "@/lib/permissions";

type FavoriteRequest = {
  favorite?: unknown;
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as FavoriteRequest;
  const favorite = body.favorite === true;
  const dashboard = await getDashboard(id, currentUser.id);

  if (!dashboard || !canViewDashboard(currentUser, dashboard)) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  await setDashboardFavorite({
    dashboardId: id,
    userId: currentUser.id,
    favorite,
  });

  return NextResponse.json({ favorite });
}
