/** Letra de una opción de quiz: 0 → A, 1 → B… (cicla cada 26). */
export function optionLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}
