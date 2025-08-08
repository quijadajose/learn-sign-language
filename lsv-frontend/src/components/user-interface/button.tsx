import type { ComponentPropsWithoutRef } from "react";

import { cn } from "../../utils";

export default function Button({
  className,
  ...props
}: ComponentPropsWithoutRef<"button">) {
  return (
    <button
      className={cn(
        "block w-full rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800",
        "focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800",
        "disabled:bg-blue-700 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
