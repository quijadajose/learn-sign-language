import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEs from "./locales/es/common.json";
import authEs from "./locales/es/auth.json";
import navEs from "./locales/es/nav.json";
import landingEs from "./locales/es/landing.json";

import commonEn from "./locales/en/common.json";
import authEn from "./locales/en/auth.json";
import navEn from "./locales/en/nav.json";
import landingEn from "./locales/en/landing.json";

export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: AppLocale = "es";
export const LOCALE_STORAGE_KEY = "lsv.uiLocale";

function syncDocumentLang(locale: string) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale.startsWith("en") ? "en" : "es";
  }
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: commonEs,
        auth: authEs,
        nav: navEs,
        landing: landingEs,
      },
      en: {
        common: commonEn,
        auth: authEn,
        nav: navEn,
        landing: landingEn,
      },
    },
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    defaultNS: "common",
    ns: ["common", "auth", "nav", "landing"],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
      caches: ["localStorage"],
    },
  })
  .then(() => {
    syncDocumentLang(i18n.resolvedLanguage ?? DEFAULT_LOCALE);
  });

i18n.on("languageChanged", syncDocumentLang);

export function getUiLocale(): AppLocale {
  const lang = i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LOCALE;
  return lang.startsWith("en") ? "en" : "es";
}

export function setUiLocale(locale: AppLocale): Promise<unknown> {
  return i18n.changeLanguage(locale);
}

/** Clears the saved preference and follows the browser language again. */
export function resetUiLocaleToBrowser(): Promise<unknown> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LOCALE_STORAGE_KEY);
  }

  const raw = (
    typeof navigator !== "undefined" ? navigator.language : DEFAULT_LOCALE
  ).toLowerCase();
  const locale: AppLocale = raw.startsWith("en") ? "en" : "es";
  return i18n.changeLanguage(locale);
}

export default i18n;
