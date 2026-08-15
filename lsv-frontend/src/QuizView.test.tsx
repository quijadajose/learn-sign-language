import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "./i18n";
import QuizView from "./QuizView";

const getQuizByLesson = vi.fn();
const submitQuiz = vi.fn();
const addToast = vi.fn();

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

vi.mock("./context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("./components/ToastProvider", () => ({
  useToast: () => addToast,
}));

vi.mock("./services/api", () => ({
  unwrapApiList: <T,>(data: T) => data,
  quizApi: {
    getQuizByLesson: (...args: unknown[]) => getQuizByLesson(...args),
    submitQuiz: (...args: unknown[]) => submitQuiz(...args),
  },
}));

const studentQuiz = {
  id: "quiz-1",
  questions: [
    {
      id: "q1",
      text: "¿Qué seña es?",
      options: [
        { id: "o-wrong", text: "Adiós" },
        { id: "o-right", text: "Hola" },
      ],
    },
  ],
};

function renderQuiz() {
  return render(
    <MemoryRouter initialEntries={["/lesson/lesson-1/quiz"]}>
      <Routes>
        <Route path="/lesson/:lessonId/quiz" element={<QuizView />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("QuizView", () => {
  beforeEach(() => {
    getQuizByLesson.mockReset();
    submitQuiz.mockReset();
    addToast.mockReset();
    getQuizByLesson.mockResolvedValue({
      success: true,
      data: [studentQuiz],
    });
  });

  it("loads the student quiz without using isCorrect and submits the chosen option", async () => {
    submitQuiz.mockResolvedValue({
      success: true,
      data: {
        id: "sub-1",
        score: 100,
        submittedAt: "2026-08-13T12:00:00.000Z",
      },
    });

    renderQuiz();

    await screen.findByText(/Qué seña es/);
    expect(document.body.textContent).not.toMatch(/isCorrect/i);

    fireEvent.click(screen.getByLabelText("Hola"));
    fireEvent.click(screen.getByRole("button", { name: "Enviar Quiz" }));

    await waitFor(() => {
      expect(submitQuiz).toHaveBeenCalledWith("quiz-1", [
        { questionId: "q1", optionId: "o-right" },
      ]);
    });

    await screen.findByText("¡Aprobado!");
  });

  it("ignores leaked isCorrect flags if the API payload includes them", async () => {
    getQuizByLesson.mockResolvedValue({
      success: true,
      data: [
        {
          ...studentQuiz,
          questions: [
            {
              id: "q1",
              text: "¿Qué seña es?",
              options: [
                { id: "o-wrong", text: "Adiós", isCorrect: false },
                { id: "o-right", text: "Hola", isCorrect: true },
              ],
            },
          ],
        },
      ],
    });

    renderQuiz();

    await screen.findByText(/Qué seña es/);
    expect(screen.queryByText("true")).toBeNull();
    expect(screen.queryByText("false")).toBeNull();
    expect(screen.getByLabelText("Hola")).toBeTruthy();
    expect(screen.getByLabelText("Adiós")).toBeTruthy();
  });
});
