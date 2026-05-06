import { mockCurrentUser } from "@/lib/mock-auth";
import { canViewDashboard } from "@/lib/permissions";
import type { AuditEvent, Category, Dashboard } from "@/lib/portal-types";

export { mockCurrentUser };

export const mockCategories: Category[] = [
  {
    id: "executive",
    name: "Executive Overview",
    ownerTeamId: "team-executive",
    dashboardCount: 12,
    children: [
      {
        id: "executive-kpi",
        name: "KPI ภาพรวม",
        ownerTeamId: "team-executive",
        dashboardCount: 5,
      },
      {
        id: "executive-region",
        name: "เขตสุขภาพ",
        ownerTeamId: "team-executive",
        dashboardCount: 7,
      },
    ],
  },
  {
    id: "operations",
    name: "Service Operations",
    ownerTeamId: "team-ops",
    dashboardCount: 18,
    children: [
      {
        id: "operations-bed",
        name: "เตียงและทรัพยากร",
        ownerTeamId: "team-ops",
        dashboardCount: 6,
      },
      {
        id: "operations-opd",
        name: "OPD/IPD",
        ownerTeamId: "team-ops",
        dashboardCount: 8,
      },
    ],
  },
  {
    id: "digital-health",
    name: "Digital Health Projects",
    ownerTeamId: "team-digital-health",
    dashboardCount: 9,
    children: [
      {
        id: "digital-health-sso",
        name: "SSO Adoption",
        ownerTeamId: "team-digital-health",
        dashboardCount: 3,
      },
      {
        id: "digital-health-data",
        name: "Data Platform",
        ownerTeamId: "team-digital-health",
        dashboardCount: 6,
      },
    ],
  },
];

export const mockDashboards: Dashboard[] = [
  {
    id: "db-001",
    title: "Hospital Executive KPI",
    description: "ภาพรวม KPI ระดับผู้บริหาร แสดงสถานะบริการหลักและแนวโน้มรายเดือน",
    provider: "Looker Studio",
    categoryId: "executive-kpi",
    categoryName: "Executive Overview / KPI ภาพรวม",
    ownerUserId: "u-executive-001",
    owner: "Executive Analytics Team",
    ownerTeamId: "team-executive",
    status: "published",
    sensitivity: "internal",
    tags: ["KPI", "ผู้บริหาร", "รายเดือน"],
    views: 1284,
    updatedAt: "2026-05-02",
    isPinned: true,
    isFavorite: true,
    embedUrl:
      "https://datastudio.google.com/embed/reporting/6c23b3be-0b75-4fa9-9857-1e81a539d414/page/aEm2D",
    externalUrl:
      "https://datastudio.google.com/reporting/6c23b3be-0b75-4fa9-9857-1e81a539d414/page/aEm2D",
    embedStatus: "embeddable",
    embedStatusReason: "Looker Studio embed reporting URLs are designed for iframe usage.",
    refreshFrequency: "monthly",
    dataSourceNote: "Executive KPI model assembled from approved monthly service indicators.",
  },
  {
    id: "db-002",
    title: "ICU Bed Situation",
    description: "ติดตามสถานะเตียง ICU การครองเตียง และรายการรอรับบริการ",
    provider: "Superset",
    categoryId: "operations-bed",
    categoryName: "Service Operations / เตียงและทรัพยากร",
    ownerUserId: "u-ops-001",
    owner: "Operations Command Center",
    ownerTeamId: "team-ops",
    status: "published",
    sensitivity: "confidential",
    tags: ["ICU", "Bed", "Operations"],
    views: 943,
    updatedAt: "2026-05-04",
    isPinned: true,
    isFavorite: false,
    embedUrl: "https://superset.apache.org/",
    externalUrl: "https://superset.apache.org/",
    embedStatus: "unknown",
    embedStatusReason: "Superset requires embed configuration, guest tokens, and compatible CSP headers.",
    refreshFrequency: "daily",
    dataSourceNote: "ICU capacity data is refreshed from the operations command center feed.",
  },
  {
    id: "db-003",
    title: "Digital Health Project Tracking",
    description: "ติดตามความก้าวหน้าโครงการ digital health ตาม milestone และหน่วยงานรับผิดชอบ",
    provider: "Metabase",
    categoryId: "digital-health-data",
    categoryName: "Digital Health Projects / Data Platform",
    ownerUserId: "u-001",
    owner: "Digital Health Strategy",
    ownerTeamId: "team-digital-health",
    status: "published",
    sensitivity: "internal",
    tags: ["Project", "Milestone", "Digital Health"],
    views: 512,
    updatedAt: "2026-05-03",
    isPinned: false,
    isFavorite: true,
    embedUrl: "https://www.metabase.com/",
    externalUrl: "https://www.metabase.com/",
    embedStatus: "external_only",
    embedStatusReason: "This is a normal website URL, so iframe support depends on target-site headers.",
    refreshFrequency: "weekly",
    dataSourceNote: "Milestone status is maintained by project managers during weekly reviews.",
  },
  {
    id: "db-004",
    title: "SSO Adoption Monitor",
    description: "อัตราการใช้งาน SSO แยกตามระบบและกลุ่มผู้ใช้",
    provider: "Grafana",
    categoryId: "digital-health-sso",
    categoryName: "Digital Health Projects / SSO Adoption",
    ownerUserId: "u-001",
    owner: "Identity Platform Team",
    ownerTeamId: "team-digital-health",
    status: "in_review",
    sensitivity: "internal",
    tags: ["SSO", "Identity", "Adoption"],
    views: 188,
    updatedAt: "2026-05-01",
    isPinned: false,
    isFavorite: false,
    embedUrl: "https://grafana.com/",
    externalUrl: "https://grafana.com/",
    embedStatus: "external_only",
    embedStatusReason: "This is a normal website URL, so it should use external fallback unless iframe is allowed.",
    refreshFrequency: "weekly",
    dataSourceNote: "SSO usage is derived from identity platform event logs.",
  },
  {
    id: "db-005",
    title: "OPD Volume By Province",
    description: "ปริมาณผู้รับบริการ OPD แยกรายจังหวัดและช่วงเวลา",
    provider: "Power BI",
    categoryId: "operations-opd",
    categoryName: "Service Operations / OPD/IPD",
    ownerUserId: "u-ops-002",
    owner: "Service Analytics Team",
    ownerTeamId: "team-ops",
    status: "published",
    sensitivity: "internal",
    tags: ["OPD", "Province", "Service"],
    views: 731,
    updatedAt: "2026-04-29",
    isPinned: false,
    isFavorite: false,
    embedUrl: "https://powerbi.microsoft.com/",
    externalUrl: "https://powerbi.microsoft.com/",
    embedStatus: "unknown",
    embedStatusReason: "Power BI private embeds may require Microsoft auth or an official embed token.",
    refreshFrequency: "monthly",
    dataSourceNote: "OPD figures are aggregated from province service reports.",
  },
  {
    id: "db-006",
    title: "Public Health Service Overview",
    description: "ข้อมูลบริการสุขภาพภาพ เช่น จำนวนการให้บริการ แนวโน้มรายเดือน และช่องทางบริการ",
    provider: "Looker Studio",
    categoryId: "executive-kpi",
    categoryName: "ข้อมูลสุขภาพสาธารณะ",
    ownerUserId: "u-public-001",
    owner: "Public Health Data Office",
    ownerTeamId: "team-public-data",
    status: "published",
    sensitivity: "public",
    tags: ["ข้อมูลสาธารณะ", "บริการสุขภาพ", "ภาพรวม"],
    views: 2241,
    updatedAt: "2026-05-04",
    isPinned: true,
    isFavorite: false,
    embedUrl: "https://lookerstudio.google.com/embed/reporting/demo",
    externalUrl: "https://lookerstudio.google.com/",
    embedStatus: "embeddable",
    embedStatusReason: "Looker Studio embed reporting URLs are designed for iframe usage.",
    refreshFrequency: "monthly",
    dataSourceNote: "Public overview excludes restricted and identifiable patient-level data.",
  },
  {
    id: "db-007",
    title: "Clinic Waiting Time",
    description: "ข้อมูลเวลาเฉลี่ยการรอรับบริการของคลินิกหลัก เพื่อช่วยประชาชนวางแผนก่อนเข้ารับบริการ",
    provider: "Custom",
    categoryId: "operations-opd",
    categoryName: "ข้อมูลสุขภาพสาธารณะ",
    ownerUserId: "u-public-002",
    owner: "Service Transparency Team",
    ownerTeamId: "team-public-data",
    status: "published",
    sensitivity: "public",
    tags: ["เวลารอคอย", "OPD", "ประชาชน"],
    views: 1760,
    updatedAt: "2026-05-03",
    isPinned: false,
    isFavorite: false,
    embedUrl: "https://example.com",
    externalUrl: "https://example.com",
    embedStatus: "external_only",
    embedStatusReason: "Custom website URLs often block iframe with X-Frame-Options or CSP frame-ancestors.",
    refreshFrequency: "daily",
    dataSourceNote: "Waiting time is calculated from public-facing queue summaries.",
  },
];

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

export const mockAuditEvents: AuditEvent[] = [
  {
    id: "audit-001",
    actorUserId: "u-900",
    actorName: "Executive Analytics Admin",
    action: "dashboard.publish",
    entityType: "dashboard",
    entityId: "db-001",
    entityTitle: "Hospital Executive KPI",
    note: "Published after executive KPI metadata review.",
    createdAt: "2026-05-04T09:10:00.000Z",
  },
  {
    id: "audit-002",
    actorUserId: "u-901",
    actorName: "Operations Command Center",
    action: "dashboard.update_embed_url",
    entityType: "dashboard",
    entityId: "db-002",
    entityTitle: "ICU Bed Situation",
    note: "Updated provider URL and marked embed status as unknown pending Superset configuration.",
    createdAt: "2026-05-04T08:35:00.000Z",
  },
  {
    id: "audit-003",
    actorUserId: "u-001",
    actorName: mockCurrentUser.name,
    action: "dashboard.submit_review",
    entityType: "dashboard",
    entityId: "db-004",
    entityTitle: "SSO Adoption Monitor",
    note: "Submitted for review with external-only embed warning.",
    createdAt: "2026-05-03T15:20:00.000Z",
  },
  {
    id: "audit-004",
    actorUserId: "u-700",
    actorName: "Public Health Data Office",
    action: "dashboard.publish",
    entityType: "dashboard",
    entityId: "db-006",
    entityTitle: "Public Health Service Overview",
    note: "Published as public dashboard with data source note.",
    createdAt: "2026-05-03T11:05:00.000Z",
  },
  {
    id: "audit-005",
    actorUserId: "u-001",
    actorName: mockCurrentUser.name,
    action: "category.create_child",
    entityType: "category",
    entityId: "digital-health-data",
    entityTitle: "Data Platform",
    note: "Created child category under Digital Health Projects.",
    createdAt: "2026-05-02T10:15:00.000Z",
  },
];
