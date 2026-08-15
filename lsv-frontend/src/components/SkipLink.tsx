import { useTranslation } from "react-i18next";

export const MAIN_CONTENT_ID = "main-content";

export function SkipLink() {
  const { t } = useTranslation("common");
  return (
    <a
      href={`#${MAIN_CONTENT_ID}`}
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-100 focus:rounded-md focus:bg-primary-700 focus:px-4 focus:py-2 focus:text-white focus:outline-none"
    >
      {t("a11y.skipToContent")}
    </a>
  );
}
