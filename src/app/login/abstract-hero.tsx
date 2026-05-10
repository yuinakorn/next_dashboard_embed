"use client";

import { useEffect, useRef, useState } from "react";

function drawAbstractArt(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = (canvas.width = 800);
  const height = (canvas.height = 1200);

  // 1. Background fill
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, "#1a1a1a");
  bgGradient.addColorStop(1, "#000000");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Random shapes
  const shapeCount = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < shapeCount; i++) {
    ctx.save();

    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = 200 + Math.random() * 600;

    const shapeGradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    const opacity = 0.1 + Math.random() * 0.2;
    shapeGradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    shapeGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = shapeGradient;

    if (Math.random() > 0.5) {
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI);
      ctx.beginPath();
      ctx.moveTo(-size, -size);
      ctx.lineTo(size, 0);
      ctx.lineTo(-size, size);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Architectural lines
  ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    const startY = Math.random() * height;
    ctx.moveTo(0, startY);
    ctx.lineTo(width, startY + (Math.random() - 0.5) * 400);
    ctx.stroke();
  }

  // 4. Noise / grain
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 15;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

export function AbstractHero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [seed, setSeed] = useState(0);

  useEffect(() => {
    setSeed(Math.random());
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      drawAbstractArt(canvasRef.current);
    }
  }, [seed]);

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden bg-zinc-900 lg:min-h-[600px]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden="true"
      />

      <div className="absolute inset-0 z-10 flex flex-col justify-center bg-gradient-to-t from-black/60 to-transparent p-8 text-white sm:p-12">
        <div className="space-y-6">
          <div className="inline-block border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-bold tracking-[0.2em] backdrop-blur-md">
            ศูนย์ข้อมูลสุขภาพ - OPEN DATA
          </div>
          <h1 className="text-4xl font-bold leading-tight">Dashboard Hub</h1>
          <div className="h-1 w-12 bg-blue-500" />
          <p className="max-w-xs text-sm leading-relaxed text-slate-300">
            เข้าถึง dashboard ภายในของหน่วยงาน ตรวจสอบรายงาน
            และจัดการข้อมูลตามสิทธิ์ที่ได้รับ
          </p>
        </div>
      </div>
    </div>
  );
}
