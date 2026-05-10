import Link from "next/link";
import type { ReactNode } from "react";
import { PublicNav } from "./public-nav";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-[oklch(0.985_0.003_250)] text-[oklch(0.21_0.015_255)]">
      <header className="sticky top-0 z-50 border-b border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-3 md:flex-row md:items-center md:justify-between">
          <Link
            href="/public"
            className="block rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[oklch(0.4_0.13_260)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[oklch(0.5_0.012_255)] leading-tight">
              Chiang Mai Health Report Portal
            </p>
            <h1 className="text-base font-semibold tracking-tight text-[oklch(0.21_0.015_255)] leading-tight md:text-lg">
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
