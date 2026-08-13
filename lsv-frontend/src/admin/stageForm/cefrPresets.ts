export interface CefrLevel {
  code: string;
  name: string;
  description: string;
}

/** Common European Framework of Reference adapted for sign language courses. */
export const CEFR_LEVELS: CefrLevel[] = [
  {
    code: "A1",
    name: "A1 — Principiante",
    description:
      "Saludos, alfabeto, vocabulario cotidiano básico y frases simples.",
  },
  {
    code: "A2",
    name: "A2 — Elemental",
    description:
      "Conversaciones cortas sobre rutinas, familia y necesidades inmediatas.",
  },
  {
    code: "B1",
    name: "B1 — Intermedio",
    description:
      "Narrar experiencias, expresar opiniones y sostener diálogos más largos.",
  },
  {
    code: "B2",
    name: "B2 — Intermedio alto",
    description:
      "Argumentar con fluidez, comprender mensajes complejos y matices.",
  },
  {
    code: "C1",
    name: "C1 — Avanzado",
    description:
      "Usar el lenguaje con precisión en contextos académicos o profesionales.",
  },
  {
    code: "C2",
    name: "C2 — Dominio",
    description:
      "Comunicación espontánea, idiomática y casi nativa en cualquier tema.",
  },
];
