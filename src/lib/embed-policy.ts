import type { DashboardProvider, EmbedStatus } from "@/lib/portal-types";

export type EmbedAssessment = {
  status: EmbedStatus;
  label: string;
  reason: string;
  recommendation: string;
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
      label: "Invalid embed URL",
      reason: "Embed URLs must be valid HTTPS URLs.",
      recommendation: "Use a public HTTPS embed URL and keep an external fallback URL.",
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
        label: "Likely embeddable",
        reason: "Looker Studio embed reporting URLs are designed for iframe usage.",
        recommendation: "Preview the iframe and keep the non-embed report URL as fallback.",
      };
    }

    return {
      status: "unknown",
      label: "Needs embed URL",
      reason: "Looker Studio links should usually contain /embed/reporting/ for iframe usage.",
      recommendation: "Use File > Embed report in Looker Studio and paste the embed URL.",
    };
  }

  if (provider === "Superset") {
    return {
      status: "unknown",
      label: "Provider configuration required",
      reason: "Superset iframe support depends on embedded dashboards, guest tokens, and CSP settings.",
      recommendation: "Confirm Superset embed settings and test with the portal domain allowlisted.",
    };
  }

  if (provider === "Power BI") {
    return {
      status: "unknown",
      label: "Authentication may be required",
      reason: "Power BI private reports often require Microsoft auth or an embed token.",
      recommendation: "Use an official Power BI embed URL and keep a fallback link.",
    };
  }

  if (provider === "Custom") {
    return {
      status: "external_only",
      label: "External-first URL",
      reason: "Normal websites frequently block iframe with X-Frame-Options or CSP frame-ancestors.",
      recommendation: "Treat this as external-only unless the target site explicitly allows this portal domain.",
    };
  }

  return {
    status: "unknown",
    label: "Needs testing",
    reason: "This provider's iframe support depends on its security headers and authentication model.",
    recommendation: "Preview the iframe and keep the external fallback URL available.",
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

  return "border-zinc-200 bg-zinc-50 text-zinc-700";
}
