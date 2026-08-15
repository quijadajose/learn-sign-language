import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => (key === "loading" ? "Cargando..." : key),
  }),
}));

describe("LoadingSpinner", () => {
  afterEach(() => {
    cleanup();
  });

  it("exposes a polite status with the default loading label", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status", { name: "Cargando..." })).toBeTruthy();
  });

  it("uses a custom label when provided", () => {
    render(<LoadingSpinner label="Cargando quiz..." />);
    expect(
      screen.getByRole("status", { name: "Cargando quiz..." }),
    ).toBeTruthy();
  });
});
