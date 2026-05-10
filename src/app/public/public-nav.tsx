"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function navItemClass(isActive: boolean) {
  return `rounded-md px-3 py-2 transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.14_258)] ${
    isActive
      ? "bg-[oklch(0.21_0.015_255)] text-white"
      : "text-[oklch(0.5_0.012_255)] hover:bg-[oklch(0.955_0.005_250)] hover:text-[oklch(0.21_0.015_255)]"
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
