import { useFormContext, Controller } from "react-hook-form";

import BaseTextField from "../fields/text-field";

interface PasswordFieldProps {
  name: string;
  label: string;
}

export default function PasswordField({ name, label }: PasswordFieldProps) {
  const { control, formState } = useFormContext();
  const error = formState.errors[name] as { message: string } | undefined;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <BaseTextField
          type="password"
          label={label}
          value={field.value}
          onChange={field.onChange}
          error={error}
        />
      )}
    />
  );
} 