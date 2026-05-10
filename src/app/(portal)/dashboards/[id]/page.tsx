import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, buttonStyles } from "@/components/dashboard-ui";

export const dynamic = "force-dynamic";
import { DashboardViewerEmbed } from "./dashboard-viewer-embed";
import { FavoriteButton, RecentlyViewedReports, RestoreReportButton } from "./report-actions";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listAuditEventsForEntity } from "@/lib/db/audit";
import { getDashboard, recordDashboardView } from "@/lib/db/dashboards";
import { getEmbedStatusTone } from "@/lib/embed-policy";
import {
  canUpdateDashboard,
  canViewDashboard,
  canRestoreDashboard,
  hasPermission,
} from "@/lib/permissions";
import type { DashboardStatus, EmbedStatus, SensitivityLevel } from "@/lib/portal-types";

type DashboardViewerPageProps = {
  params: Promise<{
    id: string;
  }>;
};

const statusTone: Record<DashboardStatus, string> = {
  draft: "bg-[oklch(0.955_0.005_250)] text-[oklch(0.3_0.018_255)]",
  in_review: "bg-amber-50 text-amber-900",
  published: "bg-emerald-50 text-emerald-800",
  rejected: "bg-rose-50 text-rose-800",
  archived: "bg-[oklch(0.91_0.006_250)] text-[oklch(0.5_0.012_255)]",
};

const statusLabels: Record<DashboardStatus, string> = {
  draft: "ร่าง",
  in_review: "รอตรวจสอบ",
  published: "เผยแพร่แล้ว",
  rejected: "ตีกลับ",
  archived: "เก็บถาวร",
};

const sensitivityTone: Record<SensitivityLevel, string> = {
  public: "bg-[oklch(0.96_0.025_180)] text-[oklch(0.4_0.09_180)]",
  internal: "bg-[oklch(0.978_0.012_258)] text-[oklch(0.4_0.13_260)]",
  confidential: "bg-orange-50 text-orange-800",
  restricted: "bg-rose-50 text-rose-800",
};

const sensitivityLabels: Record<SensitivityLevel, string> = {
  public: "สาธารณะ",
  internal: "ต้องเข้าสู่ระบบ",
  confidential: "ภายในหน่วยงาน",
  restricted: "จำกัดสิทธิ์",
};

const embedLabels: Record<EmbedStatus, string> = {
  embeddable: "ฝังได้",
  unknown: "รอตรวจ",
  external_only: "เปิดภายนอก",
  blocked: "ถูกบล็อก",
};

const accessDescriptions: Record<SensitivityLevel, string> = {
  public: "ประชาชนและผู้ใช้งานทั่วไปเปิดดูได้",
  internal: "ต้องเข้าสู่ระบบก่อนเปิดดู",
  confidential: "ข้อมูลภายในหน่วยงาน ใช้งานตามบทบาทที่ได้รับอนุญาต",
  restricted: "จำกัดเฉพาะผู้มีสิทธิ์ตามหน่วยงานหรือผู้ดูแลระบบ",
};

export default async function DashboardViewerPage({ params }: DashboardViewerPageProps) {
  const currentUser = await requireCurrentUser();
  const { id } = await params;
  const dashboard = await getDashboard(id, currentUser.id);

  if (!dashboard || !canViewDashboard(currentUser, dashboard)) {
    notFound();
  }

  await recordDashboardView(dashboard.id);
  const auditEvents = await listAuditEventsForEntity("dashboard", dashboard.id);
  const needsFallback =
    dashboard.embedStatus === "external_only" || dashboard.embedStatus === "blocked";
  const canReadAudit = hasPermission(currentUser, "audit:read");
  const categoryPath = dashboard.categoryPath?.length
    ? dashboard.categoryPath.join(" / ")
    : dashboard.categoryName;
  const canEdit = canUpdateDashboard(currentUser, dashboard);
  const canRestore = canRestoreDashboard(currentUser, dashboard);
  const categoryCrumbs = dashboard.categoryPath?.length
    ? dashboard.categoryPath
    : [dashboard.categoryName];

  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <div className="mx-auto max-w-none px-5 pt-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[oklch(0.5_0.012_255)]">
              <li>
                <Link href="/catalog" className="hover:text-[oklch(0.21_0.015_255)] hover:underline">
                  รายการรายงาน
                </Link>
              </li>
              {categoryCrumbs.map((categoryName) => (
                <li key={categoryName} className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-[oklch(0.85_0.008_250)]">/</span>
                  <span className="text-[oklch(0.5_0.012_255)]">{categoryName}</span>
                </li>
              ))}
              <li aria-hidden="true" className="text-[oklch(0.85_0.008_250)]">/</li>
              <li aria-current="page" className="font-medium text-[oklch(0.3_0.018_255)] truncate max-w-[60vw]">
                {dashboard.title}
              </li>
            </ol>
          </nav>
          <div className="flex flex-wrap gap-2">
            <FavoriteButton dashboardId={dashboard.id} initialFavorite={dashboard.isFavorite} />
            {canRestore ? <RestoreReportButton dashboardId={dashboard.id} /> : null}
            {canEdit ? (
              <Link
                href={`/dashboards/${dashboard.id}/edit`}
                className={`${buttonStyles.secondary} h-9 px-3 text-xs`}
              >
                แก้ไขรายงาน
              </Link>
            ) : null}
          </div>
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <span className="text-xs font-medium text-[oklch(0.5_0.012_255)]">
            รายงานจาก {dashboard.provider}
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.21_0.015_255)] md:text-2xl">
            {dashboard.title}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-none space-y-4 px-5 py-5">
        {needsFallback ? (
          <section className="overflow-hidden rounded-lg border border-[oklch(0.91_0.006_250)] bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[oklch(0.91_0.006_250)] px-4 py-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[oklch(0.21_0.015_255)]">พื้นที่แสดงรายงาน</h2>
                <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">{dashboard.embedStatusReason}</p>
              </div>
              {dashboard.externalUrl ? (
                <a
                  href={dashboard.externalUrl}
                  className={`${buttonStyles.secondary} h-9 w-fit px-3`}
                  target="_blank"
                  rel="noreferrer"
                >
                  เปิดภายนอก
                </a>
              ) : null}
            </div>
            <div className="flex h-[48vh] flex-col items-center justify-center px-5 text-center">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-5">
                <p className="max-w-xl text-sm leading-6 text-rose-900">
                  รายงานนี้ต้องเปิดภายนอก เพราะ Provider อาจบล็อก iframe ด้วย
                  X-Frame-Options, CSP frame-ancestors, Cloudflare หรือกติกาการยืนยันตัวตน
                </p>
                {dashboard.externalUrl ? (
                  <a
                    href={dashboard.externalUrl}
                    className={`${buttonStyles.primary} mt-4 h-10`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    เปิดรายงานภายนอก
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : (
          <DashboardViewerEmbed
            title={dashboard.title}
            src={dashboard.embedUrl}
            reason={dashboard.embedStatusReason}
            externalUrl={dashboard.externalUrl}
          />
        )}

        <section className="grid gap-4 rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <div>
            <h2 className="text-base font-semibold text-[oklch(0.21_0.015_255)]">ข้อมูลกำกับรายงาน</h2>
            <p className="text-sm leading-6 text-[oklch(0.5_0.012_255)]">{dashboard.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className={statusTone[dashboard.status]}>{statusLabels[dashboard.status]}</Badge>
              <Badge className={sensitivityTone[dashboard.sensitivity]}>
                {sensitivityLabels[dashboard.sensitivity]}
              </Badge>
              <span
                className={`rounded-md border px-2 py-1 text-xs font-semibold ${getEmbedStatusTone(dashboard.embedStatus)}`}
              >
                {embedLabels[dashboard.embedStatus]}
              </span>
              {dashboard.tags.map((tag) => (
                <span key={tag} className="rounded-md bg-[oklch(0.955_0.005_250)] px-2 py-1 text-xs font-medium text-[oklch(0.5_0.012_255)]">
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <dl className="grid gap-3 rounded-lg bg-[oklch(0.955_0.005_250)] p-3 text-sm sm:grid-cols-3 lg:grid-cols-1">
            <div>
              <dt className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">เจ้าของรายงาน</dt>
              <dd className="mt-1 font-semibold text-[oklch(0.21_0.015_255)]">{dashboard.owner}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">อัปเดตล่าสุด</dt>
              <dd className="mt-1 font-semibold text-[oklch(0.21_0.015_255)]">{dashboard.updatedAt}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">จำนวนเปิดดู</dt>
              <dd className="mt-1 font-semibold text-[oklch(0.21_0.015_255)]">{dashboard.views.toLocaleString("th-TH")}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-[oklch(0.5_0.012_255)]">สิทธิ์เข้าถึง</dt>
              <dd className="mt-1 text-sm leading-6 text-[oklch(0.3_0.018_255)]">
                {accessDescriptions[dashboard.sensitivity]}
              </dd>
            </div>
          </dl>
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-[oklch(0.21_0.015_255)]">แหล่งข้อมูลและข้อจำกัด</h2>
              <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">รายละเอียดที่ช่วยให้ตีความรายงานได้ถูกต้อง</p>
            </div>
            <p className="mt-4 rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.955_0.005_250)] p-4 text-sm leading-6 text-[oklch(0.5_0.012_255)]">
              {dashboard.dataSourceNote ?? "ยังไม่ได้ระบุหมายเหตุแหล่งข้อมูล"}
            </p>
          </section>

          <aside className="space-y-4">
            <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm">
              <h2 className="text-lg font-semibold text-[oklch(0.21_0.015_255)]">สิทธิ์ของคุณ</h2>
              <p className="mt-1 text-sm leading-6 text-[oklch(0.5_0.012_255)]">
                {canEdit
                  ? "บัญชีนี้สามารถเปิดดูและแก้ไขข้อมูลกำกับของรายงานนี้ได้"
                  : "บัญชีนี้เปิดดูรายงานได้ แต่ไม่มีสิทธิ์แก้ไขข้อมูลกำกับของรายงานนี้"}
              </p>
            </section>
            <RecentlyViewedReports
              currentReport={{
                id: dashboard.id,
                title: dashboard.title,
                category: categoryPath,
              }}
            />
          </aside>
        </div>

        {canReadAudit ? (
          <section className="rounded-lg border border-[oklch(0.91_0.006_250)] bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-lg font-semibold text-[oklch(0.21_0.015_255)]">ประวัติการเปลี่ยนแปลง</h2>
              <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">รายการล่าสุดของรายงานนี้</p>
            </div>
            {auditEvents.length ? (
              <div className="mt-4 divide-y divide-[oklch(0.91_0.006_250)]">
                {auditEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className="py-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-[oklch(0.21_0.015_255)]">{event.action}</span>
                      <span className="text-xs text-[oklch(0.5_0.012_255)]">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 leading-6 text-[oklch(0.5_0.012_255)]">{event.note}</p>
                    <p className="mt-1 text-xs font-medium text-[oklch(0.5_0.012_255)]">{event.actorName}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-[oklch(0.91_0.006_250)] bg-[oklch(0.955_0.005_250)] p-4 text-center text-sm text-[oklch(0.5_0.012_255)]">
                ยังไม่มีประวัติการเปลี่ยนแปลงสำหรับรายงานนี้
              </div>
            )}
          </section>
        ) : null}
      </div>
    </main>
  );
}
