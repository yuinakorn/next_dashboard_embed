import type { RowDataPacket } from "mysql2";
import { getDbPool } from "@/lib/db/connection";
import type { Category } from "@/lib/portal-types";

type CategoryRow = RowDataPacket & {
  id: string;
  name: string;
  parent_id: string | null;
  owner_team_id: string;
  dashboard_count: number;
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
