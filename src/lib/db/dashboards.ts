import crypto from "node:crypto";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db/connection";
import { assessEmbedUrl } from "@/lib/embed-policy";
import type {
  Dashboard,
  DashboardProvider,
  DashboardStatus,
  EmbedStatus,
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
  refreshFrequency: "unknown" | "daily" | "weekly" | "monthly" | "manual";
  dataSourceNote: string | null;
  status: Extract<DashboardStatus, "draft" | "in_review">;
  ownerUserId: string;
  ownerName: string;
  ownerTeamId: string;
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
  };
}

export async function listDashboards(userId: string): Promise<Dashboard[]> {
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
      GROUP BY
        d.id, d.title, d.description, d.provider, d.category_id, c.name, pc.name,
        d.owner_team_id, d.owner_name, d.status, d.sensitivity, d.views, d.updated_at,
        d.is_pinned, f.user_id, d.embed_url, d.external_url, d.embed_status, d.embed_status_reason
      ORDER BY d.updated_at DESC
    `,
    { userId },
  );

  return rows.map(rowToDashboard);
}

export async function getDashboard(id: string, userId: string): Promise<Dashboard | null> {
  const dashboards = await listDashboards(userId);
  return dashboards.find((dashboard) => dashboard.id === id) ?? null;
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

    for (const tag of input.tags) {
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
        { dashboardId: id, name: normalized },
      );
    }

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
