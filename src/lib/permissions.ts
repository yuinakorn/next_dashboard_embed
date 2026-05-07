import type {
  Category,
  Dashboard,
  PortalPermission,
  PortalRole,
  PortalUser,
} from "@/lib/portal-types";

const rolePermissions: Record<PortalRole, PortalPermission[]> = {
  system_admin: [
    "category:create_root",
    "category:create_child",
    "category:update",
    "dashboard:create",
    "dashboard:update_own",
    "dashboard:update_team",
    "dashboard:submit_review",
    "dashboard:approve",
    "dashboard:publish",
    "dashboard:archive",
    "dashboard:pin",
    "audit:read",
  ],
  category_admin: [
    "category:create_child",
    "category:update",
    "dashboard:create",
    "dashboard:update_team",
    "dashboard:submit_review",
    "dashboard:approve",
    "dashboard:publish",
    "dashboard:archive",
    "dashboard:pin",
    "audit:read",
  ],
  project_manager: [
    "category:create_child",
    "dashboard:create",
    "dashboard:update_team",
    "dashboard:submit_review",
    "dashboard:archive",
  ],
  editor: ["dashboard:create", "dashboard:update_own", "dashboard:submit_review"],
  viewer: [],
};

export function getUserPermissions(user: PortalUser): PortalPermission[] {
  return Array.from(new Set(user.roles.flatMap((role) => rolePermissions[role])));
}

export function hasPermission(user: PortalUser, permission: PortalPermission): boolean {
  return getUserPermissions(user).includes(permission);
}

export function canManageCategory(user: PortalUser, category: Category): boolean {
  if (hasPermission(user, "category:create_root")) {
    return true;
  }

  return (
    hasPermission(user, "category:update") &&
    user.scopes.some((scope) => scope.categoryIds.includes(category.id))
  );
}

export function canCreateChildCategory(user: PortalUser, parentCategory: Category): boolean {
  if (!hasPermission(user, "category:create_child")) {
    return false;
  }

  return (
    hasPermission(user, "category:create_root") ||
    user.scopes.some((scope) => scope.categoryIds.includes(parentCategory.id))
  );
}

export function canCreateDashboard(user: PortalUser, categoryId: string): boolean {
  if (!hasPermission(user, "dashboard:create")) {
    return false;
  }

  if (hasPermission(user, "category:create_root")) {
    return true;
  }

  return user.scopes.some((scope) => scope.categoryIds.includes(categoryId));
}

export function canUpdateDashboard(user: PortalUser, dashboard: Dashboard): boolean {
  if (hasPermission(user, "category:create_root")) {
    return true;
  }

  if (hasPermission(user, "dashboard:update_team") && dashboard.ownerTeamId === user.teamId) {
    return true;
  }

  return hasPermission(user, "dashboard:update_own") && dashboard.ownerUserId === user.id;
}

export function canSubmitDashboardForReview(user: PortalUser, dashboard: Dashboard): boolean {
  return (
    hasPermission(user, "dashboard:submit_review") &&
    (dashboard.status === "draft" || dashboard.status === "rejected") &&
    canUpdateDashboard(user, dashboard)
  );
}

export function canPublishDashboard(user: PortalUser, dashboard: Dashboard): boolean {
  if (!hasPermission(user, "dashboard:publish")) {
    return false;
  }

  return (
    hasPermission(user, "category:create_root") ||
    user.scopes.some((scope) => scope.categoryIds.includes(dashboard.categoryId))
  );
}

export function canArchiveDashboard(user: PortalUser, dashboard: Dashboard): boolean {
  if (!hasPermission(user, "dashboard:archive")) {
    return false;
  }

  if (hasPermission(user, "category:create_root")) {
    return dashboard.status !== "archived";
  }

  return dashboard.status !== "archived" && dashboard.ownerTeamId === user.teamId;
}

export function canViewDashboard(user: PortalUser, dashboard: Dashboard): boolean {
  if (dashboard.status === "published" && dashboard.sensitivity === "public") {
    return true;
  }

  if (hasPermission(user, "category:create_root")) {
    return true;
  }

  if (dashboard.status === "published" && dashboard.sensitivity !== "restricted") {
    return true;
  }

  return dashboard.ownerTeamId === user.teamId;
}
