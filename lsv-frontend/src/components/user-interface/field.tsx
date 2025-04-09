import { cn } from "../../utils";

interface FieldProps {
  children: React.ReactNode;
  id: string;
  label: string;
  labelClassName?: string;
  error: { message: string } | undefined;
}

export default function Field({
  children,
  id,
  label,
  labelClassName,
  error,
}: FieldProps) {
  return (
    <div className="space-y-1">
      <div className="relative">
        <label
          htmlFor={id}
          className={cn(
            "mb-2 block text-sm font-medium text-gray-900 dark:text-white",
            { "text-red-500 dark:text-red-400": error },
            labelClassName,
          )}
        >
          {label}
        </label>
        {children}
      </div>
      {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error.message}</p>}
    </div>
  );
}
