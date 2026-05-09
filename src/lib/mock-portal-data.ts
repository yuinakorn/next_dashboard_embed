import { mockCurrentUser } from "@/lib/mock-auth";
import { canViewDashboard } from "@/lib/permissions";
import type { AuditEvent, Category, Dashboard } from "@/lib/portal-types";

export { mockCurrentUser };

export const mockCategories: Category[] = [
  {
    id: "health",
    name: "ข้อมูลด้านสาธารณสุข",
    ownerTeamId: "team-public-data",
    dashboardCount: 0,
    depth: 0,
    path: ["ข้อมูลด้านสาธารณสุข"],
    children: [
      {
        id: "health-general",
        name: "ข้อมูลทั่วไป",
        ownerTeamId: "team-public-data",
        dashboardCount: 0,
        depth: 1,
        path: ["ข้อมูลด้านสาธารณสุข", "ข้อมูลทั่วไป"],
        children: [
          {
            id: "health-general-population",
            name: "ประชากร",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "ข้อมูลทั่วไป", "ประชากร"],
          },
          {
            id: "health-general-facilities",
            name: "หน่วยบริการ",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "ข้อมูลทั่วไป", "หน่วยบริการ"],
          },
          {
            id: "health-general-workforce",
            name: "บุคลากรสาธารณสุข",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "ข้อมูลทั่วไป", "บุคลากรสาธารณสุข"],
          },
        ],
      },
      {
        id: "health-status",
        name: "สถานะสุขภาพ",
        ownerTeamId: "team-public-data",
        dashboardCount: 0,
        depth: 1,
        path: ["ข้อมูลด้านสาธารณสุข", "สถานะสุขภาพ"],
        children: [
          {
            id: "health-status-communicable",
            name: "โรคติดต่อ",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "สถานะสุขภาพ", "โรคติดต่อ"],
          },
          {
            id: "health-status-ncd",
            name: "โรคไม่ติดต่อเรื้อรัง",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "สถานะสุขภาพ", "โรคไม่ติดต่อเรื้อรัง"],
            children: [
              {
                id: "health-status-ncd-diabetes",
                name: "เบาหวาน",
                ownerTeamId: "team-public-data",
                dashboardCount: 0,
                depth: 3,
                path: ["ข้อมูลด้านสาธารณสุข", "สถานะสุขภาพ", "โรคไม่ติดต่อเรื้อรัง", "เบาหวาน"],
              },
              {
                id: "health-status-ncd-hypertension",
                name: "ความดันโลหิตสูง",
                ownerTeamId: "team-public-data",
                dashboardCount: 0,
                depth: 3,
                path: ["ข้อมูลด้านสาธารณสุข", "สถานะสุขภาพ", "โรคไม่ติดต่อเรื้อรัง", "ความดันโลหิตสูง"],
              },
            ],
          },
          {
            id: "health-status-mch",
            name: "แม่และเด็ก",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "สถานะสุขภาพ", "แม่และเด็ก"],
          },
        ],
      },
      {
        id: "health-access",
        name: "การเข้าถึงบริการ",
        ownerTeamId: "team-public-data",
        dashboardCount: 0,
        depth: 1,
        path: ["ข้อมูลด้านสาธารณสุข", "การเข้าถึงบริการ"],
        children: [
          {
            id: "health-access-opd-ipd",
            name: "ผู้ป่วยนอก/ผู้ป่วยใน",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "การเข้าถึงบริการ", "ผู้ป่วยนอก/ผู้ป่วยใน"],
          },
          {
            id: "health-access-emergency",
            name: "อุบัติเหตุและฉุกเฉิน",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "การเข้าถึงบริการ", "อุบัติเหตุและฉุกเฉิน"],
          },
          {
            id: "health-access-referral",
            name: "การส่งต่อ",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "การเข้าถึงบริการ", "การส่งต่อ"],
          },
        ],
      },
      {
        id: "health-prevention",
        name: "ส่งเสริมป้องกัน",
        ownerTeamId: "team-public-data",
        dashboardCount: 0,
        depth: 1,
        path: ["ข้อมูลด้านสาธารณสุข", "ส่งเสริมป้องกัน"],
        children: [
          {
            id: "health-prevention-vaccine",
            name: "วัคซีน",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "ส่งเสริมป้องกัน", "วัคซีน"],
          },
          {
            id: "health-prevention-screening",
            name: "การคัดกรอง",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "ส่งเสริมป้องกัน", "การคัดกรอง"],
          },
        ],
      },
      {
        id: "health-resources",
        name: "ทรัพยากรและระบบบริการ",
        ownerTeamId: "team-public-data",
        dashboardCount: 0,
        depth: 1,
        path: ["ข้อมูลด้านสาธารณสุข", "ทรัพยากรและระบบบริการ"],
        children: [
          {
            id: "health-resources-beds",
            name: "เตียงและทรัพยากร",
            ownerTeamId: "team-public-data",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "ทรัพยากรและระบบบริการ", "เตียงและทรัพยากร"],
          },
          {
            id: "health-resources-digital",
            name: "ระบบดิจิทัลสุขภาพ",
            ownerTeamId: "team-digital-health",
            dashboardCount: 0,
            depth: 2,
            path: ["ข้อมูลด้านสาธารณสุข", "ทรัพยากรและระบบบริการ", "ระบบดิจิทัลสุขภาพ"],
          },
        ],
      },
    ],
  },
];

export const mockDashboards: Dashboard[] = [];

export const visibleDashboards = mockDashboards.filter(
  (dashboard) => canViewDashboard(mockCurrentUser, dashboard),
);

export const pinnedDashboards = visibleDashboards.filter((dashboard) => dashboard.isPinned);

export const popularDashboards = [...visibleDashboards]
  .sort((first, second) => second.views - first.views)
  .slice(0, 4);

export const recentDashboards = [...visibleDashboards]
  .sort(
    (first, second) =>
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  )
  .slice(0, 4);

export const myTeamDashboards = visibleDashboards.filter(
  (dashboard) => dashboard.ownerTeamId === mockCurrentUser.teamId,
);

export const favoriteDashboards = visibleDashboards.filter((dashboard) => dashboard.isFavorite);

export const pendingReviewDashboards = visibleDashboards.filter(
  (dashboard) => dashboard.status === "in_review",
);

export const recentlyPublishedDashboards = [...visibleDashboards]
  .filter((dashboard) => dashboard.status === "published")
  .sort(
    (first, second) =>
      new Date(second.updatedAt).getTime() - new Date(first.updatedAt).getTime(),
  )
  .slice(0, 4);

export const externalOnlyDashboards = visibleDashboards.filter(
  (dashboard) => dashboard.embedStatus === "external_only" || dashboard.embedStatus === "blocked",
);

export const publicDashboards = mockDashboards.filter(
  (dashboard) => dashboard.status === "published" && dashboard.sensitivity === "public",
);

export const publicPinnedDashboards = publicDashboards.filter((dashboard) => dashboard.isPinned);

export const publicPopularDashboards = [...publicDashboards].sort(
  (first, second) => second.views - first.views,
);

export function getDashboardById(id: string): Dashboard | undefined {
  return mockDashboards.find((dashboard) => dashboard.id === id);
}

export const mockAuditEvents: AuditEvent[] = [];
