import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import "./i18n";
import LessonView from "./LessonView";

const getUserLesson = vi.fn();
const startLesson = vi.fn();
const getLessonModel = vi.fn();
const addToast = vi.fn();

vi.mock("./context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true }),
}));

vi.mock("./components/ToastProvider", () => ({
  useToast: () => addToast,
}));

vi.mock("./components/QuillEditor", () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="lesson-content">{value}</div>
  ),
}));

vi.mock("./services/api", () => ({
  unwrapApiData: <T,>(data: T) => data,
  lessonApi: {
    getUserLesson: (...args: unknown[]) => getUserLesson(...args),
    startLesson: (...args: unknown[]) => startLesson(...args),
  },
  lessonVariantApi: {
    getRegionalLesson: vi.fn(),
  },
  signRecordApi: {
    getLessonModel: (...args: unknown[]) => getLessonModel(...args),
  },
}));

function renderLesson() {
  return render(
    <MemoryRouter initialEntries={["/lesson/lesson-1"]}>
      <Routes>
        <Route path="/lesson/:lessonId" element={<LessonView />} />
        <Route
          path="/lesson/:lessonId/practice"
          element={<div>practice-page</div>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LessonView", () => {
  beforeEach(() => {
    getUserLesson.mockReset();
    startLesson.mockReset();
    getLessonModel.mockReset();
    addToast.mockReset();
    getUserLesson.mockResolvedValue({
      success: true,
      data: {
        id: "lesson-1",
        name: "Saludos",
        description: "Aprende hola",
        content: "<p>Contenido de la lección</p>",
        stage: {
          id: "s1",
          name: "A1",
          description: "",
          createdAt: "",
          updatedAt: "",
        },
      },
    });
    startLesson.mockResolvedValue({ success: true, data: {} });
  });

  it("starts the lesson and only offers practice when a trusted model is ready", async () => {
    getLessonModel.mockResolvedValue({
      success: true,
      data: {
        static: { modelJsonUrl: "/shared/models/m/model.json" },
        dynamic: null,
      },
    });

    renderLesson();

    await screen.findByText("Saludos");
    expect(startLesson).toHaveBeenCalledWith("lesson-1", undefined);
    expect(screen.getByTestId("lesson-content").textContent).toBe(
      "<p>Contenido de la lección</p>",
    );
    expect(JSON.stringify(getUserLesson.mock.results)).not.toContain(
      "isCorrect",
    );

    fireEvent.click(screen.getByRole("button", { name: /Practiquemos/ }));
    await screen.findByText("practice-page");
  });

  it("hides the camera challenge when there is no published model", async () => {
    getLessonModel.mockResolvedValue({
      success: true,
      data: { static: null, dynamic: null },
    });

    renderLesson();

    await screen.findByText("Saludos");
    expect(screen.queryByRole("button", { name: /Practiquemos/ })).toBeNull();
  });
});
