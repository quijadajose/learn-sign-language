import { Button, TextInput, Label, Spinner } from "flowbite-react";

export interface ProfileFormData {
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

interface ProfileFormFieldsProps {
  profile: ProfileFormData;
  preview: string | null;
  isEditing: boolean;
  loading: boolean;
  onInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPreviewError: () => void;
  onHandednessChange: (isRightHanded: boolean) => void;
}

export function ProfileFormFields({
  profile,
  preview,
  isEditing,
  loading,
  onInputChange,
  onFileChange,
  onPreviewError,
  onHandednessChange,
}: ProfileFormFieldsProps) {
  return (
    <form className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="col-span-1 flex flex-col items-center justify-center text-center md:col-span-2">
        <img
          src={preview || "/user.svg"}
          alt="Profile"
          className="mb-4 size-40 rounded-full border object-cover dark:border-gray-600"
          onError={onPreviewError}
        />
        {isEditing && (
          <div className="w-full max-w-xs">
            <Label htmlFor="photo" className="sr-only">
              Change profile picture
            </Label>
            <input
              id="photo"
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="block w-full cursor-pointer rounded-lg border border-gray-300 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:placeholder:text-gray-400"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              PNG, JPG, GIF (Max 2MB).
            </p>
          </div>
        )}
      </div>

      <div>
        <Label className="text-gray-500 dark:text-gray-400" htmlFor="firstName">
          Nombre
        </Label>
        <TextInput
          id="firstName"
          name="firstName"
          value={profile.firstName}
          onChange={onInputChange}
          disabled={!isEditing || loading}
          required
        />
      </div>
      <div>
        <Label className="text-gray-500 dark:text-gray-400" htmlFor="lastName">
          Apellido
        </Label>
        <TextInput
          id="lastName"
          name="lastName"
          value={profile.lastName}
          onChange={onInputChange}
          disabled={!isEditing || loading}
          required
        />
      </div>
      <div>
        <Label className="text-gray-500 dark:text-gray-400" htmlFor="email">
          Email
        </Label>
        <TextInput
          id="email"
          name="email"
          type="email"
          value={profile.email}
          onChange={onInputChange}
          disabled={!isEditing || loading}
          required
        />
      </div>
      <div>
        <Label className="text-gray-500 dark:text-gray-400" htmlFor="age">
          Edad
        </Label>
        <TextInput
          id="age"
          name="age"
          type="number"
          value={profile.age}
          onChange={onInputChange}
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
            <Label htmlFor="currentPassword" className="text-gray-500 dark:text-gray-400">
              Contraseña Actual
            </Label>
            <TextInput
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="Deja en blanco si no cambias"
              value={profile.currentPassword || ""}
              onChange={onInputChange}
              disabled={loading}
            />
          </div>
          <div>
            <Label htmlFor="newPassword" className="text-gray-500 dark:text-gray-400">
              Nueva Contraseña
            </Label>
            <TextInput
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={profile.newPassword || ""}
              onChange={onInputChange}
              disabled={loading}
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="confirmPassword" className="text-gray-500 dark:text-gray-400">
              Repetir Nueva Contraseña
            </Label>
            <TextInput
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repite la nueva contraseña"
              value={profile.confirmPassword || ""}
              onChange={onInputChange}
              disabled={loading}
            />
          </div>
        </>
      )}

      <div>
        <Label className="text-gray-500 dark:text-gray-400" htmlFor="role">
          Rol
        </Label>
        <TextInput
          id="role"
          name="role"
          value={profile.role}
          disabled
          className="border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
        />
      </div>
      <div>
        <Label className="text-gray-500 dark:text-gray-400" htmlFor="createdAt">
          Miembro Desde
        </Label>
        <TextInput
          id="createdAt"
          name="createdAt"
          value={new Date(profile.createdAt).toLocaleDateString()}
          disabled
          className="border-gray-300 bg-gray-100 dark:border-gray-600 dark:bg-gray-700"
        />
      </div>

      <div className="md:col-span-2">
        <Label className="mb-2 block text-gray-500 dark:text-gray-400">
          Mano dominante
        </Label>
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
              onChange={() => onHandednessChange(true)}
              disabled={!isEditing || loading}
              className="mr-2 size-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
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
              onChange={() => onHandednessChange(false)}
              disabled={!isEditing || loading}
              className="mr-2 size-4 border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
            />
            Zurdo
          </Label>
        </div>
      </div>
    </form>
  );
}

interface ProfileFormActionsProps {
  isEditing: boolean;
  loading: boolean;
  onCancel: () => void;
  onSave: () => void;
  onEdit: () => void;
}

export function ProfileFormActions({
  isEditing,
  loading,
  onCancel,
  onSave,
  onEdit,
}: ProfileFormActionsProps) {
  return (
    <div className="mt-6 flex justify-end space-x-3 border-t border-gray-200 pt-4 dark:border-gray-700">
      {isEditing ? (
        <>
          <Button color="gray" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button color="success" onClick={onSave} disabled={loading}>
            {loading && <Spinner size="sm" className="mr-2" aria-hidden="true" />}
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </>
      ) : (
        <Button
          color="blue"
          className="bg-blue-700 hover:bg-blue-800"
          onClick={onEdit}
          disabled={loading}
        >
          Editar Perfil
        </Button>
      )}
    </div>
  );
}
