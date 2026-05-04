import { NextResponse } from "next/server";
import { createDashboard, listDashboards } from "@/lib/db/dashboards";
import { mockCurrentUser } from "@/lib/mock-auth";
import { canCreateDashboard } from "@/lib/permissions";
import type { DashboardProvider, DashboardStatus, SensitivityLevel } from "@/lib/portal-types";

const providers: DashboardProvider[] = [
  "Looker Studio",
  "Superset",
  "Grafana",
  "Metabase",
  "Power BI",
  "Custom",
];
const sensitivities: SensitivityLevel[] = ["public", "internal", "confidential", "restricted"];
const statuses: Extract<DashboardStatus, "draft" | "in_review">[] = ["draft", "in_review"];
const refreshFrequencies = ["unknown", "daily", "weekly", "monthly", "manual"] as const;

type DashboardRequest = {
  title?: string;
  description?: string;
  provider?: DashboardProvider;
  categoryId?: string;
  sensitivity?: SensitivityLevel;
  embedUrl?: string;
  externalUrl?: string;
  tags?: string[];
  refreshFrequency?: (typeof refreshFrequencies)[number];
  dataSourceNote?: string;
  status?: Extract<DashboardStatus, "draft" | "in_review">;
};

function isHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateRequest(body: DashboardRequest): string[] {
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
  if (body.status && !statuses.includes(body.status)) {
    errors.push("status is invalid");
  }
  if (body.refreshFrequency && !refreshFrequencies.includes(body.refreshFrequency)) {
    errors.push("refreshFrequency is invalid");
  }

  return errors;
}

export async function GET() {
  try {
    const dashboards = await listDashboards(mockCurrentUser.id);
    return NextResponse.json({ dashboards });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load dashboards.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as DashboardRequest;
  const errors = validateRequest(body);

  if (errors.length > 0) {
    return NextResponse.json({ errors }, { status: 400 });
  }

  if (!canCreateDashboard(mockCurrentUser, body.categoryId ?? "")) {
    return NextResponse.json({ error: "Current user cannot create a dashboard in this category." }, { status: 403 });
  }

  try {
    const dashboard = await createDashboard({
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
      status: body.status ?? "draft",
      ownerUserId: mockCurrentUser.id,
      ownerName: mockCurrentUser.name,
      ownerTeamId: mockCurrentUser.teamId,
    });

    return NextResponse.json({ dashboard }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create dashboard.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
