import {
  Navbar,
  NavbarBrand,
  DarkThemeToggle,
  Footer,
  FooterBrand,
  Button,
} from "flowbite-react";
import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
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
          Política de Privacidad
        </h1>
        
        <p className="mb-6 text-lg text-gray-600 dark:text-gray-400">
          Esta política describe cómo manejamos tu información personal.
        </p>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            1. Información que recopilamos
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Recopilamos información básica necesaria para el correcto funcionamiento de la plataforma:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-400">
            <li><strong>Mediante Autenticación de Google:</strong> Correo electrónico, nombre, apellido e ID único de Google.</li>
            <li><strong>Mediante Registro Directo:</strong> Correo electrónico y una contraseña definida por ti.</li>
            <li><strong>Proporcionada por ti:</strong> Edad y preferencia de lateralidad (mano dominante).</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            2. Uso de la información
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Utilizamos tus datos exclusivamente para los siguientes propósitos:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-400">
            <li>Autenticar tu acceso a la plataforma de forma segura.</li>
            <li>Personalizar tu perfil y mostrar tu información básica al iniciar sesión.</li>
            <li><strong>Protección de menores:</strong> Utilizamos el dato de la edad para filtrar el contenido de las lecciones, asegurando que las palabras mostradas sean apropiadas según tu grupo de edad.</li>
            <li>Mejorar tu experiencia de aprendizaje adaptando el contenido a tu mano dominante.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            3. Base Legal del Tratamiento
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Tratamos tus datos personales basándonos en tu <strong>consentimiento</strong> (otorgado al registrarte con tu cuenta de Google o al crear una cuenta directa) y en la <strong>necesidad técnica</strong> de procesar tu información para prestarte el servicio solicitado.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            4. Compartición de datos
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            <strong>No vendemos, alquilamos ni compartimos</strong> tus datos personales con terceros para fines comerciales. Tu información personal se utiliza únicamente dentro de los límites de nuestra propia infraestructura para brindarte el servicio.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            5. Seguridad y Almacenamiento
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Implementamos medidas de seguridad robustas para proteger tus datos:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-400">
            <li>Toda la comunicación entre tu navegador y nuestro servidor se realiza bajo el protocolo cifrado <strong>HTTPS (TLS)</strong>.</li>
            <li><strong>Seguridad de Contraseñas:</strong> No almacenamos contraseñas en texto claro. Si utilizas el registro directo, tu contraseña se cifra mediante un algoritmo de hash irreversible <strong>bcrypt</strong> antes de guardarse en nuestra base de datos.</li>
            <li>No almacenamos tus credenciales de Google; la autenticación se gestiona directamente con Google.</li>
            <li>Usamos <strong>JSON Web Tokens (JWT)</strong> almacenados en el <strong>localStorage</strong> de tu navegador exclusivamente para mantener tu sesión activa de forma segura.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            6. Servicios de Terceros y Transferencia de Datos
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Para ofrecerte una experiencia segura y estable, integramos servicios de proveedores externos:
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-600 dark:text-gray-400">
            <li><strong>Google Authentication:</strong> Lo utilizamos para gestionar tu inicio de sesión de forma segura y simplificada.</li>
            <li><strong>Sentry:</strong> Herramienta de monitoreo técnico que nos ayuda a detectar y corregir errores en tiempo real (recopila metadatos técnicos y tu dirección IP).</li>
          </ul>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            <strong>Nota sobre Transferencia Internacional:</strong> Al utilizar estos servicios, tus datos pueden ser procesados en servidores ubicados fuera de tu país de origen, principalmente en <strong>Estados Unidos</strong>, bajo estrictas medidas de seguridad y privacidad.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
            7. Tus derechos y eliminación de cuenta
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Tienes derecho a acceder, rectificar o eliminar tus datos en cualquier momento.
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Si deseas eliminar tu cuenta y todos tus datos asociados de forma permanente, envía un correo a <strong>quijadajosed@gmail.com</strong>. Procesaremos tu solicitud en un plazo máximo de <strong>72 horas</strong>.
          </p>
        </section>

        <section className="mb-10 text-sm text-gray-500 dark:text-gray-500">
          <p>Última actualización: 19 de marzo de 2026</p>
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
              <Link to="/terms-of-service" className="text-gray-500 hover:underline dark:text-gray-400">
                Condiciones del Servicio
              </Link>
            </div>
          </div>
        </div>
      </Footer>
    </div>
  );
}
