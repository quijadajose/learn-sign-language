const IDENTIFIER = /^[A-Za-z][A-Za-z0-9_]*$/;

export function pickSafeOrderBy(
  orderBy: string | undefined,
  allowed: readonly string[],
  fallback?: string,
): string | undefined {
  if (orderBy && IDENTIFIER.test(orderBy) && allowed.includes(orderBy)) {
    return orderBy;
  }
  return fallback;
}
