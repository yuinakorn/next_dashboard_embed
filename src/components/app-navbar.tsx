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
  { label: "รายงาน", href: "/catalog" },
  { label: "ประวัติ Audit", href: "/audit" },
];

function isActiveRoute(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    >
      <path d="M2.5 5l4.5 4.5L11.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function AppNavbar({
  userName,
  userTitle,
  actions,
  navItems: navItemsProp,
  extraNavItems = [],
}: {
  userName: string;
  userTitle: string;
  actions?: ReactNode;
  navItems?: NavItem[];
  extraNavItems?: NavItem[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const navItems = [...(navItemsProp ?? defaultNavItems), ...extraNavItems];
  const initials = getInitials(userName);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileOpen && navRef.current && !navRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [mobileOpen, profileOpen]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMobileOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <nav
      ref={navRef}
      className="sticky top-0 z-50 border-b border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)/0.92] backdrop-blur-sm"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl px-5">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.14_258)]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white select-none"
              style={{ background: "oklch(0.21 0.015 255)" }}
              aria-hidden="true"
            >
              DH
            </span>
            <span className="flex flex-col">
              <span className="text-[17px] font-semibold tracking-tight leading-tight text-[oklch(0.21_0.015_255)]">Dashboard Hub</span>
              <span className="text-xs leading-5 text-[oklch(0.5_0.012_255)]">ศูนย์ข้อมูลสุขภาพ - Open Data</span>
            </span>
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`rounded-md px-3 py-2 text-[15px] font-semibold transition duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.14_258)] ${
                      active
                        ? "bg-[oklch(0.21_0.015_255)] text-white"
                        : "text-[oklch(0.5_0.012_255)] hover:bg-[oklch(0.955_0.005_250)] hover:text-[oklch(0.21_0.015_255)]"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Desktop right side: profile dropdown */}
          <div className="hidden md:flex items-center" ref={profileRef}>
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                aria-expanded={profileOpen}
                aria-haspopup="true"
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition duration-150 hover:bg-[oklch(0.955_0.005_250)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.14_258)]"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[oklch(0.3_0.018_255)] text-xs font-bold text-white select-none">
                  {initials}
                </span>
                <span className="text-left">
                  <span className="block text-[15px] font-semibold text-[oklch(0.21_0.015_255)] leading-tight">{userName}</span>
                  <span className="block max-w-[220px] truncate text-[13px] leading-5 text-[oklch(0.5_0.012_255)]">{userTitle}</span>
                </span>
                <ChevronDownIcon open={profileOpen} />
              </button>

              {/* Dropdown panel */}
              {profileOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 origin-top-right rounded-xl border border-[oklch(0.91_0.006_250)] bg-white shadow-lg ring-1 ring-black/5">
                  {/* User info header */}
                  <div className="flex items-start gap-3 px-4 py-3 border-b border-[oklch(0.955_0.005_250)]">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[oklch(0.3_0.018_255)] text-sm font-bold text-white select-none">
                      {initials}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[oklch(0.21_0.015_255)] break-words">{userName}</p>
                      <p className="text-[13px] leading-5 text-[oklch(0.5_0.012_255)] break-words">{userTitle}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  {actions && (
                    <div className="p-2">
                      <div className="[&>*]:w-full [&>*]:justify-start [&>*]:rounded-lg [&>*]:px-3 [&>*]:py-2 [&>*]:text-sm">
                        {actions}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-md text-[oklch(0.5_0.012_255)] transition duration-150 hover:bg-[oklch(0.955_0.005_250)] hover:text-[oklch(0.21_0.015_255)] md:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.5_0.14_258)]"
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
        className={`overflow-hidden border-t border-[oklch(0.91_0.006_250)] transition-all duration-200 ease-out md:hidden ${
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 border-t-0"
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
                    ? "bg-[oklch(0.21_0.015_255)] text-white"
                    : "text-[oklch(0.5_0.012_255)] hover:bg-[oklch(0.955_0.005_250)] hover:text-[oklch(0.21_0.015_255)]"
                }`}
                aria-current={active ? "page" : undefined}
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="border-t border-[oklch(0.91_0.006_250)] pt-3 mt-2">
            <div className="flex items-center gap-3 px-3 py-2">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[oklch(0.3_0.018_255)] text-sm font-bold text-white select-none">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[oklch(0.21_0.015_255)] truncate">{userName}</p>
                <p className="truncate text-[13px] leading-5 text-[oklch(0.5_0.012_255)]">{userTitle}</p>
              </div>
            </div>
            {actions ? (
              <div className="flex flex-col gap-1 px-3 py-2">{actions}</div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
