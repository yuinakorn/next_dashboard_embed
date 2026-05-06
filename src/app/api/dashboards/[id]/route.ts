import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getDashboard, updateDashboard } from "@/lib/db/dashboards";
import { canCreateDashboard, canUpdateDashboard } from "@/lib/permissions";
import type {
  DashboardProvider,
  RefreshFrequency,
  SensitivityLevel,
} from "@/lib/portal-types";

const providers: DashboardProvider[] = [
  "Looker Studio",
  "Superset",
  "Grafana",
  "Metabase",
  "Power BI",
  "Custom",
];
const sensitivities: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];
const refreshFrequencies: RefreshFrequency[] = ["unknown", "daily", "weekly", "monthly", "manual"];

type DashboardUpdateRequest = {
  title?: string;
  description?: string;
  provider?: DashboardProvider;
  categoryId?: string;
  sensitivity?: SensitivityLevel;
  embedUrl?: string;
  externalUrl?: string;
  tags?: string[];
  refreshFrequency?: RefreshFrequency;
  dataSourceNote?: string;
};

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateRequest(body: DashboardUpdateRequest): string[] {
  const errors: string[] = [];

  if (!body.title?.trim()) {
    errors.push("title is required");
  }
  if (!body.description || body.description.trim().length < 20) {
    errors.push("description must be at least 20 characters");
  }
  if (!body.provider || !providers.includes(body.provider)) {
    errors.push("provider is invalid");
  }
  if (!body.categoryId?.trim()) {
    errors.push("categoryId is required");
  }
  if (!body.sensitivity || !sensitivities.includes(body.sensitivity)) {
    errors.push("sensitivity is invalid");
  }
  if (!body.embedUrl || !isHttpsUrl(body.embedUrl)) {
    errors.push("embedUrl must be a valid HTTPS URL");
  }
  if (!body.externalUrl || !isHttpsUrl(body.externalUrl)) {
    errors.push("externalUrl must be a valid HTTPS URL");
  }
  if (body.refreshFrequency && !refreshFrequencies.includes(body.refreshFrequency)) {
    errors.push("refreshFrequency is invalid");
  }

  return errors;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as DashboardUpdateRequest;
  const errors = validateRequest(body);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  const dashboard = await getDashboard(id, currentUser.id);
  if (!dashboard) {
    return NextResponse.json({ error: "Dashboard not found" }, { status: 404 });
  }

  if (!canUpdateDashboard(currentUser, dashboard)) {
    return NextResponse.json({ error: "Current user cannot update this dashboard" }, { status: 403 });
  }

  if (body.categoryId !== dashboard.categoryId && !canCreateDashboard(currentUser, body.categoryId ?? "")) {
    return NextResponse.json({ error: "Current user cannot move this dashboard to that category" }, { status: 403 });
  }

  try {
    const updatedDashboard = await updateDashboard({
      dashboardId: id,
      title: body.title?.trim() ?? "",
      description: body.description?.trim() ?? "",
      provider: body.provider as DashboardProvider,
      categoryId: body.categoryId ?? "",
      sensitivity: body.sensitivity as SensitivityLevel,
      embedUrl: body.embedUrl ?? "",
      externalUrl: body.externalUrl ?? "",
      tags: body.tags ?? [],
      refreshFrequency: body.refreshFrequency ?? "unknown",
      dataSourceNote: body.dataSourceNote?.trim() || null,
      actorUserId: currentUser.id,
      actorName: currentUser.name,
    });

    return NextResponse.json({ dashboard: updatedDashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
