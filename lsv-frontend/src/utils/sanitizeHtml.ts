import DOMPurify from "dompurify";
import type { Config } from "dompurify";

/** Allowlist for Quill lesson HTML (no scripts, event handlers, or javascript: URLs). */
const LESSON_HTML_CONFIG: Config = {
  USE_PROFILES: { html: true },
  ALLOWED_TAGS: [
    "p",
    "br",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "strong",
    "em",
    "u",
    "s",
    "blockquote",
    "pre",
    "code",
    "ul",
    "ol",
    "li",
    "a",
    "img",
    "sub",
    "sup",
  ],
  ALLOWED_ATTR: [
    "href",
    "target",
    "rel",
    "src",
    "alt",
    "class",
    "style",
    "width",
    "height",
  ],
  ALLOW_DATA_ATTR: false,
  ALLOWED_URI_REGEXP:
    /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ["target"],
};

/**
 * Sanitize rich-text HTML before render or persist.
 * Safe to call with empty/non-string values.
 */
export function sanitizeLessonHtml(dirty: string | null | undefined): string {
  if (!dirty) return "";
  return DOMPurify.sanitize(dirty, LESSON_HTML_CONFIG);
}
