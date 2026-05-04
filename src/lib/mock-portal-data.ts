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

export type DashboardStatus = "draft" | "in_review" | "published" | "archived";

export type SensitivityLevel = "public" | "internal" | "confidential";

export type MockUser = {
  id: string;
  name: string;
  title: string;
  department: string;
  teamId: string;
  roles: PortalRole[];
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
};

export const mockCurrentUser: MockUser = {
  id: "u-001",
  name: "นพ.กิตติพงศ์ วัฒนสุข",
  title: "Project Manager",
  department: "Digital Health Strategy",
  teamId: "team-digital-health",
  roles: ["project_manager", "editor", "viewer"],
};

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
    owner: "Executive Analytics Team",
    ownerTeamId: "team-executive",
    status: "published",
    sensitivity: "internal",
    tags: ["KPI", "ผู้บริหาร", "รายเดือน"],
    views: 1284,
    updatedAt: "2026-05-02",
    isPinned: true,
    isFavorite: true,
    embedUrl: "https://lookerstudio.google.com/embed/reporting/demo",
    externalUrl: "https://lookerstudio.google.com/",
  },
  {
    id: "db-002",
    title: "ICU Bed Situation",
    description: "ติดตามสถานะเตียง ICU การครองเตียง และรายการรอรับบริการ",
    provider: "Superset",
    categoryId: "operations-bed",
    categoryName: "Service Operations / เตียงและทรัพยากร",
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
  },
  {
    id: "db-003",
    title: "Digital Health Project Tracking",
    description: "ติดตามความก้าวหน้าโครงการ digital health ตาม milestone และหน่วยงานรับผิดชอบ",
    provider: "Metabase",
    categoryId: "digital-health-data",
    categoryName: "Digital Health Projects / Data Platform",
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
  },
  {
    id: "db-004",
    title: "SSO Adoption Monitor",
    description: "อัตราการใช้งาน SSO แยกตามระบบและกลุ่มผู้ใช้",
    provider: "Grafana",
    categoryId: "digital-health-sso",
    categoryName: "Digital Health Projects / SSO Adoption",
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
  },
  {
    id: "db-005",
    title: "OPD Volume By Province",
    description: "ปริมาณผู้รับบริการ OPD แยกรายจังหวัดและช่วงเวลา",
    provider: "Power BI",
    categoryId: "operations-opd",
    categoryName: "Service Operations / OPD/IPD",
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
  },
  {
    id: "db-006",
    title: "Public Health Service Overview",
    description: "ข้อมูลบริการสุขภาพภาพ เช่น จำนวนการให้บริการ แนวโน้มรายเดือน และช่องทางบริการ",
    provider: "Looker Studio",
    categoryId: "executive-kpi",
    categoryName: "ข้อมูลสุขภาพสาธารณะ",
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
  },
  {
    id: "db-007",
    title: "Clinic Waiting Time",
    description: "ข้อมูลเวลาเฉลี่ยการรอรับบริการของคลินิกหลัก เพื่อช่วยประชาชนวางแผนก่อนเข้ารับบริการ",
    provider: "Custom",
    categoryId: "operations-opd",
    categoryName: "ข้อมูลสุขภาพสาธารณะ",
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
  },
];

export const visibleDashboards = mockDashboards.filter(
  (dashboard) => dashboard.status === "published" || dashboard.ownerTeamId === mockCurrentUser.teamId,
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

export const publicDashboards = mockDashboards.filter(
  (dashboard) => dashboard.status === "published" && dashboard.sensitivity === "public",
);

export const publicPinnedDashboards = publicDashboards.filter((dashboard) => dashboard.isPinned);

export const publicPopularDashboards = [...publicDashboards].sort(
  (first, second) => second.views - first.views,
);
