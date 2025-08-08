import { useId } from "react";

import { cn } from "../../utils";
import Field from "../user-interface/field";
import Input from "../user-interface/input";

interface ListboxProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error: { message: string } | undefined;
}

export default function Listbox({
  label,
  value,
  onChange,
  options,
  error,
}: ListboxProps) {
  const id = useId();

  return (
    <Field id={id} label={label} error={error}>
      <Input
        as="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 border border-neutral-800 rounded-lg bg-neutral-950 text-white focus:outline-none",
          { "border-red-500": error }
        )}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value} className="text-black">
            {option.label}
          </option>
        ))}
      </Input>
    </Field>
  );
}
