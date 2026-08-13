export type SupersedeScope =
  | { mode: 'variant'; lessonVariantId: string }
  | { mode: 'lesson'; lessonId: string }
  | { mode: 'custom'; name: string }
  | { mode: 'none' };

/**
 * Alcance estricto al reemplazar modelos READY.
 * Con variante: solo esa variante (no base ni otras regiones).
 * Sin variante: solo modelos del lessonId sin lessonVariantId.
 * Custom sin lección: mismos name + modelType sin lesson/variant.
 */
export function resolveSupersedeScope(params: {
  lessonId?: string | null;
  lessonVariantId?: string | null;
  name?: string | null;
}): SupersedeScope {
  if (params.lessonVariantId) {
    return { mode: 'variant', lessonVariantId: params.lessonVariantId };
  }
  if (params.lessonId) {
    return { mode: 'lesson', lessonId: params.lessonId };
  }
  if (params.name) {
    return { mode: 'custom', name: params.name };
  }
  return { mode: 'none' };
}
