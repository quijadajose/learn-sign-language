import type { SignDetectionType } from "../../utils/signDetection";

export type BulkSignDraft = {
  name: string;
  detectionType: SignDetectionType;
};

/** Alfabeto manual LSV (incluye digrafos; dinámicas según movimiento típico). */
export const LSV_ALPHABET_SIGNS: BulkSignDraft[] = [
  { name: "A", detectionType: "static" },
  { name: "B", detectionType: "static" },
  { name: "C", detectionType: "static" },
  { name: "CH", detectionType: "dynamic" },
  { name: "D", detectionType: "static" },
  { name: "E", detectionType: "static" },
  { name: "F", detectionType: "static" },
  { name: "G", detectionType: "static" },
  { name: "H", detectionType: "static" },
  { name: "I", detectionType: "static" },
  { name: "J", detectionType: "dynamic" },
  { name: "K", detectionType: "static" },
  { name: "L", detectionType: "static" },
  { name: "LL", detectionType: "dynamic" },
  { name: "M", detectionType: "static" },
  { name: "N", detectionType: "static" },
  { name: "Ñ", detectionType: "dynamic" },
  { name: "O", detectionType: "static" },
  { name: "P", detectionType: "static" },
  { name: "Q", detectionType: "static" },
  { name: "R", detectionType: "static" },
  { name: "RR", detectionType: "dynamic" },
  { name: "S", detectionType: "static" },
  { name: "T", detectionType: "static" },
  { name: "U", detectionType: "static" },
  { name: "V", detectionType: "static" },
  { name: "W", detectionType: "static" },
  { name: "X", detectionType: "static" },
  { name: "Y", detectionType: "static" },
  { name: "Z", detectionType: "dynamic" },
];

export const LSV_NUMBER_SIGNS: BulkSignDraft[] = Array.from(
  { length: 10 },
  (_, i) => ({
    name: String(i),
    detectionType: "static" as const,
  }),
);

export function formatBulkSignLines(signs: BulkSignDraft[]): string {
  return signs
    .map((s) =>
      s.detectionType === "static" ? s.name : `${s.name}:dynamic`,
    )
    .join("\n");
}

/**
 * Parsea nombres separados por coma, espacio, punto y coma o salto de línea.
 * Opcional: `Nombre:static` / `Nombre:dynamic`.
 */
export function parseBulkSignLines(
  text: string,
  defaultType: SignDetectionType = "static",
): BulkSignDraft[] {
  const tokens = text
    .split(/[,;\s]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const out: BulkSignDraft[] = [];
  const seen = new Set<string>();

  for (const raw of tokens) {
    if (raw.startsWith("#")) continue;

    const match = raw.match(/^(.+?)(?::(static|dynamic))?$/i);
    if (!match) continue;

    const name = match[1].replace(/^["']+|["']+$/g, "").trim();
    if (!name) continue;

    const key = name.toLocaleLowerCase("es");
    if (seen.has(key)) continue;
    seen.add(key);

    const typeRaw = match[2]?.toLowerCase();
    const detectionType: SignDetectionType =
      typeRaw === "static" || typeRaw === "dynamic" ? typeRaw : defaultType;

    out.push({ name, detectionType });
  }

  return out;
}

export function summarizeBulkDrafts(signs: BulkSignDraft[]): {
  total: number;
  staticCount: number;
  dynamicCount: number;
} {
  let staticCount = 0;
  let dynamicCount = 0;
  for (const s of signs) {
    if (s.detectionType === "dynamic") dynamicCount += 1;
    else staticCount += 1;
  }
  return { total: signs.length, staticCount, dynamicCount };
}
