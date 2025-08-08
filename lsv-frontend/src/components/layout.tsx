import type { ReactNode } from "react";

interface LayoutProps {
  heading: string;
  description: string;
  fields: ReactNode[];
  button: ReactNode;
  back?: ReactNode;
}

export default function Layout({
  heading,
  description,
  fields,
  button,
  back,
}: LayoutProps) {
  return (
    <div className="relative flex size-full items-center justify-center px-6 py-8">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow sm:p-8 dark:border dark:border-gray-700 dark:bg-gray-800">
        <h1 className="mb-3 text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
          {heading}
        </h1>
        <p className="mb-6 text-sm font-light text-gray-500 dark:text-gray-400">
          {description}
        </p>
        <div className=" mb-4 max-h-96 overflow-auto">
          <div className="space-y-4 md:space-y-6">{fields}</div>
        </div>
        {button}
      </div>
      {back && <div className="absolute left-4 top-5">{back}</div>}
    </div>
  );
}
