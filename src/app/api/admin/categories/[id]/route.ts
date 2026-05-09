import { NextResponse } from "next/server";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/current-user";
import { listManagedCategories, updateManagedCategory } from "@/lib/db/categories";
import { listTeams } from "@/lib/db/users";
import { canManageCategory } from "@/lib/permissions";
import type { Category, CategoryStatus } from "@/lib/portal-types";

type UpdateCategoryBody = {
  name?: unknown;
  ownerTeamId?: unknown;
  status?: unknown;
  sortOrder?: unknown;
};

const validStatuses: CategoryStatus[] = ["active", "inactive", "archived"];

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readSortOrder(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
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

  const { id } = await params;
  const categories = await listManagedCategories();
  const existing = categories.find((category) => category.id === id);

  if (!existing) {
    return NextResponse.json({ error: "Category was not found." }, { status: 404 });
  }

  const permissionCategory: Category = {
    id: existing.id,
    name: existing.name,
    ownerTeamId: existing.ownerTeamId,
    dashboardCount: existing.dashboardCount,
  };

  if (!canManageCategory(actor, permissionCategory)) {
    return NextResponse.json({ error: "Category update is restricted." }, { status: 403 });
  }

  const body = (await request.json()) as UpdateCategoryBody;
  const name = readText(body.name);
  const ownerTeamId = readText(body.ownerTeamId);
  const status = readText(body.status) as CategoryStatus;

  if (!name || !ownerTeamId || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Name, owner team, and status are required." }, { status: 400 });
  }

  const teams = await listTeams();

  if (!teams.some((team) => team.id === ownerTeamId)) {
    return NextResponse.json({ error: "Owner team is invalid." }, { status: 400 });
  }

  await updateManagedCategory({
    actor,
    id,
    name,
    ownerTeamId,
    status,
    sortOrder: readSortOrder(body.sortOrder),
  });

  return NextResponse.json({ ok: true, categories: await listManagedCategories() });
}
