import { useCallback, useMemo } from "react";
import { BACKEND_BASE_URL } from "../../config";
import { adminApi } from "../../services/api";

export interface QuillConfig {
  modules: Record<string, unknown>;
  formats: string[];
}

export function useQuillConfig(
  addToast: (type: "success" | "error", message: string) => void,
) {
  const imageHandler = useCallback(function (this: {
    quill: import("quill").default;
  }) {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        try {
          const response = await adminApi.uploadLessonImage(
            file,
            crypto.randomUUID(),
          );
          if (
            response.success &&
            response.data &&
            Array.isArray(response.data) &&
            response.data.length > 0
          ) {
            const imageUrl = `${BACKEND_BASE_URL}${response.data[0]}`;
            const quill = this.quill;
            const range = quill.getSelection();
            if (range) {
              quill.insertEmbed(range.index, "image", imageUrl);
              quill.setSelection(range.index + 1);
            }
          } else {
            addToast("error", response.message || "Error al subir la imagen");
          }
        } catch (error) {
          addToast("error", "Error de conexión al subir la imagen");
        }
      }
    };
  }, [addToast]);

  const quillModules = useMemo(
    () => ({
      toolbar: false,
    }),
    [],
  );

  const quillEditModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          ["blockquote", "code-block"],
          ["link", "image"],
          [{ align: [] }],
          ["clean"],
        ],
        handlers: {
          image: imageHandler,
        },
      },
    }),
    [imageHandler],
  );

  const quillFormats = useMemo(
    () => [
      "header",
      "font",
      "size",
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "code-block",
      "list",
      "indent",
      "link",
      "image",
      "align",
    ],
    [],
  );

  const quillConfig: QuillConfig = useMemo(
    () => ({
      modules: quillEditModules,
      formats: quillFormats,
    }),
    [quillEditModules, quillFormats],
  );

  return { quillModules, quillEditModules, quillFormats, quillConfig };
}
