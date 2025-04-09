import type { ChangeEvent } from "react";

import { useId } from "react";

import { cn } from "../../utils";

import Field from "../user-interface/field";
import Input from "../user-interface/input";

interface TextFieldProps {
  type: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error: { message: string } | undefined;
}

export default function TextField({
  type,
  label,
  value,
  onChange,
  error,
}: TextFieldProps) {
  const id = useId();
  return (
    <Field
      id={id}
      label={label}
      error={error}
    >
      <Input
        as="input"
        id={id}
        type={type}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onChange(e.target.value);
        }}
        placeholder={label}
        className={cn(
          "focus:border-blue-500 focus:outline-none focus:ring-blue-500",
          { "border-red-500 focus:border-red-500 dark:border-red-400 dark:focus:border-red-400": error },
        )}
      />
    </Field>
  );
}
