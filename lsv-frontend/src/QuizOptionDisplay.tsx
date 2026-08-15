import { useTranslation } from "react-i18next";
import { BACKEND_BASE_URL } from "./config";
import { CMS_CONTENT_LANG } from "./i18n";
import { isImageUrl } from "./utils/isImageUrl";

export function optionLetter(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

interface QuizOptionDisplayProps {
  text: string;
  alt?: string;
  caption?: string;
  imageClassName?: string;
  textClassName?: string;
}

export function QuizOptionDisplay({
  text,
  alt,
  caption,
  imageClassName = "h-16 w-24 rounded border object-cover",
  textClassName = "text-gray-900 dark:text-white",
}: QuizOptionDisplayProps) {
  const { t } = useTranslation("learn");

  if (isImageUrl(text)) {
    const imageAlt = alt ?? t("quiz.signImage");
    const imageCaption = caption ?? t("quiz.signImage");
    return (
      <div className="flex items-center gap-3">
        <img
          src={`${BACKEND_BASE_URL}${encodeURI(text)}`}
          alt={imageAlt}
          className={imageClassName}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span aria-hidden="true" className="text-sm text-gray-500 dark:text-gray-400">
          {imageCaption}
        </span>
      </div>
    );
  }

  return (
    <span lang={CMS_CONTENT_LANG} className={textClassName}>
      {text}
    </span>
  );
}
