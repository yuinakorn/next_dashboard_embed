import { Badge, buttonStyles } from "@/components/dashboard-ui";
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
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <li>
            <Link href="/public" className="hover:text-slate-900 hover:underline">
              หน้าหลัก
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">/</li>
          <li>
            <Link href="/public/reports" className="hover:text-slate-900 hover:underline">
              รายงาน
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">/</li>
          <li aria-current="page" className="font-medium text-slate-700 truncate max-w-[60vw]">
            {dashboard.title}
          </li>
        </ol>
      </nav>

      <section className="space-y-3 px-5 py-5">
        <h1 className="text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
          {dashboard.title}
        </h1>
        {showEmbed ? (
          <DashboardEmbed title={dashboard.title} src={dashboard.embedUrl} />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
              <Badge className="bg-amber-50 text-amber-900">เปิดใน iframe ไม่ได้</Badge>
              <h2 className="mt-4 text-xl font-semibold text-slate-950">ต้องเปิดรายงานจากแหล่งต้นทาง</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
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
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-50 text-emerald-800">เปิดดูได้ทันที</Badge>
            <Badge className="bg-sky-50 text-sky-800">{dashboard.provider}</Badge>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{dashboard.description}</p>
          <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="font-semibold text-slate-500">หมวดรายงาน</dt>
              <dd className="mt-1 text-slate-900">
                {dashboard.categoryPath?.join(" / ") ?? dashboard.categoryName}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">ผู้รับผิดชอบ</dt>
              <dd className="mt-1 text-slate-900">{dashboard.owner}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">อัปเดตล่าสุด</dt>
              <dd className="mt-1 text-slate-900">{dashboard.updatedAt}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">ความถี่ปรับปรุง</dt>
              <dd className="mt-1 text-slate-900">{dashboard.refreshFrequency}</dd>
            </div>
          </dl>
        </div>
      </section>
    </>
  );
}
