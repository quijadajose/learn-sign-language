import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import "./i18n";
import { QuizQuestionsForm } from "./QuizQuestionsForm";

const questions = [
  {
    id: "q1",
    text: "¿Cuál es la seña?",
    options: [
      { id: "o1", text: "Hola" },
      { id: "o2", text: "Adiós" },
    ],
  },
];

describe("QuizQuestionsForm", () => {
  it("does not render answer flags and keeps submit disabled until every question is answered", () => {
    const onSubmit = vi.fn();
    const onAnswerSelect = vi.fn();

    const { rerender } = render(
      <QuizQuestionsForm
        questions={questions}
        answers={[]}
        submitting={false}
        onAnswerSelect={onAnswerSelect}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByRole("group", { name: /Cuál es la seña/ })).toBeTruthy();
    expect(screen.getByText(/Cuál es la seña/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/isCorrect/i);
    expect(
      screen.getByRole("button", { name: "Enviar Quiz" }),
    ).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByLabelText("Hola"));
    expect(onAnswerSelect).toHaveBeenCalledWith("q1", "o1");

    rerender(
      <QuizQuestionsForm
        questions={questions}
        answers={[{ questionId: "q1", optionId: "o1" }]}
        submitting={false}
        onAnswerSelect={onAnswerSelect}
        onSubmit={onSubmit}
      />,
    );

    const submit = screen.getByRole("button", { name: "Enviar Quiz" });
    expect(submit).toHaveProperty("disabled", false);
    fireEvent.click(submit);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
