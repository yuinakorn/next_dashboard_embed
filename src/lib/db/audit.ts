import type { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db/connection";
import type { AuditEvent } from "@/lib/portal-types";

type AuditEventRow = RowDataPacket & {
  id: string;
  actor_user_id: string;
  actor_name: string;
  action: string;
  entity_type: AuditEvent["entityType"];
  entity_id: string;
  entity_title: string;
  note: string;
  created_at: Date;
};

function rowToAuditEvent(row: AuditEventRow): AuditEvent {
  return {
    id: row.id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    entityTitle: row.entity_title,
    note: row.note,
    createdAt: row.created_at.toISOString(),
  };
}

type AuditFilter = {
  q?: string;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
};

export async function listAuditEvents(
  filter: AuditFilter = {},
  limit = 50,
  offset = 0,
): Promise<AuditEvent[]> {
  const { q = "", action = "", entity = "", from = "", to = "" } = filter;
  const [rows] = await getDbPool().query<AuditEventRow[]>(
    `
      SELECT
        id,
        actor_user_id,
        actor_name,
        action,
        entity_type,
        entity_id,
        entity_title,
        note,
        created_at
      FROM portal_audit_logs
      WHERE (:q = '' OR CONCAT_WS(' ',
          action, entity_type, entity_id,
          COALESCE(entity_title, ''),
          COALESCE(note, ''),
          actor_name, actor_user_id
        ) LIKE :qLike)
        AND (:action = '' OR action = :action)
        AND (:entity = '' OR entity_type = :entity)
        AND (:from = '' OR DATE(created_at) >= :from)
        AND (:to = '' OR DATE(created_at) <= :to)
      ORDER BY created_at DESC
      LIMIT :limit OFFSET :offset
    `,
    { q, qLike: `%${q}%`, action, entity, from, to, limit, offset },
  );

  return rows.map(rowToAuditEvent);
}

export async function countAuditEvents(filter: AuditFilter = {}): Promise<number> {
  const { q = "", action = "", entity = "", from = "", to = "" } = filter;
  const [rows] = await getDbPool().query<(RowDataPacket & { total: number })[]>(
    `
      SELECT COUNT(*) AS total
      FROM portal_audit_logs
      WHERE (:q = '' OR CONCAT_WS(' ',
          action, entity_type, entity_id,
          COALESCE(entity_title, ''),
          COALESCE(note, ''),
          actor_name, actor_user_id
        ) LIKE :qLike)
        AND (:action = '' OR action = :action)
        AND (:entity = '' OR entity_type = :entity)
        AND (:from = '' OR DATE(created_at) >= :from)
        AND (:to = '' OR DATE(created_at) <= :to)
    `,
    { q, qLike: `%${q}%`, action, entity, from, to },
  );

  return rows[0]?.total ?? 0;
}

export async function listAuditEventsForEntity(
  entityType: AuditEvent["entityType"],
  entityId: string,
  limit = 20,
): Promise<AuditEvent[]> {
  const [rows] = await getDbPool().query<AuditEventRow[]>(
    `
      SELECT
        id,
        actor_user_id,
        actor_name,
        action,
        entity_type,
        entity_id,
        entity_title,
        note,
        created_at
      FROM portal_audit_logs
      WHERE entity_type = :entityType
        AND entity_id = :entityId
      ORDER BY created_at DESC
      LIMIT :limit
    `,
    { entityType, entityId, limit },
  );

  return rows.map(rowToAuditEvent);
}
