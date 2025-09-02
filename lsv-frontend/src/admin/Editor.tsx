import { useCallback, useEffect, useRef, useState } from "react";
import ReactQuill from "react-quill";

import "react-quill/dist/quill.snow.css";
import { BACKEND_BASE_URL } from "../config";

export interface EditorContentChanged {
  html: string;
  markdown: string;
}

export interface EditorProps {
  value?: string;
  onChange?: (changes: EditorContentChanged) => void;
}

export default function Editor(props: EditorProps) {
  const [value, setValue] = useState<string>(props.value || "");
  const reactQuillRef = useRef<ReactQuill>(null);

  useEffect(() => {
    if (props.value !== value) {
      setValue(props.value || "");
    }
  }, [props.value]);

  const onChange = (content: string) => {
    setValue(content);

    if (props.onChange) {
      props.onChange({
        html: content,
        markdown: content,
      });
    }
  };

  const imageHandler = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      const file = input.files[0];

      const fileExtension = file.name.split(".").pop() || "png";
      const formData = new FormData();
      formData.append("id", crypto.randomUUID());
      formData.append("format", fileExtension);
      formData.append("file", file);

      try {
        const token = localStorage.getItem("auth");
        const response = await fetch(
          `${BACKEND_BASE_URL}/images/upload/lesson`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          },
        );

        if (!response.ok) throw new Error("Upload failed");

        const data: string[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No URLs returned from backend");
        }

        // 👈 prefijar si es ruta relativa
        const rawUrl = data[0];
        const imageUrl = rawUrl.startsWith("http")
          ? rawUrl
          : `${BACKEND_BASE_URL}${rawUrl}`;

        const editor = reactQuillRef.current?.getEditor();
        if (!editor) return;

        const range = editor.getSelection();
        if (range) {
          editor.insertEmbed(range.index, "image", imageUrl, "user");
        } else {
          editor.insertEmbed(editor.getLength() - 1, "image", imageUrl, "user");
        }
      } catch (err) {
        console.error(err);
      }
    };

    input.click();
  }, []);

  return (
    <ReactQuill
      ref={reactQuillRef}
      theme="snow"
      placeholder="Contenido de la lección..."
      modules={{
        toolbar: {
          container: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            [{ indent: "-1" }, { indent: "+1" }],
            ["blockquote", "code-block"],
            ["link", "image"],
          ],
          handlers: {
            image: imageHandler,
          },
        },
        clipboard: {
          matchVisual: false,
        },
      }}
      formats={[
        "header",
        "font",
        "size",
        "bold",
        "italic",
        "underline",
        "strike",
        "blockquote",
        "list",
        "bullet",
        "indent",
        "link",
        "image",
        "video",
        "code-block",
      ]}
      value={value}
      onChange={onChange}
    />
  );
}
