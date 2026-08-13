export interface Stage {
  id: string;
  name: string;
  description: string;
  languageId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StageFormData {
  name: string;
  description: string;
}

export interface Language {
  id: string;
  name: string;
  description?: string;
  countryCode?: string;
}

export interface ToastMessage {
  id: number;
  type: "success" | "error";
  message: string;
}
