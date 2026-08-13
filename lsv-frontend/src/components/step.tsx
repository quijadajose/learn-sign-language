import type { ReactNode } from "react";
import type { UseFormProps } from "react-hook-form";

import { FormProvider, useForm } from "react-hook-form";

import { useMultiStep } from "../multi-step/use-multi-step";

interface StepProps {
  defaultValues: UseFormProps["defaultValues"];
  resolver: UseFormProps["resolver"];
  children: ReactNode;
}

export default function Step({ defaultValues, resolver, children }: StepProps) {
  const form = useForm({ defaultValues, resolver });
  const { next } = useMultiStep();
  return (
    <form onSubmit={form.handleSubmit(next)} className="relative">
      <FormProvider {...form}>{children}</FormProvider>
    </form>
  );
}
