import {
  Button,
  Navbar,
  DarkThemeToggle,
  Footer,
  NavbarBrand,
  NavbarToggle,
  NavbarCollapse,
  NavbarLink,
  FooterBrand,
  FooterLinkGroup,
  FooterLink,
  FooterDivider,
} from "flowbite-react";
import { Link } from "react-router-dom";
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
  return (
    <>
      <Navbar
        fluid
        className="fixed left-0 top-0 z-50 w-full border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90"
      >
        <NavbarBrand>
          <Link to="/" className="flex items-center">
            <img
              src="/logo.svg"
              className="mr-3 h-8 sm:h-10 dark:invert"
              alt="Plataforma Logo"
            />
          </Link>
        </NavbarBrand>
        <div className="flex items-center gap-2 md:order-2">
          <Button color="gray" size="sm" as={Link} to="/login">
            Iniciar sesión
          </Button>
          <Button color="blue" size="sm" as={Link} to="/register">
            Registro
          </Button>
          <div className="ml-2 flex items-center gap-1 border-l border-gray-200 pl-2 dark:border-gray-700">
            <DarkThemeToggle className="hover:bg-gray-100 dark:hover:bg-gray-800" />
            <NavbarToggle />
          </div>
        </div>
        <NavbarCollapse>
          <NavbarLink 
            onClick={() => scrollToSection("about")} 
            className="cursor-pointer font-bold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
            active
          >
            Acerca de
          </NavbarLink>
          <NavbarLink 
            onClick={() => scrollToSection("features")}
            className="cursor-pointer font-bold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
          >
            Características
          </NavbarLink>
          <NavbarLink 
            onClick={() => scrollToSection("collaborate")}
            className="cursor-pointer font-bold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
          >
            Colaborar
          </NavbarLink>
          <NavbarLink 
            onClick={() => scrollToSection("history")}
            className="cursor-pointer font-bold text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white"
          >
            Historia
          </NavbarLink>
        </NavbarCollapse>
      </Navbar>
      <section id="about" className="bg-white pt-24 dark:bg-gray-900">
        <div className="mx-auto grid max-w-screen-xl px-4 py-8 lg:grid-cols-12 lg:gap-8 lg:py-16 xl:gap-0">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="mb-4 max-w-2xl text-4xl font-extrabold leading-none md:text-5xl xl:text-6xl dark:text-white">
              Aprende Lenguaje de Señas
            </h1>
            <p className="mb-6 max-w-2xl font-light text-gray-500 md:text-lg lg:mb-8 lg:text-xl dark:text-gray-400">
              Nuestra plataforma gratuita y online te permite aprender lenguaje de señas de diversos países. Diviértete, practica y comunícate con la comunidad sorda.
            </p>

            <Link
              to="/register"
              className="mr-3 inline-flex items-center justify-center rounded-lg bg-blue-700 px-5 py-3 text-center text-base font-medium text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-900"
            >
              Empieza ahora
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
              Ya tengo una cuenta
            </Link>
          </div>
          <div className="hidden lg:col-span-5 lg:mt-0 lg:flex">
            <img src="/image1.svg" alt="mockup" />
          </div>
        </div>
      </section>

      <section id="features" className="bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-screen-xl px-4 py-8 sm:py-16 lg:px-6">
          <div className="mb-8 max-w-screen-md lg:mb-16">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 dark:text-white">
              ¿Por qué nuestra plataforma?
            </h2>
            <p className="text-gray-500 sm:text-xl dark:text-gray-400">
              Ofrecemos una experiencia integral para aprender y practicar diversos lenguajes de señas de forma fácil.
            </p>
          </div>
          <div className="space-y-8 md:grid md:grid-cols-2 md:gap-12 md:space-y-0 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Registro Sencillo
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Regístrate y accede a todo el contenido. Sigue tu progreso a lo largo de los diferentes niveles.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Multilenguaje
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Accede a lecciones de lenguaje de señas de diferentes países y regiones.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Material Interactivo
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Aprende con videos, ejercicios prácticos y evaluaciones que te ayudarán a consolidar tus conocimientos.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Evaluación Continua
              </h3>
              
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Ranking y Motivación
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Compite amistosamente con otros usuarios, sube en el ranking y mantén la motivación para seguir aprendiendo.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="collaborate" className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-screen-xl px-4 py-8 lg:px-6 lg:py-16">
          <div className="mx-auto max-w-screen-sm text-center">
            <h2 className="mb-4 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white">
              ¿Quieres agregar un nuevo idioma?
            </h2>
            <p className="mb-6 font-light text-gray-500 md:text-lg dark:text-gray-400">
              Nuestra plataforma está creciendo. Si representas a una escuela, asociación o eres un experto que desea cargar lecciones de lenguaje de señas de tu país, ¡queremos colaborar contigo!
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:justify-center sm:space-x-4 sm:space-y-0">
              <Button
                color="blue"
                size="lg"
                href="mailto:quijadajose@gmail.com" // Placeholder or actual email
              >
                Contactar por Correo
              </Button>
              <Button
                color="gray"
                size="lg"
                href="https://github.com/quijadajose/learn-sign-language/issues"
              >
                Ver Panel de Issues
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer container>
        <div className="w-full text-center">
          <div className="w-full justify-between sm:flex sm:items-center sm:justify-between">
            <FooterBrand src="/logo.svg" alt="Logo" name="Plataforma de Señas" className="dark:invert" />
            <FooterLinkGroup>
              <FooterLink href="https://github.com/quijadajose/learn-sign-language">
                Github
              </FooterLink>
              <FooterLink href="#" onClick={() => scrollToSection("collaborate")} className="cursor-pointer">
                Colaborar
              </FooterLink>
            </FooterLinkGroup>
          </div>
          <FooterDivider />
        </div>
      </Footer>
    </>
  );
}
