"use client";

import { useEffect, useRef, useState } from "react";
import { buttonStyles } from "@/components/dashboard-ui";

function ExpandIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M2.5 6V2.5H6M14 6V2.5H10.5M2.5 10v3.5H6M14 10v3.5H10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CollapseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M6 2.5V6H2.5M10.5 2.5V6H14M6 14v-3.5H2.5M10.5 14v-3.5H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DashboardViewerEmbed({
  title,
  src,
  reason,
  externalUrl,
}: {
  title: string;
  src: string;
  reason: string;
  externalUrl?: string;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    function handleChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleChange);
    return () => document.removeEventListener("fullscreenchange", handleChange);
  }, []);

  const toggleFullscreen = async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  return (
    <section
      ref={containerRef}
      className={`flex flex-col overflow-hidden border border-[oklch(0.91_0.006_250)] bg-white shadow-sm ${
        isFullscreen ? "h-screen w-screen rounded-none" : "rounded-lg"
      }`}
    >
      <div className="flex flex-col gap-2 border-b border-[oklch(0.91_0.006_250)] px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[oklch(0.21_0.015_255)]">พื้นที่แสดงรายงาน</h2>
          <p className="mt-1 text-sm text-[oklch(0.5_0.012_255)]">{reason}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "ออกจากโหมดเต็มจอ" : "ขยายเต็มจอ"}
            title={isFullscreen ? "ออกจากโหมดเต็มจอ (Esc)" : "ขยายเต็มจอ"}
            className={`${buttonStyles.secondary} h-9 w-fit gap-1.5 px-3`}
          >
            {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
            <span>{isFullscreen ? "ย่อ" : "เต็มจอ"}</span>
          </button>
          {externalUrl ? (
            <a
              href={externalUrl}
              className={`${buttonStyles.secondary} h-9 w-fit px-3`}
              target="_blank"
              rel="noreferrer"
            >
              เปิดภายนอก
            </a>
          ) : null}
        </div>
      </div>
      <iframe
        title={title}
        src={src}
        className={`w-full bg-[oklch(0.998_0.002_250)] ${isFullscreen ? "flex-1" : "h-[72vh]"}`}
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads"
      />
    </section>
  );
}
