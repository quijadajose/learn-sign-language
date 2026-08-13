import i18n from "../i18n";

function resolveLocale(): string {
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "es";
  return lang.startsWith("en") ? "en-US" : "es-ES";
}

export function formatDate(
  dateString: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return new Date(dateString).toLocaleDateString(resolveLocale(), options);
}

export function formatDateLong(dateString: string): string {
  return formatDate(dateString, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(dateString: string): string {
  return formatDate(dateString, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
