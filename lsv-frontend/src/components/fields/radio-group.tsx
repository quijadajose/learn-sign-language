import { useId } from "react";
import { cn } from "../../utils";
import Field from "../user-interface/field";

interface RadioGroupProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  direction: "x" | "y";
  error: { message: string } | undefined;
}

export default function RadioGroup({
  label,
  value,
  onChange,
  options,
  direction,
  error,
}: RadioGroupProps) {
  const id = useId();

  return (
    <Field id={id} label={label} error={error}>
      <div
        className={cn("grid gap-4", {
          "grid-cols-[repeat(auto-fit,minmax(theme(spacing.40),1fr))]":
            direction === "x",
        })}
      >
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              "group flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition",
              value === option.value 
                ? "border-blue-500 bg-blue-50 dark:border-blue-500 dark:bg-gray-700" 
                : "border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700",
              { "border-red-500 dark:border-red-400": error }
            )}
          >
            <input
              type="radio"
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="hidden"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {option.label}
            </span>
            {value === option.value && (
              <svg
                className="pointer-events-none ml-auto size-5 fill-blue-700 dark:fill-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.5 12.75l6 6 9-13.5-1.5-1.5-7.5 11.25-4.5-4.5-1.5 1.5z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </label>
        ))}
      </div>
    </Field>
  );
}
