import { describe, expect, it } from "vitest";
import { sanitizeLessonHtml } from "./sanitizeHtml";

describe("sanitizeLessonHtml allowlist", () => {
  it("does not let form controls through (phishing markup)", () => {
    const dirty =
      '<p>Ingresa</p><form action="https://evil.example"><input name="pwd" type="password"><button>Enviar</button></form>';
    const clean = sanitizeLessonHtml(dirty).toLowerCase();
    expect(clean).not.toContain("<form");
    expect(clean).not.toContain("<input");
    expect(clean).not.toContain("<button");
    expect(clean).toContain("ingresa");
  });
});
