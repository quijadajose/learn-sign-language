export interface Language {
  id: string;
  name: string;
  description: string;
  countryCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  code: string;
  name: string;
}

export interface CountryOption {
  value: string;
  label: string;
}

export interface LanguageForm {
  name: string;
  description: string;
  countryCode: string;
}

export interface LanguageFormErrors {
  countryCode?: string;
  name?: string;
  description?: string;
}

export type LanguageFormTouched = {
  countryCode?: boolean;
  name?: boolean;
  description?: boolean;
};

export interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}
