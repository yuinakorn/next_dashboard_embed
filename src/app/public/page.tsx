import {
  publicDashboards,
  publicPinnedDashboards,
  publicPopularDashboards,
} from "@/lib/mock-portal-data";
import type { Dashboard, DashboardProvider } from "@/lib/portal-types";
import Link from "next/link";

const providerStyles: Record<DashboardProvider, string> = {
  "Looker Studio": "border-sky-200 bg-sky-50 text-sky-800",
  Superset: "border-emerald-200 bg-emerald-50 text-emerald-800",
  Grafana: "border-amber-200 bg-amber-50 text-amber-900",
  Metabase: "border-cyan-200 bg-cyan-50 text-cyan-800",
  "Power BI": "border-yellow-200 bg-yellow-50 text-yellow-900",
  Custom: "border-slate-200 bg-slate-100 text-slate-700",
};

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function PublicDashboardCard({
  dashboard,
  featured = false,
}: {
  dashboard: Dashboard;
  featured?: boolean;
}) {
  return (
    <article
      className={`rounded-lg border bg-slate-50 p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-sm ${
        featured ? "border-sky-200 shadow-[0_20px_60px_-42px_rgba(14,116,144,0.55)]" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-emerald-50 text-emerald-800">ข้อมูลเปิดเผย</Badge>
        <Badge className={providerStyles[dashboard.provider]}>{dashboard.provider}</Badge>
      </div>
      <h2 className="mt-4 text-xl font-semibold leading-7 tracking-tight text-slate-950">
        {dashboard.title}
      </h2>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{dashboard.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {dashboard.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Updated</dt>
          <dd className="mt-1 font-semibold text-slate-800">{dashboard.updatedAt}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Views</dt>
          <dd className="mt-1 font-semibold text-slate-800">{dashboard.views.toLocaleString()}</dd>
        </div>
      </dl>
      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href={`/dashboards/${dashboard.id}`}
          className="inline-flex h-10 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-slate-50 transition duration-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
        >
          เปิด dashboard
        </Link>
        <a
          href={dashboard.externalUrl}
          className="inline-flex h-10 items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          target="_blank"
          rel="noreferrer"
        >
          เปิดแหล่งข้อมูล
        </a>
      </div>
    </article>
  );
}

function PublicDataPreview({ dashboard }: { dashboard?: Dashboard }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 shadow-[0_24px_70px_-52px_rgba(15,23,42,0.75)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Public signal
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-950">
            {dashboard?.title ?? "Public health overview"}
          </h2>
        </div>
        <Badge className="bg-emerald-50 text-emerald-800">Published</Badge>
      </div>
      <div className="mt-6 grid grid-cols-12 items-end gap-2" aria-hidden="true">
        {[42, 58, 50, 72, 64, 86, 76, 92, 70, 82, 96, 88].map((height, index) => (
          <div key={`${height}-${index}`} className="flex h-32 items-end rounded bg-slate-100 px-1">
            <div
              className={`w-full rounded-sm ${
                index > 8 ? "bg-sky-700" : index > 4 ? "bg-cyan-500" : "bg-emerald-500"
              }`}
              style={{ height: `${height}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-emerald-50 p-3">
          <strong className="block text-2xl font-semibold text-emerald-950">
            {publicDashboards.length}
          </strong>
          <span className="mt-1 block text-xs font-medium text-emerald-800">
            Dashboard สาธารณะ
          </span>
        </div>
        <div className="rounded-md bg-sky-50 p-3">
          <strong className="block text-2xl font-semibold text-sky-950">
            {publicPinnedDashboards.length}
          </strong>
          <span className="mt-1 block text-xs font-medium text-sky-800">รายการแนะนำ</span>
        </div>
        <div className="rounded-md bg-slate-100 p-3">
          <strong className="block text-2xl font-semibold text-slate-950">0</strong>
          <span className="mt-1 block text-xs font-medium text-slate-600">ต้องเข้าสู่ระบบ</span>
        </div>
      </div>
    </div>
  );
}

function PublicRow({ dashboard }: { dashboard: Dashboard }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 transition duration-200 hover:border-slate-300 hover:bg-slate-100">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={providerStyles[dashboard.provider]}>{dashboard.provider}</Badge>
            <span className="text-xs font-medium text-slate-500">{dashboard.updatedAt}</span>
          </div>
          <h3 className="mt-2 truncate text-sm font-semibold text-slate-950">{dashboard.title}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-slate-500">{dashboard.description}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="text-sm font-semibold text-slate-700">
            {dashboard.views.toLocaleString()} views
          </span>
          <Link
            href={`/dashboards/${dashboard.id}`}
            className="inline-flex h-9 items-center rounded-md border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            เปิด
          </Link>
        </div>
      </div>
    </li>
  );
}

export default function PublicHome() {
  const featuredDashboard = publicPinnedDashboards[0] ?? publicPopularDashboards[0];
  const recommendedDashboards = publicPinnedDashboards.length
    ? publicPinnedDashboards
    : publicPopularDashboards.slice(0, 2);

  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Public Dashboard Center
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              ศูนย์ข้อมูล Dashboard
            </h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            <a
              className="rounded-md bg-slate-950 px-3 py-2 text-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
              href="/public"
            >
              หน้าหลัก
            </a>
            <a
              className="rounded-md px-3 py-2 text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
              href="#catalog"
            >
              รายการข้อมูล
            </a>
            <Link
              className="rounded-md px-3 py-2 text-slate-600 transition duration-200 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
              href="/"
            >
              สำหรับเจ้าหน้าที่
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_460px] lg:items-center lg:py-10">
          <div>
            <p className="text-sm font-semibold text-sky-800">ข้อมูลสุขภาพที่เปิดเผยได้</p>
            <h2 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-slate-950">
              ค้นหาและเปิดดู dashboard สาธารณะ โดยไม่ต้องเข้าสู่ระบบ
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              หน้านี้แสดงเฉพาะ dashboard ที่ผ่านการเผยแพร่และจัดระดับเป็นข้อมูลสาธารณะแล้ว
              เหมาะสำหรับประชาชนและหน่วยงานที่ต้องการดูภาพรวมบริการสุขภาพอย่างรวดเร็ว
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <a
                href="#catalog"
                className="inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-semibold text-slate-50 transition duration-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
              >
                ดูรายการข้อมูล
              </a>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-md border border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
              >
                เจ้าหน้าที่เข้าสู่ระบบ
              </Link>
            </div>
          </div>
          <PublicDataPreview dashboard={featuredDashboard} />
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_160px]">
            <label>
              <span className="sr-only">ค้นหา Dashboard สาธารณะ</span>
              <input
                className="h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition duration-200 placeholder:text-slate-400 focus:border-sky-700 focus:ring-2 focus:ring-sky-100"
                placeholder="ค้นหาด้วยชื่อ dashboard, คำสำคัญ, หมวดข้อมูล..."
              />
            </label>
            <select className="h-11 rounded-md border border-slate-300 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition duration-200 focus:border-sky-700 focus:ring-2 focus:ring-sky-100">
              <option>ทุกหมวดข้อมูล</option>
              <option>บริการสุขภาพ</option>
              <option>เวลารอคอย</option>
              <option>ภาพรวมระบบ</option>
            </select>
            <button className="h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-slate-50 transition duration-200 hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700">
              ค้นหา
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                Dashboard แนะนำ
              </h2>
              <p className="mt-1 text-sm text-slate-500">ข้อมูลที่หน่วยงานเลือกให้ประชาชนเห็นก่อน</p>
            </div>
            <span className="rounded-md bg-sky-50 px-2 py-1 text-sm font-semibold text-sky-800">
              {recommendedDashboards.length} รายการ
            </span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {recommendedDashboards.map((dashboard) => (
              <PublicDashboardCard key={dashboard.id} dashboard={dashboard} featured />
            ))}
          </div>
        </section>

        <section id="catalog" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                  รายการข้อมูลเปิดเผย
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  แสดงเฉพาะ dashboard ที่เป็น public และ published
                </p>
              </div>
              <span className="text-sm font-semibold text-slate-500">
                {publicPopularDashboards.length} รายการ
              </span>
            </div>
            <ul className="mt-4 space-y-3">
              {publicPopularDashboards.map((dashboard) => (
                <PublicRow key={dashboard.id} dashboard={dashboard} />
              ))}
            </ul>
          </div>

          <aside className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-base font-semibold text-slate-950">ขอบเขตข้อมูล</h2>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>รายการบนหน้านี้เปิดได้โดยไม่ต้องมี SSO และไม่แสดงข้อมูลภายใน</p>
              <p>Dashboard ที่ต้องใช้สิทธิ์เพิ่มเติมจะอยู่ในหน้าเจ้าหน้าที่เท่านั้น</p>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Public dashboards</dt>
                <dd className="font-semibold text-slate-900">{publicDashboards.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Recommended</dt>
                <dd className="font-semibold text-sky-800">{recommendedDashboards.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="text-slate-500">Login required</dt>
                <dd className="font-semibold text-emerald-800">0</dd>
              </div>
            </dl>
          </aside>
        </section>
      </div>
    </main>
  );
}
