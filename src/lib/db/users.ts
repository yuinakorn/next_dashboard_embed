import type { RowDataPacket } from "mysql2";
import { randomUUID } from "node:crypto";
import { getDbPool } from "@/lib/db/connection";
import type {
  AccessRequestStatus,
  Category,
  PortalRole,
  PortalUser,
  PortalUserStatus,
  TeamScope,
} from "@/lib/portal-types";

export type PortalTeam = {
  id: string;
  name: string;
};

export type ManagedPortalUser = PortalUser & {
  source: string;
  lastSeenAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  disabledReason: string | null;
  updatedAt: string;
};

export type AccessRequest = {
  id: string;
  userId: string;
  userName: string;
  userTitle: string;
  userDepartment: string;
  userTeamId: string;
  requestedRoles: PortalRole[];
  requestedCategoryIds: string[];
  reason: string;
  status: AccessRequestStatus;
  reviewerUserId: string | null;
  reviewerName: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type UserRow = RowDataPacket & {
  id: string;
  name: string;
  title: string;
  department: string;
  team_id: string;
  source: string;
  status: PortalUserStatus;
  last_seen_at: Date | null;
  approved_by: string | null;
  approved_at: Date | null;
  disabled_reason: string | null;
  updated_at: Date;
  roles: string | null;
  scope_category_ids: string | null;
};

type AccessRequestRow = RowDataPacket & {
  id: string;
  user_id: string;
  user_name: string;
  user_title: string;
  user_department: string;
  user_team_id: string;
  requested_roles: string;
  requested_category_ids: string;
  reason: string;
  status: AccessRequestStatus;
  reviewer_user_id: string | null;
  reviewer_name: string | null;
  review_note: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
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

function parseJsonStringArray(value: string | null): string[] {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseRequestRoles(value: string | null): PortalRole[] {
  const roles = parseJsonStringArray(value).filter((role): role is PortalRole =>
    portalRoles.includes(role as PortalRole),
  );

  return roles.length ? roles : ["viewer"];
}

function rowToManagedUser(row: UserRow): ManagedPortalUser {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    department: row.department,
    teamId: row.team_id,
    status: row.status,
    roles: parseRoles(row.roles),
    scopes: parseScopes(row.team_id, row.scope_category_ids),
    source: row.source,
    lastSeenAt: row.last_seen_at?.toISOString() ?? null,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at?.toISOString() ?? null,
    disabledReason: row.disabled_reason,
    updatedAt: row.updated_at.toISOString(),
  };
}

function rowToAccessRequest(row: AccessRequestRow): AccessRequest {
  return {
    id: row.id,
    userId: row.user_id,
    userName: row.user_name,
    userTitle: row.user_title,
    userDepartment: row.user_department,
    userTeamId: row.user_team_id,
    requestedRoles: parseRequestRoles(row.requested_roles),
    requestedCategoryIds: parseJsonStringArray(row.requested_category_ids),
    reason: row.reason,
    status: row.status,
    reviewerUserId: row.reviewer_user_id,
    reviewerName: row.reviewer_name,
    reviewNote: row.review_note,
    reviewedAt: row.reviewed_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
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
        u.status,
        u.last_seen_at,
        u.approved_by,
        u.approved_at,
        u.disabled_reason,
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
        u.status,
        u.last_seen_at,
        u.approved_by,
        u.approved_at,
        u.disabled_reason,
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
  const initialStatus: PortalUserStatus = source === "sso" ? "pending" : "active";

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
        INSERT INTO portal_users (id, name, title, department, team_id, source, status, last_seen_at)
        VALUES (:id, :name, :title, :department, :teamId, :source, :status, CURRENT_TIMESTAMP)
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
        status: initialStatus,
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
          :beforeJson,
          :afterJson
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

export async function updateManagedUserStatus({
  actor,
  userId,
  status,
  disabledReason,
}: {
  actor: PortalUser;
  userId: string;
  status: PortalUserStatus;
  disabledReason?: string | null;
}) {
  const existingUser = await getManagedUser(userId);

  if (!existingUser) {
    throw new Error("User was not found.");
  }

  const connection = await getDbPool().getConnection();

  try {
    await connection.beginTransaction();
    await connection.query(
      `
        UPDATE portal_users
        SET
          status = :status,
          approved_by = CASE WHEN :status = 'active' THEN :actorUserId ELSE approved_by END,
          approved_at = CASE WHEN :status = 'active' THEN CURRENT_TIMESTAMP ELSE approved_at END,
          disabled_reason = :disabledReason
        WHERE id = :userId
      `,
      {
        userId,
        status,
        actorUserId: actor.id,
        disabledReason: status === "suspended" ? disabledReason?.trim() || "Suspended by admin." : null,
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
          before_json,
          after_json
        )
        VALUES (
          :id,
          :actorUserId,
          :actorName,
          'permission.user_status_update',
          'permission',
          :entityId,
          :entityTitle,
          :note,
          :beforeJson,
          :afterJson
        )
      `,
      {
        id: `audit-${randomUUID()}`,
        actorUserId: actor.id,
        actorName: actor.name,
        entityId: userId,
        entityTitle: existingUser.name,
        note: `Updated user status to ${status}.`,
        beforeJson: JSON.stringify({ status: existingUser.status ?? "active" }),
        afterJson: JSON.stringify({ status, disabledReason }),
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

export async function listAccessRequests(status?: AccessRequestStatus): Promise<AccessRequest[]> {
  const [rows] = await getDbPool().query<AccessRequestRow[]>(
    `
      SELECT
        ar.id,
        ar.user_id,
        u.name AS user_name,
        u.title AS user_title,
        u.department AS user_department,
        u.team_id AS user_team_id,
        JSON_UNQUOTE(JSON_EXTRACT(ar.requested_roles, '$')) AS requested_roles,
        JSON_UNQUOTE(JSON_EXTRACT(ar.requested_category_ids, '$')) AS requested_category_ids,
        ar.reason,
        ar.status,
        ar.reviewer_user_id,
        ar.reviewer_name,
        ar.review_note,
        ar.reviewed_at,
        ar.created_at,
        ar.updated_at
      FROM portal_access_requests ar
      JOIN portal_users u
        ON u.id = ar.user_id
      WHERE (:status IS NULL OR ar.status = :status)
      ORDER BY ar.created_at DESC
    `,
    { status: status ?? null },
  );

  return rows.map(rowToAccessRequest);
}

export async function listAccessRequestsForUser(userId: string): Promise<AccessRequest[]> {
  const [rows] = await getDbPool().query<AccessRequestRow[]>(
    `
      SELECT
        ar.id,
        ar.user_id,
        u.name AS user_name,
        u.title AS user_title,
        u.department AS user_department,
        u.team_id AS user_team_id,
        JSON_UNQUOTE(JSON_EXTRACT(ar.requested_roles, '$')) AS requested_roles,
        JSON_UNQUOTE(JSON_EXTRACT(ar.requested_category_ids, '$')) AS requested_category_ids,
        ar.reason,
        ar.status,
        ar.reviewer_user_id,
        ar.reviewer_name,
        ar.review_note,
        ar.reviewed_at,
        ar.created_at,
        ar.updated_at
      FROM portal_access_requests ar
      JOIN portal_users u
        ON u.id = ar.user_id
      WHERE ar.user_id = :userId
      ORDER BY ar.created_at DESC
    `,
    { userId },
  );

  return rows.map(rowToAccessRequest);
}

export async function createAccessRequest({
  user,
  roles,
  categoryIds,
  reason,
  categories,
}: {
  user: PortalUser;
  roles: PortalRole[];
  categoryIds: string[];
  reason: string;
  categories: Category[];
}): Promise<string> {
  const existingPending = (await listAccessRequestsForUser(user.id)).some(
    (request) => request.status === "pending",
  );

  if (existingPending) {
    throw new Error("มีคำขอสิทธิ์ที่รอดำเนินการอยู่แล้ว");
  }

  const normalizedRoles = Array.from(new Set(roles)).filter((role): role is PortalRole =>
    portalRoles.includes(role),
  );
  const nextRoles = normalizedRoles.length ? normalizedRoles : ["viewer"];
  const allowedCategoryIds = new Set(flattenCategoryIds(categories));
  const nextCategoryIds = Array.from(new Set(categoryIds)).filter((categoryId) =>
    allowedCategoryIds.has(categoryId),
  );
  const id = `access-${randomUUID()}`;

  await getDbPool().query(
    `
      INSERT INTO portal_access_requests (
        id,
        user_id,
        requested_roles,
        requested_category_ids,
        reason
      )
      VALUES (
        :id,
        :userId,
        :requestedRoles,
        :requestedCategoryIds,
        :reason
      )
    `,
    {
      id,
      userId: user.id,
      requestedRoles: JSON.stringify(nextRoles),
      requestedCategoryIds: JSON.stringify(nextCategoryIds),
      reason: reason.trim(),
    },
  );

  return id;
}

export async function reviewAccessRequest({
  actor,
  requestId,
  decision,
  note,
  categories,
}: {
  actor: PortalUser;
  requestId: string;
  decision: "approve" | "reject";
  note: string;
  categories: Category[];
}) {
  const request = (await listAccessRequests()).find((item) => item.id === requestId);

  if (!request) {
    throw new Error("Access request was not found.");
  }

  if (request.status !== "pending") {
    throw new Error("Access request is not pending.");
  }

  if (decision === "approve") {
    await updateManagedUserPermissions({
      actor,
      userId: request.userId,
      roles: request.requestedRoles,
      categoryIds: request.requestedCategoryIds,
      categories,
    });
    await updateManagedUserStatus({
      actor,
      userId: request.userId,
      status: "active",
    });
  }

  await getDbPool().query(
    `
      UPDATE portal_access_requests
      SET
        status = :status,
        reviewer_user_id = :reviewerUserId,
        reviewer_name = :reviewerName,
        review_note = :reviewNote,
        reviewed_at = CURRENT_TIMESTAMP
      WHERE id = :requestId
    `,
    {
      requestId,
      status: decision === "approve" ? "approved" : "rejected",
      reviewerUserId: actor.id,
      reviewerName: actor.name,
      reviewNote: note.trim(),
    },
  );
}

function flattenCategoryIds(categories: Category[]): string[] {
  return categories.flatMap((category) => [
    category.id,
    ...(category.children ? flattenCategoryIds(category.children) : []),
  ]);
}
