import {
  publicDashboards,
  publicPinnedDashboards,
  publicPopularDashboards,
  type Dashboard,
} from "@/lib/mock-portal-data";
import Link from "next/link";

function PublicDashboardCard({ dashboard, featured = false }: { dashboard: Dashboard; featured?: boolean }) {
  return (
    <article
      className={`rounded-lg border bg-white p-5 shadow-sm ${
        featured ? "border-teal-300" : "border-zinc-200"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
          ข้อมูลเปิดเผย
        </span>
        <span className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
          {dashboard.provider}
        </span>
      </div>
      <h2 className="mt-4 text-xl font-semibold leading-7 text-zinc-950">{dashboard.title}</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{dashboard.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {dashboard.tags.map((tag) => (
          <span key={tag} className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-600">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 text-sm text-zinc-500">
        <span>อัปเดต {dashboard.updatedAt}</span>
        <span>{dashboard.views.toLocaleString()} views</span>
      </div>
      <div className="mt-5 flex gap-2">
        <a
          href={dashboard.externalUrl}
          className="inline-flex h-10 items-center justify-center rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800"
          target="_blank"
          rel="noreferrer"
        >
          เปิด dashboard
        </a>
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
        >
          เจ้าหน้าที่เข้าสู่ระบบ
        </Link>
      </div>
    </article>
  );
}

export default function PublicHome() {
  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Public Dashboard Center
            </p>
            <h1 className="mt-1 text-2xl font-semibold">ศูนย์ข้อมูล Dashboard</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-medium">
            <a className="rounded-md bg-zinc-950 px-3 py-2 text-white" href="/public">
              หน้าหลัก
            </a>
            <a className="rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100" href="#catalog">
              รายการข้อมูล
            </a>
            <Link className="rounded-md px-3 py-2 text-zinc-600 hover:bg-zinc-100" href="/">
              สำหรับเจ้าหน้าที่
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <h2 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-zinc-950">
              ค้นหาและเปิดดู dashboard ข้อมูลสุขภาพที่เผยแพร่ได้ทันที
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
              หน้านี้แสดงเฉพาะ dashboard ที่ผ่านการเผยแพร่เป็นข้อมูลสาธารณะแล้ว
              ประชาชนสามารถเปิดดูได้โดยไม่ต้องเข้าสู่ระบบ
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <strong className="block text-3xl font-semibold">{publicDashboards.length}</strong>
              <span className="mt-1 block text-sm text-zinc-500">public dashboards</span>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <strong className="block text-3xl font-semibold">{publicPinnedDashboards.length}</strong>
              <span className="mt-1 block text-sm text-zinc-500">recommended</span>
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
              <strong className="block text-3xl font-semibold">0</strong>
              <span className="mt-1 block text-sm text-zinc-500">login required</span>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-8 px-5 py-8">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_220px_160px]">
            <input
              className="h-11 rounded-md border border-zinc-300 px-3 text-sm outline-none transition placeholder:text-zinc-400 focus:border-teal-600"
              placeholder="ค้นหาด้วยชื่อ dashboard, คำสำคัญ, หมวดข้อมูล..."
            />
            <select className="h-11 rounded-md border border-zinc-300 bg-white px-3 text-sm text-zinc-700 outline-none focus:border-teal-600">
              <option>ทุกหมวดข้อมูล</option>
              <option>บริการสุขภาพ</option>
              <option>เวลารอคอย</option>
              <option>ภาพรวมระบบ</option>
            </select>
            <button className="h-11 rounded-md bg-teal-700 px-4 text-sm font-medium text-white transition hover:bg-teal-800">
              ค้นหา
            </button>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">Dashboard แนะนำ</h2>
              <p className="mt-1 text-sm text-zinc-500">ข้อมูลที่หน่วยงานเลือกให้ประชาชนเห็นก่อน</p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {publicPinnedDashboards.map((dashboard) => (
              <PublicDashboardCard key={dashboard.id} dashboard={dashboard} featured />
            ))}
          </div>
        </section>

        <section id="catalog">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold">รายการข้อมูลเปิดเผย</h2>
              <p className="mt-1 text-sm text-zinc-500">แสดงเฉพาะ dashboard ที่เป็น public และ published</p>
            </div>
            <span className="text-sm font-medium text-zinc-500">{publicPopularDashboards.length} รายการ</span>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {publicPopularDashboards.map((dashboard) => (
              <PublicDashboardCard key={dashboard.id} dashboard={dashboard} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
