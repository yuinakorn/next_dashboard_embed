import Link from "next/link";
import type { ReactNode } from "react";
import { PublicNav } from "./public-nav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[oklch(0.968_0.006_240)] text-slate-950">
      <header className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
          <Link href="/public" className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-700">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Chiang Mai Health Report Portal
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">
              ศูนย์รายงานสุขภาพจังหวัดเชียงใหม่
            </h1>
          </Link>
          <PublicNav />
        </div>
      </header>
      {children}
    </main>
  );
}
