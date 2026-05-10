import { buttonStyles } from "@/components/dashboard-ui";
import { palette } from "@/lib/design-tokens";
import { getPublicDashboard } from "@/lib/db/dashboards";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardEmbed } from "./dashboard-embed";

type PublicReportPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function canEmbed(embedStatus: string) {
  return embedStatus === "embeddable" || embedStatus === "unknown";
}

export default async function PublicReportPage({ params }: PublicReportPageProps) {
  const { id } = await params;
  const dashboard = await getPublicDashboard(id);

  if (!dashboard) {
    notFound();
  }

  const showEmbed = canEmbed(dashboard.embedStatus);

  return (
    <>
      <nav aria-label="breadcrumb" className="px-5 pt-5">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-[oklch(0.5_0.012_255)]">
          <li>
            <Link href="/public" className="hover:text-[oklch(0.21_0.015_255)] hover:underline">
              หน้าหลัก
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.85_0.008_250)]">/</li>
          <li>
            <Link href="/public/reports" className="hover:text-[oklch(0.21_0.015_255)] hover:underline">
              รายงาน
            </Link>
          </li>
          <li aria-hidden="true" className="text-[oklch(0.85_0.008_250)]">/</li>
          <li aria-current="page" className="font-medium text-[oklch(0.3_0.018_255)] truncate max-w-[60vw]">
            {dashboard.title}
          </li>
        </ol>
      </nav>

      <section className="space-y-3 px-5 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-[oklch(0.21_0.015_255)] md:text-2xl">
          {dashboard.title}
        </h1>
        {showEmbed ? (
          <DashboardEmbed title={dashboard.title} src={dashboard.embedUrl} />
        ) : (
          <div
            className="overflow-hidden rounded-xl"
            style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
          >
            <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: palette.amberDeep }}>
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: palette.amber }}
                  aria-hidden="true"
                />
                เปิดใน iframe ไม่ได้
              </span>
              <h2 className="mt-3 text-xl font-semibold" style={{ color: palette.ink }}>
                ต้องเปิดรายงานจากแหล่งต้นทาง
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6" style={{ color: palette.inkMuted }}>
                {dashboard.embedStatusReason}
              </p>
              <a
                href={dashboard.externalUrl}
                className={`${buttonStyles.primary} mt-5 h-10 justify-center`}
                target="_blank"
                rel="noreferrer"
              >
                เปิดแหล่งรายงาน
              </a>
            </div>
          </div>
        )}
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-8">
        <div
          className="rounded-xl p-5"
          style={{ background: palette.paper, border: `1px solid ${palette.border}` }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px]">
            <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: palette.emeraldDeep }}>
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: palette.emerald }}
                aria-hidden="true"
              />
              เปิดดูได้ทันที
            </span>
            <span aria-hidden="true" style={{ color: palette.inkFaint }}>·</span>
            <span className="font-medium" style={{ color: palette.inkMuted }}>{dashboard.provider}</span>
          </div>
          <p className="mt-4 text-sm leading-6" style={{ color: palette.inkMuted }}>
            {dashboard.description}
          </p>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "หมวดรายงาน", value: dashboard.categoryPath?.join(" / ") ?? dashboard.categoryName },
              { label: "ผู้รับผิดชอบ", value: dashboard.owner },
              { label: "อัปเดตล่าสุด", value: dashboard.updatedAt },
              { label: "ความถี่ปรับปรุง", value: dashboard.refreshFrequency },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt
                  className="text-[11px] font-semibold uppercase tracking-wider"
                  style={{ color: palette.inkMuted }}
                >
                  {label}
                </dt>
                <dd className="mt-1 font-medium" style={{ color: palette.ink }}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
    </>
  );
}
