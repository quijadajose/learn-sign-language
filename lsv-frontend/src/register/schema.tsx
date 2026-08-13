import { FieldValues } from "react-hook-form";
import type { Flow, s } from "@formity/react";
import { Link } from "react-router-dom";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import Screen from "../components/screen";
import Step from "../components/step";
import Layout from "../components/layout";
import NextButton from "../components/navigation/next-button";
import BackButton from "../components/navigation/back-button";
import Row from "../components/user-interface/row";
import TextField from "../components/react-hook-form/text-field";
import EmailField from "../components/react-hook-form/email-field";
import PasswordField from "../components/react-hook-form/password-field";
import NumberField from "../components/react-hook-form/number-field";
import YesNo from "../components/react-hook-form/yes-no";

import { MultiStep } from "../multi-step/multi-step";
import { Resolver } from "react-hook-form";

const loginFooter = (
  <p className="mt-4 text-center text-sm font-medium text-gray-600 dark:text-gray-400">
    ¿Ya tienes cuenta?{" "}
    <Link
      to="/login"
      className="text-blue-700 hover:underline dark:text-blue-500"
    >
      Volver al inicio de sesión
    </Link>
  </p>
);

type PersonalInfoValues = {
  email: string;
  firstName: string;
  lastName: string;
  age: number;
};

type AccountInfoValues = {
  password: string;
  confirmPassword: string;
  isRightHanded: boolean;
};

const personalInfoSchema = z.object({
  email: z
    .string()
    .email({ error: "Dirección de correo electrónico no válida" }),
  firstName: z.string().min(1, { error: "Requerido" }),
  lastName: z.string().min(1, { error: "Requerido" }),
  age: z
    .number()
    .min(14, { error: "Mínimo de 14 años" })
    .max(99, { error: "Máximo de 99 años" }),
});

const accountInfoSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "La contraseña debe tener al menos 8 caracteres" }),
    confirmPassword: z.string(),
    isRightHanded: z.boolean(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

const personalInfoResolver = zodResolver(
  personalInfoSchema,
) as Resolver<PersonalInfoValues>;
const accountInfoResolver = zodResolver(
  accountInfoSchema,
) as Resolver<AccountInfoValues>;

export type Schema = {
  render: React.ReactNode;
  struct: [
    s.Form<{
      email: string;
      firstName: string;
      lastName: string;
      age: number;
    }>,
    s.Form<{
      password: string;
      confirmPassword: string;
      isRightHanded: boolean;
    }>,
    s.Return<{
      email: string;
      firstName: string;
      lastName: string;
      age: number;
      password: string;
      isRightHanded: boolean;
    }>,
  ];
  inputs: Record<never, never>;
  params: Record<never, never>;
};

export const flow: Flow<Schema> = [
  {
    form: {
      fields: () => ({
        email: ["", []],
        firstName: ["", []],
        lastName: ["", []],
        age: [18, []],
      }),
      render: ({ fields, ...rest }) => (
        <Screen progress={{ total: 2, current: 1 }}>
          <MultiStep step="personalInfo" {...rest}>
            <Step
              defaultValues={fields}
              resolver={
                personalInfoResolver as unknown as Resolver<FieldValues>
              }
            >
              <Layout
                heading="Registro"
                description="Por favor, rellene sus datos personales"
                fields={[
                  <EmailField key="email" name="email" label="Correo" />,
                  <Row
                    key="names"
                    items={[
                      <TextField
                        key="firstName"
                        name="firstName"
                        label="Nombre"
                      />,
                      <TextField
                        key="lastName"
                        name="lastName"
                        label="Apellido"
                      />,
                    ]}
                  />,
                  <NumberField key="age" name="age" label="Edad" />,
                ]}
                button={<NextButton>Siguiente</NextButton>}
                footer={loginFooter}
              />
            </Step>
          </MultiStep>
        </Screen>
      ),
    },
  },
  {
    form: {
      fields: () => ({
        password: ["", []],
        confirmPassword: ["", []],
        isRightHanded: [true, []],
      }),
      render: ({ fields, ...rest }) => (
        <Screen progress={{ total: 2, current: 2 }}>
          <MultiStep step="accountInfo" {...rest}>
            <Step
              defaultValues={fields}
              resolver={accountInfoResolver as unknown as Resolver<FieldValues>}
            >
              <Layout
                heading="Registro"
                description="Establecas la configuracion adicional de la cuenta"
                fields={[
                  <PasswordField
                    key="password"
                    name="password"
                    label="Contraseña"
                  />,
                  <PasswordField
                    key="confirmPassword"
                    name="confirmPassword"
                    label="Repita la Contraseña"
                  />,
                  <YesNo
                    key="isRightHanded"
                    name="isRightHanded"
                    label="¿Eres diestro?"
                  />,
                ]}
                button={<NextButton>Crear cuenta</NextButton>}
                back={<BackButton />}
                footer={loginFooter}
              />
            </Step>
          </MultiStep>
        </Screen>
      ),
    },
  },
  {
    return: ({ email, firstName, lastName, age, password, isRightHanded }) => ({
      email,
      firstName,
      lastName,
      age,
      password,
      isRightHanded,
    }),
  },
];
