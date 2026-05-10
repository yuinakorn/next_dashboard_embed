"use client";

import { useEffect, useRef, useState } from "react";

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

export function DashboardEmbed({
  title,
  src,
}: {
  title: string;
  src: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
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
    <div
      ref={containerRef}
      className={`flex flex-col overflow-hidden border border-[oklch(0.91_0.006_250)] bg-[oklch(0.998_0.002_250)] ${
        isFullscreen ? "h-screen w-screen rounded-none" : "rounded-lg"
      }`}
    >
      <div className="flex items-center justify-end gap-2 border-b border-[oklch(0.91_0.006_250)] bg-white px-3 py-2">
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? "ออกจากโหมดเต็มจอ" : "ขยายเต็มจอ"}
          title={isFullscreen ? "ออกจากโหมดเต็มจอ (Esc)" : "ขยายเต็มจอ"}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[oklch(0.91_0.006_250)] bg-white px-2.5 text-xs font-semibold text-[oklch(0.3_0.018_255)] transition hover:bg-[oklch(0.955_0.005_250)] hover:text-[oklch(0.21_0.015_255)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[oklch(0.4_0.13_260)]"
        >
          {isFullscreen ? <CollapseIcon /> : <ExpandIcon />}
          <span>{isFullscreen ? "ย่อ" : "เต็มจอ"}</span>
        </button>
      </div>
      <iframe
        title={title}
        src={src}
        className={`w-full bg-[oklch(0.955_0.005_250)] ${
          isFullscreen ? "flex-1" : "h-[85vh] min-h-[640px]"
        }`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
