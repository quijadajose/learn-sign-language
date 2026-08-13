import React, { useEffect, useState } from "react";
import { Card, Spinner } from "flowbite-react";
import { BACKEND_BASE_URL } from "./config";
import { useNavigate } from "react-router-dom";
import { userApi } from "./services/api";
import { useAuth } from "./context/AuthContext";
import { useToast } from "./components/ToastProvider";
import LocaleSwitcher from "./components/LocaleSwitcher";
import type { UserData } from "./types/user";
import {
  ProfileFormActions,
  ProfileFormFields,
  type ProfileFormData,
} from "./ProfileFormFields";

export const ResponsiveProfileForm = () => {
  const { user, token, login } = useAuth();
  const addToast = useToast();
  const [profile, setProfile] = useState<ProfileFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [newPhotoFile, setNewPhotoFile] = useState<File | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      addToast("error", "No estás autenticado. Redirigiendo al login...");
      const redirectId = setTimeout(() => navigate("/login"), 3000);
      return () => clearTimeout(redirectId);
    }

    let cancelled = false;

    if (user) {
      setProfile(user as unknown as ProfileFormData);
    } else {
      const fetchProfileData = async () => {
        setLoading(true);
        try {
          const response = await userApi.getMe();
          if (cancelled) return;
          if (response.success) {
            setProfile(response.data);
            login(response.data, token);
          } else {
            setError(`Failed to fetch profile: ${response.message}`);
            addToast("error", `Error al cargar el perfil: ${response.message}`);
          }
        } finally {
          setLoading(false);
        }
      };
      void fetchProfileData();
    }

    return () => {
      cancelled = true;
    };
  }, [user, token, navigate, addToast, login]);

  useEffect(() => {
    if (!profile) return;

    if (!newPhotoFile) {
      const imageUrl = `${BACKEND_BASE_URL}/images/user/${encodeURIComponent(profile.id)}?size=lg&v=${Date.now()}`;
      setPreview(imageUrl);
      return;
    }

    const objectUrl = URL.createObjectURL(newPhotoFile);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
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
      ...(prev as ProfileFormData),
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

      const profileUpdateBody: {
        email: string;
        firstName: string;
        lastName: string;
        age: number;
        isRightHanded: boolean;
        oldPassword?: string;
        newPassword?: string;
      } = {
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
          return;
        }

        if (newPassword !== confirmPassword) {
          addToast(
            "error",
            "La nueva contraseña y su confirmación no coinciden.",
          );
          return;
        }

        profileUpdateBody.oldPassword = currentPassword;
        profileUpdateBody.newPassword = newPassword;
      }

      const userResponse = await userApi.updateMe(profileUpdateBody);

      if (!userResponse.success) {
        addToast(
          "error",
          `Error al actualizar perfil: ${userResponse.message}`,
        );
        throw new Error(`User update failed: ${userResponse.message}`);
      }

      let updatedProfileData = userResponse.data;
      if (newPhotoFile) {
        if (!updatedProfileData?.id) {
          throw new Error("User ID missing after profile update.");
        }

        const imageResponse = await userApi.uploadUserImage(
          newPhotoFile,
          updatedProfileData.id,
        );

        if (!imageResponse.success) {
          addToast("error", `Error al subir la foto: ${imageResponse.message}`);
        } else {
          updatedProfileData = {
            ...updatedProfileData,
            photo: `/images/user/${encodeURIComponent(updatedProfileData.id)}?v=${Date.now()}`,
          };
          setPreview(
            `${BACKEND_BASE_URL}/images/user/${encodeURIComponent(updatedProfileData.id)}?size=lg&v=${Date.now()}`,
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

      login(finalProfileData as unknown as UserData, token!);

      setIsEditing(false);
      setNewPhotoFile(null);
      addToast("success", "Perfil actualizado correctamente.");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Ocurrió un error inesperado.";
      addToast("error", `Error al guardar el perfil: ${message}`);
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
      <div className="container mx-auto px-4 pt-2 text-center text-red-600 dark:text-red-400">
        <p>Error: {error}</p>
      </div>
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
    <div className="container mx-auto px-4 pt-2">
      <Card>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Perfil
        </h1>
        <ProfileFormFields
          profile={profile}
          preview={preview}
          isEditing={isEditing}
          loading={loading}
          onInputChange={handleInputChange}
          onFileChange={handleFileChange}
          onPreviewError={() => {
            setPreview("/user.svg");
          }}
          onHandednessChange={(isRightHanded) =>
            setProfile((p) => (p ? { ...p, isRightHanded } : null))
          }
        />
        <ProfileFormActions
          isEditing={isEditing}
          loading={loading}
          onCancel={() => {
            setIsEditing(false);
            setNewPhotoFile(null);
          }}
          onSave={handleSave}
          onEdit={() => setIsEditing(true)}
        />
      </Card>

      <Card className="mt-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Preferencias
        </h2>
        <LocaleSwitcher withPreferences />
      </Card>
    </div>
  );
};

export default ResponsiveProfileForm;
