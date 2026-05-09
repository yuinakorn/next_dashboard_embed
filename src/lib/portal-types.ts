export type PortalRole =
  | "system_admin"
  | "category_admin"
  | "project_manager"
  | "editor"
  | "viewer";

export type DashboardProvider =
  | "Looker Studio"
  | "Superset"
  | "Grafana"
  | "Metabase"
  | "Power BI"
  | "Custom";

export type DashboardStatus = "draft" | "in_review" | "published" | "rejected" | "archived";

export type SensitivityLevel = "public" | "internal" | "confidential" | "restricted";

export type EmbedStatus = "embeddable" | "unknown" | "external_only" | "blocked";

export type RefreshFrequency = "unknown" | "daily" | "weekly" | "monthly" | "manual";

export type CategoryStatus = "active" | "inactive" | "archived";

export type PortalPermission =
  | "category:create_root"
  | "category:create_child"
  | "category:update"
  | "dashboard:create"
  | "dashboard:update_own"
  | "dashboard:update_team"
  | "dashboard:submit_review"
  | "dashboard:approve"
  | "dashboard:publish"
  | "dashboard:archive"
  | "dashboard:pin"
  | "permission:manage"
  | "audit:read";

export type TeamScope = {
  teamId: string;
  categoryIds: string[];
};

export type PortalUser = {
  id: string;
  name: string;
  title: string;
  department: string;
  teamId: string;
  roles: PortalRole[];
  scopes: TeamScope[];
};

export type Category = {
  id: string;
  name: string;
  ownerTeamId: string;
  dashboardCount: number;
  children?: Category[];
};

export type Dashboard = {
  id: string;
  title: string;
  description: string;
  provider: DashboardProvider;
  categoryId: string;
  categoryName: string;
  ownerUserId: string;
  owner: string;
  ownerTeamId: string;
  status: DashboardStatus;
  sensitivity: SensitivityLevel;
  tags: string[];
  views: number;
  updatedAt: string;
  isPinned: boolean;
  isFavorite: boolean;
  embedUrl: string;
  externalUrl: string;
  embedStatus: EmbedStatus;
  embedStatusReason: string;
  refreshFrequency: RefreshFrequency;
  dataSourceNote: string | null;
};

export type MockJwtPayload = {
  sub: string;
  name: string;
  title: string;
  department: string;
  team_id: string;
  roles: PortalRole[];
  scopes: TeamScope[];
  iat: number;
  exp: number;
};

export type AuditEvent = {
  id: string;
  actorUserId: string;
  actorName: string;
  action: string;
  entityType: "dashboard" | "category" | "permission";
  entityId: string;
  entityTitle: string;
  note: string;
  createdAt: string;
};
