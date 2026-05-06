import crypto from "node:crypto";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { getDbPool } from "@/lib/db/connection";
import { assessEmbedUrl } from "@/lib/embed-policy";
import type {
  Dashboard,
  DashboardProvider,
  DashboardStatus,
  EmbedStatus,
  RefreshFrequency,
  SensitivityLevel,
} from "@/lib/portal-types";

type DashboardRow = RowDataPacket & {
  id: string;
  title: string;
  description: string;
  provider: DashboardProvider;
  category_id: string;
  category_name: string;
  parent_category_name: string | null;
  owner_user_id: string;
  owner_team_id: string;
  owner_name: string;
  status: DashboardStatus;
  sensitivity: SensitivityLevel;
  views: number;
  updated_at: Date;
  is_pinned: 0 | 1;
  is_favorite: 0 | 1;
  embed_url: string;
  external_url: string;
  embed_status: EmbedStatus;
  embed_status_reason: string;
  refresh_frequency: RefreshFrequency;
  data_source_note: string | null;
  tags: string | null;
};

export type CreateDashboardInput = {
  title: string;
  description: string;
  provider: DashboardProvider;
  categoryId: string;
  sensitivity: SensitivityLevel;
  embedUrl: string;
  externalUrl: string;
  tags: string[];
  refreshFrequency: RefreshFrequency;
  dataSourceNote: string | null;
  status: Extract<DashboardStatus, "draft" | "in_review">;
  ownerUserId: string;
  ownerName: string;
  ownerTeamId: string;
};

export type ReviewDashboardInput = {
  dashboardId: string;
  decision: "approve" | "reject";
  note: string;
  actorUserId: string;
  actorName: string;
};

export type UpdateDashboardInput = {
  dashboardId: string;
  title: string;
  description: string;
  provider: DashboardProvider;
  categoryId: string;
  sensitivity: SensitivityLevel;
  embedUrl: string;
  externalUrl: string;
  tags: string[];
  refreshFrequency: RefreshFrequency;
  dataSourceNote: string | null;
  actorUserId: string;
  actorName: string;
};

function rowToDashboard(row: DashboardRow): Dashboard {
  const categoryName = row.parent_category_name
    ? `${row.parent_category_name} / ${row.category_name}`
    : row.category_name;

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    provider: row.provider,
    categoryId: row.category_id,
    categoryName,
    ownerUserId: row.owner_user_id,
    owner: row.owner_name,
    ownerTeamId: row.owner_team_id,
    status: row.status,
    sensitivity: row.sensitivity,
    tags: row.tags ? row.tags.split(",").filter(Boolean) : [],
    views: row.views,
    updatedAt: row.updated_at.toISOString().slice(0, 10),
    isPinned: Boolean(row.is_pinned),
    isFavorite: Boolean(row.is_favorite),
    embedUrl: row.embed_url,
    externalUrl: row.external_url,
    embedStatus: row.embed_status,
    embedStatusReason: row.embed_status_reason,
    refreshFrequency: row.refresh_frequency,
    dataSourceNote: row.data_source_note,
  };
}

async function queryDashboards(
  userId: string,
  options: {
    publicOnly?: boolean;
  } = {},
): Promise<Dashboard[]> {
  const [rows] = await getDbPool().query<DashboardRow[]>(
    `
      SELECT
        d.id,
        d.title,
        d.description,
        d.provider,
        d.category_id,
        c.name AS category_name,
        pc.name AS parent_category_name,
        d.owner_user_id,
        d.owner_team_id,
        d.owner_name,
        d.status,
        d.sensitivity,
        d.views,
        d.updated_at,
        d.is_pinned,
        CASE WHEN f.user_id IS NULL THEN 0 ELSE 1 END AS is_favorite,
        d.embed_url,
        d.external_url,
        d.embed_status,
        d.embed_status_reason,
        d.refresh_frequency,
        d.data_source_note,
        GROUP_CONCAT(t.name ORDER BY t.name SEPARATOR ',') AS tags
      FROM portal_dashboards d
      JOIN portal_categories c ON c.id = d.category_id
      LEFT JOIN portal_categories pc ON pc.id = c.parent_id
      LEFT JOIN portal_favorites f
        ON f.dashboard_id = d.id
        AND f.user_id = :userId
      LEFT JOIN portal_dashboard_tags dt ON dt.dashboard_id = d.id
      LEFT JOIN portal_tags t ON t.id = dt.tag_id
      WHERE d.status <> 'archived'
        AND (:publicOnly = FALSE OR (d.status = 'published' AND d.sensitivity = 'public'))
      GROUP BY
        d.id, d.title, d.description, d.provider, d.category_id, c.name, pc.name, d.owner_user_id,
        d.owner_team_id, d.owner_name, d.status, d.sensitivity, d.views, d.updated_at,
        d.is_pinned, f.user_id, d.embed_url, d.external_url, d.embed_status, d.embed_status_reason,
        d.refresh_frequency, d.data_source_note
      ORDER BY d.updated_at DESC
    `,
    { userId, publicOnly: Boolean(options.publicOnly) },
  );

  return rows.map(rowToDashboard);
}

export async function listDashboards(userId: string): Promise<Dashboard[]> {
  return queryDashboards(userId);
}

export async function listPublicDashboards(): Promise<Dashboard[]> {
  return queryDashboards("public", { publicOnly: true });
}

export async function getDashboard(id: string, userId: string): Promise<Dashboard | null> {
  const dashboards = await listDashboards(userId);
  return dashboards.find((dashboard) => dashboard.id === id) ?? null;
}

async function getDashboardForUpdate(
  connection: PoolConnection,
  id: string,
): Promise<
  | (RowDataPacket &
      Pick<
        DashboardRow,
        | "id"
        | "title"
        | "description"
        | "provider"
        | "category_id"
        | "status"
        | "sensitivity"
        | "embed_url"
        | "external_url"
        | "refresh_frequency"
        | "data_source_note"
      >)
  | null
> {
  const [rows] = await connection.query<
    Array<
      RowDataPacket &
        Pick<
          DashboardRow,
          | "id"
          | "title"
          | "description"
          | "provider"
          | "category_id"
          | "status"
          | "sensitivity"
          | "embed_url"
          | "external_url"
          | "refresh_frequency"
          | "data_source_note"
        >
    >
  >(
    `
      SELECT
        id, title, description, provider, category_id, status, sensitivity,
        embed_url, external_url, refresh_frequency, data_source_note
      FROM portal_dashboards
      WHERE id = :id
      FOR UPDATE
    `,
    { id },
  );

  return rows[0] ?? null;
}

async function replaceDashboardTags(
  connection: PoolConnection,
  dashboardId: string,
  tags: string[],
): Promise<void> {
  await connection.query<ResultSetHeader>(
    "DELETE FROM portal_dashboard_tags WHERE dashboard_id = :dashboardId",
    { dashboardId },
  );

  for (const tag of tags) {
    const normalized = tag.trim();
    if (!normalized) {
      continue;
    }
    await connection.query<ResultSetHeader>("INSERT IGNORE INTO portal_tags (name) VALUES (:name)", {
      name: normalized,
    });
    await connection.query<ResultSetHeader>(
      `
        INSERT IGNORE INTO portal_dashboard_tags (dashboard_id, tag_id)
        SELECT :dashboardId, id
        FROM portal_tags
        WHERE name = :name
      `,
      { dashboardId, name: normalized },
    );
  }
}

export async function createDashboard(input: CreateDashboardInput): Promise<Dashboard> {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  const id = `db-${crypto.randomUUID()}`;
  const assessment = assessEmbedUrl(input.provider, input.embedUrl);

  try {
    await connection.beginTransaction();
    await connection.query<ResultSetHeader>(
      `
        INSERT INTO portal_dashboards (
          id, title, description, provider, category_id, owner_team_id, owner_user_id, owner_name,
          status, sensitivity, embed_url, external_url, embed_status, embed_status_reason,
          refresh_frequency, data_source_note, created_by
        )
        VALUES (
          :id, :title, :description, :provider, :categoryId, :ownerTeamId, :ownerUserId, :ownerName,
          :status, :sensitivity, :embedUrl, :externalUrl, :embedStatus, :embedStatusReason,
          :refreshFrequency, :dataSourceNote, :createdBy
        )
      `,
      {
        id,
        title: input.title,
        description: input.description,
        provider: input.provider,
        categoryId: input.categoryId,
        ownerTeamId: input.ownerTeamId,
        ownerUserId: input.ownerUserId,
        ownerName: input.ownerName,
        status: input.status,
        sensitivity: input.sensitivity,
        embedUrl: input.embedUrl,
        externalUrl: input.externalUrl,
        embedStatus: assessment.status,
        embedStatusReason: assessment.reason,
        refreshFrequency: input.refreshFrequency,
        dataSourceNote: input.dataSourceNote,
        createdBy: input.ownerUserId,
      },
    );

    await replaceDashboardTags(connection, id, input.tags);

    await connection.query<ResultSetHeader>(
      `
        INSERT INTO portal_audit_logs (
          id, actor_user_id, actor_name, action, entity_type, entity_id, entity_title, note, after_json
        )
        VALUES (
          :auditId, :actorUserId, :actorName, :action, 'dashboard', :entityId, :entityTitle, :note, :afterJson
        )
      `,
      {
        auditId: `audit-${crypto.randomUUID()}`,
        actorUserId: input.ownerUserId,
        actorName: input.ownerName,
        action: input.status === "in_review" ? "dashboard.submit_review" : "dashboard.create_draft",
        entityId: id,
        entityTitle: input.title,
        note:
          input.status === "in_review"
            ? "Dashboard submitted for review."
            : "Dashboard saved as draft.",
        afterJson: JSON.stringify({ id, status: input.status }),
      },
    );

    await connection.commit();
    const dashboard = await getDashboard(id, input.ownerUserId);
    if (!dashboard) {
      throw new Error("Created dashboard could not be loaded.");
    }
    return dashboard;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function updateDashboard(input: UpdateDashboardInput): Promise<Dashboard> {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  const assessment = assessEmbedUrl(input.provider, input.embedUrl);

  try {
    await connection.beginTransaction();
    const before = await getDashboardForUpdate(connection, input.dashboardId);

    if (!before) {
      throw new Error("Dashboard not found.");
    }

    await connection.query<ResultSetHeader>(
      `
        UPDATE portal_dashboards
        SET
          title = :title,
          description = :description,
          provider = :provider,
          category_id = :categoryId,
          sensitivity = :sensitivity,
          embed_url = :embedUrl,
          external_url = :externalUrl,
          embed_status = :embedStatus,
          embed_status_reason = :embedStatusReason,
          refresh_frequency = :refreshFrequency,
          data_source_note = :dataSourceNote
        WHERE id = :id
      `,
      {
        id: input.dashboardId,
        title: input.title,
        description: input.description,
        provider: input.provider,
        categoryId: input.categoryId,
        sensitivity: input.sensitivity,
        embedUrl: input.embedUrl,
        externalUrl: input.externalUrl,
        embedStatus: assessment.status,
        embedStatusReason: assessment.reason,
        refreshFrequency: input.refreshFrequency,
        dataSourceNote: input.dataSourceNote,
      },
    );

    await replaceDashboardTags(connection, input.dashboardId, input.tags);

    await connection.query<ResultSetHeader>(
      `
        INSERT INTO portal_audit_logs (
          id, actor_user_id, actor_name, action, entity_type, entity_id, entity_title,
          note, before_json, after_json
        )
        VALUES (
          :auditId, :actorUserId, :actorName, 'dashboard.update', 'dashboard', :entityId, :entityTitle,
          :note, :beforeJson, :afterJson
        )
      `,
      {
        auditId: `audit-${crypto.randomUUID()}`,
        actorUserId: input.actorUserId,
        actorName: input.actorName,
        entityId: input.dashboardId,
        entityTitle: input.title,
        note: "Dashboard metadata updated.",
        beforeJson: JSON.stringify({
          id: before.id,
          title: before.title,
          description: before.description,
          provider: before.provider,
          categoryId: before.category_id,
          status: before.status,
          sensitivity: before.sensitivity,
          embedUrl: before.embed_url,
          externalUrl: before.external_url,
          refreshFrequency: before.refresh_frequency,
          dataSourceNote: before.data_source_note,
        }),
        afterJson: JSON.stringify({
          id: input.dashboardId,
          title: input.title,
          description: input.description,
          provider: input.provider,
          categoryId: input.categoryId,
          status: before.status,
          sensitivity: input.sensitivity,
          embedUrl: input.embedUrl,
          externalUrl: input.externalUrl,
          refreshFrequency: input.refreshFrequency,
          dataSourceNote: input.dataSourceNote,
        }),
      },
    );

    await connection.commit();
    const dashboard = await getDashboard(input.dashboardId, input.actorUserId);
    if (!dashboard) {
      throw new Error("Updated dashboard could not be loaded.");
    }
    return dashboard;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function reviewDashboard(input: ReviewDashboardInput): Promise<Dashboard> {
  const pool = getDbPool();
  const connection = await pool.getConnection();
  const nextStatus: DashboardStatus = input.decision === "approve" ? "published" : "rejected";
  const action = input.decision === "approve" ? "dashboard.publish" : "dashboard.reject";

  try {
    await connection.beginTransaction();
    const before = await getDashboardForUpdate(connection, input.dashboardId);

    if (!before) {
      throw new Error("Dashboard not found.");
    }

    await connection.query<ResultSetHeader>(
      `
        UPDATE portal_dashboards
        SET
          status = :status,
          last_reviewed_at = CURRENT_TIMESTAMP,
          published_at = CASE WHEN :status = 'published' THEN CURRENT_TIMESTAMP ELSE published_at END
        WHERE id = :id
      `,
      {
        id: input.dashboardId,
        status: nextStatus,
      },
    );

    await connection.query<ResultSetHeader>(
      `
        INSERT INTO portal_audit_logs (
          id, actor_user_id, actor_name, action, entity_type, entity_id, entity_title,
          note, before_json, after_json
        )
        VALUES (
          :auditId, :actorUserId, :actorName, :action, 'dashboard', :entityId, :entityTitle,
          :note, :beforeJson, :afterJson
        )
      `,
      {
        auditId: `audit-${crypto.randomUUID()}`,
        actorUserId: input.actorUserId,
        actorName: input.actorName,
        action,
        entityId: input.dashboardId,
        entityTitle: before.title,
        note:
          input.note.trim() ||
          (input.decision === "approve" ? "Approved from review queue." : "Rejected from review queue."),
        beforeJson: JSON.stringify({ id: before.id, status: before.status }),
        afterJson: JSON.stringify({ id: before.id, status: nextStatus }),
      },
    );

    await connection.commit();
    const dashboard = await getDashboard(input.dashboardId, input.actorUserId);
    if (!dashboard) {
      throw new Error("Reviewed dashboard could not be loaded.");
    }
    return dashboard;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
