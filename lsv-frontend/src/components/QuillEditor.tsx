import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange?: (value: string) => void;
  modules?: any;
  formats?: string[];
  theme?: string;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

export interface QuillEditorRef {
  getEditor: () => any;
}

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

    useImperativeHandle(ref, () => ({
      getEditor: () => quillRef.current?.getEditor(),
    }));

    useEffect(() => {
      // Silenciar warnings y Errores relacionados con findDOMNode y MutationEvent
      const originalConsoleWarn = console.warn;
      const originalConsoleError = console.error;

      console.warn = (...args) => {
        const message = args[0];
        if (
          typeof message === "string" &&
          (message.includes("findDOMNode") ||
            message.includes("DOMNodeInserted") ||
            message.includes("MutationEvent"))
        ) {
          return;
        }
        originalConsoleWarn.apply(console, args);
      };
      if (import.meta.env.DEV) {
        console.error = (...args) => {
          const message = args[0];
          if (
            typeof message === "string" &&
            (message.includes("findDOMNode") ||
              message.includes("DOMNodeInserted") ||
              message.includes("MutationEvent"))
          ) {
            return;
          }
          originalConsoleError.apply(console, args);
        };
      }

      return () => {
        console.warn = originalConsoleWarn;
        console.error = originalConsoleError;
      };
    }, []);

    return (
      <div
        className={`quill-flowbite rounded-md bg-gray-50 dark:bg-gray-700 ${className}`}
      >
        <ReactQuill
          ref={quillRef}
          value={value}
          onChange={onChange}
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
