import { Button } from "flowbite-react";
import { HiArrowRight } from "react-icons/hi";

interface EmptyNextStepProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyNextStep({
  title,
  description,
  actionLabel,
  onAction,
}: EmptyNextStepProps) {
  return (
    <div className="mx-auto max-w-md px-4 py-10 text-center">
      <p className="text-lg font-semibold text-gray-900 dark:text-white">
        {title}
      </p>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button color="blue" className="mt-5" onClick={onAction}>
          {actionLabel}
          <HiArrowRight className="ml-2 size-4" />
        </Button>
      )}
    </div>
  );
}
