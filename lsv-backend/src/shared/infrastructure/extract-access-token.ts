export const ACCESS_COOKIE_NAME = 'lsv_access';

export function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) {
    return null;
  }
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) {
      continue;
    }
    const key = part.slice(0, idx).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

export function requestUsedBearerToken(req: {
  headers?: { authorization?: string };
}): boolean {
  const header = req.headers?.authorization;
  return (
    typeof header === 'string' &&
    header.startsWith('Bearer ') &&
    header.slice(7).trim().length > 0
  );
}

export function extractAccessToken(req: {
  headers?: { authorization?: string; cookie?: string };
  cookies?: Record<string, string>;
}): string | null {
  const header = req.headers?.authorization;
  if (requestUsedBearerToken(req)) {
    const token = header?.slice(7).trim();
    if (token) {
      return token;
    }
  }
  const fromParsed = req.cookies?.[ACCESS_COOKIE_NAME];
  if (typeof fromParsed === 'string' && fromParsed.length > 0) {
    return fromParsed;
  }
  return readCookie(req.headers?.cookie, ACCESS_COOKIE_NAME);
}
