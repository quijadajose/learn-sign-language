import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "./i18n";
import { optionLetter, QuizOptionDisplay } from "./QuizOptionDisplay";

describe("QuizOptionDisplay", () => {
  it("uses a unique sign-image alt instead of a generic label", () => {
    render(
      <QuizOptionDisplay
        text="/images/quiz/abc.png"
        alt="Imagen de seña, opción B"
        caption="Opción B"
      />,
    );

    expect(screen.getByRole("img").getAttribute("alt")).toBe(
      "Imagen de seña, opción B",
    );
    expect(screen.getByText("Opción B")).toBeTruthy();
    expect(screen.queryByText("Opción")).toBeNull();
  });

  it("marks written option text as CMS language", () => {
    render(<QuizOptionDisplay text="Hola" />);
    expect(screen.getByText("Hola").getAttribute("lang")).toBe("es");
  });

  it("maps option indexes to letters", () => {
    expect(optionLetter(0)).toBe("A");
    expect(optionLetter(1)).toBe("B");
  });
});
