import type { DashboardProvider, EmbedStatus } from "@/lib/portal-types";

export type EmbedAssessment = {
  status: EmbedStatus;
  label: string;
  reason: string;
  recommendation: string;
};

export type EmbedHeaderSnapshot = {
  httpStatus: number;
  finalUrl: string;
  xFrameOptions: string | null;
  contentSecurityPolicy: string | null;
  server: string | null;
};

export type EmbedHealthResult = EmbedAssessment & {
  checkedAt: string;
  headers: EmbedHeaderSnapshot | null;
};

function parseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export function assessEmbedUrl(provider: DashboardProvider, value: string): EmbedAssessment {
  const url = parseUrl(value);

  if (!url || url.protocol !== "https:") {
    return {
      status: "blocked",
      label: "URL ไม่ถูกต้อง",
      reason: "Embed URL ต้องเป็น HTTPS URL ที่ถูกต้อง",
      recommendation: "ใช้ HTTPS embed URL และเก็บ external fallback URL ไว้เสมอ",
    };
  }

  const host = url.hostname.toLowerCase();
  const path = url.pathname.toLowerCase();

  if (provider === "Looker Studio") {
    if (
      (host === "datastudio.google.com" || host === "lookerstudio.google.com") &&
      path.includes("/embed/reporting/")
    ) {
      return {
        status: "embeddable",
        label: "มีแนวโน้มฝังได้",
        reason: "Looker Studio embed reporting URL ถูกออกแบบมาให้ใช้กับ iframe",
        recommendation: "ตรวจ preview iframe และเก็บ report URL แบบ non-embed เป็น fallback",
      };
    }

    return {
      status: "unknown",
      label: "ควรใช้ Embed URL",
      reason: "Looker Studio link ควรมี /embed/reporting/ เพื่อใช้กับ iframe",
      recommendation: "ใช้เมนู Embed report ใน Looker Studio แล้วนำ embed URL มาใส่",
    };
  }

  if (provider === "Superset") {
    return {
      status: "unknown",
      label: "ต้องตั้งค่า Provider",
      reason: "Superset จะ iframe ได้ขึ้นกับ embedded dashboard, guest token และ CSP",
      recommendation: "ตรวจการตั้งค่า Superset และ allowlist domain ของ portal",
    };
  }

  if (provider === "Power BI") {
    return {
      status: "unknown",
      label: "อาจต้องยืนยันตัวตน",
      reason: "Power BI private report มักต้องใช้ Microsoft auth หรือ embed token",
      recommendation: "ใช้ Power BI embed URL ที่ถูกต้อง และเก็บ fallback link ไว้",
    };
  }

  if (provider === "Custom") {
    return {
      status: "external_only",
      label: "ควรเปิดภายนอก",
      reason: "เว็บไซต์ทั่วไปมักบล็อก iframe ด้วย X-Frame-Options หรือ CSP frame-ancestors",
      recommendation: "ให้ถือเป็น external-only ยกเว้นเว็บปลายทางอนุญาต domain ของ portal ชัดเจน",
    };
  }

  return {
    status: "unknown",
    label: "ต้องทดสอบเพิ่มเติม",
    reason: "การ iframe ได้หรือไม่ขึ้นกับ security header และรูปแบบ auth ของ Provider",
    recommendation: "ลอง preview iframe และเก็บ external fallback URL ไว้",
  };
}

export function getEmbedStatusTone(status: EmbedStatus): string {
  if (status === "embeddable") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (status === "external_only") {
    return "border-amber-200 bg-amber-50 text-amber-800";
  }

  if (status === "blocked") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border-slate-200 bg-slate-100 text-slate-700";
}

export function assessEmbedHeaders(headers: EmbedHeaderSnapshot): EmbedAssessment {
  const xFrameOptions = headers.xFrameOptions?.toLowerCase() ?? "";
  const csp = headers.contentSecurityPolicy?.toLowerCase() ?? "";

  if (headers.httpStatus === 401 || headers.httpStatus === 403) {
    return {
      status: "external_only",
      label: "ติด Auth หรือ Challenge",
      reason: `ปลายทางตอบ HTTP ${headers.httpStatus} จึงอาจต้องใช้ auth, allowlist หรือจัดการ challenge ก่อน iframe`,
      recommendation: "ให้ใช้ external-only จนกว่าเว็บปลายทางจะอนุญาต domain ของ portal ชัดเจน",
    };
  }

  if (xFrameOptions.includes("deny") || xFrameOptions.includes("sameorigin")) {
    return {
      status: "external_only",
      label: "ถูกบล็อกด้วย X-Frame-Options",
      reason: `ปลายทางส่ง X-Frame-Options: ${headers.xFrameOptions} ทำให้ browser บล็อก cross-origin iframe`,
      recommendation: "ให้เจ้าของเว็บปลายทางปรับ X-Frame-Options และใช้ CSP frame-ancestors เพื่ออนุญาต portal domain",
    };
  }

  if (csp.includes("frame-ancestors")) {
    const frameAncestors = csp.split("frame-ancestors")[1]?.split(";")[0] ?? "";

    if (frameAncestors.includes("'none'") || frameAncestors.includes("'self'")) {
      return {
        status: "external_only",
        label: "ถูกจำกัดด้วย CSP",
        reason: "ปลายทางใช้ CSP frame-ancestors ที่ยังไม่อนุญาต domain ของ portal อย่างชัดเจน",
        recommendation: "ให้เจ้าของเว็บเพิ่ม portal domain ใน Content-Security-Policy frame-ancestors",
      };
    }

    return {
      status: "unknown",
      label: "พบ CSP frame policy",
      reason: "ปลายทางส่ง CSP frame-ancestors การแสดงผลจริงขึ้นกับว่าอนุญาต portal domain หรือไม่",
      recommendation: "ยืนยันว่า production portal domain อยู่ใน frame-ancestors แล้ว",
    };
  }

  if (headers.httpStatus >= 200 && headers.httpStatus < 300) {
    return {
      status: "unknown",
      label: "ยังไม่พบตัวบล็อกชัดเจน",
      reason: "ไม่พบ X-Frame-Options หรือ CSP frame-ancestors ที่บล็อกจาก response",
      recommendation: "ลอง preview iframe ใน browser และเก็บ fallback link ไว้",
    };
  }

  return {
    status: "unknown",
    label: "ควรตรวจสอบเอง",
    reason: `ปลายทางตอบ HTTP ${headers.httpStatus}`,
    recommendation: "เปิด fallback URL เพื่อตรวจว่าต้อง login หรือตั้งค่า Provider เพิ่มหรือไม่",
  };
}
