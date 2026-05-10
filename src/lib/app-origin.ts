function normalizeOrigin(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.origin;
  } catch {
    return null;
  }
}

function getConfiguredOrigin(): string | null {
  return (
    normalizeOrigin(process.env.APP_ORIGIN) ||
    normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
    normalizeOrigin(process.env.SSO_REDIRECT_URI)
  );
}

function getForwardedOrigin(request: Request): string | null {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

  if (!host) {
    return null;
  }

  const proto =
    request.headers.get("x-forwarded-proto") ||
    (process.env.NODE_ENV === "production" ? "https" : new URL(request.url).protocol.replace(":", ""));

  return `${proto}://${host}`;
}

export function getAppOrigin(request: Request): string {
  return getConfiguredOrigin() || getForwardedOrigin(request) || new URL(request.url).origin;
}

export function getAppUrl(path: string, request: Request): URL {
  return new URL(path, getAppOrigin(request));
}
