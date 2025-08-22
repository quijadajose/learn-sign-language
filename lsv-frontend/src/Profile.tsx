import React, { useEffect, useState } from "react";
import { Button, TextInput, Card, Label, Spinner, Toast } from "flowbite-react";
import { HiCheck, HiX } from "react-icons/hi";
import { BACKEND_BASE_URL } from "./config";
import { useNavigate } from "react-router-dom";

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  createdAt: string;
  age: number;
  isRightHanded: boolean;
  role: string;
  photo?: string;
}

export const ResponsiveProfileForm = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const [toastMessages, setToastMessages] = useState<
    { id: number; type: "success" | "error"; message: string }[]
  >([]);

  const addToast = (type: "success" | "error", message: string) => {
    const id = Date.now();
    setToastMessages((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToastMessages((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("auth");

      if (!token || token === "undefined") {
        setError("Authentication token not found. Please log in again.");
        addToast("error", "No estás autenticado. Redirigiendo al login...");
        setLoading(false);
        setTimeout(() => navigate("/login"), 3000);
        return;
      }

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser: UserProfile = JSON.parse(storedUser);
          if (parsedUser && parsedUser.id && parsedUser.email) {
            setProfile(parsedUser);
            setLoading(false);
            return;
          } else {
            console.warn("Stored user data is invalid. Fetching from backend.");
            localStorage.removeItem("user");
          }
        } catch (parseError) {
          console.error(
            "Failed to parse user data from localStorage:",
            parseError,
          );
          localStorage.removeItem("user");
        }
      }

      try {
        const response = await fetch(`${BACKEND_BASE_URL}/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data: UserProfile = await response.json();
          setProfile(data);
          localStorage.setItem("user", JSON.stringify(data));
        } else {
          const errorData = await response.text();
          setError(`Failed to fetch profile: ${response.statusText}`);
          addToast(
            "error",
            `Error al cargar el perfil: ${errorData || response.statusText}`,
          );
        }
      } catch (fetchError: any) {
        console.error("Error fetching profile data:", fetchError);
        setError("An unexpected error occurred while fetching profile data.");
        addToast("error", "Ocurrió un error inesperado al cargar tu perfil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [navigate]);

  useEffect(() => {
    if (!profile) return;

    if (newPhotoFile) {
      const objectUrl = URL.createObjectURL(newPhotoFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      const imageUrl = `${BACKEND_BASE_URL}/images/user/${profile.id}?size=lg&v=${Date.now()}`;
      setPreview(imageUrl);
    }
  }, [newPhotoFile, profile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewPhotoFile(e.target.files[0]);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    if (!profile) return;
    const { name, value, type } = e.target;
    const isCheckbox = type === "checkbox";
    const checked = isCheckbox
      ? (e.target as HTMLInputElement).checked
      : undefined;

    setProfile((prev) => ({
      ...(prev as UserProfile),
      [name]: isCheckbox ? checked : value,
    }));
  };

  const handleSave = async () => {
    if (!profile) {
      addToast(
        "error",
        "No se pueden guardar los cambios, los datos del perfil no están cargados.",
      );
      return;
    }

    const token = localStorage.getItem("auth");
    if (!token || token === "undefined") {
      addToast(
        "error",
        "No estás autenticado. Por favor, inicia sesión de nuevo.",
      );
      return;
    }

    setLoading(true);

    try {
      const { currentPassword, newPassword, confirmPassword } = profile;

      const profileUpdateBody: any = {
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        age: Number(profile.age),
        isRightHanded: profile.isRightHanded,
      };

      const isPasswordBeingUpdated =
        currentPassword || newPassword || confirmPassword;

      if (isPasswordBeingUpdated) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          addToast(
            "error",
            "Por favor completa todos los campos de contraseña para cambiarla.",
          );
          setLoading(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          addToast(
            "error",
            "La nueva contraseña y su confirmación no coinciden.",
          );
          setLoading(false);
          return;
        }

        profileUpdateBody.oldPassword = currentPassword;
        profileUpdateBody.newPassword = newPassword;
      }

      const userResponse = await fetch(`${BACKEND_BASE_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileUpdateBody),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        console.error("User update failed:", errorData);
        addToast(
          "error",
          `Error al actualizar perfil: ${errorData.message || userResponse.statusText}`,
        );
        throw new Error(
          `User update failed: ${errorData.message || userResponse.statusText}`,
        );
      }

      let updatedProfileData = await userResponse.json();

      if (newPhotoFile) {
        const formData = new FormData();
        if (!updatedProfileData?.id) {
          throw new Error("User ID missing after profile update.");
        }
        formData.append("id", updatedProfileData.id);
        formData.append("format", "png");
        formData.append("file", newPhotoFile);

        const imageResponse = await fetch(
          `${BACKEND_BASE_URL}/images/upload/user`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (!imageResponse.ok) {
          const errorData = await imageResponse.text();
          console.error("Image upload failed:", errorData);
          addToast(
            "error",
            `Error al subir la foto: ${errorData || imageResponse.statusText}`,
          );
        } else {
          updatedProfileData = {
            ...updatedProfileData,
            photo: `/images/user/${updatedProfileData.id}?v=${Date.now()}`,
          };
          setPreview(
            `${BACKEND_BASE_URL}/images/user/${updatedProfileData.id}?size=lg&v=${Date.now()}`,
          );
          addToast("success", "Foto de perfil actualizada.");
        }
      }

      const finalProfileData = {
        ...updatedProfileData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      };
      setProfile(finalProfileData);
      localStorage.setItem("user", JSON.stringify(finalProfileData));
      setIsEditing(false);
      setNewPhotoFile(null);
      addToast("success", "Perfil actualizado correctamente.");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      if (!toastMessages.some((t) => t.type === "error")) {
        addToast(
          "error",
          `Error al guardar el perfil: ${error.message || "Ocurrió un error inesperado."}`,
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex min-h-[calc(100vh-100px)] items-center justify-center">
        <Spinner size="xl" aria-label="Loading profile data..." />
        <span className="pl-3">Loading profile...</span>
      </div>
    );
  }

  if (error) {
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
                {toast.type === "success" ? (
                  <HiCheck className="size-5" />
                ) : (
                  <HiX className="size-5" />
                )}
              </div>
              <div className="ml-3 text-sm font-normal">{toast.message}</div>
              <Toast.Toggle
                onDismiss={() =>
                  setToastMessages((prev) =>
                    prev.filter((t) => t.id !== toast.id),
                  )
                }
              />
            </Toast>
          ))}
        </div>
        <div className="container mx-auto px-4 pt-2 text-center text-red-600 dark:text-red-400">
          <p>Error: {error}</p>
        </div>
      </>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 pt-2 text-center text-gray-500 dark:text-gray-400">
        <p>No se pudieron cargar los datos del perfil.</p>
      </div>
    );
  }

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
              {toast.type === "success" ? (
                <HiCheck className="size-5" />
              ) : (
                <HiX className="size-5" />
              )}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <Toast.Toggle
              onDismiss={() =>
                setToastMessages((prev) =>
                  prev.filter((t) => t.id !== toast.id),
                )
              }
            />
          </Toast>
        ))}
      </div>

      <div className="container mx-auto px-4 pt-2">
        <Card>
          <h1 className="text-2xl font-bold text-gray-500 dark:text-gray-400">
            Perfil
          </h1>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="col-span-1 flex flex-col items-center justify-center text-center md:col-span-2">
              <img
                key={preview}
                src={preview || "/user.svg"}
                alt="Profile"
                className="mb-4 h-40 w-40 rounded-full border object-cover dark:border-gray-600"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== window.location.origin + "/user.svg") {
                    console.warn(
                      `Failed to load image: ${target.src}. Falling back to default.`,
                    );
                    target.src = "/user.svg";
                    setPreview("/user.svg");
                  }
                }}
              />
              {isEditing && (
                <div className="w-full max-w-xs">
                  <Label
                    htmlFor="photo"
                    value="Change profile picture"
                    className="sr-only"
                  />
                  <input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 dark:placeholder-gray-400"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF (Max 2MB).
                  </p>
                </div>
              )}
            </div>

            <div>
              <Label
                className="text-gray-500 dark:text-gray-400"
                htmlFor="firstName"
                value="Nombre"
              />
              <TextInput
                id="firstName"
                name="firstName"
                value={profile.firstName}
                onChange={handleInputChange}
                disabled={!isEditing || loading}
                required
              />
            </div>
            <div>
              <Label
                className="text-gray-500 dark:text-gray-400"
                htmlFor="lastName"
                value="Apellido"
              />
              <TextInput
                id="lastName"
                name="lastName"
                value={profile.lastName}
                onChange={handleInputChange}
                disabled={!isEditing || loading}
                required
              />
            </div>
            <div>
              <Label
                className="text-gray-500 dark:text-gray-400"
                htmlFor="email"
                value="Email"
              />
              <TextInput
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleInputChange}
                disabled={!isEditing || loading}
                required
              />
            </div>
            <div>
              <Label
                className="text-gray-500 dark:text-gray-400"
                htmlFor="age"
                value="Edad"
              />
              <TextInput
                id="age"
                name="age"
                type="number"
                value={profile.age}
                onChange={handleInputChange}
                disabled={!isEditing || loading}
                min="1"
              />
            </div>

            {isEditing && (
              <>
                <div className="mt-4 border-t pt-4 dark:border-gray-600 md:col-span-2">
                  <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Cambiar Contraseña
                  </h3>
                </div>

                <div>
                  <Label
                    htmlFor="currentPassword"
                    value="Contraseña Actual"
                    className="text-gray-500 dark:text-gray-400"
                  />
                  <TextInput
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="Deja en blanco si no cambias"
                    value={profile.currentPassword || ""}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div>
                  <Label
                    htmlFor="newPassword"
                    value="Nueva Contraseña"
                    className="text-gray-500 dark:text-gray-400"
                  />
                  <TextInput
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={profile.newPassword || ""}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2">
                  <Label
                    htmlFor="confirmPassword"
                    value="Repetir Nueva Contraseña"
                    className="text-gray-500 dark:text-gray-400"
                  />
                  <TextInput
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Repite la nueva contraseña"
                    value={profile.confirmPassword || ""}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
              </>
            )}

            <div>
              <Label
                className="text-gray-500 dark:text-gray-400"
                htmlFor="role"
                value="Rol"
              />
              <TextInput
                id="role"
                name="role"
                value={profile.role}
                disabled
                className="border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>
            <div>
              <Label
                className="text-gray-500 dark:text-gray-400"
                htmlFor="createdAt"
                value="Miembro Desde"
              />
              <TextInput
                id="createdAt"
                name="createdAt"
                value={new Date(profile.createdAt).toLocaleDateString()}
                disabled
                className="border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
              />
            </div>

            <div className="md:col-span-2">
              <Label
                className="mb-2 block text-gray-500 dark:text-gray-400"
                value="Mano dominante"
              />
              <div className="flex items-center space-x-4">
                <Label
                  htmlFor="rightHanded"
                  className="flex cursor-pointer items-center text-gray-500 dark:text-gray-400"
                >
                  <input
                    id="rightHanded"
                    type="radio"
                    name="isRightHanded"
                    value="true"
                    checked={profile.isRightHanded === true}
                    onChange={() =>
                      setProfile((p) =>
                        p ? { ...p, isRightHanded: true } : null,
                      )
                    }
                    disabled={!isEditing || loading}
                    className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                  />
                  Diestro
                </Label>
                <Label
                  htmlFor="leftHanded"
                  className="flex cursor-pointer items-center text-gray-500 dark:text-gray-400"
                >
                  <input
                    id="leftHanded"
                    type="radio"
                    name="isRightHanded"
                    value="false"
                    checked={profile.isRightHanded === false}
                    onChange={() =>
                      setProfile((p) =>
                        p ? { ...p, isRightHanded: false } : null,
                      )
                    }
                    disabled={!isEditing || loading}
                    className="mr-2 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
                  />
                  Zurdo
                </Label>
              </div>
            </div>
          </form>

          <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
            {isEditing ? (
              <>
                <Button
                  color="gray"
                  onClick={() => {
                    setIsEditing(false);
                    setNewPhotoFile(null);
                  }}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  color="success"
                  onClick={handleSave}
                  isProcessing={loading}
                  disabled={loading}
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} disabled={loading}>
                Editar Perfil
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default ResponsiveProfileForm;
