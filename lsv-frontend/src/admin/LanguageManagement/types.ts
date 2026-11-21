export interface Language {
  id: string;
  name: string;
  description: string;
  countryCode?: string;
  createdAt: string;
  updatedAt: string;
}

/** Contenido que se perdería al borrar un idioma (GET /languages/:id/deletion-impact). */
export interface LanguageDeletionImpact {
  stages: number;
  lessons: number;
  quizzes: number;
  signs: number;
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
