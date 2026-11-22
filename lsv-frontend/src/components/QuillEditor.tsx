import {
  useRef,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useCallback,
} from "react";
import ReactQuill, { Quill } from "react-quill-new";
import type { QuillOptions } from "quill";
import "react-quill-new/dist/quill.snow.css";
import "../styles/quill-flowbite.css";
import { sanitizeLessonHtml } from "../utils/sanitizeHtml";

interface QuillEditorProps {
  value: string;
  onChange?: (value: string) => void;
  modules?: QuillOptions["modules"];
  formats?: string[];
  theme?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export interface QuillEditorRef {
  getEditor: () => Quill | undefined;
}

/**
 * Quill's HTML (esp. getSemanticHTML) is not byte-identical to DOMPurify output.
 * Feeding sanitized HTML back as a controlled `value` makes react-quill call
 * setContents → onChange → setState → setContents in a loop ("Maximum update
 * depth exceeded"). Keep Quill's last HTML when it sanitizes to the same string
 * as the parent value, and only propagate user-originated edits.
 */
const QuillEditor = forwardRef<QuillEditorRef, QuillEditorProps>(
  (
    {
      value,
      onChange,
      modules,
      formats,
      theme = "snow",
      placeholder,
      readOnly = false,
      className = "",
    },
    ref,
  ) => {
    const quillRef = useRef<ReactQuill>(null);
    const lastQuillHtmlRef = useRef<string | null>(null);
    // FE-12: la versión saneada de la última salida de Quill se calcula una sola vez, al recibirla.
    const lastSanitizedRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current?.getEditor(),
    }));

    const safeValue = useMemo(() => sanitizeLessonHtml(value), [value]);

    const editorValue = useMemo(() => {
      const last = lastQuillHtmlRef.current;
      if (last !== null && lastSanitizedRef.current === safeValue) {
        return last;
      }
      return safeValue;
    }, [safeValue]);

    const handleChange = useCallback(
      (next: string, _delta: unknown, source: string) => {
        const sanitized = sanitizeLessonHtml(next);
        lastQuillHtmlRef.current = next;
        lastSanitizedRef.current = sanitized;
        // Ignore programmatic setContents from react-quill's controlled updates.
        if (source !== "user") return;
        if (sanitized === value) return;
        onChange?.(sanitized);
      },
      [onChange, value],
    );

    return (
      <div
        className={
          className.includes("quill-seamless")
            ? `quill-flowbite ${className}`
            : `quill-flowbite rounded-md bg-gray-50 dark:bg-gray-700 ${className}`
        }
      >
        <ReactQuill
          ref={quillRef}
          value={editorValue}
          onChange={readOnly ? undefined : handleChange}
          modules={modules}
          formats={formats}
          theme={theme}
          placeholder={placeholder}
          readOnly={readOnly}
        />
      </div>
    );
  },
);

QuillEditor.displayName = "QuillEditor";

export default QuillEditor;
