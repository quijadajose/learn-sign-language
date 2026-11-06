import { z } from "zod";
import type { VariantFormState } from "./types";

/** Valida que el texto sea un UUID v4-compatible (lo que acepta zod). */
export function isUuid(value: string | null | undefined): boolean {
  return !!value && z.string().uuid().safeParse(value).success;
}

/**
 * Decide qué idioma seleccionar al iniciar la vista. Conserva el guardado
 * si es válido; si no, toma el primero disponible. Devuelve null cuando no
 * hay nada válido que seleccionar.
 */
export function pickInitialLanguageId(
  storedId: string | null | undefined,
  languageIds: string[],
): string | null {
  if (storedId && isUuid(storedId)) return storedId;
  if (languageIds.length > 0) return languageIds[0];
  return null;
}

/** Un variante necesita nombre, descripción, contenido y región. */
export function isVariantFormComplete(
  form: Pick<VariantFormState, "name" | "description" | "content" | "regionId">,
): boolean {
  return Boolean(
    form.name.trim() &&
      form.description.trim() &&
      form.content.trim() &&
      form.regionId,
  );
}
