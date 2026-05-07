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

export async function listAuditEvents(limit = 100): Promise<AuditEvent[]> {
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
      ORDER BY created_at DESC
      LIMIT :limit
    `,
    { limit },
  );

  return rows.map(rowToAuditEvent);
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
