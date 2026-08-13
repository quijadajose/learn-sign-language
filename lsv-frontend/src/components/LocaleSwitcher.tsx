import { useTranslation } from "react-i18next";
import {
  getUiLocale,
  resetUiLocaleToBrowser,
  setUiLocale,
  type AppLocale,
} from "../i18n";

const OPTIONS: { value: AppLocale; labelKey: "locale.es" | "locale.en" }[] = [
  { value: "es", labelKey: "locale.es" },
  { value: "en", labelKey: "locale.en" },
];

interface LocaleSwitcherProps {
  className?: string;
  compact?: boolean;
  /** Profile-style block with explanation and browser reset. */
  withPreferences?: boolean;
}

export function LocaleSwitcher({
  className = "",
  compact = false,
  withPreferences = false,
}: LocaleSwitcherProps) {
  const { t, i18n } = useTranslation("common");
  const current: AppLocale = i18n.language.startsWith("en") ? "en" : "es";

  const select = (
    <select
      aria-label={t("locale.label")}
      className="rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
      value={current}
      onChange={(e) => {
        void setUiLocale(e.target.value as AppLocale);
      }}
    >
      {OPTIONS.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {t(opt.labelKey)}
        </option>
      ))}
    </select>
  );

  if (withPreferences) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {t("locale.label")}
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t("locale.profileHint")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {select}
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
            onClick={() => {
              void resetUiLocaleToBrowser();
            }}
          >
            {t("locale.useBrowser")}
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {t("locale.current", { language: t(`locale.${getUiLocale()}`) })}
        </p>
      </div>
    );
  }

  return (
    <label
      className={`inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 ${className}`}
    >
      {!compact && <span className="hidden sm:inline">{t("locale.label")}</span>}
      {select}
    </label>
  );
}

export default LocaleSwitcher;
