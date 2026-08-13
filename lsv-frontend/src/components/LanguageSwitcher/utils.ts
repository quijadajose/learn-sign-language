/** Hide descriptions that only repeat the name. */
export function usefulDescription(
  name: string,
  description?: string | null,
): string | null {
  const trimmed = description?.trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase() === name.trim().toLowerCase()) return null;
  return trimmed;
}
