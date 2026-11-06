import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AddSignModal, type AddSignModalProps } from "./AddSignModal";

const baseProps: AddSignModalProps = {
  show: true,
  onClose: vi.fn(),
  newSignName: "",
  onNewSignNameChange: vi.fn(),
  newSignDetectionType: "static",
  onNewSignDetectionTypeChange: vi.fn(),
  isNewSignGlobal: false,
  onIsNewSignGlobalChange: vi.fn(),
  onAddSign: vi.fn(),
  onAddSignsBulk: vi.fn(),
  hasLessonSelected: true,
};

describe("AddSignModal", () => {
  it("clears the bulk draft when the modal is closed and reopened", () => {
    const { rerender } = render(<AddSignModal {...baseProps} />);

    fireEvent.click(screen.getByRole("button", { name: /Varias|Lista/i }));
    const input = screen.getByPlaceholderText(/Hola, Casa/);
    fireEvent.change(input, { target: { value: "A, B" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("A")).toBeTruthy();

    rerender(<AddSignModal {...baseProps} show={false} />);
    rerender(<AddSignModal {...baseProps} show={true} />);
    expect(screen.queryByText("A")).toBeNull();
  });
});
