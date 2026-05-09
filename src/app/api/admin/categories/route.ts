import { NextResponse } from "next/server";
import { AuthRequiredError, getCurrentUser } from "@/lib/auth/current-user";
import {
  createManagedCategory,
  listCategories,
  listManagedCategories,
} from "@/lib/db/categories";
import { listTeams } from "@/lib/db/users";
import { canCreateChildCategory, hasPermission } from "@/lib/permissions";
import type { Category } from "@/lib/portal-types";

type CreateCategoryBody = {
  name?: unknown;
  parentId?: unknown;
  ownerTeamId?: unknown;
  sortOrder?: unknown;
};

function findCategory(categories: Category[], id: string): Category | null {
  for (const category of categories) {
    if (category.id === id) {
      return category;
    }

    const child = findCategory(category.children ?? [], id);

    if (child) {
      return child;
    }
  }

  return null;
}

function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readSortOrder(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : 0;
}

export async function POST(request: Request) {
  let actor;

  try {
    actor = await getCurrentUser();
  } catch (error) {
    if (error instanceof AuthRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    throw error;
  }

  const body = (await request.json()) as CreateCategoryBody;
  const name = readText(body.name);
  const parentId = readText(body.parentId) || null;
  const ownerTeamId = readText(body.ownerTeamId);

  if (!name || !ownerTeamId) {
    return NextResponse.json({ error: "Category name and owner team are required." }, { status: 400 });
  }

  const teams = await listTeams();

  if (!teams.some((team) => team.id === ownerTeamId)) {
    return NextResponse.json({ error: "Owner team is invalid." }, { status: 400 });
  }

  const activeTree = await listCategories();

  if (parentId) {
    const parentCategory = findCategory(activeTree, parentId);

    if (!parentCategory) {
      return NextResponse.json({ error: "Parent category was not found." }, { status: 404 });
    }

    if (!canCreateChildCategory(actor, parentCategory)) {
      return NextResponse.json({ error: "You cannot create a child category here." }, { status: 403 });
    }
  } else if (!hasPermission(actor, "category:create_root")) {
    return NextResponse.json({ error: "Root category creation is restricted." }, { status: 403 });
  }

  const id = await createManagedCategory({
    actor,
    name,
    parentId,
    ownerTeamId,
    sortOrder: readSortOrder(body.sortOrder),
  });
  const categories = await listManagedCategories();

  return NextResponse.json({ id, categories }, { status: 201 });
}
