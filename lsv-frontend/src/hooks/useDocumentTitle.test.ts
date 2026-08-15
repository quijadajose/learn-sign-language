import { describe, expect, it } from "vitest";
import { pageLabelForPath, titleForPath } from "./useDocumentTitle";

const labels: Record<string, string> = {
  appName: "Aprende Lenguaje de Señas",
  "a11y.pages.home": "Inicio",
  "a11y.pages.login": "Iniciar sesión",
  "a11y.pages.register": "Registro",
  "a11y.pages.forgotPassword": "Recuperar contraseña",
  "a11y.pages.resetPassword": "Restablecer contraseña",
  "a11y.pages.dashboard": "Dashboard",
  "a11y.pages.profile": "Perfil",
  "a11y.pages.leaderboard": "Ranking",
  "a11y.pages.lesson": "Lección",
  "a11y.pages.practice": "Práctica de señas",
  "a11y.pages.quiz": "Quiz",
  "a11y.pages.lessons": "Lecciones",
  "a11y.pages.management": "Gestión",
  "a11y.pages.privacy": "Privacidad",
  "a11y.pages.terms": "Términos",
};

function t(key: string) {
  return labels[key] ?? key;
}

describe("pageLabelForPath", () => {
  it("maps student routes to page labels", () => {
    expect(pageLabelForPath("/", t)).toBe("Inicio");
    expect(pageLabelForPath("/login", t)).toBe("Iniciar sesión");
    expect(pageLabelForPath("/register", t)).toBe("Registro");
    expect(pageLabelForPath("/dashboard", t)).toBe("Dashboard");
    expect(pageLabelForPath("/lesson/abc", t)).toBe("Lección");
    expect(pageLabelForPath("/lesson/abc/practice", t)).toBe("Práctica de señas");
    expect(pageLabelForPath("/lesson/abc/quiz", t)).toBe("Quiz");
    expect(pageLabelForPath("/quiz/q1", t)).toBe("Quiz");
    expect(pageLabelForPath("/lessons/stage-1", t)).toBe("Lecciones");
  });
});

describe("titleForPath", () => {
  it("prefixes the page name unless it is the app name", () => {
    expect(titleForPath("/", "Aprende Lenguaje de Señas", "Inicio")).toBe(
      "Inicio · Aprende Lenguaje de Señas",
    );
    expect(
      titleForPath("/", "Aprende Lenguaje de Señas", "Aprende Lenguaje de Señas"),
    ).toBe("Aprende Lenguaje de Señas");
  });
});
