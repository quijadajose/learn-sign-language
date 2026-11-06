export interface VisibilityActor {
  sub: string;
  role: string;
}

export interface AccessibleLanguagesPort {
  findAccessibleLanguageIds(userId: string): Promise<string[]>;
}

/**
 * Idiomas visibles para el actor en listados de señas y modelos.
 * - admin: `undefined` (sin filtro).
 * - moderator: idiomas de sus permisos (LANGUAGE y REGION); lista vacía si no tiene ninguno.
 * - otros roles: lista vacía.
 */
export async function resolveVisibleLanguageIds(
  actor: VisibilityActor,
  port: AccessibleLanguagesPort,
): Promise<string[] | undefined> {
  if (actor.role === 'admin') return undefined;
  if (actor.role === 'moderator') {
    return port.findAccessibleLanguageIds(actor.sub);
  }
  return [];
}
