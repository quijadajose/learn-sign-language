import { Button, Navbar, DarkThemeToggle, Footer } from "flowbite-react";
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
        rounded
        className="fixed left-0 top-0 z-50 w-full bg-white shadow-md"
      >
        <Navbar.Brand>
          <img
            src="public/LogoLogin.png"
            className="mr-3 h-6 sm:h-9"
            alt="LSV Logo"
          />
          <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white"></span>
        </Navbar.Brand>
        <div className="flex space-x-2 md:order-2">
          <Button color="gray">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button color="blue">
            <Link to="/register">Registro</Link>
          </Button>
          <DarkThemeToggle />
          <Navbar.Toggle />
        </div>
        <Navbar.Collapse>
          <Navbar.Link onClick={() => scrollToSection("about")} active>
            Acerca de
          </Navbar.Link>
          <Navbar.Link onClick={() => scrollToSection("why")}>
            ¿Por qué LSV?
          </Navbar.Link>
          <Navbar.Link onClick={() => scrollToSection("history")}>
            Historia del proyecto
          </Navbar.Link>
        </Navbar.Collapse>
      </Navbar>
      <section id="about" className="bg-white dark:bg-gray-900">
        <div className="mx-auto grid max-w-screen-xl px-4 py-8 lg:grid-cols-12 lg:gap-8 lg:py-16 xl:gap-0">
          <div className="mr-auto place-self-center lg:col-span-7">
            <h1 className="mb-4 max-w-2xl text-4xl font-extrabold leading-none md:text-5xl xl:text-6xl dark:text-white">
              Aprende lenguaje de señas venezolano
            </h1>
            <p className="mb-6 max-w-2xl font-light text-gray-500 md:text-lg lg:mb-8 lg:text-xl dark:text-gray-400">
              Aprende lenguaje de señas venezolano con esta aplicación gratis y
              online. Diviértete, practica y comunícate con la comunidad sorda y
              sordomuda de Venezuela.
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
            <img src="public/image1.svg" alt="mockup" />
          </div>
        </div>
      </section>
      <section id="why" className="bg-gray-50 dark:bg-gray-800">
        <div className="mx-auto max-w-screen-xl px-4 py-8 sm:py-16 lg:px-6">
          <div className="mb-8 max-w-screen-md lg:mb-16">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 dark:text-white">
              ¿Por qué LSV?
            </h2>
            <p className="text-gray-500 sm:text-xl dark:text-gray-400">
              LSV es una aplicación web y móvil que te permite aprender y
              practicar el lenguaje de señas venezolano de forma fácil,
              divertida y eficaz.
            </p>
          </div>
          <div className="space-y-8 md:grid md:grid-cols-2 md:gap-12 md:space-y-0 lg:grid-cols-3">
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Registro Crea tu cuenta y accede a LSV.
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Regístrate y recupera tu contraseña de forma segura y rápida, y
                disfruta de la mejor aplicación para aprender y practicar
                lenguaje de señas venezolano.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Administración Gestiona los idiomas y las lecciones de LSV
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Accede a un panel de administración donde podrás añadir,
                eliminar y actualizar idiomas y lecciones, agrupados en etapas y
                niveles del MCER.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Selección Elige el idioma y el nivel que más te convenga
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Accede a un panel de selección de lecciones donde podrás ver las
                lecciones disponibles, con videos, ejercicios y material de
                apoyo.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Evaluación Realiza pruebas de conocimiento
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Accede a un panel de evaluación donde podrás comprobar tu nivel
                y tu progreso.
              </p>
            </div>
            <div>
              <h3 className="mb-2 text-xl font-bold dark:text-white">
                Ranking Compara tu ranking y el de otros usuarios
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Accede a una tabla de posiciones donde podrás ver tu puntuación
                y la de otros usuarios según tu nivel y progreso, y retarte a ti
                mismo y a otros.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="history" className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-screen-xl items-center gap-16 px-4 py-8 lg:grid lg:grid-cols-2 lg:px-6 lg:py-16">
          <div className="font-light text-gray-500 sm:text-lg dark:text-gray-400">
            <h2 className="mb-4 text-4xl font-extrabold text-gray-900 dark:text-white">
              Historia del proyecto
            </h2>
            <p className="mb-4">
              La idea de aprender la lengua de señas siempre me acompañó desde
              la infancia, porque muchos compañeros de clase la practicaban
              porque ellos o sus familiares tenían problemas de habla y/o
              audición, y la lengua de señas me llamaba la atención, pero no
              había muchos lugares donde la enseñaran. Cuando comencé la
              universidad, me di cuenta de que con los conocimientos que iba a
              aprender podría hacer algo para facilitar la educación de la
              lengua de señas venezolana. Pero no fue hasta que una asignatura
              nos asignó la realización de un sistema innovador y, sin dudarlo,
              pensé en hacer ese proyecto que quería hacer desde hace tanto
              tiempo.
            </p>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <img
              className="w-full rounded-lg"
              src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/office-long-2.png"
              alt="office content 1"
            />
            <img
              className="mt-4 w-full rounded-lg lg:mt-10"
              src="https://flowbite.s3.amazonaws.com/blocks/marketing-ui/content/office-long-1.png"
              alt="office content 2"
            />
          </div>
        </div>
      </section>
      <Footer container>
        <Footer.Brand src="public/LogoLogin.png" alt="LSV Logo" />
        <Footer.LinkGroup>
          <Footer.Link href="https://github.com/quijadajose/LSV/">
            Github
          </Footer.Link>
        </Footer.LinkGroup>
      </Footer>
    </>
  );
}
