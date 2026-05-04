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

export function assessEmbedHeaders(headers: EmbedHeaderSnapshot): EmbedAssessment {
  const xFrameOptions = headers.xFrameOptions?.toLowerCase() ?? "";
  const csp = headers.contentSecurityPolicy?.toLowerCase() ?? "";

  if (headers.httpStatus === 401 || headers.httpStatus === 403) {
    return {
      status: "external_only",
      label: "Auth or challenge response",
      reason: `The target returned HTTP ${headers.httpStatus}, so iframe access may require auth, allowlisting, or challenge handling.`,
      recommendation: "Keep this as external-only unless the target app can explicitly allow this portal domain.",
    };
  }

  if (xFrameOptions.includes("deny") || xFrameOptions.includes("sameorigin")) {
    return {
      status: "external_only",
      label: "Blocked by X-Frame-Options",
      reason: `The target sends X-Frame-Options: ${headers.xFrameOptions}. Browsers block cross-origin iframe in this case.`,
      recommendation: "Ask the target owner to remove X-Frame-Options and use CSP frame-ancestors to allow the portal domain.",
    };
  }

  if (csp.includes("frame-ancestors")) {
    const frameAncestors = csp.split("frame-ancestors")[1]?.split(";")[0] ?? "";

    if (frameAncestors.includes("'none'") || frameAncestors.includes("'self'")) {
      return {
        status: "external_only",
        label: "Restricted by CSP",
        reason: "The target uses CSP frame-ancestors that does not clearly allow this portal domain.",
        recommendation: "Ask the target owner to add the portal domain to Content-Security-Policy frame-ancestors.",
      };
    }

    return {
      status: "unknown",
      label: "CSP frame policy present",
      reason: "The target sends CSP frame-ancestors. Final browser behavior depends on whether this portal domain is allowed.",
      recommendation: "Confirm that the production portal domain is included in frame-ancestors.",
    };
  }

  if (headers.httpStatus >= 200 && headers.httpStatus < 300) {
    return {
      status: "unknown",
      label: "No obvious frame block",
      reason: "No X-Frame-Options or CSP frame-ancestors block was detected from the server response.",
      recommendation: "Preview the iframe in browser and keep the fallback link available.",
    };
  }

  return {
    status: "unknown",
    label: "Needs manual review",
    reason: `The target returned HTTP ${headers.httpStatus}.`,
    recommendation: "Open the fallback URL and confirm whether authentication or provider configuration is required.",
  };
}
