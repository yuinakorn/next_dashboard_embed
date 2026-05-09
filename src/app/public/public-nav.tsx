"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navItemClass(isActive: boolean) {
  return `rounded-md px-3 py-2 transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${
    isActive
      ? "bg-slate-950 text-slate-50"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
  }`;
}

export function PublicNav() {
  const pathname = usePathname();
  const isHome = pathname === "/public";
  const isReports =
    pathname === "/public/reports" ||
    pathname.startsWith("/public/reports/") ||
    pathname.startsWith("/public/categories/");

  return (
    <nav className="flex flex-wrap gap-2 text-sm font-semibold" aria-label="Public navigation">
      <Link className={navItemClass(isHome)} href="/public" aria-current={isHome ? "page" : undefined}>
        หน้าหลัก
      </Link>
      <Link className={navItemClass(isReports)} href="/public/reports" aria-current={isReports ? "page" : undefined}>
        รายงาน
      </Link>
      <Link className={navItemClass(false)} href="/">
        สำหรับเจ้าหน้าที่
      </Link>
    </nav>
  );
}
