import { NextResponse } from "next/server";
import {
  assessEmbedHeaders,
  type EmbedHeaderSnapshot,
  type EmbedHealthResult,
} from "@/lib/embed-policy";

type CheckRequest = {
  url?: string;
};

function isValidHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function headerSnapshot(response: Response): EmbedHeaderSnapshot {
  return {
    httpStatus: response.status,
    finalUrl: response.url,
    xFrameOptions: response.headers.get("x-frame-options"),
    contentSecurityPolicy: response.headers.get("content-security-policy"),
    server: response.headers.get("server"),
  };
}

async function fetchHeaders(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const requestOptions: RequestInit = {
      redirect: "follow",
      signal: controller.signal,
    };

    const headResponse = await fetch(url, {
      ...requestOptions,
      method: "HEAD",
    });

    if (headResponse.status !== 405) {
      return headResponse;
    }

    return fetch(url, {
      ...requestOptions,
      method: "GET",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as CheckRequest;
  const url = body.url?.trim() ?? "";

  if (!isValidHttpsUrl(url)) {
    const result: EmbedHealthResult = {
      status: "blocked",
      label: "Invalid URL",
      reason: "Embed health check accepts HTTPS URLs only.",
      recommendation: "Use an HTTPS URL and keep a fallback URL.",
      checkedAt: new Date().toISOString(),
      headers: null,
    };

    return NextResponse.json(result, { status: 400 });
  }

  try {
    const response = await fetchHeaders(url);
    const headers = headerSnapshot(response);
    const assessment = assessEmbedHeaders(headers);

    const result: EmbedHealthResult = {
      ...assessment,
      checkedAt: new Date().toISOString(),
      headers,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error";
    const result: EmbedHealthResult = {
      status: "unknown",
      label: "Health check failed",
      reason: message,
      recommendation: "Use the external fallback until the target URL can be checked from the server.",
      checkedAt: new Date().toISOString(),
      headers: null,
    };

    return NextResponse.json(result, { status: 502 });
  }
}
