import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function titleForPath(_pathname: string, appName: string, page: string) {
  return page === appName ? appName : `${page} · ${appName}`;
}

export function pageLabelForPath(
  pathname: string,
  t: (key: string) => string,
): string {
  if (pathname === "/") return t("a11y.pages.home");
  if (pathname === "/login") return t("a11y.pages.login");
  if (pathname === "/register") return t("a11y.pages.register");
  if (pathname === "/forgotPassword") return t("a11y.pages.forgotPassword");
  if (pathname === "/reset-password") return t("a11y.pages.resetPassword");
  if (pathname === "/dashboard") return t("a11y.pages.dashboard");
  if (pathname === "/profile") return t("a11y.pages.profile");
  if (pathname === "/leaderboard") return t("a11y.pages.leaderboard");
  if (pathname.startsWith("/lesson/") && pathname.endsWith("/practice")) {
    return t("a11y.pages.practice");
  }
  if (pathname.startsWith("/lesson/") && pathname.endsWith("/quiz")) {
    return t("a11y.pages.quiz");
  }
  if (pathname.startsWith("/lesson/")) return t("a11y.pages.lesson");
  if (pathname.startsWith("/quiz/")) return t("a11y.pages.quiz");
  if (pathname.startsWith("/lessons/")) return t("a11y.pages.lessons");
  if (pathname.startsWith("/admin/")) return t("a11y.pages.management");
  if (pathname === "/privacy-policy") return t("a11y.pages.privacy");
  if (pathname === "/terms-of-service") return t("a11y.pages.terms");
  return t("appName");
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => {
      document.title = previous;
    };
  }, [title]);
}

export function DocumentTitle() {
  const { pathname } = useLocation();
  const { t } = useTranslation("common");
  const appName = t("appName");
  const page = pageLabelForPath(pathname, t);
  useDocumentTitle(titleForPath(pathname, appName, page));
  return null;
}
