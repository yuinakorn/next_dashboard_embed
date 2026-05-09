import type { RowDataPacket } from "mysql2";
import { randomUUID } from "node:crypto";
import { getDbPool } from "@/lib/db/connection";
import type { Category, CategoryStatus, PortalUser } from "@/lib/portal-types";

type CategoryRow = RowDataPacket & {
  id: string;
  name: string;
  parent_id: string | null;
  owner_team_id: string;
  dashboard_count: number;
};

type ManagedCategoryRow = CategoryRow & {
  status: CategoryStatus;
  sort_order: number;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

export type ManagedCategory = {
  id: string;
  name: string;
  parentId: string | null;
  ownerTeamId: string;
  status: CategoryStatus;
  sortOrder: number;
  dashboardCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

function buildCategoryTree(rows: CategoryRow[], parentId: string | null = null): Category[] {
  return rows
    .filter((row) => row.parent_id === parentId)
    .map((row) => ({
      id: row.id,
      name: row.name,
      ownerTeamId: row.owner_team_id,
      dashboardCount: row.dashboard_count,
      children: buildCategoryTree(rows, row.id),
    }));
}

export async function listCategories(): Promise<Category[]> {
  const [rows] = await getDbPool().query<CategoryRow[]>(
    `
      SELECT
        c.id,
        c.name,
        c.parent_id,
        c.owner_team_id,
        COUNT(d.id) AS dashboard_count
      FROM portal_categories c
      LEFT JOIN portal_dashboards d
        ON d.category_id = c.id
        AND d.status <> 'archived'
      WHERE c.status = 'active'
      GROUP BY c.id, c.name, c.parent_id, c.owner_team_id, c.sort_order
      ORDER BY c.sort_order ASC, c.name ASC
    `,
  );

  return buildCategoryTree(rows);
}

function rowToManagedCategory(row: ManagedCategoryRow): ManagedCategory {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    ownerTeamId: row.owner_team_id,
    status: row.status,
    sortOrder: row.sort_order,
    dashboardCount: row.dashboard_count,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listManagedCategories(): Promise<ManagedCategory[]> {
  const [rows] = await getDbPool().query<ManagedCategoryRow[]>(
    `
      SELECT
        c.id,
        c.name,
        c.parent_id,
        c.owner_team_id,
        c.status,
        c.sort_order,
        c.created_by,
        c.created_at,
        c.updated_at,
        COUNT(d.id) AS dashboard_count
      FROM portal_categories c
      LEFT JOIN portal_dashboards d
        ON d.category_id = c.id
        AND d.status <> 'archived'
      GROUP BY
        c.id,
        c.name,
        c.parent_id,
        c.owner_team_id,
        c.status,
        c.sort_order,
        c.created_by,
        c.created_at,
        c.updated_at
      ORDER BY c.sort_order ASC, c.name ASC
    `,
  );

  return rows.map(rowToManagedCategory);
}

export async function createManagedCategory({
  actor,
  name,
  parentId,
  ownerTeamId,
  sortOrder,
}: {
  actor: PortalUser;
  name: string;
  parentId: string | null;
  ownerTeamId: string;
  sortOrder: number;
}): Promise<string> {
  const id = `cat-${randomUUID()}`;
  const connection = await getDbPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      `
        INSERT INTO portal_categories (
          id,
          name,
          parent_id,
          owner_team_id,
          sort_order,
          created_by
        )
        VALUES (
          :id,
          :name,
          :parentId,
          :ownerTeamId,
          :sortOrder,
          :createdBy
        )
      `,
      {
        id,
        name,
        parentId,
        ownerTeamId,
        sortOrder,
        createdBy: actor.id,
      },
    );
    await connection.query(
      `
        INSERT INTO portal_audit_logs (
          id,
          actor_user_id,
          actor_name,
          action,
          entity_type,
          entity_id,
          entity_title,
          note,
          after_json
        )
        VALUES (
          :auditId,
          :actorUserId,
          :actorName,
          :action,
          'category',
          :entityId,
          :entityTitle,
          :note,
          CAST(:afterJson AS JSON)
        )
      `,
      {
        auditId: `audit-${randomUUID()}`,
        actorUserId: actor.id,
        actorName: actor.name,
        action: parentId ? "category.create_child" : "category.create_root",
        entityId: id,
        entityTitle: name,
        note: parentId
          ? `Created child category ${name}.`
          : `Created root category ${name}.`,
        afterJson: JSON.stringify({ id, name, parentId, ownerTeamId, sortOrder }),
      },
    );
    await connection.commit();
    return id;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateManagedCategory({
  actor,
  id,
  name,
  ownerTeamId,
  status,
  sortOrder,
}: {
  actor: PortalUser;
  id: string;
  name: string;
  ownerTeamId: string;
  status: CategoryStatus;
  sortOrder: number;
}) {
  const existing = (await listManagedCategories()).find((category) => category.id === id);

  if (!existing) {
    throw new Error("Category was not found.");
  }

  const connection = await getDbPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      `
        UPDATE portal_categories
        SET
          name = :name,
          owner_team_id = :ownerTeamId,
          status = :status,
          sort_order = :sortOrder
        WHERE id = :id
      `,
      { id, name, ownerTeamId, status, sortOrder },
    );
    await connection.query(
      `
        INSERT INTO portal_audit_logs (
          id,
          actor_user_id,
          actor_name,
          action,
          entity_type,
          entity_id,
          entity_title,
          note,
          before_json,
          after_json
        )
        VALUES (
          :auditId,
          :actorUserId,
          :actorName,
          'category.update',
          'category',
          :entityId,
          :entityTitle,
          :note,
          CAST(:beforeJson AS JSON),
          CAST(:afterJson AS JSON)
        )
      `,
      {
        auditId: `audit-${randomUUID()}`,
        actorUserId: actor.id,
        actorName: actor.name,
        entityId: id,
        entityTitle: name,
        note: `Updated category ${name}.`,
        beforeJson: JSON.stringify(existing),
        afterJson: JSON.stringify({ id, name, ownerTeamId, status, sortOrder }),
      },
    );
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
