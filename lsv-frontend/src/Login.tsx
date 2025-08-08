import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Checkbox, Label, TextInput } from "flowbite-react";
import { Link } from "react-router-dom";
import { BACKEND_BASE_URL } from "./config";
import { Toast } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";

function Login() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [toastMessages, setToastMessages] = useState<{ id: number; type: "success" | "error"; message: string }[]>([]);
  const navigate = useNavigate();

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    
    if (token || localStorage.getItem("auth")) {
      if(token){
        localStorage.setItem("auth", token);
      }   
      addToast("success", "Inicio de sesion exitoso");
      navigate("/dashboard");
    }
  }, [navigate, token]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
  
      if (response.ok) {
        const json = await response.json();
        localStorage.setItem("auth", json.data.token);
        localStorage.setItem("user", JSON.stringify(json.data.user));
        
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }
        
        addToast("success", "Inicio de sesion exitoso");
        navigate("/dashboard");
      } else {
        const errorData = await response.json();
        addToast("error", errorData.message || "Invalid credentials");
      }
    } catch (error) {
      addToast("error",  "Ha ocurrido un error inesperado");
    }
  }; 

  const handleGoogleLogin = () => {
    window.location.href = `${BACKEND_BASE_URL}/auth/google`;
  };

  return (
    <>
    <div className="fixed right-5 top-5 z-50 flex flex-col gap-3">
            {toastMessages.map((toast) => (
              <Toast key={toast.id}>
                <div
                  className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                    toast.type === "success"
                      ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
                      : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
                  }`}
                >
                  {toast.type === "success" ? <HiCheck className="size-5" /> : <HiX className="size-5" />}
                </div>
                <div className="ml-3 text-sm font-normal">{toast.message}</div>
                <Toast.Toggle onDismiss={() => setToastMessages((prev) => prev.filter((t) => t.id !== toast.id))} />
              </Toast>
            ))}
          </div>
    <section className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6 py-8 dark:bg-gray-900">
      <Link
        to="/"
        className="mb-6 flex items-center text-2xl font-semibold text-gray-900 dark:text-white"
        >
        <img className="mr-2 size-8" src="public/LogoLogin.png" alt="logo" />
        Lenguaje de señas venezolano
      </Link>
      <div className="w-full rounded-lg bg-white shadow sm:max-w-md xl:p-0 dark:border dark:border-gray-700 dark:bg-gray-800">
        <div className="space-y-4 p-6 sm:p-8 md:space-y-6">
          <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
            Iniciar sesión
          </h1>
          <form className="space-y-4 md:space-y-6" onSubmit={handleLogin}>
            <div>
              <Label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                Correo electrónico
              </Label>
              <TextInput
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
            <div>
              <Label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
                >
                Contraseña
              </Label>
              <TextInput
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Checkbox 
                  id="remember" 
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
                <Label
                  htmlFor="remember"
                  className="ml-3 text-sm text-gray-500 dark:text-gray-300"
                  >
                  Recuérdame
                </Label>
              </div>
              <Link
                to="/forgotPassword"
                className="font-medium text-blue-700 no-underline hover:underline dark:text-blue-500"
                >
                ¿Olvidaste la contraseña?
              </Link>
            </div>
            <p className="font-medium text-gray-600 dark:text-gray-400">
              ¿No tienes cuenta?{" "}
              <Link to="/register" className="text-gray-500 hover:underline">
                Registrarse
              </Link>
            </p>
            <Button type="submit" className="w-full px-4 py-2 font-semibold">
              Iniciar sesión
            </Button>
            <Button
              color={"red"}
              type="button"
              className="flex w-full max-w-md items-center justify-center rounded-lg bg-red-600  px-4 py-2 font-semibold text-white hover:bg-red-700"
              onClick={handleGoogleLogin}
              >
              <svg
                width="20"
                height="20"
                fill="currentColor"
                className="mr-2"
                viewBox="0 0 1792 1792"
                >
                <path d="M896 786h725q12 67 12 128 0 217-91 387.5t-259.5 266.5-386.5 96q-157 0-299-60.5t-245-163.5-163.5-245-60.5-299 60.5-299 163.5-245 245-163.5 299-60.5q300 0 515 201l-209 201q-123-119-306-119-129 0-238.5 65t-173.5 176.5-64 243.5 64 243.5 173.5 176.5 238.5 65q87 0 160-24t120-60 82-82 51.5-87 22.5-78h-436v-264z"></path>
              </svg>
              Iniciar sesión con Google
            </Button>
          </form>
        </div>
      </div>
    </section>
                </>
  );
}

export default Login;
