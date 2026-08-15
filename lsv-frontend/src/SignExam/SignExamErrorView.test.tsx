import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "../i18n";
import SignExamErrorView from "./SignExamErrorView";

describe("SignExamErrorView", () => {
  it("exposes the error as an alert", () => {
    const onGoBack = vi.fn();
    render(
      <SignExamErrorView error="No hay cámara disponible" onGoBack={onGoBack} />,
    );

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/No hay cámara disponible/);
    fireEvent.click(screen.getByRole("button", { name: /Volver a la lección/ }));
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });
});
