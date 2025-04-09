import { useFormContext, Controller } from "react-hook-form";

import BaseTextField from "../fields/text-field";

interface EmailFieldProps {
  name: string;
  label: string;
}

export default function EmailField({ name, label }: EmailFieldProps) {
  const { control, formState } = useFormContext();
  const error = formState.errors[name] as { message: string } | undefined;
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <BaseTextField
          type="email"
          label={label}
          value={field.value}
          onChange={field.onChange}
          error={error}
        />
      )}
    />
  );
} 