import type { ElementType, ComponentProps, ReactNode } from "react";

import { cn } from "../../utils";

type InputProps<E extends ElementType> = Omit<ComponentProps<E>, "as"> & {
  as?: E;
  children?: ReactNode;
  className?: ReactNode;
};

export default function Input<T extends ElementType>({
  as,
  children,
  className,
  ...props
}: InputProps<T>) {
  const As = as || "div";
  return (
    <As
      className={cn(
        "block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-left text-sm text-gray-900",
        "dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder:text-gray-400",
        "focus:border-blue-500 focus:ring-blue-500 dark:focus:border-blue-500 dark:focus:ring-blue-500",
        className,
      )}
      {...props}
    >
      {children}
    </As>
  );
}
