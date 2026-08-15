import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MAIN_CONTENT_ID, SkipLink } from "./SkipLink";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) =>
      key === "a11y.skipToContent" ? "Saltar al contenido principal" : key,
  }),
}));

describe("SkipLink", () => {
  it("points at the main content landmark", () => {
    render(<SkipLink />);
    const link = screen.getByRole("link", {
      name: "Saltar al contenido principal",
    });
    expect(link.getAttribute("href")).toBe(`#${MAIN_CONTENT_ID}`);
    expect(MAIN_CONTENT_ID).toBe("main-content");
  });
});
