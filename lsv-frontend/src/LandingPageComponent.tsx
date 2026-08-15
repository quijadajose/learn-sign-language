import {
  Button,
  Navbar,
  DarkThemeToggle,
  Footer,
  NavbarToggle,
  NavbarCollapse,
  NavbarLink,
  FooterBrand,
  FooterDivider,
} from "flowbite-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MAIN_CONTENT_ID } from "./components/SkipLink";

const scrollToSection = (id: string) => {
  const section = document.getElementById(id);
  if (section) {
    window.scrollTo({
      top: section.offsetTop,
      behavior: "smooth",
    });
  }
};

export default function LandingPageComponent() {
  const { t } = useTranslation(["landing", "common"]);

  return (
    <>
      <Navbar
        fluid
        className="fixed left-0 top-0 z-50 w-full border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90"
      >
        <Link to="/" className="flex items-center" aria-label={t("common:a11y.home")}>
          <img
            src="/logo.svg"
            className="mr-3 h-8 dark:invert sm:h-10"
            alt=""
          />
        </Link>
        <div className="flex items-center gap-2 md:order-2">
          <Button color="gray" size="sm" as={Link} to="/login">
            {t("nav.login")}
          </Button>
          <Button color="blue" size="sm" as={Link} to="/register">
            {t("nav.register")}
          </Button>
          <div className="ml-2 flex items-center gap-1 border-l border-gray-200 pl-2 dark:border-gray-700">
            <DarkThemeToggle
              className="hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label={t("common:a11y.toggleTheme")}
            />
            <NavbarToggle />
          </div>
        </div>
        <NavbarCollapse>
          <NavbarLink
            onClick={() => scrollToSection("about")}
            className="cursor-pointer font-bold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
            active
          >
            {t("nav.about")}
          </NavbarLink>
          <NavbarLink
            onClick={() => scrollToSection("features")}
            className="cursor-pointer font-bold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
          >
            {t("nav.features")}
          </NavbarLink>
          <NavbarLink
            onClick={() => scrollToSection("collaborate")}
            className="cursor-pointer font-bold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
          >
            {t("nav.collaborate")}
          </NavbarLink>
        </NavbarCollapse>
      </Navbar>
      <main id={MAIN_CONTENT_ID}>
      <section id="about" className="bg-white pt-24 dark:bg-gray-900">
        <div className="mx-auto grid max-w-screen-xl px-4 py-8 lg:grid-cols-12 lg:gap-8 lg:py-16 xl:gap-0">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="mb-4 max-w-2xl text-4xl font-extrabold leading-none dark:text-white md:text-5xl xl:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mb-6 max-w-2xl font-light text-gray-500 dark:text-gray-400 md:text-lg lg:mb-8 lg:text-xl">
              {t("hero.subtitle")}
            </p>

            <Link
              to="/register"
              className="mr-3 inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-center text-base font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              {t("hero.ctaStart")}
              <svg
                className="-mr-1 ml-2 size-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-5 py-3 text-center text-base font-medium text-gray-900 hover:bg-gray-100 focus:ring-4 focus:ring-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 dark:focus:ring-gray-800"
            >
              {t("hero.ctaAccount")}
            </Link>
          </div>
          <div className="hidden lg:col-span-5 lg:mt-0 lg:flex">
            <img src="/image1.svg" alt={t("hero.mockupAlt")} />
          </div>
        </div>
      </section>

      <section id="features" className="bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-screen-xl px-4 py-8 sm:py-16 lg:px-6">
          <div className="mb-8 max-w-screen-md lg:mb-16">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 dark:text-white">
              {t("features.title")}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 sm:text-xl">
              {t("features.subtitle")}
            </p>
          </div>
          <div className="space-y-8 md:grid md:grid-cols-2 md:gap-12 md:space-y-0 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                {t("features.easySignup.title")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t("features.easySignup.body")}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                {t("features.multilang.title")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t("features.multilang.body")}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                {t("features.interactive.title")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t("features.interactive.body")}
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                {t("features.evaluation.title")}
              </h3>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                {t("features.ranking.title")}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t("features.ranking.body")}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="collaborate" className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
          <div className="mx-auto max-w-screen-sm text-center">
            <h2 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
              {t("collaborate.title")}
            </h2>
            <p className="mb-6 font-light text-gray-500 dark:text-gray-400 md:text-lg">
              {t("collaborate.body")}
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
              <Button
                color="blue"
                size="lg"
                href="mailto:quijadajose@gmail.com"
              >
                {t("collaborate.email")}
              </Button>
              <Button
                color="gray"
                size="lg"
                href="https://github.com/quijadajose/learn-sign-language/issues"
              >
                {t("collaborate.issues")}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer container>
        <div className="w-full text-center">
          <div className="w-full justify-between sm:flex sm:items-center sm:justify-between">
            <FooterBrand
              src="/logo.svg"
              alt={t("footer.logoAlt")}
              name={t("footer.brand")}
              className="dark:invert"
            />
            <a
              href="https://github.com/quijadajose/learn-sign-language"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              {t("footer.collaborate")}
            </a>
            <a
              href="https://stats.uptimerobot.com/n46WRvlnZD"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              {t("footer.status")}
            </a>
            <Link
              to="/privacy-policy"
              className="text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              to="/terms-of-service"
              className="text-sm text-gray-500 hover:underline dark:text-gray-400"
            >
              {t("footer.terms")}
            </Link>
          </div>
          <FooterDivider />
        </div>
      </Footer>
      </main>
    </>
  );
}
