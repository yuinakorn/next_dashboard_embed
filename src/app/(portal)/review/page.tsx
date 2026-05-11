import { PageHeader } from "@/components/dashboard-ui";
import { palette } from "@/lib/design-tokens";
import { requireCurrentUser } from "@/lib/auth/require-current-user";
import { listDashboardsForUser } from "@/lib/db/dashboards";
import type { Dashboard } from "@/lib/portal-types";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const currentUser = await requireCurrentUser();
  const dashboards = await listDashboardsForUser(currentUser);
  const reviewQueue = dashboards.filter((d) => d.status === "in_review");

  return (
    <>
      <PageHeader
        eyebrow="คิวตรวจสอบ"
        title="รายงานรอตรวจ"
        description={
          reviewQueue.length
            ? `${reviewQueue.length} รายงานรอการอนุมัติ`
            : "ไม่มีรายงานรอตรวจในขณะนี้"
        }
      />
      <div className="mx-auto max-w-7xl px-5 py-8">
        {reviewQueue.length ? (
          <div className="space-y-3">
            {reviewQueue.map((dashboard) => (
              <ReviewItem key={dashboard.id} dashboard={dashboard} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl px-5 py-14 text-center"
            style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
          >
            <p className="text-sm font-semibold" style={{ color: palette.ink }}>
              ไม่มีรายงานรอตรวจ
            </p>
            <p className="mt-1 text-sm" style={{ color: palette.inkMuted }}>
              รายงานที่ส่งตรวจจะปรากฏที่นี่โดยอัตโนมัติ
            </p>
            <Link
              href="/catalog"
              className="mt-4 inline-block text-sm font-semibold hover:underline"
              style={{ color: palette.accentDeep }}
            >
              ไปที่รายการรายงาน →
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

function ReviewItem({ dashboard }: { dashboard: Dashboard }) {
  return (
    <article
      className="flex flex-col gap-4 rounded-xl px-5 py-4 lg:flex-row lg:items-start lg:justify-between"
      style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
          <span
            className="inline-flex items-center gap-1.5 font-semibold"
            style={{ color: palette.amberDeep }}
          >
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: palette.amber }}
              aria-hidden="true"
            />
            รอตรวจสอบ
          </span>
          <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
          <span style={{ color: palette.inkMuted }}>{dashboard.provider}</span>
          <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
          <span style={{ color: palette.inkFaint }}>
            {new Date(dashboard.updatedAt).toLocaleDateString("th-TH")}
          </span>
        </div>
        <h2
          className="mt-1.5 text-[17px] font-semibold leading-6 tracking-tight"
          style={{ color: palette.ink }}
        >
          {dashboard.title}
        </h2>
        {dashboard.description ? (
          <p
            className="mt-1 line-clamp-2 max-w-3xl text-sm leading-6"
            style={{ color: palette.inkMuted }}
          >
            {dashboard.description}
          </p>
        ) : null}
        <p className="mt-2 text-[12px]" style={{ color: palette.inkFaint }}>
          <span style={{ color: palette.inkMuted }}>หมวด</span> {dashboard.categoryName}
          {dashboard.owner ? (
            <>
              <span aria-hidden="true"> · </span>
              <span style={{ color: palette.inkMuted }}>เจ้าของ</span> {dashboard.owner}
            </>
          ) : null}
        </p>
      </div>
      <div className="flex shrink-0 self-end lg:self-start">
        <Link
          href={`/dashboards/${dashboard.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-md px-3.5 text-sm font-semibold text-white transition-all duration-150 hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          style={{ background: palette.ink, outlineColor: palette.accent }}
        >
          เปิดตรวจสอบ →
        </Link>
      </div>
    </article>
  );
}
