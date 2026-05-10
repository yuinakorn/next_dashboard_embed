"use client";

import { useEffect, useState } from "react";

type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  width: number;
};

type Pattern = {
  lines: Line[];
  gradient: { angle: number; mid: number };
};

const W = 400;
const H = 600;

function generatePattern(): Pattern {
  const lines: Line[] = [];
  const count = 16 + Math.floor(Math.random() * 18);

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI;
    const cx = (Math.random() * 1.6 - 0.3) * W;
    const cy = (Math.random() * 1.6 - 0.3) * H;
    const len = Math.max(W, H) * 2;
    lines.push({
      x1: cx - Math.cos(angle) * len,
      y1: cy - Math.sin(angle) * len,
      x2: cx + Math.cos(angle) * len,
      y2: cy + Math.sin(angle) * len,
      opacity: 0.18 + Math.random() * 0.45,
      width: 0.5 + Math.random() * 1.3,
    });
  }

  return {
    lines,
    gradient: {
      angle: Math.floor(Math.random() * 360),
      mid: 25 + Math.floor(Math.random() * 50),
    },
  };
}

export function AbstractHero() {
  const [pattern, setPattern] = useState<Pattern | null>(null);

  useEffect(() => {
    setPattern(generatePattern());
  }, []);

  const gradientStyle = pattern
    ? {
        background: `linear-gradient(${pattern.gradient.angle}deg, #d1d5db 0%, #f9fafb ${pattern.gradient.mid}%, #9ca3af 100%)`,
      }
    : { background: "linear-gradient(135deg, #d1d5db 0%, #f9fafb 50%, #9ca3af 100%)" };

  return (
    <div
      className="relative h-full min-h-[420px] overflow-hidden lg:min-h-[600px]"
      style={gradientStyle}
    >
      {pattern ? (
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {pattern.lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1}
              y1={l.y1}
              x2={l.x2}
              y2={l.y2}
              stroke="black"
              strokeOpacity={l.opacity}
              strokeWidth={l.width}
            />
          ))}
        </svg>
      ) : null}

      <div className="relative z-10 flex h-full flex-col justify-center p-8 sm:p-10">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/60 p-6 shadow-2xl backdrop-blur-md sm:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/70">
            ศูนย์ข้อมูลสุขภาพ - OPEN DATA
          </p>
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Dashboard Hub
          </h1>
          <p className="text-sm leading-relaxed text-white/85">
            เข้าถึง dashboard ภายในของหน่วยงาน ตรวจสอบรายงาน
            และจัดการข้อมูลตามสิทธิ์ที่ได้รับ
          </p>
        </div>
      </div>
    </div>
  );
}
