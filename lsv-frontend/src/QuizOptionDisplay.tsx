import { BACKEND_BASE_URL } from "./config";
import { isImageUrl } from "./utils/isImageUrl";

interface QuizOptionDisplayProps {
  text: string;
  imageClassName?: string;
  textClassName?: string;
}

export function QuizOptionDisplay({
  text,
  imageClassName = "h-16 w-24 rounded border object-cover",
  textClassName = "text-gray-900 dark:text-white",
}: QuizOptionDisplayProps) {
  if (isImageUrl(text)) {
    return (
      <div className="flex items-center gap-3">
        <img
          src={`${BACKEND_BASE_URL}${encodeURI(text)}`}
          alt="Opción"
          className={imageClassName}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span className="text-sm text-gray-500 dark:text-gray-400">Imagen</span>
      </div>
    );
  }

  return <span className={textClassName}>{text}</span>;
}
