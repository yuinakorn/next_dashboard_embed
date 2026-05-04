import type { MockJwtPayload, PortalUser } from "@/lib/portal-types";

export const mockJwtPayload: MockJwtPayload = {
  sub: "u-001",
  name: "นพ.กิตติพงศ์ วัฒนสุข",
  title: "Project Manager",
  department: "Digital Health Strategy",
  team_id: "team-digital-health",
  roles: ["category_admin", "project_manager", "editor", "viewer"],
  scopes: [
    {
      teamId: "team-digital-health",
      categoryIds: ["digital-health", "digital-health-sso", "digital-health-data"],
    },
  ],
  iat: 1777885200,
  exp: 1777971600,
};

export function userFromJwtPayload(payload: MockJwtPayload): PortalUser {
  return {
    id: payload.sub,
    name: payload.name,
    title: payload.title,
    department: payload.department,
    teamId: payload.team_id,
    roles: payload.roles,
    scopes: payload.scopes,
  };
}

export function getMockCurrentUser(): PortalUser {
  return userFromJwtPayload(mockJwtPayload);
}

export const mockCurrentUser = getMockCurrentUser();
