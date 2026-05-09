"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
};

const defaultNavItems: NavItem[] = [
  { label: "หน้าหลัก", href: "/" },
  { label: "Catalog", href: "/catalog" },
  { label: "คิวตรวจสอบ", href: "/review" },
  { label: "ประวัติ Audit", href: "/audit" },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function HamburgerIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 5h14M3 10h14M3 15h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function AppNavbar({
  userName,
  userTitle,
  actions,
  extraNavItems = [],
}: {
  userName: string;
  userTitle: string;
  actions?: ReactNode;
  extraNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navItems = [...defaultNavItems, ...extraNavItems];

  // Close on click outside
  useEffect(() => {
    if (!mobileOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen]);

  // Close on Escape
  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [mobileOpen]);

  return (
    <nav
      ref={menuRef}
      className="sticky top-0 z-50 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex flex-col rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
          >
            <span className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-slate-950">Dashboard Hub</span>
              <span className="text-sm font-medium text-[#005f80]">Open Data</span>
            </span>
            <span className="text-[11px] text-slate-500">สำนักงานสาธารณสุขจังหวัดเชียงใหม่</span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-sm font-semibold transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 ${
                      active
                        ? "bg-slate-950 text-slate-50"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop right side: user + actions */}
          <div className="hidden items-center gap-3 md:flex">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">
                {userName}
              </p>
              <p className="text-xs text-slate-500">{userTitle}</p>
            </div>
            {actions}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 transition duration-150 hover:bg-slate-100 hover:text-slate-950 md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-menu"
            aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        id="mobile-nav-menu"
        className={`overflow-hidden border-t border-slate-200 transition-all duration-200 ease-out md:hidden ${
          mobileOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0 border-t-0"
        }`}
      >
        <div className="mx-auto max-w-7xl space-y-1 px-5 py-3">
          {navItems.map((item) => {
            const active = isActiveRoute(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2.5 text-sm font-semibold transition duration-150 ${
                  active
                    ? "bg-slate-950 text-slate-50"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="border-t border-slate-200 pt-3 mt-2">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-slate-800">
                {userName}
              </p>
              <p className="text-xs text-slate-500">{userTitle}</p>
            </div>
            {actions ? (
              <div className="flex px-3 py-2">{actions}</div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
