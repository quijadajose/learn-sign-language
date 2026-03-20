import {
  Navbar,
  NavbarBrand,
  DarkThemeToggle,
  Footer,
  FooterBrand,
  Button,
} from "flowbite-react";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <Navbar
        fluid
        className="fixed left-0 top-0 z-50 w-full border-b border-gray-200 bg-white/90 shadow-sm backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/90"
      >
        <NavbarBrand>
          <Link to="/" className="flex items-center">
            <img
              src="/logo.svg"
              className="mr-3 h-8 dark:invert sm:h-10"
              alt="Plataforma Logo"
            />
            <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
              Aprende lenguaje de señas
            </span>
          </Link>
        </NavbarBrand>
        <div className="flex items-center gap-2 md:order-2">
          <Button color="blue" size="sm" as={Link} to="/">
            Volver al inicio
          </Button>
          <DarkThemeToggle className="ml-2 hover:bg-gray-100 dark:hover:bg-gray-800" />
        </div>
      </Navbar>

      <main className="mx-auto max-w-4xl flex-grow px-4 pb-16 pt-32 lg:px-6">
        <h1 className="mb-8 text-3xl font-extrabold text-gray-900 dark:text-white md:text-4xl">
          Condiciones del Servicio
        </h1>
        
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
          Bienvenido a nuestra plataforma de aprendizaje de lenguaje de señas. Al acceder o utilizar nuestro sitio web, aceptas estar sujeto a estas condiciones.
        </p>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            1. Aceptación de los Términos
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Al registrarte y utilizar esta plataforma, confirmas que has leído, entendido y aceptado cumplir con estos Términos de Servicio y nuestra Política de Privacidad.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            2. Descripción del Servicio
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Nuestra plataforma ofrece herramientas educativas para el aprendizaje de lenguaje de señas mediante lecciones interactivas, cuestionarios y seguimiento de progreso. Nos reservamos el derecho de modificar, suspender o interrumpir cualquier aspecto del servicio en cualquier momento.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            3. Registro y Cuentas de Usuario
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Para acceder a ciertas funciones, deberás registrarte utilizando tu cuenta de Google o mediante un formulario de registro. Eres responsable de:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-400">
            <li>Mantener la confidencialidad de tu cuenta y contraseña.</li>
            <li>Todas las actividades que ocurran bajo tu cuenta.</li>
            <li>Proporcionar información veraz y actualizada (edad, lateralidad, etc.) para el correcto funcionamiento de los filtros de contenido.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            4. Uso Permitido y Conducta
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Te comprometes a utilizar la plataforma de manera ética y legal. Está estrictamente prohibido:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-400">
            <li>Intentar vulnerar la seguridad del sitio.</li>
            <li>Extraer contenido de forma automatizada (scraping) sin autorización.</li>
            <li>Utilizar la plataforma para fines comerciales no autorizados o envío de spam.</li>
            <li>Acosar, insultar o difamar a otros usuarios o administradores.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            6. Limitación de Responsabilidad
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            La plataforma se proporciona "tal cual" y "según disponibilidad". No garantizamos que el servicio sea ininterrumpido o libre de errores. No nos hacemos responsables de pérdidas directas o indirectas derivadas del uso de la plataforma.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            7. Modificaciones a las Condiciones
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Podemos actualizar estas condiciones ocasionalmente. Te notificaremos cualquier cambio sustancial mediante un aviso en la plataforma o por correo electrónico. El uso continuado del servicio tras dichas modificaciones implica la aceptación de los nuevos términos.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            8. Contacto
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Si tienes dudas sobre estas condiciones, puedes contactarnos en: <strong>quijadajosed@gmail.com</strong>
          </p>
        </section>

        <section className="mb-10 text-sm text-gray-500 dark:text-gray-500">
          <p>Última actualización: 20 de marzo de 2026</p>
        </section>
      </main>

      <Footer container>
        <div className="w-full text-center">
          <div className="w-full justify-between sm:flex sm:items-center sm:justify-between">
            <FooterBrand
              src="/logo.svg"
              alt="Logo"
              className="dark:invert"
            />
            <div className="flex gap-4">
              <Link to="/" className="text-gray-500 hover:underline dark:text-gray-400">
                Inicio
              </Link>
              <Link to="/privacy-policy" className="text-gray-500 hover:underline dark:text-gray-400">
                Política de Privacidad
              </Link>
            </div>
          </div>
        </div>
      </Footer>
    </div>
  );
}
