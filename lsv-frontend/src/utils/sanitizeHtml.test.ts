import { describe, expect, it } from "vitest";
import { sanitizeLessonHtml } from "./sanitizeHtml";

describe("sanitizeLessonHtml", () => {
  it("strips script tags and event handlers", () => {
    const dirty =
      '<p onclick="alert(1)">Hola</p><script>alert(2)</script><img src=x onerror="alert(3)">';
    const clean = sanitizeLessonHtml(dirty);
    expect(clean).not.toContain("script");
    expect(clean).not.toContain("onclick");
    expect(clean).not.toContain("onerror");
    expect(clean).toContain("Hola");
  });

  it("blocks javascript: URLs in links", () => {
    const dirty = '<a href="javascript:alert(1)">click</a>';
    const clean = sanitizeLessonHtml(dirty);
    expect(clean.toLowerCase()).not.toContain("javascript:");
  });

  it("keeps safe formatting tags", () => {
    const dirty = "<p><strong>Bold</strong> and <em>italic</em></p>";
    expect(sanitizeLessonHtml(dirty)).toContain("<strong>Bold</strong>");
    expect(sanitizeLessonHtml(dirty)).toContain("<em>italic</em>");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeLessonHtml("")).toBe("");
    expect(sanitizeLessonHtml(null)).toBe("");
    expect(sanitizeLessonHtml(undefined)).toBe("");
  });
});
