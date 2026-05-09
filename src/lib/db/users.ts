import type { RowDataPacket } from "mysql2";
import { randomUUID } from "node:crypto";
import { getDbPool } from "@/lib/db/connection";
import type { Category, PortalRole, PortalUser, TeamScope } from "@/lib/portal-types";

export type PortalTeam = {
  id: string;
  name: string;
};

export type ManagedPortalUser = PortalUser & {
  source: string;
  lastSeenAt: string | null;
  updatedAt: string;
};

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  title: string;
  department: string;
  team_id: string;
  source: string;
  last_seen_at: Date | null;
  updated_at: Date;
  roles: string | null;
  scope_category_ids: string | null;
};

type TeamRow = RowDataPacket & {
  id: string;
  name: string;
};

const portalRoles: PortalRole[] = [
  "system_admin",
  "category_admin",
  "project_manager",
  "editor",
  "viewer",
];

function parseRoles(value: string | null): PortalRole[] {
  const roles = (value ?? "")
    .split(",")
    .filter((role): role is PortalRole => portalRoles.includes(role as PortalRole));

  return roles.length ? roles : ["viewer"];
}

function parseScopes(teamId: string, value: string | null): TeamScope[] {
  const categoryIds = (value ?? "").split(",").filter(Boolean);

  return categoryIds.length ? [{ teamId, categoryIds }] : [];
}

function rowToManagedUser(row: UserRow): ManagedPortalUser {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    department: row.department,
    teamId: row.team_id,
    roles: parseRoles(row.roles),
    scopes: parseScopes(row.team_id, row.scope_category_ids),
    source: row.source,
    lastSeenAt: row.last_seen_at?.toISOString() ?? null,
    updatedAt: row.updated_at.toISOString(),
  };
}

export function allPortalRoles(): PortalRole[] {
  return portalRoles;
}

export async function listTeams(): Promise<PortalTeam[]> {
  const [rows] = await getDbPool().query<TeamRow[]>(
    `
      SELECT id, name
      FROM portal_teams
      ORDER BY name ASC
    `,
  );

  return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function listManagedUsers(): Promise<ManagedPortalUser[]> {
  const [rows] = await getDbPool().query<UserRow[]>(
    `
      SELECT
        u.id,
        u.name,
        u.title,
        u.department,
        u.team_id,
        u.source,
        u.last_seen_at,
        u.updated_at,
        GROUP_CONCAT(DISTINCT ur.role ORDER BY ur.role SEPARATOR ',') AS roles,
        GROUP_CONCAT(DISTINCT pcs.category_id ORDER BY pcs.category_id SEPARATOR ',') AS scope_category_ids
      FROM portal_users u
      LEFT JOIN portal_user_roles ur
        ON ur.user_id = u.id
      LEFT JOIN portal_category_scopes pcs
        ON pcs.user_id = u.id
      GROUP BY
        u.id,
        u.name,
        u.title,
        u.department,
        u.team_id,
        u.source,
        u.last_seen_at,
        u.updated_at
      ORDER BY u.updated_at DESC, u.name ASC
    `,
  );

  return rows.map(rowToManagedUser);
}

export async function getManagedUser(userId: string): Promise<ManagedPortalUser | null> {
  const users = await listManagedUsers();
  return users.find((user) => user.id === userId) ?? null;
}

export async function upsertCurrentUser(user: PortalUser, source = "sso"): Promise<void> {
  const connection = await getDbPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      `
        INSERT INTO portal_teams (id, name)
        VALUES (:teamId, :teamName)
        ON DUPLICATE KEY UPDATE name = VALUES(name)
      `,
      { teamId: user.teamId, teamName: user.department || user.teamId },
    );
    await connection.query(
      `
        INSERT INTO portal_users (id, name, title, department, team_id, source, last_seen_at)
        VALUES (:id, :name, :title, :department, :teamId, :source, CURRENT_TIMESTAMP)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          title = VALUES(title),
          department = VALUES(department),
          team_id = VALUES(team_id),
          source = VALUES(source),
          last_seen_at = CURRENT_TIMESTAMP
      `,
      {
        id: user.id,
        name: user.name,
        title: user.title,
        department: user.department,
        teamId: user.teamId,
        source,
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

export async function updateManagedUserPermissions({
  actor,
  userId,
  roles,
  categoryIds,
  categories,
}: {
  actor: PortalUser;
  userId: string;
  roles: PortalRole[];
  categoryIds: string[];
  categories: Category[];
}) {
  const existingUser = await getManagedUser(userId);

  if (!existingUser) {
    throw new Error("User was not found.");
  }

  const normalizedRoles = Array.from(new Set(roles)).filter((role): role is PortalRole =>
    portalRoles.includes(role),
  );
  const nextRoles = normalizedRoles.length ? normalizedRoles : ["viewer"];
  const allowedCategoryIds = new Set(flattenCategoryIds(categories));
  const nextCategoryIds = Array.from(new Set(categoryIds)).filter((categoryId) =>
    allowedCategoryIds.has(categoryId),
  );
  const connection = await getDbPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.query("DELETE FROM portal_user_roles WHERE user_id = :userId", { userId });
    for (const role of nextRoles) {
      await connection.query(
        "INSERT INTO portal_user_roles (user_id, role) VALUES (:userId, :role)",
        { userId, role },
      );
    }

    await connection.query("DELETE FROM portal_category_scopes WHERE user_id = :userId", { userId });
    for (const categoryId of nextCategoryIds) {
      await connection.query(
        `
          INSERT INTO portal_category_scopes (user_id, team_id, category_id)
          VALUES (:userId, :teamId, :categoryId)
        `,
        { userId, teamId: existingUser.teamId, categoryId },
      );
    }

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
          :id,
          :actorUserId,
          :actorName,
          'permission.update',
          'permission',
          :entityId,
          :entityTitle,
          :note,
          CAST(:beforeJson AS JSON),
          CAST(:afterJson AS JSON)
        )
      `,
      {
        id: `audit-${randomUUID()}`,
        actorUserId: actor.id,
        actorName: actor.name,
        entityId: userId,
        entityTitle: existingUser.name,
        note: `Updated roles and category scope for ${existingUser.name}.`,
        beforeJson: JSON.stringify({
          roles: existingUser.roles,
          categoryIds: existingUser.scopes.flatMap((scope) => scope.categoryIds),
        }),
        afterJson: JSON.stringify({ roles: nextRoles, categoryIds: nextCategoryIds }),
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

function flattenCategoryIds(categories: Category[]): string[] {
  return categories.flatMap((category) => [
    category.id,
    ...(category.children ? flattenCategoryIds(category.children) : []),
  ]);
}
