import { FieldValues } from "react-hook-form";
import type {
  Schema,
  Form,
  Return,
} from "@formity/react";

import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Screen,
  Step,
  Layout,
  Row,
  TextField,
  EmailField,
  PasswordField,
  NumberField,
  YesNo,
  NextButton,
  BackButton,
} from "../components";

import { MultiStep } from "../multi-step";
import { Resolver } from "react-hook-form";

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
  email: z.string().email({ message: "Dirección de correo electrónico no válida" }),
  firstName: z.string().min(1, { message: "Requerido" }),
  lastName: z.string().min(1, { message: "Requerido" }),
  age: z.number().min(14, { message: "Mínimo de 14 años" }).max(99, { message: "Máximo de 99 años" }),
});

const accountInfoSchema = z.object({
  password: z.string().min(8, { message: "La contraseña debe tener al menos 8 caracteres" }),
  confirmPassword: z.string(),
  isRightHanded: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const personalInfoResolver = zodResolver(personalInfoSchema) as Resolver<PersonalInfoValues>;
const accountInfoResolver = zodResolver(accountInfoSchema) as Resolver<AccountInfoValues>;

export type Values = [
  Form<{
    email: string;
    firstName: string;
    lastName: string;
    age: number;
  }>,
  Form<{
    password: string;
    confirmPassword: string;
    isRightHanded: boolean;
  }>,
  Return<{
    email: string;
    firstName: string;
    lastName: string;
    age: number;
    password: string;
    isRightHanded: boolean;
  }>,
];

export const schema: Schema<Values> = [
  {
    form: {
      values: () => ({
        email: ["", []],
        firstName: ["", []],
        lastName: ["", []],
        age: [18, []],
      }),
      render: ({ values, ...rest }) => (
        <Screen progress={{ total: 2, current: 1 }}>
          <MultiStep step="personalInfo" {...rest}>
            <Step
              defaultValues={values}
              resolver={personalInfoResolver as unknown as Resolver<FieldValues>}
            >
              <Layout
                heading="Registro"
                description="Por favor, rellene sus datos personales"
                fields={[
                  <EmailField key="email" name="email" label="Correo" />,
                  <Row
                    key="names"
                    items={[
                      <TextField key="firstName" name="firstName" label="Nombre" />,
                      <TextField key="lastName" name="lastName" label="Apellido" />,
                    ]}
                  />,
                  <NumberField key="age" name="age" label="Edad" />,
                ]}
                button={<NextButton>Siguiente</NextButton>}
              />
            </Step>
          </MultiStep>
        </Screen>
      ),
    },
  },
  {
    form: {
      values: () => ({
        password: ["", []],
        confirmPassword: ["", []],
        isRightHanded: [true, []],
      }),
      render: ({ values, ...rest }) => (
        <Screen progress={{ total: 2, current: 2 }}>
          <MultiStep step="accountInfo" {...rest}>
            <Step
              defaultValues={values}
              resolver={accountInfoResolver as unknown as Resolver<FieldValues>}
            >
              <Layout
                heading="Registro"
                description="Establecas la configuracion adicional de la cuenta"
                fields={[
                  <PasswordField key="password" name="password" label="Contraseña" />,
                  <PasswordField key="confirmPassword" name="confirmPassword" label="Repita la Contraseña" />,
                  <YesNo key="isRightHanded" name="isRightHanded" label="¿Eres diestro?" />,
                ]}
                button={<NextButton>Crear cuenta</NextButton>}
                back={<BackButton />}
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
